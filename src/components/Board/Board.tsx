import React, { useRef, useEffect, useCallback, useState } from 'react'
import type { Board as BoardType, Point, PentominoPiece, DragState } from '@/types'
import { CANVAS_CONFIG } from '@/utils/constants'
import { BoardRenderer } from './BoardRenderer'
import { useBoardInteraction } from '@/hooks/useBoardInteraction'
import './Board.css'

interface BoardProps {
  board: BoardType
  pieces: PentominoPiece[]
  selectedPieceId?: string
  dragState?: DragState
  onCellClick?: (position: Point) => void
  onCellHover?: (position: Point | null) => void
  onPieceDrop?: (pieceId: string, position: Point) => void
  showGrid?: boolean
  showCoordinates?: boolean
  className?: string
}

export const Board: React.FC<BoardProps> = ({
  board,
  pieces,
  selectedPieceId,
  dragState,
  onCellClick,
  onCellHover,
  onPieceDrop,
  showGrid = true,
  showCoordinates = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredCell, setHoveredCell] = useState<Point | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  // Calculate canvas dimensions based on board size
  const calculateCanvasSize = useCallback(() => {
    const { width, height } = board.config
    const canvasWidth = width * CANVAS_CONFIG.CELL_SIZE + (width + 1) * CANVAS_CONFIG.CELL_BORDER
    const canvasHeight = height * CANVAS_CONFIG.CELL_SIZE + (height + 1) * CANVAS_CONFIG.CELL_BORDER
    return { width: canvasWidth, height: canvasHeight }
  }, [board.config])

  // Update canvas size when board changes
  useEffect(() => {
    const size = calculateCanvasSize()
    setCanvasSize(size)
  }, [calculateCanvasSize])

  // Convert screen coordinates to board coordinates
  const screenToBoard = useCallback((screenX: number, screenY: number): Point | null => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const x = screenX - rect.left
    const y = screenY - rect.top

    const cellX = Math.floor(x / (CANVAS_CONFIG.CELL_SIZE + CANVAS_CONFIG.CELL_BORDER))
    const cellY = Math.floor(y / (CANVAS_CONFIG.CELL_SIZE + CANVAS_CONFIG.CELL_BORDER))

    if (cellX >= 0 && cellX < board.config.width && cellY >= 0 && cellY < board.config.height) {
      return { x: cellX, y: cellY }
    }

    return null
  }, [board.config])

  // Handle mouse events
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    const boardPos = screenToBoard(event.clientX, event.clientY)
    setHoveredCell(boardPos)
    onCellHover?.(boardPos)
  }, [screenToBoard, onCellHover])

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null)
    onCellHover?.(null)
  }, [onCellHover])

  const handleClick = useCallback((event: React.MouseEvent) => {
    const boardPos = screenToBoard(event.clientX, event.clientY)
    if (boardPos) {
      onCellClick?.(boardPos)
    }
  }, [screenToBoard, onCellClick])

  // Handle drag and drop
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const boardPos = screenToBoard(event.clientX, event.clientY)
    if (boardPos && dragState?.draggedPieceId) {
      onPieceDrop?.(dragState.draggedPieceId, boardPos)
    }
  }, [screenToBoard, dragState, onPieceDrop])

  // Render the board
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const renderer = new BoardRenderer(ctx)
    renderer.render({
      board,
      pieces,
      hoveredCell,
      selectedPieceId,
      dragState,
      showGrid,
      showCoordinates,
    })
  }, [board, pieces, hoveredCell, selectedPieceId, dragState, showGrid, showCoordinates])

  // Set up board interaction hook
  const { handleKeyDown } = useBoardInteraction({
    board,
    pieces,
    selectedPieceId,
    onCellClick,
  })

  // Handle keyboard events
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('keydown', handleKeyDown)
    return () => canvas.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className={`board-container ${className}`}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="board-canvas"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        tabIndex={0}
        role="grid"
        aria-label={`Pentomino board ${board.config.width}x${board.config.height}`}
        aria-describedby="board-description"
      />
      
      <div id="board-description" className="sr-only">
        {board.config.description || `${board.config.width} by ${board.config.height} pentomino puzzle board`}
        {hoveredCell && ` Currently hovering over cell ${hoveredCell.x}, ${hoveredCell.y}`}
      </div>
      
      {showCoordinates && (
        <div className="board-coordinates">
          {hoveredCell && (
            <span className="coordinate-display">
              ({hoveredCell.x}, {hoveredCell.y})
            </span>
          )}
        </div>
      )}
    </div>
  )
}
