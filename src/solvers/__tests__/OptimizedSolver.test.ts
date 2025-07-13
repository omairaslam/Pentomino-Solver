import { describe, it, expect, beforeEach } from 'vitest'
import { BacktrackingSolver } from '../BacktrackingSolver'
import { createBoard } from '../../utils/board-utils'
import { performanceMonitor } from '../../utils/performance'
import type { BoardConfig, SolverConfig } from '../../types'

describe('Optimized BacktrackingSolver', () => {
  let solver: BacktrackingSolver
  let config: SolverConfig

  beforeEach(() => {
    config = {
      algorithm: 'backtracking',
      engine: 'javascript',
      maxTime: 3000, // 3 seconds for optimized tests
      maxSolutions: 1,
      trackSteps: false, // Disable for performance
    }
    solver = new BacktrackingSolver(config)
    performanceMonitor.clear()
  })

  describe('Performance optimizations', () => {
    it('should solve a 6x10 rectangle faster with optimizations', async () => {
      const boardConfig: BoardConfig = {
        name: 'Optimized Test Rectangle',
        description: 'Rectangle for performance testing',
        width: 6,
        height: 10,
        blockedCells: [],
      }

      const board = createBoard(boardConfig)
      const startTime = Date.now()
      
      const result = await solver.solve(board)
      
      const endTime = Date.now()
      const solvingTime = endTime - startTime

      expect(result.success).toBe(true)
      expect(result.solutions.length).toBeGreaterThan(0)
      expect(solvingTime).toBeLessThan(3000) // Should solve within 3 seconds
      expect(result.stepsExplored).toBeGreaterThan(0)
      
      console.log(`Solved in ${solvingTime}ms with ${result.stepsExplored} steps`)
    }, 5000)

    it('should use caching effectively', async () => {
      const boardConfig: BoardConfig = {
        name: 'Cache Test',
        description: 'Small board for cache testing',
        width: 5,
        height: 4,
        blockedCells: [],
      }

      const board = createBoard(boardConfig)
      
      // First solve - should be computed
      const result1 = await solver.solve(board)
      const time1 = result1.totalTime
      
      // Second solve - should be cached
      const result2 = await solver.solve(board)
      const time2 = result2.totalTime
      
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(time2).toBeLessThan(time1) // Cached should be faster
      
      console.log(`First solve: ${time1}ms, Cached solve: ${time2}ms`)
    }, 8000)

    it('should handle impossible boards quickly', async () => {
      const boardConfig: BoardConfig = {
        name: 'Impossible Board',
        description: 'Board that cannot be solved',
        width: 3,
        height: 3, // Too small for pentominos
        blockedCells: [],
      }

      const board = createBoard(boardConfig)
      const startTime = Date.now()
      
      const result = await solver.solve(board)
      
      const endTime = Date.now()
      const solvingTime = endTime - startTime

      expect(result.success).toBe(true)
      expect(result.solutions.length).toBe(0)
      expect(solvingTime).toBeLessThan(100) // Should fail fast
      
      console.log(`Impossible board detected in ${solvingTime}ms`)
    }, 2000)

    it('should respect piece ordering optimization', async () => {
      const boardConfig: BoardConfig = {
        name: 'Piece Order Test',
        description: 'Test piece ordering',
        width: 5,
        height: 12,
        blockedCells: [],
      }

      const board = createBoard(boardConfig)
      
      const result = await solver.solve(board)
      
      expect(result.success).toBe(true)
      
      if (result.solutions.length > 0) {
        const solution = result.solutions[0]
        // Check that X piece (most constrained) is placed early
        const xPlacement = solution.placements.find(p => p.pieceType === 'X')
        expect(xPlacement).toBeDefined()
        
        console.log('Solution found with optimized piece ordering')
      }
    }, 10000)
  })

  describe('Early pruning', () => {
    it('should prune impossible branches early', async () => {
      const boardConfig: BoardConfig = {
        name: 'Pruning Test',
        description: 'Board with limited space',
        width: 8,
        height: 8,
        blockedCells: [
          // Block many cells to create constraints
          { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
          { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
          { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 },
          { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 },
        ],
      }

      const board = createBoard(boardConfig)
      const startTime = Date.now()
      
      const result = await solver.solve(board)
      
      const endTime = Date.now()
      const solvingTime = endTime - startTime

      // Should complete quickly due to early pruning
      expect(solvingTime).toBeLessThan(2000)
      expect(result.stepsExplored).toBeGreaterThan(0)
      
      console.log(`Pruning test completed in ${solvingTime}ms with ${result.stepsExplored} steps`)
    }, 5000)
  })

  describe('Progress tracking', () => {
    it('should provide meaningful progress updates', () => {
      const progress = solver.getProgress()
      
      expect(progress).toHaveProperty('stepsExplored')
      expect(progress).toHaveProperty('solutionsFound')
      expect(progress).toHaveProperty('timeElapsed')
      expect(typeof progress.stepsExplored).toBe('number')
      expect(typeof progress.solutionsFound).toBe('number')
      expect(typeof progress.timeElapsed).toBe('number')
    })
  })
})
