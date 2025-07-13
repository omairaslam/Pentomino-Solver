import type { PentominoType, PresetConfig } from '@/types'

// Pentomino piece colors (pastel theme)
export const PIECE_COLORS: Record<PentominoType, string> = {
  F: '#ffb3ba', // Light pink
  I: '#bae1ff', // Light blue
  L: '#baffc9', // Light green
  N: '#ffffba', // Light yellow
  P: '#ffdfba', // Light orange
  T: '#e0bbff', // Light purple
  U: '#ffb3e6', // Light magenta
  V: '#b3ffb3', // Light lime
  W: '#ffb3d9', // Light rose
  X: '#b3d9ff', // Light sky
  Y: '#d9ffb3', // Light mint
  Z: '#ffd9b3', // Light peach
}

// Dark theme colors
export const PIECE_COLORS_DARK: Record<PentominoType, string> = {
  F: '#d69e9e',
  I: '#9ec5d6',
  L: '#9ed6a8',
  N: '#d6d69e',
  P: '#d6c19e',
  T: '#c19ed6',
  U: '#d69ec5',
  V: '#9ed69e',
  W: '#d69eb8',
  X: '#9eb8d6',
  Y: '#b8d69e',
  Z: '#d6b89e',
}

// Pentomino piece names
export const PIECE_NAMES: Record<PentominoType, string> = {
  F: 'F-piece',
  I: 'I-piece',
  L: 'L-piece',
  N: 'N-piece',
  P: 'P-piece',
  T: 'T-piece',
  U: 'U-piece',
  V: 'V-piece',
  W: 'W-piece',
  X: 'X-piece',
  Y: 'Y-piece',
  Z: 'Z-piece',
}

// All pentomino types
export const ALL_PENTOMINO_TYPES: PentominoType[] = [
  'F', 'I', 'L', 'N', 'P', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
]

// Board presets
export const BOARD_PRESETS: PresetConfig[] = [
  {
    id: 'classic-8x8-hole',
    name: '8×8 with 2×2 Hole',
    description: 'Classic pentomino challenge: fit all 12 pieces in an 8×8 grid with a 2×2 hole in the center',
    width: 8,
    height: 8,
    blockedCells: [
      { x: 3, y: 3 }, { x: 4, y: 3 },
      { x: 3, y: 4 }, { x: 4, y: 4 }
    ],
    category: 'classic',
    difficulty: 'medium',
    solutionCount: 65, // Known solution count for this configuration
  },
  {
    id: 'rectangle-6x10',
    name: '6×10 Rectangle',
    description: 'Simple rectangular board using all 12 pentomino pieces',
    width: 6,
    height: 10,
    blockedCells: [],
    category: 'classic',
    difficulty: 'easy',
    solutionCount: 2339,
  },
  {
    id: 'rectangle-5x12',
    name: '5×12 Rectangle',
    description: 'Narrow rectangular board - more challenging to solve',
    width: 5,
    height: 12,
    blockedCells: [],
    category: 'classic',
    difficulty: 'medium',
    solutionCount: 1010,
  },
  {
    id: 'rectangle-4x15',
    name: '4×15 Rectangle',
    description: 'Very narrow rectangle - expert level challenge',
    width: 4,
    height: 15,
    blockedCells: [],
    category: 'classic',
    difficulty: 'hard',
    solutionCount: 368,
  },
  {
    id: 'rectangle-3x20',
    name: '3×20 Rectangle',
    description: 'Extremely narrow rectangle - ultimate challenge',
    width: 3,
    height: 20,
    blockedCells: [],
    category: 'classic',
    difficulty: 'expert',
    solutionCount: 2,
  },
  {
    id: 'cross-shape',
    name: 'Cross Shape',
    description: 'Cross-shaped board with blocked corners',
    width: 9,
    height: 9,
    blockedCells: [
      // Top corners
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
      { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 },
      { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 7, y: 1 }, { x: 8, y: 1 },
      { x: 0, y: 2 }, { x: 8, y: 2 },
      // Bottom corners
      { x: 0, y: 6 }, { x: 8, y: 6 },
      { x: 0, y: 7 }, { x: 1, y: 7 }, { x: 7, y: 7 }, { x: 8, y: 7 },
      { x: 0, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 },
      { x: 6, y: 8 }, { x: 7, y: 8 }, { x: 8, y: 8 },
    ],
    category: 'challenge',
    difficulty: 'hard',
  },
]

// Default board preset (8x8 with hole)
export const DEFAULT_PRESET = BOARD_PRESETS[0]

// Canvas rendering constants
export const CANVAS_CONFIG = {
  CELL_SIZE: 30,
  CELL_BORDER: 1,
  PIECE_BORDER: 2,
  GRID_COLOR: '#e2e8f0',
  BLOCKED_COLOR: '#64748b',
  EMPTY_COLOR: '#ffffff',
  HOVER_ALPHA: 0.7,
  DRAG_ALPHA: 0.8,
  ANIMATION_FPS: 60,
} as const

// Solver configuration
export const SOLVER_CONFIG = {
  DEFAULT_MAX_TIME: 30000, // 30 seconds
  DEFAULT_MAX_SOLUTIONS: 100,
  STEP_DELAY_MS: 100, // For step-by-step visualization
  FAST_STEP_DELAY_MS: 50,
  SLOW_STEP_DELAY_MS: 500,
} as const

// Animation configuration
export const ANIMATION_CONFIG = {
  PIECE_MOVE_DURATION: 300,
  PIECE_ROTATE_DURATION: 200,
  SOLUTION_STEP_DURATION: 800,
  FADE_DURATION: 200,
  BOUNCE_EASING: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  ROTATE_CW: ['r', 'ArrowUp'] as readonly string[],
  ROTATE_CCW: ['R', 'shift+r'] as readonly string[],
  FLIP_HORIZONTAL: ['h', 'ArrowLeft', 'ArrowRight'] as readonly string[],
  FLIP_VERTICAL: ['v', 'ArrowDown'] as readonly string[],
  SOLVE: ['s', ' '] as readonly string[],
  RESET: ['Escape'] as readonly string[],
  UNDO: ['z', 'ctrl+z', 'cmd+z'] as readonly string[],
  REDO: ['y', 'ctrl+y', 'cmd+y', 'ctrl+shift+z', 'cmd+shift+z'] as readonly string[],
  NEXT_SOLUTION: ['n', 'ArrowRight'] as readonly string[],
  PREV_SOLUTION: ['p', 'ArrowLeft'] as readonly string[],
  PLAY_PAUSE: [' ', 'Enter'] as readonly string[],
}

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'pentomino-theme',
  GAME_STATE: 'pentomino-game-state',
  SETTINGS: 'pentomino-settings',
  CUSTOM_BOARDS: 'pentomino-custom-boards',
  STATISTICS: 'pentomino-statistics',
} as const

// Error messages
export const ERROR_MESSAGES = {
  SOLVER_TIMEOUT: 'Solver timed out. Try a simpler configuration or increase the time limit.',
  SOLVER_NO_SOLUTION: 'No solution found for this configuration.',
  SOLVER_ERROR: 'An error occurred while solving. Please try again.',
  INVALID_BOARD: 'Invalid board configuration.',
  PIECE_OVERLAP: 'Pieces cannot overlap.',
  INVALID_PLACEMENT: 'Invalid piece placement.',
  WEBASSEMBLY_NOT_SUPPORTED: 'WebAssembly is not supported in this browser.',
  WEBASSEMBLY_LOAD_FAILED: 'Failed to load WebAssembly solver.',
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  SOLUTION_FOUND: 'Solution found!',
  MULTIPLE_SOLUTIONS: 'Multiple solutions found!',
  PUZZLE_COMPLETED: 'Puzzle completed successfully!',
  BOARD_RESET: 'Board reset successfully.',
  SETTINGS_SAVED: 'Settings saved successfully.',
} as const
