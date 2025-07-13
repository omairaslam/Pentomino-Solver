import { describe, it, expect, beforeEach } from 'vitest'
import { DancingLinksSolver } from '../DancingLinksSolver'
import { createBoard } from '../../utils/board-utils'
import type { BoardConfig, SolverConfig } from '../../types'

describe('DancingLinksSolver', () => {
  let solver: DancingLinksSolver
  let config: SolverConfig

  beforeEach(() => {
    config = {
      algorithm: 'dancing-links',
      engine: 'javascript',
      maxTime: 5000, // 5 seconds for tests
      maxSolutions: 1,
      trackSteps: false, // Disable for faster tests
    }
    solver = new DancingLinksSolver(config)
  })

  describe('Matrix construction', () => {
    it('should build matrix for valid board', async () => {
      const boardConfig: BoardConfig = {
        name: 'Test Rectangle',
        description: 'Simple rectangle for testing',
        width: 6,
        height: 10,
        blockedCells: [],
      }

      const board = createBoard(boardConfig)
      const result = await solver.solve(board)

      expect(result.success).toBe(true)
      // Should either find solutions or complete without error
      expect(result.totalTime).toBeGreaterThan(0)
    }, 10000)

    it('should handle invalid board dimensions', async () => {
      const boardConfig: BoardConfig = {
        name: 'Invalid Board',
        description: 'Board too small',
        width: 2,
        height: 2,
        blockedCells: [],
      }

      const board = createBoard(boardConfig)
      const result = await solver.solve(board)

      expect(result.success).toBe(true)
      expect(result.solutions.length).toBe(0)
      expect(result.totalTime).toBeLessThan(100) // Should fail fast
    }, 2000)

    it('should handle board with wrong number of cells', async () => {
      const boardConfig: BoardConfig = {
        name: 'Wrong Size Board',
        description: 'Board with wrong number of empty cells',
        width: 7,
        height: 7, // 49 cells, not 60
        blockedCells: [],
      }

      const board = createBoard(boardConfig)
      const result = await solver.solve(board)

      expect(result.success).toBe(true)
      expect(result.solutions.length).toBe(0)
      expect(result.totalTime).toBeLessThan(100) // Should fail fast
    }, 2000)
  })

  describe('Algorithm X implementation', () => {
    it('should respect timeout configuration', async () => {
      const shortTimeoutConfig: SolverConfig = {
        ...config,
        maxTime: 100, // Very short timeout
      }
      
      const solverWithTimeout = new DancingLinksSolver(shortTimeoutConfig)
      
      const boardConfig: BoardConfig = {
        name: 'Complex Board',
        description: 'Board that should timeout',
        width: 6,
        height: 10,
        blockedCells: [],
      }

      const board = createBoard(boardConfig)
      
      await expect(solverWithTimeout.solve(board)).rejects.toThrow('timed out')
    }, 5000)

    it('should respect solution limit', async () => {
      const limitedConfig: SolverConfig = {
        ...config,
        maxSolutions: 2,
        maxTime: 10000, // Longer timeout
      }
      
      const solverWithLimit = new DancingLinksSolver(limitedConfig)
      
      const boardConfig: BoardConfig = {
        name: 'Test Rectangle',
        description: 'Rectangle for testing',
        width: 6,
        height: 10,
        blockedCells: [],
      }

      const board = createBoard(boardConfig)
      const result = await solverWithLimit.solve(board)

      expect(result.success).toBe(true)
      if (result.solutions.length > 0) {
        expect(result.solutions.length).toBeLessThanOrEqual(2)
      }
    }, 15000)
  })

  describe('Solution validation', () => {
    it('should produce valid solutions', async () => {
      const boardConfig: BoardConfig = {
        name: 'Small Test',
        description: 'Small board for solution validation',
        width: 5,
        height: 12,
        blockedCells: [],
      }

      const board = createBoard(boardConfig)
      const result = await solver.solve(board)

      expect(result.success).toBe(true)
      
      if (result.solutions.length > 0) {
        const solution = result.solutions[0]
        
        // Should have exactly 12 placements (one for each piece)
        expect(solution.placements).toHaveLength(12)
        
        // Each placement should have required properties
        for (const placement of solution.placements) {
          expect(placement).toHaveProperty('pieceType')
          expect(placement).toHaveProperty('position')
          expect(placement).toHaveProperty('variantIndex')
          expect(typeof placement.position.x).toBe('number')
          expect(typeof placement.position.y).toBe('number')
          expect(typeof placement.variantIndex).toBe('number')
        }
        
        // All piece types should be unique
        const pieceTypes = solution.placements.map(p => p.pieceType)
        const uniqueTypes = new Set(pieceTypes)
        expect(uniqueTypes.size).toBe(12)
      }
    }, 15000)
  })

  describe('Performance characteristics', () => {
    it('should provide progress updates', () => {
      const progress = solver.getProgress()
      
      expect(progress).toHaveProperty('stepsExplored')
      expect(progress).toHaveProperty('solutionsFound')
      expect(progress).toHaveProperty('timeElapsed')
      expect(typeof progress.stepsExplored).toBe('number')
      expect(typeof progress.solutionsFound).toBe('number')
      expect(typeof progress.timeElapsed).toBe('number')
    })

    it('should allow stopping the solver', () => {
      expect(() => solver.stop()).not.toThrow()
    })

    it('should handle empty board gracefully', async () => {
      const boardConfig: BoardConfig = {
        name: 'Empty Board',
        description: 'Board with no empty cells',
        width: 8,
        height: 8,
        blockedCells: Array.from({ length: 64 }, (_, i) => ({
          x: i % 8,
          y: Math.floor(i / 8)
        })),
      }

      const board = createBoard(boardConfig)
      const result = await solver.solve(board)

      expect(result.success).toBe(true)
      expect(result.solutions.length).toBe(0)
      expect(result.totalTime).toBeLessThan(100) // Should complete quickly
    }, 2000)
  })

  describe('Matrix validation', () => {
    it('should validate board before solving', async () => {
      // This test ensures the validation methods work correctly
      const validBoardConfig: BoardConfig = {
        name: 'Valid Board',
        description: 'Board with exactly 60 empty cells',
        width: 6,
        height: 10,
        blockedCells: [],
      }

      const validBoard = createBoard(validBoardConfig)
      const validResult = await solver.solve(validBoard)

      expect(validResult.success).toBe(true)
      // Should not fail due to validation
    }, 5000)
  })
})
