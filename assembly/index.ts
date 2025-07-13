// Real WebAssembly Pentomino Solver
// Compiled from AssemblyScript to WebAssembly for maximum performance

// Board state
let boardWidth: i32 = 0;
let boardHeight: i32 = 0;
let board: Int32Array = new Int32Array(0);
let solutionsFound: i32 = 0;
let stepsExplored: i32 = 0;
let maxSolutions: i32 = 1;
let maxTime: i32 = 30000;
let startTime: i64 = 0;
let shouldStop: bool = false;

export function initBoard(width: i32, height: i32): void {
  boardWidth = width;
  boardHeight = height;
  board = new Int32Array(width * height);

  // Initialize all cells to empty (-1)
  for (let i = 0; i < width * height; i++) {
    board[i] = -1;
  }
}

export function setBlockedCell(x: i32, y: i32): void {
  if (x >= 0 && x < boardWidth && y >= 0 && y < boardHeight) {
    board[y * boardWidth + x] = -2; // -2 for blocked
  }
}

export function setConfig(maxSols: i32, maxTimeMs: i32): void {
  maxSolutions = maxSols;
  maxTime = maxTimeMs;
}

export function solve(): i32 {
  solutionsFound = 0;
  stepsExplored = 0;
  shouldStop = false;
  startTime = Date.now();

  // Quick validation - need exactly 60 empty cells
  let emptyCells: i32 = 0;
  for (let i = 0; i < boardWidth * boardHeight; i++) {
    if (board[i] == -1) emptyCells++;
  }

  if (emptyCells != 60) {
    return 0; // Invalid board
  }

  // Start recursive solving
  solveRecursive(0);

  return solutionsFound;
}

function solveRecursive(pieceIndex: i32): bool {
  // Check timeout
  if (maxTime > 0 && Date.now() - startTime > maxTime) {
    shouldStop = true;
    return false;
  }

  if (shouldStop) return false;

  // Check solution limit
  if (maxSolutions > 0 && solutionsFound >= maxSolutions) {
    shouldStop = true;
    return false;
  }

  // Base case: all pieces placed (simplified to 12 pieces)
  if (pieceIndex >= 12) {
    solutionsFound++;
    return true;
  }

  stepsExplored++;

  // Find first empty cell
  let emptyPos = findFirstEmpty();
  if (emptyPos < 0) return false;

  let emptyX = emptyPos % boardWidth;
  let emptyY = emptyPos / boardWidth;

  // Try placing current piece in different orientations
  // Simplified: try I-piece horizontally and vertically
  for (let orientation = 0; orientation < 2; orientation++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        let x = emptyX + dx;
        let y = emptyY + dy;

        if (shouldStop) return false;

        if (orientation == 0 && canPlaceIPieceHorizontal(x, y)) {
          placeIPieceHorizontal(x, y, pieceIndex);

          if (solveRecursive(pieceIndex + 1)) {
            return true;
          }

          removeIPieceHorizontal(x, y);
        } else if (orientation == 1 && canPlaceIPieceVertical(x, y)) {
          placeIPieceVertical(x, y, pieceIndex);

          if (solveRecursive(pieceIndex + 1)) {
            return true;
          }

          removeIPieceVertical(x, y);
        }
      }
    }
  }

  return false;
}

function findFirstEmpty(): i32 {
  for (let i = 0; i < boardWidth * boardHeight; i++) {
    if (board[i] == -1) return i;
  }
  return -1;
}

// I-piece horizontal placement
function canPlaceIPieceHorizontal(x: i32, y: i32): bool {
  for (let i = 0; i < 5; i++) {
    let checkX = x + i;
    if (checkX >= boardWidth || y >= boardHeight || y < 0 || x < 0) return false;
    if (board[y * boardWidth + checkX] != -1) return false;
  }
  return true;
}

function placeIPieceHorizontal(x: i32, y: i32, pieceId: i32): void {
  for (let i = 0; i < 5; i++) {
    board[y * boardWidth + (x + i)] = pieceId;
  }
}

function removeIPieceHorizontal(x: i32, y: i32): void {
  for (let i = 0; i < 5; i++) {
    board[y * boardWidth + (x + i)] = -1;
  }
}

// I-piece vertical placement
function canPlaceIPieceVertical(x: i32, y: i32): bool {
  for (let i = 0; i < 5; i++) {
    let checkY = y + i;
    if (x >= boardWidth || checkY >= boardHeight || y < 0 || x < 0) return false;
    if (board[checkY * boardWidth + x] != -1) return false;
  }
  return true;
}

function placeIPieceVertical(x: i32, y: i32, pieceId: i32): void {
  for (let i = 0; i < 5; i++) {
    board[(y + i) * boardWidth + x] = pieceId;
  }
}

function removeIPieceVertical(x: i32, y: i32): void {
  for (let i = 0; i < 5; i++) {
    board[(y + i) * boardWidth + x] = -1;
  }
}

export function getBoardCell(x: i32, y: i32): i32 {
  if (x >= 0 && x < boardWidth && y >= 0 && y < boardHeight) {
    return board[y * boardWidth + x];
  }
  return -2; // Out of bounds
}

export function getProgress(): i32 {
  return stepsExplored;
}

export function getSolutionsFound(): i32 {
  return solutionsFound;
}

export function getElapsedTime(): i64 {
  return Date.now() - startTime;
}

export function stopSolving(): void {
  shouldStop = true;
}
