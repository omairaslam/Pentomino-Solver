import { useCallback } from 'react'
import type { PentominoPiece, Board, Point } from '../types'
import { getPentominoVariantCount } from '../utils/pentomino-definitions'
import { canPlacePiece } from '../utils/board-utils'

interface UsePieceManipulationProps {
  pieces: PentominoPiece[]
  board: Board
  onPieceUpdate?: (piece: PentominoPiece) => void
  onPiecePlace?: (piece: PentominoPiece, position: Point) => void
  onPieceRemove?: (piece: PentominoPiece) => void
}

export function usePieceManipulation({
  pieces,
  board,
  onPieceUpdate,
  onPiecePlace,
  onPieceRemove,
}: UsePieceManipulationProps) {

  // Rotate a piece clockwise
  const rotatePiece = useCallback((piece: PentominoPiece, clockwise: boolean = true) => {
    const variantCount = getPentominoVariantCount(piece.type)
    let newVariantIndex: number

    if (clockwise) {
      newVariantIndex = (piece.variantIndex + 1) % variantCount
    } else {
      newVariantIndex = (piece.variantIndex - 1 + variantCount) % variantCount
    }

    const updatedPiece: PentominoPiece = {
      ...piece,
      variantIndex: newVariantIndex,
    }

    // If piece is placed, check if new orientation is valid
    if (piece.isPlaced) {
      if (canPlacePiece(board, updatedPiece, piece.position, newVariantIndex)) {
        onPieceUpdate?.(updatedPiece)
      } else {
        // Try to find a nearby valid position
        const nearbyPosition = findNearbyValidPosition(updatedPiece, piece.position)
        if (nearbyPosition) {
          onPieceUpdate?.({ ...updatedPiece, position: nearbyPosition })
        } else {
          // Remove piece if no valid position found
          onPieceRemove?.(piece)
          onPieceUpdate?.({ ...updatedPiece, isPlaced: false, position: { x: 0, y: 0 } })
        }
      }
    } else {
      onPieceUpdate?.(updatedPiece)
    }
  }, [board, onPieceUpdate, onPiecePlace, onPieceRemove])

  // Flip a piece (cycles through different orientations)
  const flipPiece = useCallback((piece: PentominoPiece, horizontal: boolean = true) => {
    const variantCount = getPentominoVariantCount(piece.type)
    
    // For flipping, we jump to a different set of orientations
    // This is a simplified approach - in practice, you'd want to track
    // which variants represent flipped versions
    let newVariantIndex: number
    
    if (horizontal) {
      // Jump to the "flipped" variants (second half of variants array)
      const halfCount = Math.floor(variantCount / 2)
      if (piece.variantIndex < halfCount) {
        newVariantIndex = piece.variantIndex + halfCount
      } else {
        newVariantIndex = piece.variantIndex - halfCount
      }
    } else {
      // Vertical flip - different logic
      newVariantIndex = (piece.variantIndex + Math.floor(variantCount / 4)) % variantCount
    }

    // Ensure the index is valid
    newVariantIndex = Math.max(0, Math.min(newVariantIndex, variantCount - 1))

    const updatedPiece: PentominoPiece = {
      ...piece,
      variantIndex: newVariantIndex,
    }

    // If piece is placed, check if new orientation is valid
    if (piece.isPlaced) {
      if (canPlacePiece(board, updatedPiece, piece.position, newVariantIndex)) {
        onPieceUpdate?.(updatedPiece)
      } else {
        // Try to find a nearby valid position
        const nearbyPosition = findNearbyValidPosition(updatedPiece, piece.position)
        if (nearbyPosition) {
          onPieceUpdate?.({ ...updatedPiece, position: nearbyPosition })
        } else {
          // Remove piece if no valid position found
          onPieceRemove?.(piece)
          onPieceUpdate?.({ ...updatedPiece, isPlaced: false, position: { x: 0, y: 0 } })
        }
      }
    } else {
      onPieceUpdate?.(updatedPiece)
    }
  }, [board, onPieceUpdate, onPiecePlace, onPieceRemove])

  // Place a piece at a specific position
  const placePiece = useCallback((piece: PentominoPiece, position: Point) => {
    if (canPlacePiece(board, piece, position)) {
      const updatedPiece: PentominoPiece = {
        ...piece,
        position,
        isPlaced: true,
        zIndex: Math.max(...pieces.map(p => p.zIndex), 0) + 1,
      }
      
      onPiecePlace?.(updatedPiece, position)
      onPieceUpdate?.(updatedPiece)
      return true
    }
    return false
  }, [board, pieces, onPiecePlace, onPieceUpdate])

  // Remove a piece from the board
  const removePiece = useCallback((piece: PentominoPiece) => {
    if (piece.isPlaced) {
      const updatedPiece: PentominoPiece = {
        ...piece,
        isPlaced: false,
        position: { x: 0, y: 0 },
        zIndex: 0,
      }
      
      onPieceRemove?.(piece)
      onPieceUpdate?.(updatedPiece)
      return true
    }
    return false
  }, [onPieceRemove, onPieceUpdate])

  // Move a piece to a new position
  const movePiece = useCallback((piece: PentominoPiece, newPosition: Point) => {
    if (!piece.isPlaced) return false

    if (canPlacePiece(board, piece, newPosition)) {
      // Remove from old position first
      onPieceRemove?.(piece)
      
      // Place at new position
      const updatedPiece: PentominoPiece = {
        ...piece,
        position: newPosition,
      }
      
      onPiecePlace?.(updatedPiece, newPosition)
      onPieceUpdate?.(updatedPiece)
      return true
    }
    return false
  }, [board, onPiecePlace, onPieceRemove, onPieceUpdate])

  // Find a nearby valid position for a piece
  const findNearbyValidPosition = useCallback((piece: PentominoPiece, centerPosition: Point): Point | null => {
    const maxDistance = 3
    
    // Search in expanding squares around the center position
    for (let distance = 1; distance <= maxDistance; distance++) {
      for (let dx = -distance; dx <= distance; dx++) {
        for (let dy = -distance; dy <= distance; dy++) {
          // Only check positions on the edge of the current square
          if (Math.abs(dx) !== distance && Math.abs(dy) !== distance) continue
          
          const testPosition: Point = {
            x: centerPosition.x + dx,
            y: centerPosition.y + dy,
          }
          
          if (canPlacePiece(board, piece, testPosition)) {
            return testPosition
          }
        }
      }
    }
    
    return null
  }, [board])

  // Get all valid positions for a piece
  const getValidPositions = useCallback((piece: PentominoPiece): Point[] => {
    const validPositions: Point[] = []
    
    for (let y = 0; y < board.config.height; y++) {
      for (let x = 0; x < board.config.width; x++) {
        const position = { x, y }
        if (canPlacePiece(board, piece, position)) {
          validPositions.push(position)
        }
      }
    }
    
    return validPositions
  }, [board])

  // Snap a piece to the nearest valid position
  const snapToGrid = useCallback((piece: PentominoPiece, approximatePosition: Point): Point | null => {
    // Find the closest valid position to the approximate position
    const validPositions = getValidPositions(piece)
    
    if (validPositions.length === 0) return null
    
    let closestPosition = validPositions[0]
    let minDistance = getDistance(approximatePosition, closestPosition)
    
    for (const position of validPositions) {
      const distance = getDistance(approximatePosition, position)
      if (distance < minDistance) {
        minDistance = distance
        closestPosition = position
      }
    }
    
    // Only snap if the distance is reasonable (within 2 cells)
    return minDistance <= 2 ? closestPosition : null
  }, [getValidPositions])

  // Helper function to calculate distance between two points
  const getDistance = (a: Point, b: Point): number => {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  return {
    rotatePiece,
    flipPiece,
    placePiece,
    removePiece,
    movePiece,
    getValidPositions,
    snapToGrid,
    findNearbyValidPosition,
  }
}
