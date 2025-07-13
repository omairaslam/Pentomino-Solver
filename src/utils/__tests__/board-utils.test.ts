import { describe, it, expect } from 'vitest'
import {
  createBoard,
  cloneBoard,
  isValidPosition,
  getCellState,
  setCellState,
  canPlacePiece,
  placePiece,
  removePiece,
  getValidPlacements,
  isBoardComplete,
  getEmptyCellCount,
  getEmptyCells,
  resetBoard,
  validateBoardConfig,
  getBoardStats,
} from '../board-utils'
import { createPentominoPiece } from '../pentomino-definitions'
import type { BoardConfig } from '@/types'

describe('Board Utils', () => {
  const simpleConfig: BoardConfig = {
    name: 'Test Board',
    description: 'A test board',
    width: 4,
    height: 3,
    blockedCells: [{ x: 1, y: 1 }],
  }

  describe('createBoard', () => {
    it('should create a board with correct dimensions', () => {
      const board = createBoard(simpleConfig)
      
      expect(board.config).toEqual(simpleConfig)
      expect(board.cells).toHaveLength(3) // height
      expect(board.cells[0]).toHaveLength(4) // width
    })

    it('should initialize empty cells correctly', () => {
      const board = createBoard(simpleConfig)
      
      // Check that most cells are empty
      expect(board.cells[0][0].state).toBe('empty')
      expect(board.cells[2][3].state).toBe('empty')
    })

    it('should mark blocked cells correctly', () => {
      const board = createBoard(simpleConfig)
      
      expect(board.cells[1][1].state).toBe('blocked')
    })

    it('should calculate empty cell count correctly', () => {
      const board = createBoard(simpleConfig)
      const totalCells = 4 * 3 // 12
      const blockedCells = 1
      const expectedEmpty = totalCells - blockedCells // 11
      
      expect(board.emptyCellCount).toBe(expectedEmpty)
    })
  })

  describe('cloneBoard', () => {
    it('should create a deep copy of the board', () => {
      const original = createBoard(simpleConfig)
      const clone = cloneBoard(original)
      
      expect(clone).toEqual(original)
      expect(clone).not.toBe(original)
      expect(clone.cells).not.toBe(original.cells)
      expect(clone.config).not.toBe(original.config)
    })
  })

  describe('isValidPosition', () => {
    it('should return true for valid positions', () => {
      const board = createBoard(simpleConfig)
      
      expect(isValidPosition(board, { x: 0, y: 0 })).toBe(true)
      expect(isValidPosition(board, { x: 3, y: 2 })).toBe(true)
    })

    it('should return false for invalid positions', () => {
      const board = createBoard(simpleConfig)
      
      expect(isValidPosition(board, { x: -1, y: 0 })).toBe(false)
      expect(isValidPosition(board, { x: 4, y: 0 })).toBe(false)
      expect(isValidPosition(board, { x: 0, y: 3 })).toBe(false)
    })
  })

  describe('getCellState and setCellState', () => {
    it('should get and set cell states correctly', () => {
      const board = createBoard(simpleConfig)
      
      expect(getCellState(board, { x: 0, y: 0 })).toBe('empty')
      expect(getCellState(board, { x: 1, y: 1 })).toBe('blocked')
      
      setCellState(board, { x: 0, y: 0 }, 'occupied', 'piece1', 'F')
      expect(getCellState(board, { x: 0, y: 0 })).toBe('occupied')
      expect(board.cells[0][0].pieceId).toBe('piece1')
    })

    it('should update empty cell count when setting states', () => {
      const board = createBoard(simpleConfig)
      const initialCount = board.emptyCellCount
      
      setCellState(board, { x: 0, y: 0 }, 'occupied')
      expect(board.emptyCellCount).toBe(initialCount - 1)
      
      setCellState(board, { x: 0, y: 0 }, 'empty')
      expect(board.emptyCellCount).toBe(initialCount)
    })
  })

  describe('piece placement', () => {
    it('should check if a piece can be placed', () => {
      const board = createBoard({
        name: 'Test',
        description: 'Test',
        width: 5,
        height: 5,
        blockedCells: [],
      })
      
      const piece = createPentominoPiece('I') // 5-cell straight piece
      
      // Should be able to place at origin
      expect(canPlacePiece(board, piece, { x: 0, y: 0 })).toBe(true)
      
      // Should not be able to place if it goes out of bounds
      expect(canPlacePiece(board, piece, { x: 1, y: 0 })).toBe(false) // I-piece is 5 cells wide
    })

    it('should place and remove pieces correctly', () => {
      const board = createBoard({
        name: 'Test',
        description: 'Test',
        width: 6,
        height: 6,
        blockedCells: [],
      })
      
      const piece = createPentominoPiece('I')
      const position = { x: 0, y: 0 }
      
      // Place piece
      expect(placePiece(board, piece, position)).toBe(true)
      piece.isPlaced = true
      piece.position = position
      
      // Check that cells are occupied
      for (let x = 0; x < 5; x++) {
        expect(getCellState(board, { x, y: 0 })).toBe('occupied')
      }
      
      // Remove piece
      expect(removePiece(board, piece)).toBe(true)
      
      // Check that cells are empty again
      for (let x = 0; x < 5; x++) {
        expect(getCellState(board, { x, y: 0 })).toBe('empty')
      }
    })
  })

  describe('board analysis', () => {
    it('should detect when board is complete', () => {
      const board = createBoard({
        name: 'Small',
        description: 'Small board',
        width: 2,
        height: 2,
        blockedCells: [],
      })
      
      expect(isBoardComplete(board)).toBe(false)
      
      // Fill all cells
      setCellState(board, { x: 0, y: 0 }, 'occupied')
      setCellState(board, { x: 1, y: 0 }, 'occupied')
      setCellState(board, { x: 0, y: 1 }, 'occupied')
      setCellState(board, { x: 1, y: 1 }, 'occupied')
      
      expect(isBoardComplete(board)).toBe(true)
    })

    it('should get empty cells correctly', () => {
      const board = createBoard(simpleConfig)
      const emptyCells = getEmptyCells(board)
      
      expect(emptyCells).toHaveLength(11) // 12 total - 1 blocked
      expect(emptyCells).not.toContainEqual({ x: 1, y: 1 }) // blocked cell
    })

    it('should provide correct board statistics', () => {
      const board = createBoard(simpleConfig)
      const stats = getBoardStats(board)
      
      expect(stats.totalCells).toBe(12)
      expect(stats.emptyCells).toBe(11)
      expect(stats.occupiedCells).toBe(0)
      expect(stats.blockedCells).toBe(1)
      expect(stats.completionPercentage).toBe('0.0')
    })
  })

  describe('validateBoardConfig', () => {
    it('should validate correct configurations', () => {
      const errors = validateBoardConfig(simpleConfig)
      expect(errors).toHaveLength(1) // Not enough cells for pentominoes
    })

    it('should detect invalid dimensions', () => {
      const invalidConfig: BoardConfig = {
        name: 'Invalid',
        description: 'Invalid board',
        width: 0,
        height: -1,
        blockedCells: [],
      }
      
      const errors = validateBoardConfig(invalidConfig)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some(e => e.includes('width'))).toBe(true)
      expect(errors.some(e => e.includes('height'))).toBe(true)
    })

    it('should detect out-of-bounds blocked cells', () => {
      const invalidConfig: BoardConfig = {
        name: 'Invalid',
        description: 'Invalid board',
        width: 3,
        height: 3,
        blockedCells: [{ x: 5, y: 5 }],
      }
      
      const errors = validateBoardConfig(invalidConfig)
      expect(errors.some(e => e.includes('outside board bounds'))).toBe(true)
    })
  })

  describe('resetBoard', () => {
    it('should reset board to initial state', () => {
      const board = createBoard(simpleConfig)
      
      // Modify the board
      setCellState(board, { x: 0, y: 0 }, 'occupied')
      setCellState(board, { x: 2, y: 2 }, 'occupied')
      
      // Reset
      resetBoard(board)
      
      // Check that it's back to initial state
      expect(getCellState(board, { x: 0, y: 0 })).toBe('empty')
      expect(getCellState(board, { x: 2, y: 2 })).toBe('empty')
      expect(getCellState(board, { x: 1, y: 1 })).toBe('blocked') // Should remain blocked
      expect(board.emptyCellCount).toBe(11)
    })
  })
})
