import { useCallback } from 'react'
import type { Board, Point, PentominoPiece } from '@/types'
import { KEYBOARD_SHORTCUTS } from '@/utils/constants'

interface UseBoardInteractionProps {
  board: Board
  pieces: PentominoPiece[]
  selectedPieceId?: string
  onCellClick?: (position: Point) => void
  onPieceRotate?: (pieceId: string, clockwise: boolean) => void
  onPieceFlip?: (pieceId: string, horizontal: boolean) => void
  onSolve?: () => void
  onReset?: () => void
  onUndo?: () => void
  onRedo?: () => void
}

export function useBoardInteraction({
  board: _board,
  pieces,
  selectedPieceId,
  onCellClick: _onCellClick,
  onPieceRotate,
  onPieceFlip,
  onSolve,
  onReset,
  onUndo,
  onRedo,
}: UseBoardInteractionProps) {
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const key = event.key
    const isCtrlOrCmd = event.ctrlKey || event.metaKey
    const isShift = event.shiftKey
    
    // Prevent default for handled keys
    const handledKeys = [
      ...KEYBOARD_SHORTCUTS.ROTATE_CW,
      ...KEYBOARD_SHORTCUTS.ROTATE_CCW,
      ...KEYBOARD_SHORTCUTS.FLIP_HORIZONTAL,
      ...KEYBOARD_SHORTCUTS.FLIP_VERTICAL,
      ...KEYBOARD_SHORTCUTS.SOLVE,
      ...KEYBOARD_SHORTCUTS.RESET,
      ...KEYBOARD_SHORTCUTS.UNDO,
      ...KEYBOARD_SHORTCUTS.REDO,
    ]
    
    if ((handledKeys as string[]).includes(key) ||
        (isCtrlOrCmd && ['z', 'y'].includes(key.toLowerCase()))) {
      event.preventDefault()
    }

    // Handle piece rotation
    if (selectedPieceId && onPieceRotate) {
      if ((KEYBOARD_SHORTCUTS.ROTATE_CW as string[]).includes(key)) {
        onPieceRotate(selectedPieceId, true)
        return
      }
      
      if ((KEYBOARD_SHORTCUTS.ROTATE_CCW as string[]).includes(key) ||
          (key === 'r' && isShift)) {
        onPieceRotate(selectedPieceId, false)
        return
      }
    }

    // Handle piece flipping
    if (selectedPieceId && onPieceFlip) {
      if ((KEYBOARD_SHORTCUTS.FLIP_HORIZONTAL as string[]).includes(key)) {
        onPieceFlip(selectedPieceId, true)
        return
      }
      
      if ((KEYBOARD_SHORTCUTS.FLIP_VERTICAL as string[]).includes(key)) {
        onPieceFlip(selectedPieceId, false)
        return
      }
    }

    // Handle global actions
    if ((KEYBOARD_SHORTCUTS.SOLVE as string[]).includes(key) && onSolve) {
      onSolve()
      return
    }

    if ((KEYBOARD_SHORTCUTS.RESET as string[]).includes(key) && onReset) {
      onReset()
      return
    }

    // Handle undo/redo
    if (isCtrlOrCmd) {
      if (key.toLowerCase() === 'z' && !isShift && onUndo) {
        onUndo()
        return
      }
      
      if ((key.toLowerCase() === 'y' || (key.toLowerCase() === 'z' && isShift)) && onRedo) {
        onRedo()
        return
      }
    }
  }, [
    selectedPieceId,
    onPieceRotate,
    onPieceFlip,
    onSolve,
    onReset,
    onUndo,
    onRedo,
  ])

  const getValidDropPositions = useCallback((pieceId: string): Point[] => {
    const piece = pieces.find(p => p.id === pieceId)
    if (!piece) return []

    const validPositions: Point[] = []
    
    // This would contain logic to check all valid positions for the piece
    // For now, return empty array - will be implemented with piece placement logic
    
    return validPositions
  }, [pieces])

  const canPlacePieceAt = useCallback((pieceId: string, _position: Point): boolean => {
    const piece = pieces.find(p => p.id === pieceId)
    if (!piece) return false

    // This would contain logic to check if a piece can be placed at a position
    // For now, return true - will be implemented with collision detection
    
    return true
  }, [pieces])

  const getHoveredPiece = useCallback((_position: Point): PentominoPiece | null => {
    // Find the topmost piece at the given position
    const piecesAtPosition = pieces
      .filter(piece => piece.isPlaced)
      .filter(_piece => {
        // Check if position is within piece bounds
        // This would use the actual piece shape and position
        return false // Placeholder
      })
      .sort((a, b) => b.zIndex - a.zIndex)

    return piecesAtPosition[0] || null
  }, [pieces])

  return {
    handleKeyDown,
    getValidDropPositions,
    canPlacePieceAt,
    getHoveredPiece,
  }
}
