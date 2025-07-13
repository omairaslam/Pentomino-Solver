import type { Board, Point, PentominoPiece, DragState, PentominoType } from '@/types'
import { CANVAS_CONFIG } from '@/utils/constants'
import { getPentominoVariant, getPentominoDefinition } from '@/utils/pentomino-definitions'
import { getPieceCells } from '@/utils/geometry'

interface RenderOptions {
  board: Board
  pieces: PentominoPiece[]
  hoveredCell?: Point | null
  selectedPieceId?: string
  dragState?: DragState
  showGrid?: boolean
  showCoordinates?: boolean
}

export class BoardRenderer {
  private ctx: CanvasRenderingContext2D
  private cellSize: number
  private cellBorder: number

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
    this.cellSize = CANVAS_CONFIG.CELL_SIZE
    this.cellBorder = CANVAS_CONFIG.CELL_BORDER
  }

  render(options: RenderOptions): void {
    const { board, pieces, hoveredCell, selectedPieceId, dragState, showGrid = true, showCoordinates = false } = options

    // Clear canvas
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

    // Draw board background
    this.drawBoardBackground(board)

    // Draw grid if enabled
    if (showGrid) {
      this.drawGrid(board)
    }

    // Draw board cells (empty, blocked)
    this.drawBoardCells(board)

    // Draw placed pieces
    this.drawPlacedPieces(board, pieces, selectedPieceId)

    // Draw hover effects
    if (hoveredCell) {
      this.drawHoverEffect(hoveredCell)
    }

    // Draw drag preview
    if (dragState?.isDragging && dragState.draggedPieceId) {
      this.drawDragPreview(dragState, pieces)
    }

    // Draw coordinates if enabled
    if (showCoordinates) {
      this.drawCoordinates(board)
    }
  }

  private drawBoardBackground(_board: Board): void {
    this.ctx.fillStyle = CANVAS_CONFIG.EMPTY_COLOR
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
  }

  private drawGrid(board: Board): void {
    this.ctx.strokeStyle = CANVAS_CONFIG.GRID_COLOR
    this.ctx.lineWidth = this.cellBorder

    const { width, height } = board.config

    // Draw vertical lines
    for (let x = 0; x <= width; x++) {
      const xPos = x * (this.cellSize + this.cellBorder)
      this.ctx.beginPath()
      this.ctx.moveTo(xPos, 0)
      this.ctx.lineTo(xPos, height * (this.cellSize + this.cellBorder))
      this.ctx.stroke()
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y++) {
      const yPos = y * (this.cellSize + this.cellBorder)
      this.ctx.beginPath()
      this.ctx.moveTo(0, yPos)
      this.ctx.lineTo(width * (this.cellSize + this.cellBorder), yPos)
      this.ctx.stroke()
    }
  }

  private drawBoardCells(board: Board): void {
    for (let y = 0; y < board.config.height; y++) {
      for (let x = 0; x < board.config.width; x++) {
        const cell = board.cells[y][x]
        const cellRect = this.getCellRect({ x, y })

        switch (cell.state) {
          case 'blocked':
            this.ctx.fillStyle = CANVAS_CONFIG.BLOCKED_COLOR
            this.ctx.fillRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height)
            break
          case 'empty':
            // Already drawn as background
            break
          case 'occupied':
            // Will be drawn by drawPlacedPieces
            break
        }
      }
    }
  }

  private drawPlacedPieces(_board: Board, pieces: PentominoPiece[], selectedPieceId?: string): void {
    // Sort pieces by z-index to ensure proper rendering order
    const sortedPieces = [...pieces]
      .filter(piece => piece.isPlaced)
      .sort((a, b) => a.zIndex - b.zIndex)

    for (const piece of sortedPieces) {
      this.drawPiece(piece, selectedPieceId === piece.id)
    }
  }

  private drawPiece(piece: PentominoPiece, isSelected: boolean): void {
    const definition = getPentominoDefinition(piece.type)
    const variant = getPentominoVariant(piece.type, piece.variantIndex)
    const pieceCells = getPieceCells(variant, piece.position)

    // Get piece color
    let fillColor = definition.color
    if (isSelected) {
      fillColor = this.adjustColorBrightness(fillColor, 1.2)
    }

    // Draw piece cells
    this.ctx.fillStyle = fillColor
    this.ctx.strokeStyle = this.adjustColorBrightness(fillColor, 0.8)
    this.ctx.lineWidth = CANVAS_CONFIG.PIECE_BORDER

    for (const cell of pieceCells) {
      const cellRect = this.getCellRect(cell)
      
      // Fill cell
      this.ctx.fillRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height)
      
      // Draw border
      this.ctx.strokeRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height)
    }

    // Draw piece label in center
    if (pieceCells.length > 0) {
      this.drawPieceLabel(piece.type, pieceCells)
    }
  }

  private drawPieceLabel(type: PentominoType, cells: Point[]): void {
    // Calculate center of piece
    const centerX = cells.reduce((sum, cell) => sum + cell.x, 0) / cells.length
    const centerY = cells.reduce((sum, cell) => sum + cell.y, 0) / cells.length

    const centerRect = this.getCellRect({ x: centerX, y: centerY })
    const textX = centerRect.x + centerRect.width / 2
    const textY = centerRect.y + centerRect.height / 2

    // Draw label
    this.ctx.fillStyle = '#000000'
    this.ctx.font = `bold ${Math.floor(this.cellSize * 0.4)}px sans-serif`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(type, textX, textY)
  }

  private drawHoverEffect(hoveredCell: Point): void {
    const cellRect = this.getCellRect(hoveredCell)
    
    this.ctx.fillStyle = `rgba(0, 0, 0, ${CANVAS_CONFIG.HOVER_ALPHA})`
    this.ctx.fillRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height)
  }

  private drawDragPreview(dragState: DragState, pieces: PentominoPiece[]): void {
    const draggedPiece = pieces.find(p => p.id === dragState.draggedPieceId)
    if (!draggedPiece) return

    // const definition = getPentominoDefinition(draggedPiece.type)
    const variant = getPentominoVariant(draggedPiece.type, draggedPiece.variantIndex)

    // Calculate preview position based on current drag position
    const previewPosition = this.screenToBoardPosition(dragState.currentPosition)
    if (!previewPosition) return

    const pieceCells = getPieceCells(variant, previewPosition)
    
    // Determine if this is a valid drop position
    const isValidDrop = dragState.validDropZones.some(zone => 
      zone.x === previewPosition.x && zone.y === previewPosition.y
    )

    // Draw preview with appropriate styling
    this.ctx.fillStyle = isValidDrop 
      ? `rgba(34, 197, 94, ${CANVAS_CONFIG.DRAG_ALPHA})` // Green for valid
      : `rgba(239, 68, 68, ${CANVAS_CONFIG.DRAG_ALPHA})` // Red for invalid

    for (const cell of pieceCells) {
      const cellRect = this.getCellRect(cell)
      this.ctx.fillRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height)
    }
  }

  private drawCoordinates(board: Board): void {
    this.ctx.fillStyle = '#666666'
    this.ctx.font = `${Math.floor(this.cellSize * 0.25)}px sans-serif`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'

    for (let y = 0; y < board.config.height; y++) {
      for (let x = 0; x < board.config.width; x++) {
        const cellRect = this.getCellRect({ x, y })
        const text = `${x},${y}`
        this.ctx.fillText(
          text,
          cellRect.x + cellRect.width / 2,
          cellRect.y + cellRect.height - 8
        )
      }
    }
  }

  private getCellRect(position: Point): { x: number; y: number; width: number; height: number } {
    const x = position.x * (this.cellSize + this.cellBorder) + this.cellBorder
    const y = position.y * (this.cellSize + this.cellBorder) + this.cellBorder
    
    return {
      x,
      y,
      width: this.cellSize,
      height: this.cellSize,
    }
  }

  private screenToBoardPosition(screenPos: Point): Point | null {
    // This is a simplified version - in practice, you'd need the canvas bounds
    const cellX = Math.floor(screenPos.x / (this.cellSize + this.cellBorder))
    const cellY = Math.floor(screenPos.y / (this.cellSize + this.cellBorder))
    
    return { x: cellX, y: cellY }
  }

  private adjustColorBrightness(color: string, factor: number): string {
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
}
