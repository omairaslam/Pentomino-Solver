import React, { useRef, useEffect, useCallback } from 'react'
import type { PentominoPiece } from '../../types'
import { getPentominoDefinition, getPentominoVariant } from '../../utils/pentomino-definitions'
import { CANVAS_CONFIG } from '../../utils/constants'
import './PieceRenderer.css'

interface PieceRendererProps {
  piece: PentominoPiece
  scale?: number
  isSelected?: boolean
  isDragging?: boolean
  onMouseDown?: (event: React.MouseEvent, piece: PentominoPiece) => void
  onTouchStart?: (event: React.TouchEvent, piece: PentominoPiece) => void
  onClick?: (piece: PentominoPiece) => void
  onDoubleClick?: (piece: PentominoPiece) => void
  className?: string
}

export const PieceRenderer: React.FC<PieceRendererProps> = ({
  piece,
  scale = 1,
  isSelected = false,
  isDragging = false,
  onMouseDown,
  onTouchStart,
  onClick,
  onDoubleClick,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Get piece definition and current variant
  const definition = getPentominoDefinition(piece.type)
  const variant = getPentominoVariant(piece.type, piece.variantIndex)

  // Calculate canvas size based on piece bounds and scale
  const cellSize = CANVAS_CONFIG.CELL_SIZE * scale
  const cellBorder = CANVAS_CONFIG.CELL_BORDER * scale
  const canvasWidth = variant.bounds.width * cellSize + (variant.bounds.width + 1) * cellBorder
  const canvasHeight = variant.bounds.height * cellSize + (variant.bounds.height + 1) * cellBorder

  // Render the piece on canvas
  const renderPiece = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Get piece color with state modifications
    let fillColor = definition.color
    if (isSelected) {
      fillColor = adjustColorBrightness(fillColor, 1.2)
    }
    if (isDragging) {
      fillColor = adjustColorBrightness(fillColor, 0.8)
    }

    // Draw piece cells
    ctx.fillStyle = fillColor
    ctx.strokeStyle = adjustColorBrightness(fillColor, 0.7)
    ctx.lineWidth = CANVAS_CONFIG.PIECE_BORDER * scale

    for (const cell of variant.cells) {
      const x = cell.x * (cellSize + cellBorder) + cellBorder
      const y = cell.y * (cellSize + cellBorder) + cellBorder

      // Fill cell
      ctx.fillRect(x, y, cellSize, cellSize)
      
      // Draw border
      ctx.strokeRect(x, y, cellSize, cellSize)
    }

    // Draw piece label in center
    if (variant.cells.length > 0) {
      const centerX = (variant.bounds.width * (cellSize + cellBorder)) / 2
      const centerY = (variant.bounds.height * (cellSize + cellBorder)) / 2

      ctx.fillStyle = '#000000'
      ctx.font = `bold ${Math.floor(cellSize * 0.4)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(piece.type, centerX, centerY)
    }

    // Draw selection indicator
    if (isSelected) {
      ctx.strokeStyle = '#2563eb'
      ctx.lineWidth = 3 * scale
      ctx.setLineDash([5 * scale, 5 * scale])
      ctx.strokeRect(0, 0, canvas.width, canvas.height)
      ctx.setLineDash([])
    }
  }, [piece, variant, definition, scale, isSelected, isDragging, cellSize, cellBorder])

  // Re-render when dependencies change
  useEffect(() => {
    renderPiece()
  }, [renderPiece])

  // Handle mouse events
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    onMouseDown?.(event, piece)
  }, [onMouseDown, piece])

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    event.preventDefault()
    onTouchStart?.(event, piece)
  }, [onTouchStart, piece])

  const handleClick = useCallback(() => {
    onClick?.(piece)
  }, [onClick, piece])

  const handleDoubleClick = useCallback(() => {
    onDoubleClick?.(piece)
  }, [onDoubleClick, piece])

  // Handle keyboard events for accessibility
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick?.(piece)
    }
  }, [onClick, piece])

  return (
    <div
      className={`piece-renderer ${className} ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      data-piece-type={piece.type}
      data-piece-id={piece.id}
    >
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="piece-canvas"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`${definition.name} piece, variant ${piece.variantIndex + 1}`}
        aria-pressed={isSelected}
        draggable={false} // We handle dragging manually
      />
      
      <div className="piece-info">
        <span className="piece-type">{piece.type}</span>
        {piece.variantIndex > 0 && (
          <span className="piece-variant">v{piece.variantIndex + 1}</span>
        )}
      </div>
    </div>
  )
}

// Helper function to adjust color brightness
function adjustColorBrightness(color: string, factor: number): string {
  // Simple color brightness adjustment
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  const newR = Math.min(255, Math.floor(r * factor))
  const newG = Math.min(255, Math.floor(g * factor))
  const newB = Math.min(255, Math.floor(b * factor))

  return `rgb(${newR}, ${newG}, ${newB})`
}
