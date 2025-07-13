import type { Board, SolverSolution, PentominoType } from '../types'

/**
 * Cache key for board configurations
 * (Currently using string keys, but this interface is ready for future enhancements)
 */
// interface CacheKey {
//   boardHash: string
//   availablePieces: PentominoType[]
// }

/**
 * Cached solution data
 */
interface CachedSolution {
  solutions: SolverSolution[]
  timestamp: number
  hitCount: number
}

/**
 * Solution cache for pentomino puzzles
 * Caches solutions based on board configuration and available pieces
 */
export class SolutionCache {
  private cache = new Map<string, CachedSolution>()
  private maxCacheSize: number
  private maxAge: number // in milliseconds

  constructor(maxCacheSize: number = 100, maxAgeMinutes: number = 30) {
    this.maxCacheSize = maxCacheSize
    this.maxAge = maxAgeMinutes * 60 * 1000
  }

  /**
   * Generate a cache key for a board and piece configuration
   */
  private generateCacheKey(board: Board, availablePieces: PentominoType[]): string {
    const boardHash = this.hashBoard(board)
    const piecesHash = availablePieces.sort().join(',')
    return `${boardHash}:${piecesHash}`
  }

  /**
   * Generate a hash for the board configuration
   */
  private hashBoard(board: Board): string {
    const { width, height, blockedCells } = board.config
    
    // Create a simple hash based on board dimensions and blocked cells
    let hash = `${width}x${height}`
    
    if (blockedCells.length > 0) {
      const sortedBlocked = blockedCells
        .map(cell => `${cell.x},${cell.y}`)
        .sort()
        .join(';')
      hash += `:${sortedBlocked}`
    }
    
    return hash
  }

  /**
   * Get cached solutions if available
   */
  get(board: Board, availablePieces: PentominoType[]): SolverSolution[] | null {
    const key = this.generateCacheKey(board, availablePieces)
    const cached = this.cache.get(key)
    
    if (!cached) {
      return null
    }
    
    // Check if cache entry is too old
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key)
      return null
    }
    
    // Update hit count and return solutions
    cached.hitCount++
    return [...cached.solutions] // Return a copy
  }

  /**
   * Store solutions in cache
   */
  set(board: Board, availablePieces: PentominoType[], solutions: SolverSolution[]): void {
    const key = this.generateCacheKey(board, availablePieces)
    
    // Clean up old entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanup()
    }
    
    this.cache.set(key, {
      solutions: [...solutions], // Store a copy
      timestamp: Date.now(),
      hitCount: 0,
    })
  }

  /**
   * Clean up old and least used cache entries
   */
  private cleanup(): void {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())
    
    // Remove expired entries
    for (const [key, cached] of entries) {
      if (now - cached.timestamp > this.maxAge) {
        this.cache.delete(key)
      }
    }
    
    // If still too many entries, remove least used ones
    if (this.cache.size >= this.maxCacheSize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].hitCount - b[1].hitCount)
      
      const toRemove = Math.ceil(this.maxCacheSize * 0.2) // Remove 20%
      for (let i = 0; i < toRemove && i < sortedEntries.length; i++) {
        this.cache.delete(sortedEntries[i][0])
      }
    }
  }

  /**
   * Clear all cached solutions
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    oldestEntry: number
  } {
    const entries = Array.from(this.cache.values())
    const totalHits = entries.reduce((sum, entry) => sum + entry.hitCount, 0)
    const totalEntries = entries.length
    const oldestTimestamp = entries.length > 0 
      ? Math.min(...entries.map(entry => entry.timestamp))
      : Date.now()
    
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: totalEntries > 0 ? totalHits / totalEntries : 0,
      oldestEntry: Date.now() - oldestTimestamp,
    }
  }

  /**
   * Check if a board configuration is likely solvable
   * Based on basic constraints
   */
  isLikelySolvable(board: Board, availablePieces: PentominoType[]): boolean {
    // Count empty cells
    let emptyCells = 0
    for (let y = 0; y < board.config.height; y++) {
      for (let x = 0; x < board.config.width; x++) {
        if (board.cells[y][x].state === 'empty') {
          emptyCells++
        }
      }
    }
    
    // Check if we have exactly the right number of cells
    const requiredCells = availablePieces.length * 5
    if (emptyCells !== requiredCells) {
      return false
    }
    
    // Check if board dimensions allow for piece placement
    const minDimension = Math.min(board.config.width, board.config.height)
    if (minDimension < 3) {
      // Most pieces need at least 3x3 space in some orientation
      return false
    }
    
    return true
  }

  /**
   * Precompute and cache solutions for common board configurations
   */
  async precomputeCommonSolutions(): Promise<void> {
    // This would be implemented to precompute solutions for standard boards
    // like 6x10, 5x12, 8x8 with 2x2 hole, etc.
    console.log('Precomputing common solutions...')
    // Implementation would go here
  }
}
