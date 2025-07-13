import React, { useState, useCallback } from 'react'
import { PieceRenderer } from '../PieceRenderer/PieceRenderer'
import type { PentominoPiece, Point } from '../../types'
import './PiecePalette.css'

interface PiecePaletteProps {
  pieces: PentominoPiece[]
  selectedPieceId?: string
  onPieceSelect?: (piece: PentominoPiece) => void
  onPieceRotate?: (piece: PentominoPiece) => void
  onPieceFlip?: (piece: PentominoPiece) => void
  onDragStart?: (piece: PentominoPiece, startPosition: Point) => void
  onDragEnd?: (piece: PentominoPiece) => void
  showOnlyAvailable?: boolean
  layout?: 'grid' | 'list' | 'compact'
  className?: string
}

export const PiecePalette: React.FC<PiecePaletteProps> = ({
  pieces,
  selectedPieceId,
  onPieceSelect,
  onPieceRotate,
  onPieceFlip,
  onDragStart,
  onDragEnd,
  showOnlyAvailable = false,
  layout = 'grid',
  className = '',
}) => {
  const [draggedPieceId, setDraggedPieceId] = useState<string>()

  // Filter pieces based on availability
  const visiblePieces = showOnlyAvailable 
    ? pieces.filter(piece => !piece.isPlaced)
    : pieces

  // Handle piece selection
  const handlePieceClick = useCallback((piece: PentominoPiece) => {
    onPieceSelect?.(piece)
  }, [onPieceSelect])

  // Handle piece double-click for rotation
  const handlePieceDoubleClick = useCallback((piece: PentominoPiece) => {
    onPieceRotate?.(piece)
  }, [onPieceRotate])

  // Handle drag start
  const handleMouseDown = useCallback((event: React.MouseEvent, piece: PentominoPiece) => {
    if (piece.isPlaced) return

    const rect = event.currentTarget.getBoundingClientRect()
    const startPosition: Point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }

    setDraggedPieceId(piece.id)
    onDragStart?.(piece, startPosition)

    // Add global mouse event listeners for drag
    const handleMouseMove = (_e: MouseEvent) => {
      // Drag logic will be handled by parent component
    }

    const handleMouseUp = () => {
      setDraggedPieceId(undefined)
      onDragEnd?.(piece)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [onDragStart, onDragEnd])

  // Handle touch start for mobile
  const handleTouchStart = useCallback((event: React.TouchEvent, piece: PentominoPiece) => {
    if (piece.isPlaced) return

    const touch = event.touches[0]
    const rect = event.currentTarget.getBoundingClientRect()
    const startPosition: Point = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    }

    setDraggedPieceId(piece.id)
    onDragStart?.(piece, startPosition)

    // Add global touch event listeners for drag
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      // Drag logic will be handled by parent component
    }

    const handleTouchEnd = () => {
      setDraggedPieceId(undefined)
      onDragEnd?.(piece)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }, [onDragStart, onDragEnd])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!selectedPieceId) return

    const selectedPiece = pieces.find(p => p.id === selectedPieceId)
    if (!selectedPiece) return

    switch (event.key.toLowerCase()) {
      case 'r':
        event.preventDefault()
        onPieceRotate?.(selectedPiece)
        break
      case 'h':
        event.preventDefault()
        onPieceFlip?.(selectedPiece)
        break
      case 'v':
        event.preventDefault()
        onPieceFlip?.(selectedPiece)
        break
    }
  }, [selectedPieceId, pieces, onPieceRotate, onPieceFlip])

  return (
    <div 
      className={`piece-palette ${layout} ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="toolbar"
      aria-label="Pentomino pieces palette"
    >
      <div className="palette-header">
        <h3>Pieces</h3>
        <div className="palette-controls">
          <button 
            className="btn btn-sm"
            onClick={() => onPieceRotate?.(pieces.find(p => p.id === selectedPieceId)!)}
            disabled={!selectedPieceId}
            title="Rotate piece (R)"
          >
            ↻
          </button>
          <button 
            className="btn btn-sm"
            onClick={() => onPieceFlip?.(pieces.find(p => p.id === selectedPieceId)!)}
            disabled={!selectedPieceId}
            title="Flip piece (H)"
          >
            ⇄
          </button>
        </div>
      </div>

      <div className="pieces-container">
        {visiblePieces.map((piece) => (
          <div
            key={piece.id}
            className={`piece-wrapper ${piece.isPlaced ? 'placed' : 'available'}`}
          >
            <PieceRenderer
              piece={piece}
              scale={layout === 'compact' ? 0.7 : 1}
              isSelected={selectedPieceId === piece.id}
              isDragging={draggedPieceId === piece.id}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onClick={handlePieceClick}
              onDoubleClick={handlePieceDoubleClick}
              className={piece.isPlaced ? 'placed' : ''}
            />
            
            {piece.isPlaced && (
              <div className="placed-indicator">
                <span>Placed</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="palette-footer">
        <div className="piece-count">
          {visiblePieces.filter(p => !p.isPlaced).length} / {pieces.length} available
        </div>
        
        <div className="palette-legend">
          <div className="legend-item">
            <span className="legend-dot available"></span>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot placed"></span>
            <span>Placed</span>
          </div>
        </div>
      </div>
    </div>
  )
}
