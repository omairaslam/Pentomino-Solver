import type { 
  Board, 
  PentominoPiece, 
  SolverConfig, 
  SolverResult, 
  SolverSolution, 
  SolverStep,
  Point 
} from '../types'
import { 
  canPlacePiece, 
  placePiece, 
  removePiece, 
  cloneBoard, 
  isBoardComplete 
} from '../utils/board-utils'
import {
  getAllPentominoTypes,
  getPentominoVariantCount,
  createPentominoPiece
} from '../utils/pentomino-definitions'
import { SolutionCache } from './SolutionCache'

/**
 * Backtracking solver for pentomino puzzles
 * Uses recursive backtracking to find all possible solutions
 */
export class BacktrackingSolver {
  private config: SolverConfig
  private startTime: number = 0
  private solutions: SolverSolution[] = []
  private steps: SolverStep[] = []
  private stepsExplored: number = 0
  private shouldStop: boolean = false
  private cache: SolutionCache

  constructor(config: SolverConfig) {
    this.config = config
    this.cache = new SolutionCache(50, 15) // 50 entries, 15 minutes TTL
  }

  /**
   * Solve the pentomino puzzle
   */
  async solve(board: Board): Promise<SolverResult> {
    this.startTime = Date.now()
    this.solutions = []
    this.steps = []
    this.stepsExplored = 0
    this.shouldStop = false

    // Check cache first
    const pieceTypes = getAllPentominoTypes()
    const cachedSolutions = this.cache.get(board, pieceTypes)
    if (cachedSolutions && cachedSolutions.length > 0) {
      return {
        success: true,
        solutions: cachedSolutions.slice(0, this.config.maxSolutions || 10),
        totalTime: Date.now() - this.startTime,
        stepsExplored: 0, // Cached result
      }
    }

    // Quick solvability check
    if (!this.cache.isLikelySolvable(board, pieceTypes)) {
      return {
        success: true,
        solutions: [],
        totalTime: Date.now() - this.startTime,
        stepsExplored: 0,
      }
    }

    // Create pieces for all pentomino types
    const pieces = pieceTypes.map(type =>
      createPentominoPiece(type, `${type}-solver`)
    )

    // Optimize piece order for better performance
    this.optimizePieceOrder(pieces, board)

    // Clone the board to avoid modifying the original
    const workingBoard = cloneBoard(board)

    try {
      await this.backtrack(workingBoard, pieces, 0)
      
      const totalTime = Date.now() - this.startTime

      // Cache the results if we found solutions
      if (this.solutions.length > 0) {
        this.cache.set(board, pieceTypes, this.solutions)
      }

      return {
        success: true,
        solutions: this.solutions,
        totalTime,
        stepsExplored: this.stepsExplored,
      }
    } catch (error) {
      const totalTime = Date.now() - this.startTime
      
      return {
        success: false,
        solutions: this.solutions,
        totalTime,
        stepsExplored: this.stepsExplored,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Recursive backtracking function with optimizations
   */
  private async backtrack(
    board: Board,
    pieces: PentominoPiece[],
    pieceIndex: number
  ): Promise<void> {
    // Check for timeout
    if (this.config.maxTime && Date.now() - this.startTime > this.config.maxTime) {
      this.shouldStop = true
      throw new Error('Solver timed out')
    }

    // Check if we've found enough solutions
    if (this.config.maxSolutions && this.solutions.length >= this.config.maxSolutions) {
      this.shouldStop = true
      return
    }

    // Base case: all pieces placed
    if (pieceIndex >= pieces.length) {
      if (isBoardComplete(board)) {
        this.addSolution(board, pieces)
      }
      return
    }

    // Early pruning: check if remaining pieces can fit in remaining space
    if (!this.canRemainingPiecesFit(board, pieces, pieceIndex)) {
      return
    }

    const currentPiece = pieces[pieceIndex]
    const variantCount = getPentominoVariantCount(currentPiece.type)

    // Get optimal positions for this piece (MRV heuristic)
    const positions = this.getOptimalPositions(board, currentPiece)

    // Try all variants of the current piece
    for (let variantIndex = 0; variantIndex < variantCount; variantIndex++) {
      if (this.shouldStop) return

      currentPiece.variantIndex = variantIndex

      // Try positions in optimal order
      for (const position of positions) {
        if (this.shouldStop) return

        this.stepsExplored++

        // Check if piece can be placed at this position
        if (canPlacePiece(board, currentPiece, position, variantIndex)) {
          // Place the piece
          const success = placePiece(board, currentPiece, position, variantIndex)

          if (success) {
            currentPiece.position = position
            currentPiece.isPlaced = true

            // Track step if required
            if (this.config.trackSteps) {
              this.addStep(currentPiece, position, variantIndex, true, board)
            }

            // Add delay for visualization if needed
            if (this.config.trackSteps) {
              await this.delay(10) // Reduced delay for better performance
            }

            // Recursively try to place the next piece
            await this.backtrack(board, pieces, pieceIndex + 1)

            // Backtrack: remove the piece
            removePiece(board, currentPiece)
            currentPiece.isPlaced = false

            // Track backtrack step if required
            if (this.config.trackSteps) {
              this.addStep(currentPiece, position, variantIndex, false, board)
            }
          }
        }
      }
    }
  }

  /**
   * Add a solution to the results
   */
  private addSolution(_board: Board, pieces: PentominoPiece[]): void {
    const solutionSteps = this.config.trackSteps ? [...this.steps] : []
    
    const solution: SolverSolution = {
      id: this.solutions.length + 1,
      placements: pieces
        .filter(piece => piece.isPlaced)
        .map(piece => ({
          pieceType: piece.type,
          position: piece.position,
          variantIndex: piece.variantIndex,
        })),
      steps: solutionSteps,
      solvingTime: Date.now() - this.startTime,
    }

    this.solutions.push(solution)
  }

  /**
   * Add a step to the tracking
   */
  private addStep(
    piece: PentominoPiece,
    position: Point,
    variantIndex: number,
    isPlacement: boolean,
    board: Board
  ): void {
    if (!this.config.trackSteps) return

    const step: SolverStep = {
      stepNumber: this.steps.length + 1,
      pieceType: piece.type,
      position,
      variantIndex,
      isPlacement,
      boardState: board.cells.map(row => row.map(cell => ({ ...cell }))),
    }

    this.steps.push(step)
  }

  /**
   * Delay function for visualization
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Stop the solver
   */
  stop(): void {
    this.shouldStop = true
  }

  /**
   * Optimize piece order for better performance
   * Place more constrained pieces first
   */
  private optimizePieceOrder(pieces: PentominoPiece[], _board: Board): void {
    // Define piece difficulty/constraint scores
    const pieceConstraints: Record<string, number> = {
      'I': 1,  // Line piece - very flexible
      'L': 2,  // L-shaped - moderately flexible
      'N': 3,  // N-shaped - moderately flexible
      'Y': 4,  // Y-shaped - less flexible
      'P': 5,  // P-shaped - less flexible
      'U': 6,  // U-shaped - constrained
      'V': 7,  // V-shaped - constrained
      'W': 8,  // W-shaped - constrained
      'Z': 9,  // Z-shaped - very constrained
      'F': 10, // F-shaped - very constrained
      'T': 11, // T-shaped - very constrained
      'X': 12, // X-shaped - most constrained (only 1 orientation)
    }

    // Sort pieces by constraint level (most constrained first)
    pieces.sort((a, b) => {
      const scoreA = pieceConstraints[a.type] || 0
      const scoreB = pieceConstraints[b.type] || 0
      return scoreB - scoreA
    })
  }

  /**
   * Check if remaining pieces can fit in remaining empty space
   * Early pruning optimization
   */
  private canRemainingPiecesFit(board: Board, pieces: PentominoPiece[], startIndex: number): boolean {
    // Count remaining empty cells
    let emptyCells = 0
    for (let y = 0; y < board.config.height; y++) {
      for (let x = 0; x < board.config.width; x++) {
        if (board.cells[y][x].state === 'empty') {
          emptyCells++
        }
      }
    }

    // Count cells needed by remaining pieces
    let cellsNeeded = 0
    for (let i = startIndex; i < pieces.length; i++) {
      cellsNeeded += 5 // Each pentomino piece has 5 cells
    }

    return emptyCells >= cellsNeeded
  }

  /**
   * Get optimal positions for a piece using MRV (Most Restrictive Value) heuristic
   * Prioritize positions that are more constrained
   */
  private getOptimalPositions(board: Board, _piece: PentominoPiece): Point[] {
    const positions: Array<{ point: Point; score: number }> = []

    // Find the first empty cell (left-to-right, top-to-bottom)
    // This helps maintain a more systematic search pattern
    let firstEmpty: Point | null = null
    for (let y = 0; y < board.config.height && !firstEmpty; y++) {
      for (let x = 0; x < board.config.width && !firstEmpty; x++) {
        if (board.cells[y][x].state === 'empty') {
          firstEmpty = { x, y }
        }
      }
    }

    // If no empty cells, return empty array
    if (!firstEmpty) return []

    // Only try positions near the first empty cell to maintain systematic placement
    const searchRadius = 3
    for (let y = Math.max(0, firstEmpty.y - searchRadius);
         y <= Math.min(board.config.height - 1, firstEmpty.y + searchRadius);
         y++) {
      for (let x = Math.max(0, firstEmpty.x - searchRadius);
           x <= Math.min(board.config.width - 1, firstEmpty.x + searchRadius);
           x++) {
        const point: Point = { x, y }

        // Calculate constraint score (higher = more constrained = try first)
        const score = this.calculateConstraintScore(board, point)
        positions.push({ point, score })
      }
    }

    // Sort by constraint score (most constrained first)
    positions.sort((a, b) => b.score - a.score)

    return positions.map(p => p.point)
  }

  /**
   * Calculate how constrained a position is
   * Higher score = more constrained = should try first
   */
  private calculateConstraintScore(board: Board, position: Point): number {
    let score = 0

    // Check adjacent cells - more filled neighbors = higher constraint
    const directions = [
      { x: -1, y: 0 }, { x: 1, y: 0 },
      { x: 0, y: -1 }, { x: 0, y: 1 }
    ]

    for (const dir of directions) {
      const adjX = position.x + dir.x
      const adjY = position.y + dir.y

      if (adjX >= 0 && adjX < board.config.width &&
          adjY >= 0 && adjY < board.config.height) {
        if (board.cells[adjY][adjX].state !== 'empty') {
          score += 10 // Adjacent to filled cell
        }
      } else {
        score += 5 // Adjacent to board edge
      }
    }

    // Prefer positions closer to top-left (systematic placement)
    score += (board.config.height - position.y) + (board.config.width - position.x)

    return score
  }

  /**
   * Get current progress
   */
  getProgress(): {
    stepsExplored: number
    solutionsFound: number
    timeElapsed: number
  } {
    return {
      stepsExplored: this.stepsExplored,
      solutionsFound: this.solutions.length,
      timeElapsed: Date.now() - this.startTime,
    }
  }
}
