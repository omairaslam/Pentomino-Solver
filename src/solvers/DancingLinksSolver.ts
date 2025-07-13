import type {
  Board,
  SolverConfig,
  SolverResult,
  SolverSolution,
  Point,
  PentominoType
} from '../types'
// import { cloneBoard } from '../utils/board-utils' // Will be used for future enhancements
import { 
  getAllPentominoTypes, 
  getPentominoVariantCount, 
  getPentominoVariant 
} from '../utils/pentomino-definitions'
import { getPieceCells } from '../utils/geometry'

/**
 * Node in the dancing links data structure
 */
class DLXNode {
  left: DLXNode = this
  right: DLXNode = this
  up: DLXNode = this
  down: DLXNode = this
  column: ColumnNode | null = null
  rowId: number = -1

  constructor(rowId: number = -1) {
    this.rowId = rowId
  }
}

/**
 * Column header node
 */
class ColumnNode extends DLXNode {
  size: number = 0
  name: string = ''

  constructor(name: string) {
    super()
    this.name = name
    this.column = this
  }
}

/**
 * Dancing Links solver implementation of Algorithm X
 * Efficiently solves exact cover problems like pentomino puzzles
 */
export class DancingLinksSolver {
  private config: SolverConfig
  private startTime: number = 0
  private solutions: SolverSolution[] = []
  // private steps: SolverStep[] = [] // Will be used for step tracking in future
  private stepsExplored: number = 0
  private shouldStop: boolean = false
  private header: ColumnNode = new ColumnNode('header')
  private columns: ColumnNode[] = []
  private rowToPlacement: Map<number, {
    pieceType: PentominoType
    position: Point
    variantIndex: number
  }> = new Map()

  constructor(config: SolverConfig) {
    this.config = config
  }

  /**
   * Solve the pentomino puzzle using Algorithm X
   */
  async solve(board: Board): Promise<SolverResult> {
    this.startTime = Date.now()
    this.solutions = []
    // this.steps = [] // Will be implemented for step tracking
    this.stepsExplored = 0
    this.shouldStop = false

    try {
      // Build the exact cover matrix
      this.buildMatrix(board)
      
      // Solve using Algorithm X
      const solution: number[] = []
      await this.search(solution)
      
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
   * Build the exact cover matrix for the pentomino problem
   * Optimized version with better matrix construction
   */
  private buildMatrix(board: Board): void {
    const emptyCells: Point[] = []

    // Find all empty cells and create a lookup map
    const cellToIndex = new Map<string, number>()
    for (let y = 0; y < board.config.height; y++) {
      for (let x = 0; x < board.config.width; x++) {
        if (board.cells[y][x].state === 'empty') {
          const cellKey = `${x},${y}`
          cellToIndex.set(cellKey, emptyCells.length)
          emptyCells.push({ x, y })
        }
      }
    }

    // Early exit if not enough cells for all pieces
    if (emptyCells.length < 60) { // 12 pieces × 5 cells each
      return
    }

    // Create columns: one for each piece type + one for each empty cell
    const pieceTypes = getAllPentominoTypes()

    // Initialize header and columns
    this.header = new ColumnNode('header')
    this.columns = []

    // Create piece columns (constraints: each piece must be used exactly once)
    for (const pieceType of pieceTypes) {
      const column = new ColumnNode(`piece-${pieceType}`)
      this.columns.push(column)
      this.linkColumnToHeader(column)
    }

    // Create cell columns (constraints: each cell must be covered exactly once)
    for (let i = 0; i < emptyCells.length; i++) {
      const cell = emptyCells[i]
      const column = new ColumnNode(`cell-${cell.x}-${cell.y}`)
      this.columns.push(column)
      this.linkColumnToHeader(column)
    }

    // Create rows: one for each valid piece placement
    let rowId = 0
    for (const pieceType of pieceTypes) {
      const variantCount = getPentominoVariantCount(pieceType)

      for (let variantIndex = 0; variantIndex < variantCount; variantIndex++) {
        const variant = getPentominoVariant(pieceType, variantIndex)

        // Optimize: only try positions where the piece could potentially fit
        const pieceCells = getPieceCells(variant, { x: 0, y: 0 })
        const bounds = this.getPieceBounds(pieceCells)
        const maxX = board.config.width - bounds.width
        const maxY = board.config.height - bounds.height

        for (let y = 0; y <= maxY; y++) {
          for (let x = 0; x <= maxX; x++) {
            const position: Point = { x, y }
            const pieceCells = getPieceCells(variant, position)

            // Check if all piece cells are valid and empty
            const isValidPlacement = pieceCells.every(cell => {
              const cellKey = `${cell.x},${cell.y}`
              return cellToIndex.has(cellKey)
            })

            if (isValidPlacement && pieceCells.length === 5) {
              this.createRow(rowId, pieceType, position, variantIndex, pieceCells, cellToIndex, pieceTypes.length)
              this.rowToPlacement.set(rowId, { pieceType, position, variantIndex })
              rowId++
            }
          }
        }
      }
    }
  }

  /**
   * Get the bounding box of a piece variant
   */
  private getPieceBounds(pieceCells: Point[]): { width: number; height: number } {
    if (pieceCells.length === 0) return { width: 0, height: 0 }

    let minX = pieceCells[0].x, maxX = pieceCells[0].x
    let minY = pieceCells[0].y, maxY = pieceCells[0].y

    for (const cell of pieceCells) {
      minX = Math.min(minX, cell.x)
      maxX = Math.max(maxX, cell.x)
      minY = Math.min(minY, cell.y)
      maxY = Math.max(maxY, cell.y)
    }

    return {
      width: maxX - minX + 1,
      height: maxY - minY + 1
    }
  }

  /**
   * Create a row in the matrix for a specific piece placement
   * Optimized version with better indexing
   */
  private createRow(
    rowId: number,
    pieceType: PentominoType,
    _position: Point,
    _variantIndex: number,
    pieceCells: Point[],
    cellToIndex: Map<string, number>,
    pieceColumnOffset: number
  ): void {
    const rowNodes: DLXNode[] = []

    // Add node for piece constraint
    const pieceTypes = getAllPentominoTypes()
    const pieceColumnIndex = pieceTypes.indexOf(pieceType)
    if (pieceColumnIndex >= 0 && pieceColumnIndex < this.columns.length) {
      const pieceNode = new DLXNode(rowId)
      pieceNode.column = this.columns[pieceColumnIndex]
      this.linkNodeToColumn(pieceNode, this.columns[pieceColumnIndex])
      rowNodes.push(pieceNode)
    }

    // Add nodes for cell constraints
    for (const cell of pieceCells) {
      const cellKey = `${cell.x},${cell.y}`
      const cellIndex = cellToIndex.get(cellKey)
      if (cellIndex !== undefined) {
        const cellColumnIndex = pieceColumnOffset + cellIndex
        if (cellColumnIndex < this.columns.length) {
          const cellNode = new DLXNode(rowId)
          cellNode.column = this.columns[cellColumnIndex]
          this.linkNodeToColumn(cellNode, this.columns[cellColumnIndex])
          rowNodes.push(cellNode)
        }
      }
    }

    // Only create row if we have the expected number of nodes (1 piece + 5 cells)
    if (rowNodes.length === 6) {
      // Link row nodes horizontally
      for (let i = 0; i < rowNodes.length; i++) {
        const current = rowNodes[i]
        const next = rowNodes[(i + 1) % rowNodes.length]
        const prev = rowNodes[(i - 1 + rowNodes.length) % rowNodes.length]

        current.right = next
        current.left = prev
      }
    }
  }

  /**
   * Algorithm X search function
   */
  private async search(solution: number[]): Promise<void> {
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

    if (this.shouldStop) return

    this.stepsExplored++

    // If matrix is empty, we found a solution
    if (this.header.right === this.header) {
      this.addSolution(solution)
      return
    }

    // Choose column with minimum size (MRV heuristic)
    const column = this.chooseColumn()
    this.cover(column)

    // Try each row in the chosen column
    for (let row = column.down; row !== column; row = row.down) {
      if (this.shouldStop) return

      solution.push(row.rowId)

      // Cover all other columns in this row
      for (let j = row.right; j !== row; j = j.right) {
        this.cover(j.column!)
      }

      // Add delay for visualization if needed
      if (this.config.trackSteps) {
        await this.delay(10)
      }

      // Recursively search
      await this.search(solution)

      // Backtrack: uncover columns
      for (let j = row.left; j !== row; j = j.left) {
        this.uncover(j.column!)
      }

      solution.pop()
    }

    this.uncover(column)
  }

  /**
   * Choose column with minimum size (MRV heuristic)
   */
  private chooseColumn(): ColumnNode {
    let minSize = Infinity
    let chosenColumn = this.header.right as ColumnNode

    for (let column = this.header.right as ColumnNode; 
         column !== this.header; 
         column = column.right as ColumnNode) {
      if (column.size < minSize) {
        minSize = column.size
        chosenColumn = column
      }
    }

    return chosenColumn
  }

  /**
   * Cover a column (remove it from the matrix)
   */
  private cover(column: ColumnNode): void {
    column.right.left = column.left
    column.left.right = column.right

    for (let row = column.down; row !== column; row = row.down) {
      for (let j = row.right; j !== row; j = j.right) {
        j.down.up = j.up
        j.up.down = j.down
        j.column!.size--
      }
    }
  }

  /**
   * Uncover a column (restore it to the matrix)
   */
  private uncover(column: ColumnNode): void {
    for (let row = column.up; row !== column; row = row.up) {
      for (let j = row.left; j !== row; j = j.left) {
        j.column!.size++
        j.down.up = j
        j.up.down = j
      }
    }

    column.right.left = column
    column.left.right = column
  }

  /**
   * Link a column to the header
   */
  private linkColumnToHeader(column: ColumnNode): void {
    column.left = this.header.left
    column.right = this.header
    this.header.left.right = column
    this.header.left = column
  }

  /**
   * Link a node to its column
   */
  private linkNodeToColumn(node: DLXNode, column: ColumnNode): void {
    node.down = column
    node.up = column.up
    column.up.down = node
    column.up = node
    column.size++
  }

  /**
   * Add a solution to the results
   */
  private addSolution(solutionRows: number[]): void {
    const placements = solutionRows.map(rowId => {
      const placement = this.rowToPlacement.get(rowId)!
      return {
        pieceType: placement.pieceType,
        position: placement.position,
        variantIndex: placement.variantIndex,
      }
    })

    const solution: SolverSolution = {
      id: this.solutions.length + 1,
      placements,
      steps: [], // Dancing Links doesn't track individual steps the same way
      solvingTime: Date.now() - this.startTime,
    }

    this.solutions.push(solution)
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
