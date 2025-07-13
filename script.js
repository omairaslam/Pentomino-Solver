const Grid = {
  width: 10,
  height: 6,
  cells: [],

  init() {
    this.createGrid();
    this.drawGrid();
  },

  createGrid() {
    for (let i = 0; i < this.height; i++) {
      this.cells[i] = [];
      for (let j = 0; j < this.width; j++) {
        this.cells[i][j] = 0;
      }
    }
  },

  drawGrid() {
    const gridContainer = document.getElementById('grid-container');
    gridContainer.innerHTML = '';
    gridContainer.style.gridTemplateColumns = `repeat(${this.width}, 30px)`;
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        const cell = document.createElement('div');
        cell.classList.add('grid-cell');
        gridContainer.appendChild(cell);
      }
    }
  }
};

const Pieces = {
  list: [
    { name: 'F', color: 'red', shape: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]] },
    { name: 'I', color: 'blue', shape: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
    { name: 'L', color: 'green', shape: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 0]] },
    { name: 'N', color: 'purple', shape: [[0, 1], [0, 2], [1, 0], [1, 1], [2, 0]] },
    { name: 'P', color: 'orange', shape: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]] },
    { name: 'T', color: 'cyan', shape: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]] },
    { name: 'U', color: 'magenta', shape: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]] },
    { name: 'V', color: 'brown', shape: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]] },
    { name: 'W', color: 'pink', shape: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]] },
    { name: 'X', color: 'yellow', shape: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]] },
    { name: 'Y', color: 'lime', shape: [[0, 1], [1, 0], [1, 1], [1, 2], [1, 3]] },
    { name: 'Z', color: 'teal', shape: [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2]] }
  ],

  init() {
    this.drawPieces();
  },

  drawPieces() {
    const piecesContainer = document.getElementById('pieces-container');
    piecesContainer.innerHTML = '';
    this.list.forEach(piece => {
      const pieceElement = this.createPieceElement(piece);
      piecesContainer.appendChild(pieceElement);
    });
  },

  createPieceElement(piece) {
    const pieceElement = document.createElement('div');
    pieceElement.classList.add('piece');
    pieceElement.style.backgroundColor = piece.color;
    pieceElement.dataset.pieceName = piece.name;

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(5, 10px)';
    grid.style.gridTemplateRows = 'repeat(5, 10px)';

    piece.shape.forEach(([row, col]) => {
      const cell = document.createElement('div');
      cell.style.gridRowStart = row + 1;
      cell.style.gridColumnStart = col + 1;
      cell.style.backgroundColor = piece.color;
      cell.style.border = '1px solid #ccc';
      grid.appendChild(cell);
    });

    pieceElement.appendChild(grid);
    return pieceElement;
  }
};

const Solver = {
  solve() {
    const solutions = [];
    const board = Grid.cells.map(row => row.slice());
    const pieces = Pieces.list.map(piece => this.getPieceVariations(piece)).flat();
    this.backtrack(board, pieces, [], solutions);
    console.log(`Found ${solutions.length} solutions`);
    if (solutions.length > 0) {
      this.visualizeSolution(solutions[0]);
    }
  },

  getPieceVariations(piece) {
    const variations = [];
    let currentShape = piece.shape;
    for (let i = 0; i < 4; i++) {
      variations.push({ ...piece, shape: this.normalizeShape(currentShape) });
      currentShape = this.rotate(currentShape);
    }
    currentShape = this.flip(piece.shape);
    for (let i = 0; i < 4; i++) {
      variations.push({ ...piece, shape: this.normalizeShape(currentShape) });
      currentShape = this.rotate(currentShape);
    }
    return variations;
  },

  rotate(shape) {
    return shape.map(([row, col]) => [col, -row]);
  },

  flip(shape) {
    return shape.map(([row, col]) => [row, -col]);
  },

  normalizeShape(shape) {
    const minRow = Math.min(...shape.map(([row, _]) => row));
    const minCol = Math.min(...shape.map(([_, col]) => col));
    return shape.map(([row, col]) => [row - minRow, col - minCol]);
  },

  backtrack(board, pieces, currentSolution, solutions) {
    if (pieces.length === 0) {
      solutions.push(currentSolution);
      return;
    }

    const piece = pieces[0];
    const remainingPieces = pieces.slice(1);

    for (let row = 0; row < Grid.height; row++) {
      for (let col = 0; col < Grid.width; col++) {
        if (this.canPlace(board, piece, row, col)) {
          const newBoard = this.placePiece(board, piece, row, col);
          const newSolution = [...currentSolution, { piece, row, col }];
          this.backtrack(newBoard, remainingPieces, newSolution, solutions);
        }
      }
    }
  },

  canPlace(board, piece, row, col) {
    for (const [r, c] of piece.shape) {
      const newRow = row + r;
      const newCol = col + c;
      if (
        newRow >= Grid.height ||
        newCol >= Grid.width ||
        newRow < 0 ||
        newCol < 0 ||
        board[newRow][newCol] !== 0
      ) {
        return false;
      }
    }
    return true;
  },

  placePiece(board, piece, row, col) {
    const newBoard = board.map(row => row.slice());
    for (const [r, c] of piece.shape) {
      newBoard[row + r][col + c] = piece.name;
    }
    return newBoard;
  },

  visualizeSolution(solution) {
    Grid.init();
    solution.forEach(({ piece, row, col }) => {
      piece.shape.forEach(([r, c]) => {
        const cellIndex = (row + r) * Grid.width + (col + c);
        const cell = document.getElementById('grid-container').children[cellIndex];
        cell.style.backgroundColor = piece.color;
      });
    });
  }
};

const Controls = {
  init() {
    document.getElementById('reset-button').addEventListener('click', () => App.reset());
    document.getElementById('solve-button').addEventListener('click', () => Solver.solve());
    document.getElementById('preset-button').addEventListener('click', () => App.loadPreset());
  }
};

const App = {
  init() {
    Grid.init();
    Pieces.init();
    Controls.init();
    console.log('App initialized');
  },

  reset() {
    document.getElementById('grid-container').innerHTML = '';
    document.getElementById('pieces-container').innerHTML = '';
    Grid.width = 10;
    Grid.height = 6;
    Grid.init();
    Pieces.init();
  },

  loadPreset() {
    document.getElementById('grid-container').innerHTML = '';
    document.getElementById('pieces-container').innerHTML = '';
    Grid.width = 8;
    Grid.height = 8;
    Grid.init();
    const blockedCells = [[3, 3], [3, 4], [4, 3], [4, 4]];
    blockedCells.forEach(([row, col]) => {
      Grid.cells[row][col] = 'blocked';
      const cellIndex = row * Grid.width + col;
      const cell = document.getElementById('grid-container').children[cellIndex];
      cell.style.backgroundColor = 'black';
    });
    Pieces.init();
  }
};

App.init();
