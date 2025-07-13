import { useState, useCallback, useRef, useEffect } from 'react'
import type { Point, PentominoPiece, DragState, Board } from '../types'
import { canPlacePiece } from '../utils/board-utils'

interface UseDragAndDropProps {
  board: Board
  pieces: PentominoPiece[]
  onPieceDrop?: (piece: PentominoPiece, position: Point) => void
  onDragStateChange?: (dragState: DragState | null) => void
}

export function useDragAndDrop({
  board,
  pieces,
  onPieceDrop,
  onDragStateChange,
}: UseDragAndDropProps) {
  const [dragState, setDragState] = useState<DragState | null>(null)
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 })
  const animationFrameRef = useRef<number | undefined>(undefined)

  // Start dragging a piece
  const startDrag = useCallback((piece: PentominoPiece, startPosition: Point) => {
    if (piece.isPlaced) return

    dragOffsetRef.current = startPosition
    
    const newDragState: DragState = {
      isDragging: true,
      draggedPieceId: piece.id,
      dragOffset: startPosition,
      currentPosition: startPosition,
      validDropZones: getValidDropZones(piece),
    }

    setDragState(newDragState)
    onDragStateChange?.(newDragState)

    // Add cursor style to body
    document.body.style.cursor = 'grabbing'
  }, [onDragStateChange])

  // Update drag position
  const updateDrag = useCallback((clientPosition: Point) => {
    if (!dragState?.isDragging) return

    const newPosition = {
      x: clientPosition.x - dragOffsetRef.current.x,
      y: clientPosition.y - dragOffsetRef.current.y,
    }

    const updatedDragState: DragState = {
      ...dragState,
      currentPosition: newPosition,
    }

    setDragState(updatedDragState)
    onDragStateChange?.(updatedDragState)
  }, [dragState, onDragStateChange])

  // End dragging
  const endDrag = useCallback((dropPosition?: Point) => {
    if (!dragState?.isDragging || !dragState.draggedPieceId) return

    const draggedPiece = pieces.find(p => p.id === dragState.draggedPieceId)
    if (!draggedPiece) return

    // If drop position is provided and valid, place the piece
    if (dropPosition && isValidDropPosition(draggedPiece, dropPosition)) {
      onPieceDrop?.(draggedPiece, dropPosition)
    }

    // Reset drag state
    setDragState(null)
    onDragStateChange?.(null)

    // Reset cursor
    document.body.style.cursor = ''
  }, [dragState, pieces, onPieceDrop, onDragStateChange])

  // Get valid drop zones for a piece
  const getValidDropZones = useCallback((piece: PentominoPiece): Point[] => {
    const validZones: Point[] = []

    for (let y = 0; y < board.config.height; y++) {
      for (let x = 0; x < board.config.width; x++) {
        const position = { x, y }
        if (canPlacePiece(board, piece, position)) {
          validZones.push(position)
        }
      }
    }

    return validZones
  }, [board])

  // Check if a drop position is valid
  const isValidDropPosition = useCallback((piece: PentominoPiece, position: Point): boolean => {
    return canPlacePiece(board, piece, position)
  }, [board])

  // Convert screen coordinates to board coordinates
  const screenToBoardPosition = useCallback((
    screenPosition: Point,
    boardElement: HTMLElement
  ): Point | null => {
    const rect = boardElement.getBoundingClientRect()
    const relativeX = screenPosition.x - rect.left
    const relativeY = screenPosition.y - rect.top

    // This would need to be implemented based on the board's cell size and layout
    // For now, return a simple grid-based calculation
    const cellSize = 30 // Should match CANVAS_CONFIG.CELL_SIZE
    const cellBorder = 1 // Should match CANVAS_CONFIG.CELL_BORDER

    const boardX = Math.floor(relativeX / (cellSize + cellBorder))
    const boardY = Math.floor(relativeY / (cellSize + cellBorder))

    if (boardX >= 0 && boardX < board.config.width && 
        boardY >= 0 && boardY < board.config.height) {
      return { x: boardX, y: boardY }
    }

    return null
  }, [board.config])

  // Handle mouse events
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (dragState?.isDragging) {
      updateDrag({ x: event.clientX, y: event.clientY })
    }
  }, [dragState, updateDrag])

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (dragState?.isDragging) {
      // Try to find the board element under the cursor
      const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY)
      const boardElement = elementUnderCursor?.closest('[data-board]') as HTMLElement
      
      if (boardElement) {
        const boardPosition = screenToBoardPosition(
          { x: event.clientX, y: event.clientY },
          boardElement
        )
        endDrag(boardPosition || undefined)
      } else {
        endDrag()
      }
    }
  }, [dragState, screenToBoardPosition, endDrag])

  // Handle touch events
  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (dragState?.isDragging && event.touches.length > 0) {
      const touch = event.touches[0]
      updateDrag({ x: touch.clientX, y: touch.clientY })
    }
  }, [dragState, updateDrag])

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (dragState?.isDragging) {
      if (event.changedTouches.length > 0) {
        const touch = event.changedTouches[0]
        const elementUnderCursor = document.elementFromPoint(touch.clientX, touch.clientY)
        const boardElement = elementUnderCursor?.closest('[data-board]') as HTMLElement
        
        if (boardElement) {
          const boardPosition = screenToBoardPosition(
            { x: touch.clientX, y: touch.clientY },
            boardElement
          )
          endDrag(boardPosition || undefined)
        } else {
          endDrag()
        }
      } else {
        endDrag()
      }
    }
  }, [dragState, screenToBoardPosition, endDrag])

  // Set up global event listeners
  useEffect(() => {
    if (dragState?.isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [dragState, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      document.body.style.cursor = ''
    }
  }, [])

  return {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    getValidDropZones,
    isValidDropPosition,
    screenToBoardPosition,
  }
}
