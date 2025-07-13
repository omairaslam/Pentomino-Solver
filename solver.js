// Dancing Links (DLX) solver for Pentomino puzzles

class DlxNode {
  constructor(row, col) {
    this.row = row;
    this.col = col;
    this.up = this;
    this.down = this;
    this.left = this;
    this.right = this;
  }
}

class Dlx {
  constructor(matrix) {
    this.header = new DlxNode(null, null);
    this.build(matrix);
  }

  build(matrix) {
    const numCols = matrix[0].length;
    const columns = [];

    for (let j = 0; j < numCols; j++) {
      const colNode = new DlxNode(null, j);
      columns.push(colNode);
      colNode.left = this.header.left;
      colNode.right = this.header;
      this.header.left.right = colNode;
      this.header.left = colNode;
    }

    for (let i = 0; i < matrix.length; i++) {
      let firstNode = null;
      for (let j = 0; j < numCols; j++) {
        if (matrix[i][j] === 1) {
          const colNode = columns[j];
          const newNode = new DlxNode(i, j);
          newNode.up = colNode.up;
          newNode.down = colNode;
          colNode.up.down = newNode;
          colNode.up = newNode;

          if (firstNode) {
            newNode.left = firstNode.left;
            newNode.right = firstNode;
            firstNode.left.right = newNode;
            firstNode.left = newNode;
          } else {
            firstNode = newNode;
          }
        }
      }
    }
  }

  search(solutions) {
    if (this.header.right === this.header) {
      solutions.push([]);
      return;
    }

    let col = this.header.right;

    this.cover(col);

    for (let rowNode = col.down; rowNode !== col; rowNode = rowNode.down) {
      const solution = [rowNode.row];
      for (let rightNode = rowNode.right; rightNode !== rowNode; rightNode = rightNode.right) {
        this.cover(rightNode.col > -1 ? this.header.right : rightNode);
      }

      this.search(solutions);

      if (solutions.length > 0) {
        solutions[solutions.length - 1].push(...solution);
      }

      for (let leftNode = rowNode.left; leftNode !== rowNode; leftNode = leftNode.left) {
        this.uncover(leftNode.col > -1 ? this.header.right : leftNode);
      }
    }

    this.uncover(col);
  }

  cover(colNode) {
    colNode.right.left = colNode.left;
    colNode.left.right = colNode.right;

    for (let rowNode = colNode.down; rowNode !== colNode; rowNode = rowNode.down) {
      for (let rightNode = rowNode.right; rightNode !== rowNode; rightNode = rightNode.right) {
        rightNode.down.up = rightNode.up;
        rightNode.up.down = rightNode.down;
      }
    }
  }

  uncover(colNode) {
    for (let rowNode = colNode.up; rowNode !== colNode; rowNode = rowNode.up) {
      for (let leftNode = rowNode.left; leftNode !== rowNode; leftNode = leftNode.left) {
        leftNode.down.up = leftNode;
        leftNode.up.down = leftNode;
      }
    }
    colNode.right.left = colNode;
    colNode.left.right = colNode;
  }
}

self.onmessage = function(e) {
  const { board, pieces } = e.data;
  const { matrix, placements } = buildMatrix(board, pieces);
  const dlx = new Dlx(matrix);
  const solutions = [];
  dlx.search(solutions);
  self.postMessage({ solutions, placements });
};

function buildMatrix(board, pieces) {
  const boardWidth = board[0].length;
  const boardHeight = board.length;
  const numPieces = pieces.length;
  const numCells = boardWidth * boardHeight;
  const matrix = [];
  const placements = [];
  let row = 0;

  for (let i = 0; i < numPieces; i++) {
    const piece = pieces[i];
    const variations = getPieceVariations(piece);
    for (const variation of variations) {
      for (let r = 0; r < boardHeight; r++) {
        for (let c = 0; c < boardWidth; c++) {
          if (canPlace(board, variation, r, c)) {
            const matrixRow = new Array(numPieces + numCells).fill(0);
            matrixRow[i] = 1;
            variation.shape.forEach(([dr, dc]) => {
              const cellIndex = (r + dr) * boardWidth + (c + dc);
              matrixRow[numPieces + cellIndex] = 1;
            });
            matrix.push(matrixRow);
            placements.push({ piece: variation, row: r, col: c });
          }
        }
      }
    }
  }

  return { matrix, placements };
}

function getPieceVariations(piece) {
  const variations = [];
  let currentShape = piece.shape;
  for (let i = 0; i < 4; i++) {
    variations.push({ ...piece, shape: normalizeShape(currentShape) });
    currentShape = rotate(currentShape);
  }
  currentShape = flip(piece.shape);
  for (let i = 0; i < 4; i++) {
    variations.push({ ...piece, shape: normalizeShape(currentShape) });
    currentShape = rotate(currentShape);
  }
  return [...new Set(variations.map(v => JSON.stringify(v)))].map(s => JSON.parse(s));
}

function rotate(shape) {
  return shape.map(([row, col]) => [col, -row]);
}

function flip(shape) {
  return shape.map(([row, col]) => [row, -col]);
}

function normalizeShape(shape) {
  const minRow = Math.min(...shape.map(([row, _]) => row));
  const minCol = Math.min(...shape.map(([_, col]) => col));
  return shape.map(([row, col]) => [row - minRow, col - minCol]);
}

function canPlace(board, piece, row, col) {
  const boardWidth = board[0].length;
  const boardHeight = board.length;
  for (const [r, c] of piece.shape) {
    const newRow = row + r;
    const newCol = col + c;
    if (
      newRow >= boardHeight ||
      newCol >= boardWidth ||
      newRow < 0 ||
      newCol < 0 ||
      board[newRow][newCol] !== 0
    ) {
      return false;
    }
  }
  return true;
}
