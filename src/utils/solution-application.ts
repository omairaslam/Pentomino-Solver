import type { 
  Board, 
  SolverSolution, 
  PentominoPiece, 
  Point 
} from '../types'
import { 
  placePiece, 
  removePiece, 
  resetBoard, 
  cloneBoard 
} from './board-utils'
import { 
  createPentominoPiece, 
  getPentominoVariant 
} from './pentomino-definitions'

/**
 * Result of applying a solution to the board
 */
export interface SolutionApplicationResult {
  success: boolean
  appliedPlacements: number
  failedPlacements: Array<{
    pieceType: string
    position: Point
    variantIndex: number
    reason: string
  }>
  updatedPieces: PentominoPiece[]
  error?: string
}

/**
 * Apply a solver solution to the board and piece collection
 */
export function applySolutionToBoard(
  board: Board,
  pieces: PentominoPiece[],
  solution: SolverSolution
): SolutionApplicationResult {
  const result: SolutionApplicationResult = {
    success: false,
    appliedPlacements: 0,
    failedPlacements: [],
    updatedPieces: [...pieces],
  }

  try {
    // Reset the board first
    resetBoard(board)
    
    // Reset all pieces
    result.updatedPieces.forEach(piece => {
      piece.isPlaced = false
      piece.position = { x: 0, y: 0 }
      piece.zIndex = 0
    })

    // Apply each placement from the solution
    for (const placement of solution.placements) {
      const piece = result.updatedPieces.find(p => p.type === placement.pieceType)
      
      if (!piece) {
        result.failedPlacements.push({
          pieceType: placement.pieceType,
          position: placement.position,
          variantIndex: placement.variantIndex,
          reason: `Piece ${placement.pieceType} not found in piece collection`,
        })
        continue
      }

      // Set piece variant and position
      piece.variantIndex = placement.variantIndex
      piece.position = placement.position

      // Try to place the piece
      const placed = placePiece(board, piece, placement.position, placement.variantIndex)
      
      if (placed) {
        piece.isPlaced = true
        piece.zIndex = result.appliedPlacements + 1
        result.appliedPlacements++
      } else {
        result.failedPlacements.push({
          pieceType: placement.pieceType,
          position: placement.position,
          variantIndex: placement.variantIndex,
          reason: 'Failed to place piece on board (collision or invalid position)',
        })
      }
    }

    // Check if all placements were successful
    result.success = result.failedPlacements.length === 0 && 
                    result.appliedPlacements === solution.placements.length

    return result
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error occurred'
    return result
  }
}

/**
 * Validate that a solution is applicable to the given board
 */
export function validateSolution(
  board: Board,
  solution: SolverSolution
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check if solution has the expected number of pieces
  if (solution.placements.length !== 12) {
    errors.push(`Solution should have 12 pieces, but has ${solution.placements.length}`)
  }

  // Check for duplicate piece types
  const pieceTypes = solution.placements.map(p => p.pieceType)
  const uniqueTypes = new Set(pieceTypes)
  if (uniqueTypes.size !== pieceTypes.length) {
    errors.push('Solution contains duplicate piece types')
  }

  // Check if all positions are within board bounds
  for (const placement of solution.placements) {
    const { position } = placement
    if (position.x < 0 || position.x >= board.config.width ||
        position.y < 0 || position.y >= board.config.height) {
      errors.push(`Piece ${placement.pieceType} position (${position.x}, ${position.y}) is out of bounds`)
    }
  }

  // Create a test board to check for overlaps
  const testBoard = cloneBoard(board)
  resetBoard(testBoard)
  
  const occupiedCells = new Set<string>()
  
  for (const placement of solution.placements) {
    try {
      const variant = getPentominoVariant(placement.pieceType, placement.variantIndex)

      for (const cell of variant.cells) {
        const actualX = placement.position.x + cell.x
        const actualY = placement.position.y + cell.y
        const cellKey = `${actualX},${actualY}`
        
        // Check bounds
        if (actualX < 0 || actualX >= board.config.width ||
            actualY < 0 || actualY >= board.config.height) {
          errors.push(`Piece ${placement.pieceType} extends outside board bounds`)
          continue
        }
        
        // Check for overlaps
        if (occupiedCells.has(cellKey)) {
          errors.push(`Piece ${placement.pieceType} overlaps with another piece at (${actualX}, ${actualY})`)
        } else {
          occupiedCells.add(cellKey)
        }
        
        // Check if cell is blocked
        if (testBoard.cells[actualY][actualX].state === 'blocked') {
          errors.push(`Piece ${placement.pieceType} tries to occupy blocked cell at (${actualX}, ${actualY})`)
        }
      }
    } catch (error) {
      errors.push(`Failed to validate piece ${placement.pieceType}: ${error}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Create pieces from a solution for visualization
 */
export function createPiecesFromSolution(solution: SolverSolution): PentominoPiece[] {
  return solution.placements.map((placement, index) => {
    const piece = createPentominoPiece(placement.pieceType, `solution-${placement.pieceType}`)
    piece.position = placement.position
    piece.variantIndex = placement.variantIndex
    piece.isPlaced = true
    piece.zIndex = index + 1
    return piece
  })
}

/**
 * Animate the application of a solution step by step
 */
export async function animateSolutionApplication(
  board: Board,
  pieces: PentominoPiece[],
  solution: SolverSolution,
  onStepComplete?: (stepIndex: number, piece: PentominoPiece) => void,
  stepDelay: number = 500
): Promise<SolutionApplicationResult> {
  const result: SolutionApplicationResult = {
    success: false,
    appliedPlacements: 0,
    failedPlacements: [],
    updatedPieces: [...pieces],
  }

  try {
    // Reset the board first
    resetBoard(board)
    
    // Reset all pieces
    result.updatedPieces.forEach(piece => {
      piece.isPlaced = false
      piece.position = { x: 0, y: 0 }
      piece.zIndex = 0
    })

    // Apply each placement with animation
    for (let i = 0; i < solution.placements.length; i++) {
      const placement = solution.placements[i]
      const piece = result.updatedPieces.find(p => p.type === placement.pieceType)
      
      if (!piece) {
        result.failedPlacements.push({
          pieceType: placement.pieceType,
          position: placement.position,
          variantIndex: placement.variantIndex,
          reason: `Piece ${placement.pieceType} not found in piece collection`,
        })
        continue
      }

      // Set piece variant and position
      piece.variantIndex = placement.variantIndex
      piece.position = placement.position

      // Try to place the piece
      const placed = placePiece(board, piece, placement.position, placement.variantIndex)
      
      if (placed) {
        piece.isPlaced = true
        piece.zIndex = result.appliedPlacements + 1
        result.appliedPlacements++
        
        // Notify step completion
        onStepComplete?.(i, piece)
        
        // Wait for animation
        if (stepDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, stepDelay))
        }
      } else {
        result.failedPlacements.push({
          pieceType: placement.pieceType,
          position: placement.position,
          variantIndex: placement.variantIndex,
          reason: 'Failed to place piece on board (collision or invalid position)',
        })
      }
    }

    // Check if all placements were successful
    result.success = result.failedPlacements.length === 0 && 
                    result.appliedPlacements === solution.placements.length

    return result
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error occurred'
    return result
  }
}

/**
 * Clear a solution from the board
 */
export function clearSolution(
  board: Board,
  pieces: PentominoPiece[]
): void {
  // Reset the board
  resetBoard(board)
  
  // Reset all pieces
  pieces.forEach(piece => {
    if (piece.isPlaced) {
      removePiece(board, piece)
    }
    piece.isPlaced = false
    piece.position = { x: 0, y: 0 }
    piece.zIndex = 0
  })
}
