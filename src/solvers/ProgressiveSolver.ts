import type {
  Board,
  PentominoPiece,
  SolverConfig,
  SolverResult,
  SolverSolution,
  SolverStep
} from '../types'
import { BacktrackingSolver } from './BacktrackingSolver'
import {
  placePiece,
  removePiece,
  cloneBoard
} from '../utils/board-utils'
import { 
  createPentominoPiece, 
  getAllPentominoTypes 
} from '../utils/pentomino-definitions'

/**
 * Progressive solver that allows step-by-step interaction and visualization
 * Users can guide the solving process and see each step
 */
export class ProgressiveSolver {
  private config: SolverConfig
  private board: Board
  private pieces: PentominoPiece[]
  private currentStep: number = 0
  private steps: SolverStep[] = []
  private isActive: boolean = false
  private onStepCallback?: (step: SolverStep, stepIndex: number) => void
  private onCompleteCallback?: (result: SolverResult) => void

  constructor(config: SolverConfig) {
    this.config = {
      ...config,
      trackSteps: true, // Always track steps for progressive solving
    }
    this.board = this.createEmptyBoard()
    this.pieces = []
  }

  /**
   * Initialize the progressive solver with a board
   */
  initialize(board: Board): void {
    this.board = cloneBoard(board)
    this.pieces = getAllPentominoTypes().map(type => 
      createPentominoPiece(type, `progressive-${type}`)
    )
    this.currentStep = 0
    this.steps = []
    this.isActive = false
  }

  /**
   * Set callback for step updates
   */
  onStep(callback: (step: SolverStep, stepIndex: number) => void): void {
    this.onStepCallback = callback
  }

  /**
   * Set callback for completion
   */
  onComplete(callback: (result: SolverResult) => void): void {
    this.onCompleteCallback = callback
  }

  /**
   * Start progressive solving
   */
  async startProgressive(): Promise<void> {
    if (this.isActive) {
      throw new Error('Progressive solver is already active')
    }

    this.isActive = true
    this.currentStep = 0
    this.steps = []

    try {
      // Use the backtracking solver to generate steps
      const solver = new BacktrackingSolver({
        ...this.config,
        maxSolutions: 1,
        trackSteps: true,
      })

      const result = await solver.solve(this.board)
      
      if (result.success && result.solutions.length > 0) {
        this.steps = result.solutions[0].steps || []
        console.log(`Progressive solver: Generated ${this.steps.length} steps`)
      } else {
        throw new Error('No solution found for progressive solving')
      }
    } catch (error) {
      this.isActive = false
      throw error
    }
  }

  /**
   * Execute the next step in the solution
   */
  async nextStep(): Promise<boolean> {
    if (!this.isActive || this.currentStep >= this.steps.length) {
      return false
    }

    const step = this.steps[this.currentStep]
    
    try {
      // Apply the step to the board
      await this.applyStep(step)
      
      // Notify callback
      this.onStepCallback?.(step, this.currentStep)
      
      this.currentStep++
      
      // Check if we've completed all steps
      if (this.currentStep >= this.steps.length) {
        this.completeProgressive()
      }
      
      return true
    } catch (error) {
      console.error('Failed to apply step:', error)
      return false
    }
  }

  /**
   * Execute the previous step (undo)
   */
  async previousStep(): Promise<boolean> {
    if (!this.isActive || this.currentStep <= 0) {
      return false
    }

    this.currentStep--
    const step = this.steps[this.currentStep]
    
    try {
      // Undo the step
      await this.undoStep(step)
      
      // Notify callback
      this.onStepCallback?.(step, this.currentStep)
      
      return true
    } catch (error) {
      console.error('Failed to undo step:', error)
      return false
    }
  }

  /**
   * Jump to a specific step
   */
  async jumpToStep(stepIndex: number): Promise<boolean> {
    if (!this.isActive || stepIndex < 0 || stepIndex > this.steps.length) {
      return false
    }

    // Reset board and replay steps up to the target
    this.resetBoard()
    
    for (let i = 0; i < stepIndex; i++) {
      await this.applyStep(this.steps[i])
    }
    
    this.currentStep = stepIndex
    
    // Notify callback for current state
    if (stepIndex > 0) {
      this.onStepCallback?.(this.steps[stepIndex - 1], stepIndex - 1)
    }
    
    return true
  }

  /**
   * Apply a step to the board
   */
  private async applyStep(step: SolverStep): Promise<void> {
    const piece = this.pieces.find(p => p.type === step.pieceType)
    if (!piece) {
      throw new Error(`Piece ${step.pieceType} not found`)
    }

    if (step.isPlacement) {
      // Place the piece
      piece.variantIndex = step.variantIndex
      piece.position = step.position
      
      const success = placePiece(this.board, piece, step.position, step.variantIndex)
      if (success) {
        piece.isPlaced = true
      } else {
        throw new Error(`Failed to place piece ${step.pieceType}`)
      }
    } else {
      // Remove the piece
      if (piece.isPlaced) {
        removePiece(this.board, piece)
        piece.isPlaced = false
      }
    }
  }

  /**
   * Undo a step
   */
  private async undoStep(step: SolverStep): Promise<void> {
    const piece = this.pieces.find(p => p.type === step.pieceType)
    if (!piece) {
      throw new Error(`Piece ${step.pieceType} not found`)
    }

    if (step.isPlacement) {
      // Remove the piece (undo placement)
      if (piece.isPlaced) {
        removePiece(this.board, piece)
        piece.isPlaced = false
      }
    } else {
      // Place the piece (undo removal)
      piece.variantIndex = step.variantIndex
      piece.position = step.position
      
      const success = placePiece(this.board, piece, step.position, step.variantIndex)
      if (success) {
        piece.isPlaced = true
      }
    }
  }

  /**
   * Reset the board to initial state
   */
  private resetBoard(): void {
    // Reset board cells
    for (let y = 0; y < this.board.config.height; y++) {
      for (let x = 0; x < this.board.config.width; x++) {
        if (this.board.cells[y][x].state !== 'empty' && this.board.cells[y][x].state !== 'blocked') {
          this.board.cells[y][x].state = 'empty'
          this.board.cells[y][x].pieceType = undefined
        }
      }
    }
    
    // Reset pieces
    this.pieces.forEach(piece => {
      piece.isPlaced = false
      piece.position = { x: 0, y: 0 }
      piece.zIndex = 0
    })
  }

  /**
   * Complete the progressive solving
   */
  private completeProgressive(): void {
    this.isActive = false
    
    // Create a solution from the current state
    const solution: SolverSolution = {
      id: 1,
      placements: this.pieces
        .filter(piece => piece.isPlaced)
        .map(piece => ({
          pieceType: piece.type,
          position: piece.position,
          variantIndex: piece.variantIndex,
        })),
      steps: this.steps,
      solvingTime: 0, // Progressive solving doesn't have a single solve time
    }

    const result: SolverResult = {
      success: true,
      solutions: [solution],
      totalTime: 0,
      stepsExplored: this.steps.length,
    }

    this.onCompleteCallback?.(result)
  }

  /**
   * Get current progress information
   */
  getProgress(): {
    currentStep: number
    totalSteps: number
    isActive: boolean
    completionPercentage: number
  } {
    return {
      currentStep: this.currentStep,
      totalSteps: this.steps.length,
      isActive: this.isActive,
      completionPercentage: this.steps.length > 0 ? (this.currentStep / this.steps.length) * 100 : 0,
    }
  }

  /**
   * Get the current board state
   */
  getCurrentBoard(): Board {
    return cloneBoard(this.board)
  }

  /**
   * Get the current pieces state
   */
  getCurrentPieces(): PentominoPiece[] {
    return this.pieces.map(piece => ({ ...piece }))
  }

  /**
   * Stop progressive solving
   */
  stop(): void {
    this.isActive = false
  }

  /**
   * Create an empty board for initialization
   */
  private createEmptyBoard(): Board {
    return {
      config: {
        name: 'Progressive Board',
        description: 'Board for progressive solving',
        width: 8,
        height: 8,
        blockedCells: [],
      },
      cells: Array.from({ length: 8 }, () =>
        Array.from({ length: 8 }, () => ({
          state: 'empty' as const,
        }))
      ),
      emptyCellCount: 64,
    }
  }
}
