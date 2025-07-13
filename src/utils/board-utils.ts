import type { Board, BoardConfig, BoardCell, Point, PentominoPiece, CellState } from '@/types'
import { getPentominoVariant } from './pentomino-definitions'
import { getPieceCells, isPointInBounds } from './geometry'

/**
 * Create a new board from configuration
 */
export function createBoard(config: BoardConfig): Board {
  const cells: BoardCell[][] = []
  let emptyCellCount = 0

  // Initialize all cells as empty
  for (let y = 0; y < config.height; y++) {
    cells[y] = []
    for (let x = 0; x < config.width; x++) {
      cells[y][x] = { state: 'empty' }
      emptyCellCount++
    }
  }

  // Mark blocked cells
  for (const blockedCell of config.blockedCells) {
    if (isPointInBounds(blockedCell, config)) {
      cells[blockedCell.y][blockedCell.x] = { state: 'blocked' }
      emptyCellCount--
    }
  }

  return {
    config,
    cells,
    emptyCellCount,
  }
}

/**
 * Create a copy of a board
 */
export function cloneBoard(board: Board): Board {
  return {
    config: { ...board.config, blockedCells: [...board.config.blockedCells] },
    cells: board.cells.map(row => row.map(cell => ({ ...cell }))),
    emptyCellCount: board.emptyCellCount,
  }
}

/**
 * Check if a position is valid on the board
 */
export function isValidPosition(board: Board, position: Point): boolean {
  return isPointInBounds(position, board.config)
}

/**
 * Get the state of a cell at a position
 */
export function getCellState(board: Board, position: Point): CellState | null {
  if (!isValidPosition(board, position)) {
    return null
  }
  return board.cells[position.y][position.x].state
}

/**
 * Set the state of a cell at a position
 */
export function setCellState(
  board: Board,
  position: Point,
  state: CellState,
  pieceId?: string,
  pieceType?: string
): boolean {
  if (!isValidPosition(board, position)) {
    return false
  }

  const cell = board.cells[position.y][position.x]
  const oldState = cell.state

  cell.state = state
  cell.pieceId = pieceId
  cell.pieceType = pieceType as any

  // Update empty cell count
  if (oldState === 'empty' && state !== 'empty') {
    board.emptyCellCount--
  } else if (oldState !== 'empty' && state === 'empty') {
    board.emptyCellCount++
  }

  return true
}

/**
 * Check if a piece can be placed at a position
 */
export function canPlacePiece(
  board: Board,
  piece: PentominoPiece,
  position: Point,
  variantIndex?: number
): boolean {
  const variant = getPentominoVariant(piece.type, variantIndex ?? piece.variantIndex)
  const pieceCells = getPieceCells(variant, position)

  // Check if all piece cells are within bounds and empty
  for (const cell of pieceCells) {
    if (!isValidPosition(board, cell)) {
      return false
    }

    const cellState = getCellState(board, cell)
    if (cellState !== 'empty') {
      return false
    }
  }

  return true
}

/**
 * Place a piece on the board
 */
export function placePiece(
  board: Board,
  piece: PentominoPiece,
  position: Point,
  variantIndex?: number
): boolean {
  if (!canPlacePiece(board, piece, position, variantIndex)) {
    return false
  }

  const variant = getPentominoVariant(piece.type, variantIndex ?? piece.variantIndex)
  const pieceCells = getPieceCells(variant, position)

  // Place the piece
  for (const cell of pieceCells) {
    setCellState(board, cell, 'occupied', piece.id, piece.type)
  }

  return true
}

/**
 * Remove a piece from the board
 */
export function removePiece(board: Board, piece: PentominoPiece): boolean {
  if (!piece.isPlaced) {
    return false
  }

  const variant = getPentominoVariant(piece.type, piece.variantIndex)
  const pieceCells = getPieceCells(variant, piece.position)

  // Remove the piece
  for (const cell of pieceCells) {
    if (isValidPosition(board, cell)) {
      const boardCell = board.cells[cell.y][cell.x]
      if (boardCell.pieceId === piece.id) {
        setCellState(board, cell, 'empty')
      }
    }
  }

  return true
}

/**
 * Get all valid positions where a piece can be placed
 */
export function getValidPlacements(
  board: Board,
  piece: PentominoPiece,
  variantIndex?: number
): Point[] {
  const validPositions: Point[] = []
  // const variant = getPentominoVariant(piece.type, variantIndex ?? piece.variantIndex)

  for (let y = 0; y < board.config.height; y++) {
    for (let x = 0; x < board.config.width; x++) {
      const position = { x, y }
      if (canPlacePiece(board, piece, position, variantIndex)) {
        validPositions.push(position)
      }
    }
  }

  return validPositions
}

/**
 * Check if the board is completely filled
 */
export function isBoardComplete(board: Board): boolean {
  return board.emptyCellCount === 0
}

/**
 * Get the number of empty cells
 */
export function getEmptyCellCount(board: Board): number {
  return board.emptyCellCount
}

/**
 * Get all empty cell positions
 */
export function getEmptyCells(board: Board): Point[] {
  const emptyCells: Point[] = []

  for (let y = 0; y < board.config.height; y++) {
    for (let x = 0; x < board.config.width; x++) {
      if (board.cells[y][x].state === 'empty') {
        emptyCells.push({ x, y })
      }
    }
  }

  return emptyCells
}

/**
 * Get all occupied cell positions
 */
export function getOccupiedCells(board: Board): Point[] {
  const occupiedCells: Point[] = []

  for (let y = 0; y < board.config.height; y++) {
    for (let x = 0; x < board.config.width; x++) {
      if (board.cells[y][x].state === 'occupied') {
        occupiedCells.push({ x, y })
      }
    }
  }

  return occupiedCells
}

/**
 * Reset the board to its initial state
 */
export function resetBoard(board: Board): void {
  // Clear all cells
  for (let y = 0; y < board.config.height; y++) {
    for (let x = 0; x < board.config.width; x++) {
      board.cells[y][x] = { state: 'empty' }
    }
  }

  // Restore blocked cells
  for (const blockedCell of board.config.blockedCells) {
    if (isValidPosition(board, blockedCell)) {
      board.cells[blockedCell.y][blockedCell.x] = { state: 'blocked' }
    }
  }

  // Recalculate empty cell count
  board.emptyCellCount = board.config.width * board.config.height - board.config.blockedCells.length
}

/**
 * Validate board configuration
 */
export function validateBoardConfig(config: BoardConfig): string[] {
  const errors: string[] = []

  if (config.width <= 0) {
    errors.push('Board width must be positive')
  }

  if (config.height <= 0) {
    errors.push('Board height must be positive')
  }

  if (config.width > 50 || config.height > 50) {
    errors.push('Board dimensions are too large (max 50x50)')
  }

  // Check blocked cells are within bounds
  for (const cell of config.blockedCells) {
    if (!isPointInBounds(cell, config)) {
      errors.push(`Blocked cell (${cell.x}, ${cell.y}) is outside board bounds`)
    }
  }

  // Check if there are enough empty cells for all pentominoes (60 cells)
  const totalCells = config.width * config.height
  const blockedCells = config.blockedCells.length
  const emptyCells = totalCells - blockedCells

  if (emptyCells < 60) {
    errors.push(`Not enough empty cells for all pentominoes (need 60, have ${emptyCells})`)
  }

  return errors
}

/**
 * Get board statistics
 */
export function getBoardStats(board: Board) {
  const totalCells = board.config.width * board.config.height
  const blockedCells = board.config.blockedCells.length
  const occupiedCells = totalCells - board.emptyCellCount - blockedCells

  return {
    totalCells,
    emptyCells: board.emptyCellCount,
    occupiedCells,
    blockedCells,
    completionPercentage: ((occupiedCells / (totalCells - blockedCells)) * 100).toFixed(1),
  }
}
