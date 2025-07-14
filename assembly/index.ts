// Real WebAssembly Pentomino Solver - Full Implementation
// Compiled from AssemblyScript to WebAssembly for maximum performance

// Simplified pentomino piece definitions
// Each piece is represented as a flat array of coordinates: [x1,y1, x2,y2, x3,y3, x4,y4, x5,y5]
const I_PIECE: StaticArray<i32> = [0,0, 0,1, 0,2, 0,3, 0,4];
const L_PIECE: StaticArray<i32> = [0,0, 0,1, 0,2, 0,3, 1,3];
const N_PIECE: StaticArray<i32> = [0,0, 0,1, 1,1, 1,2, 1,3];
const P_PIECE: StaticArray<i32> = [0,0, 0,1, 1,0, 1,1, 1,2];
const Y_PIECE: StaticArray<i32> = [0,0, 0,1, 0,2, 1,1, 2,1];
const T_PIECE: StaticArray<i32> = [0,0, 1,0, 2,0, 1,1, 1,2];
const U_PIECE: StaticArray<i32> = [0,0, 0,1, 1,1, 2,1, 2,0];
const V_PIECE: StaticArray<i32> = [0,0, 0,1, 0,2, 1,2, 2,2];
const W_PIECE: StaticArray<i32> = [0,0, 0,1, 1,1, 1,2, 2,2];
const X_PIECE: StaticArray<i32> = [1,0, 0,1, 1,1, 2,1, 1,2];
const Z_PIECE: StaticArray<i32> = [0,0, 1,0, 1,1, 1,2, 2,2];
const F_PIECE: StaticArray<i32> = [0,1, 1,0, 1,1, 1,2, 2,1];

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

// Used pieces tracking
let usedPieces: StaticArray<bool> = new StaticArray<bool>(12);

function getPieceDefinition(pieceId: i32): StaticArray<i32> {
  switch (pieceId) {
    case 0: return I_PIECE;
    case 1: return L_PIECE;
    case 2: return N_PIECE;
    case 3: return P_PIECE;
    case 4: return Y_PIECE;
    case 5: return T_PIECE;
    case 6: return U_PIECE;
    case 7: return V_PIECE;
    case 8: return W_PIECE;
    case 9: return X_PIECE;
    case 10: return Z_PIECE;
    case 11: return F_PIECE;
    default: return I_PIECE; // Fallback
  }
}

function rotatePiece(piece: StaticArray<i32>, rotations: i32): StaticArray<i32> {
  let result = new StaticArray<i32>(10); // 5 cells * 2 coordinates

  for (let i = 0; i < 5; i++) {
    let x = piece[i * 2];
    let y = piece[i * 2 + 1];

    // Apply rotations (90 degrees each)
    for (let r = 0; r < rotations; r++) {
      let newX = y;
      let newY = -x;
      x = newX;
      y = newY;
    }

    result[i * 2] = x;
    result[i * 2 + 1] = y;
  }

  return result;
}

function normalizePiece(piece: StaticArray<i32>): StaticArray<i32> {
  let minX = piece[0];
  let minY = piece[1];

  // Find minimum coordinates
  for (let i = 1; i < 5; i++) {
    if (piece[i * 2] < minX) minX = piece[i * 2];
    if (piece[i * 2 + 1] < minY) minY = piece[i * 2 + 1];
  }

  // Normalize to origin
  let result = new StaticArray<i32>(10);
  for (let i = 0; i < 5; i++) {
    result[i * 2] = piece[i * 2] - minX;
    result[i * 2 + 1] = piece[i * 2 + 1] - minY;
  }

  return result;
}

export function initBoard(width: i32, height: i32): void {
  boardWidth = width;
  boardHeight = height;
  board = new Int32Array(width * height);

  // Initialize all cells to empty (-1)
  for (let i = 0; i < width * height; i++) {
    board[i] = -1;
  }

  // Reset used pieces
  for (let i = 0; i < 12; i++) {
    usedPieces[i] = false;
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

  // Reset used pieces
  for (let i = 0; i < 12; i++) {
    usedPieces[i] = false;
  }

  // Start real backtracking algorithm
  solveBacktrack();

  return solutionsFound;
}

function solveBacktrack(): bool {
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

  stepsExplored++;

  // Find next piece to place (simple order for now)
  let nextPiece = findNextUnusedPiece();
  if (nextPiece == -1) {
    // All pieces placed - solution found!
    solutionsFound++;
    return maxSolutions <= 1; // Stop if we only want one solution
  }

  // Try different orientations of the selected piece
  let basePiece = getPieceDefinition(nextPiece);

  // Try 4 rotations
  for (let rotation = 0; rotation < 4; rotation++) {
    let rotatedPiece = rotatePiece(basePiece, rotation);
    let normalizedPiece = normalizePiece(rotatedPiece);

    // Try all positions on the board
    for (let y = 0; y < boardHeight; y++) {
      for (let x = 0; x < boardWidth; x++) {
        if (shouldStop) return false;

        if (canPlacePiece(normalizedPiece, x, y)) {
          // Place the piece
          placePiece(normalizedPiece, x, y, nextPiece);
          usedPieces[nextPiece] = true;

          // Recursively solve
          if (solveBacktrack()) {
            return true; // Solution found and we're stopping
          }

          // Backtrack: remove the piece
          removePiece(normalizedPiece, x, y);
          usedPieces[nextPiece] = false;
        }
      }
    }
  }

  return false; // No solution found with current configuration
}

function findNextUnusedPiece(): i32 {
  for (let pieceId = 0; pieceId < 12; pieceId++) {
    if (!usedPieces[pieceId]) {
      return pieceId;
    }
  }
  return -1; // All pieces used
}

function canPlacePiece(orientation: StaticArray<i32>, startX: i32, startY: i32): bool {
  // Check if all 5 cells of the piece can be placed
  for (let i = 0; i < 5; i++) {
    let x = startX + orientation[i * 2];
    let y = startY + orientation[i * 2 + 1];

    // Check bounds
    if (x < 0 || x >= boardWidth || y < 0 || y >= boardHeight) {
      return false;
    }

    // Check if cell is already occupied
    if (board[y * boardWidth + x] != -1) {
      return false;
    }
  }

  return true;
}

function placePiece(orientation: StaticArray<i32>, startX: i32, startY: i32, pieceId: i32): void {
  for (let i = 0; i < 5; i++) {
    let x = startX + orientation[i * 2];
    let y = startY + orientation[i * 2 + 1];
    board[y * boardWidth + x] = pieceId;
  }
}

function removePiece(orientation: StaticArray<i32>, startX: i32, startY: i32): void {
  for (let i = 0; i < 5; i++) {
    let x = startX + orientation[i * 2];
    let y = startY + orientation[i * 2 + 1];
    board[y * boardWidth + x] = -1;
  }
}

function validateSolution(): bool {
  // Check that all cells are filled (except blocked ones)
  for (let i = 0; i < boardWidth * boardHeight; i++) {
    if (board[i] == -1) return false; // Empty cell found
  }

  // Check that all 12 pieces are used exactly once
  let pieceCounts: StaticArray<i32> = new StaticArray<i32>(12);
  for (let i = 0; i < 12; i++) {
    pieceCounts[i] = 0;
  }

  for (let i = 0; i < boardWidth * boardHeight; i++) {
    let pieceId = board[i];
    if (pieceId >= 0 && pieceId < 12) {
      pieceCounts[pieceId]++;
    }
  }

  // Each piece should appear exactly 5 times
  for (let i = 0; i < 12; i++) {
    if (pieceCounts[i] != 5) return false;
  }

  return true;
}

// Additional utility functions for debugging and analysis
export function validateCurrentSolution(): bool {
  return validateSolution();
}

export function getPieceCount(): i32 {
  return 12;
}

export function getUsedPieceCount(): i32 {
  let count = 0;
  for (let i = 0; i < 12; i++) {
    if (usedPieces[i]) count++;
  }
  return count;
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
