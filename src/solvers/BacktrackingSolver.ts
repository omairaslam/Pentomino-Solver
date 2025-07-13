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

  constructor(config: SolverConfig) {
    this.config = config
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

    // Create pieces for all pentomino types
    const pieces = getAllPentominoTypes().map(type => 
      createPentominoPiece(type, `${type}-solver`)
    )

    // Clone the board to avoid modifying the original
    const workingBoard = cloneBoard(board)

    try {
      await this.backtrack(workingBoard, pieces, 0)
      
      const totalTime = Date.now() - this.startTime
      
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
   * Recursive backtracking function
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

    const currentPiece = pieces[pieceIndex]
    const variantCount = getPentominoVariantCount(currentPiece.type)

    // Try all variants of the current piece
    for (let variantIndex = 0; variantIndex < variantCount; variantIndex++) {
      if (this.shouldStop) return

      currentPiece.variantIndex = variantIndex

      // Try all positions on the board
      for (let y = 0; y < board.config.height; y++) {
        for (let x = 0; x < board.config.width; x++) {
          if (this.shouldStop) return

          const position: Point = { x, y }
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
                await this.delay(50) // Small delay for visualization
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
