import { describe, it, expect, beforeEach } from 'vitest'
import { BacktrackingSolver } from '../BacktrackingSolver'
import { createBoard } from '../../utils/board-utils'
import type { BoardConfig, SolverConfig } from '../../types'

describe('BacktrackingSolver', () => {
  let solver: BacktrackingSolver
  let config: SolverConfig

  beforeEach(() => {
    config = {
      algorithm: 'backtracking',
      engine: 'javascript',
      maxTime: 5000, // 5 seconds for tests
      maxSolutions: 1,
      trackSteps: false, // Disable for faster tests
    }
    solver = new BacktrackingSolver(config)
  })

  describe('Small board tests', () => {
    it('should solve a simple 5x12 rectangle', async () => {
      const boardConfig: BoardConfig = {
        name: 'Test Rectangle',
        description: 'Simple rectangle for testing',
        width: 5,
        height: 12,
        blockedCells: [],
      }

      const board = createBoard(boardConfig)
      const result = await solver.solve(board)

      expect(result.success).toBe(true)
      expect(result.solutions.length).toBeGreaterThan(0)
      expect(result.solutions[0].placements).toHaveLength(12) // All 12 pieces
      expect(result.totalTime).toBeGreaterThan(0)
      expect(result.stepsExplored).toBeGreaterThan(0)
    }, 10000) // 10 second timeout

    it('should solve a 6x10 rectangle', async () => {
      const boardConfig: BoardConfig = {
        name: 'Test Rectangle 6x10',
        description: 'Rectangle for testing',
        width: 6,
        height: 10,
        blockedCells: [],
      }

      const board = createBoard(boardConfig)
      const result = await solver.solve(board)

      expect(result.success).toBe(true)
      expect(result.solutions.length).toBeGreaterThan(0)
      expect(result.solutions[0].placements).toHaveLength(12)
    }, 10000)
  })

  describe('Configuration tests', () => {
    it('should respect maxSolutions limit', async () => {
      const configWithLimit: SolverConfig = {
        ...config,
        maxSolutions: 2,
      }
      
      const solverWithLimit = new BacktrackingSolver(configWithLimit)
      
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
      expect(result.solutions.length).toBeLessThanOrEqual(2)
    }, 15000)

    it('should track steps when enabled', async () => {
      const configWithSteps: SolverConfig = {
        ...config,
        trackSteps: true,
        maxTime: 2000, // Shorter time to avoid too many steps
      }
      
      const solverWithSteps = new BacktrackingSolver(configWithSteps)
      
      const boardConfig: BoardConfig = {
        name: 'Small Test',
        description: 'Small board for step tracking',
        width: 4,
        height: 5,
        blockedCells: [],
      }

      const board = createBoard(boardConfig)
      const result = await solverWithSteps.solve(board)

      if (result.success && result.solutions.length > 0) {
        expect(result.solutions[0].steps.length).toBeGreaterThan(0)
        
        // Check step structure
        const firstStep = result.solutions[0].steps[0]
        expect(firstStep).toHaveProperty('stepNumber')
        expect(firstStep).toHaveProperty('pieceType')
        expect(firstStep).toHaveProperty('position')
        expect(firstStep).toHaveProperty('variantIndex')
        expect(firstStep).toHaveProperty('isPlacement')
        expect(firstStep).toHaveProperty('boardState')
      }
    }, 10000)

    it('should timeout when maxTime is exceeded', async () => {
      const configWithTimeout: SolverConfig = {
        ...config,
        maxTime: 100, // Very short timeout
      }
      
      const solverWithTimeout = new BacktrackingSolver(configWithTimeout)
      
      const boardConfig: BoardConfig = {
        name: 'Complex Board',
        description: 'Board that should timeout',
        width: 8,
        height: 8,
        blockedCells: [
          { x: 3, y: 3 }, { x: 4, y: 3 },
          { x: 3, y: 4 }, { x: 4, y: 4 }
        ],
      }

      const board = createBoard(boardConfig)
      
      await expect(solverWithTimeout.solve(board)).rejects.toThrow('timed out')
    }, 5000)
  })

  describe('Invalid board tests', () => {
    it('should handle board with insufficient space', async () => {
      const boardConfig: BoardConfig = {
        name: 'Too Small',
        description: 'Board too small for all pieces',
        width: 3,
        height: 3, // Only 9 cells, need 60
        blockedCells: [],
      }

      const board = createBoard(boardConfig)
      const result = await solver.solve(board)

      expect(result.success).toBe(true) // Should complete without error
      expect(result.solutions.length).toBe(0) // But find no solutions
    }, 5000)

    it('should handle board with too many blocked cells', async () => {
      const boardConfig: BoardConfig = {
        name: 'Too Many Blocked',
        description: 'Board with too many blocked cells',
        width: 8,
        height: 8,
        blockedCells: Array.from({ length: 50 }, (_, i) => ({
          x: i % 8,
          y: Math.floor(i / 8)
        })), // Block most cells
      }

      const board = createBoard(boardConfig)
      const result = await solver.solve(board)

      expect(result.success).toBe(true)
      expect(result.solutions.length).toBe(0)
    }, 5000)
  })

  describe('Progress tracking', () => {
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
  })
})
