// Core geometric types
export interface Point {
  x: number
  y: number
}

export interface Dimensions {
  width: number
  height: number
}

export interface Rectangle extends Point, Dimensions {}

// Pentomino piece types
export type PentominoType = 'F' | 'I' | 'L' | 'N' | 'P' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'

export interface PentominoShape {
  /** Relative coordinates of the piece cells */
  cells: Point[]
  /** Bounding box dimensions */
  bounds: Dimensions
}

export interface PentominoDefinition {
  type: PentominoType
  /** Base shape (rotation 0) */
  baseShape: PentominoShape
  /** All possible rotations and flips */
  variants: PentominoShape[]
  /** Display color */
  color: string
  /** Display name */
  name: string
}

export interface PentominoPiece {
  id: string
  type: PentominoType
  /** Current position on board */
  position: Point
  /** Current variant index */
  variantIndex: number
  /** Whether piece is placed on board */
  isPlaced: boolean
  /** Whether piece is currently being dragged */
  isDragging: boolean
  /** Z-index for rendering order */
  zIndex: number
}

// Board types
export type CellState = 'empty' | 'blocked' | 'occupied'

export interface BoardCell {
  state: CellState
  /** ID of piece occupying this cell (if any) */
  pieceId?: string
  /** Type of piece occupying this cell (if any) */
  pieceType?: PentominoType
}

export interface BoardConfig {
  width: number
  height: number
  /** Preset blocked cells */
  blockedCells: Point[]
  /** Display name */
  name: string
  /** Description */
  description: string
}

export interface Board {
  config: BoardConfig
  cells: BoardCell[][]
  /** Total empty cells that need to be filled */
  emptyCellCount: number
}

// Solver types
export type SolverAlgorithm = 'backtracking' | 'dancing-links'
export type SolverEngine = 'javascript' | 'webassembly'

export interface SolverConfig {
  algorithm: SolverAlgorithm
  engine: SolverEngine
  /** Maximum time to spend solving (ms) */
  maxTime?: number
  /** Maximum solutions to find */
  maxSolutions?: number
  /** Whether to track steps for visualization */
  trackSteps: boolean
}

export interface SolverStep {
  /** Step number */
  stepNumber: number
  /** Piece being placed/removed */
  pieceType: PentominoType
  /** Position where piece is placed */
  position: Point
  /** Variant index used */
  variantIndex: number
  /** Whether this is a placement (true) or backtrack (false) */
  isPlacement: boolean
  /** Board state after this step */
  boardState: BoardCell[][]
}

export interface SolverSolution {
  /** Solution number */
  id: number
  /** Piece placements */
  placements: Array<{
    pieceType: PentominoType
    position: Point
    variantIndex: number
  }>
  /** Steps taken to reach this solution */
  steps: SolverStep[]
  /** Time taken to find solution (ms) */
  solvingTime: number
}

export interface SolverResult {
  /** Whether solving completed successfully */
  success: boolean
  /** All solutions found */
  solutions: SolverSolution[]
  /** Total time spent solving */
  totalTime: number
  /** Number of steps explored */
  stepsExplored: number
  /** Error message if solving failed */
  error?: string
}

// Game state types
export type GameMode = 'manual' | 'auto-solve' | 'step-by-step'

export interface GameState {
  mode: GameMode
  board: Board
  pieces: PentominoPiece[]
  /** Currently selected piece */
  selectedPieceId?: string
  /** Current solver result */
  solverResult?: SolverResult
  /** Current solution being viewed */
  currentSolutionIndex: number
  /** Current step in step-by-step mode */
  currentStepIndex: number
  /** Whether animation is playing */
  isAnimating: boolean
  /** Animation speed (steps per second) */
  animationSpeed: number
  /** Undo/redo history */
  history: GameStateSnapshot[]
  /** Current position in history */
  historyIndex: number
}

export interface GameStateSnapshot {
  timestamp: number
  board: Board
  pieces: PentominoPiece[]
  description: string
}

// UI types
export interface DragState {
  isDragging: boolean
  draggedPieceId?: string
  dragOffset: Point
  currentPosition: Point
  validDropZones: Point[]
}

export interface ThemeConfig {
  mode: 'light' | 'dark'
  pieceColors: Record<PentominoType, string>
  boardColors: {
    empty: string
    blocked: string
    occupied: string
    validDrop: string
    invalidDrop: string
  }
}

// Animation types
export interface AnimationConfig {
  duration: number
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
  delay?: number
}

export interface AnimationState {
  isAnimating: boolean
  currentFrame: number
  totalFrames: number
  startTime: number
  config: AnimationConfig
}

// Event types
export interface PieceEvent {
  pieceId: string
  type: 'select' | 'deselect' | 'move' | 'rotate' | 'flip' | 'place' | 'remove'
  position?: Point
  variantIndex?: number
}

export interface BoardEvent {
  type: 'cell-click' | 'cell-hover' | 'resize' | 'reset'
  position?: Point
  newSize?: Dimensions
}

export interface SolverEvent {
  type: 'start' | 'step' | 'solution-found' | 'complete' | 'error'
  step?: SolverStep
  solution?: SolverSolution
  error?: string
}

// Preset configurations
export interface PresetConfig extends BoardConfig {
  id: string
  category: 'classic' | 'custom' | 'challenge'
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  solutionCount?: number
  thumbnail?: string
}

// Export/Import types
export interface ExportData {
  version: string
  timestamp: number
  board: BoardConfig
  pieces: Array<{
    type: PentominoType
    position: Point
    variantIndex: number
  }>
  solutions?: SolverSolution[]
}

// Performance monitoring
export interface PerformanceMetrics {
  renderTime: number
  solverTime: number
  memoryUsage: number
  frameRate: number
}
