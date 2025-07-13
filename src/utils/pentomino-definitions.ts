import type { PentominoDefinition, PentominoType, PentominoShape } from '@/types'
import { PIECE_COLORS, PIECE_NAMES } from './constants'
import { normalizeShape, generateShapeVariants } from './geometry'

/**
 * Base shapes for all 12 pentomino pieces
 * Each shape is defined by the relative coordinates of its 5 cells
 */
const BASE_SHAPES: Record<PentominoType, PentominoShape> = {
  // F-piece:  ⬛⬛
  //          ⬛⬛
  //           ⬛
  F: normalizeShape([
    { x: 1, y: 0 }, { x: 2, y: 0 },
    { x: 0, y: 1 }, { x: 1, y: 1 },
    { x: 1, y: 2 }
  ]),

  // I-piece: ⬛⬛⬛⬛⬛
  I: normalizeShape([
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }
  ]),

  // L-piece: ⬛
  //          ⬛
  //          ⬛
  //          ⬛⬛
  L: normalizeShape([
    { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 },
    { x: 1, y: 3 }
  ]),

  // N-piece:  ⬛
  //          ⬛⬛
  //          ⬛
  //          ⬛
  N: normalizeShape([
    { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }
  ]),

  // P-piece: ⬛⬛
  //          ⬛⬛
  //          ⬛
  P: normalizeShape([
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }
  ]),

  // T-piece: ⬛⬛⬛
  //           ⬛
  //           ⬛
  T: normalizeShape([
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
    { x: 1, y: 1 }, { x: 1, y: 2 }
  ]),

  // U-piece: ⬛ ⬛
  //          ⬛⬛⬛
  U: normalizeShape([
    { x: 0, y: 0 }, { x: 2, y: 0 },
    { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }
  ]),

  // V-piece: ⬛
  //          ⬛
  //          ⬛⬛⬛
  V: normalizeShape([
    { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }
  ]),

  // W-piece: ⬛
  //          ⬛⬛
  //           ⬛⬛
  W: normalizeShape([
    { x: 0, y: 0 },
    { x: 0, y: 1 }, { x: 1, y: 1 },
    { x: 1, y: 2 }, { x: 2, y: 2 }
  ]),

  // X-piece:  ⬛
  //          ⬛⬛⬛
  //           ⬛
  X: normalizeShape([
    { x: 1, y: 0 },
    { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
    { x: 1, y: 2 }
  ]),

  // Y-piece:  ⬛
  //          ⬛⬛
  //           ⬛
  //           ⬛
  Y: normalizeShape([
    { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }
  ]),

  // Z-piece: ⬛⬛
  //           ⬛
  //           ⬛⬛
  Z: normalizeShape([
    { x: 0, y: 0 }, { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 1, y: 2 }, { x: 2, y: 2 }
  ]),
}

/**
 * Generate all pentomino definitions with variants
 */
export function createPentominoDefinitions(): Record<PentominoType, PentominoDefinition> {
  const definitions: Record<PentominoType, PentominoDefinition> = {} as Record<PentominoType, PentominoDefinition>

  for (const [type, baseShape] of Object.entries(BASE_SHAPES) as [PentominoType, PentominoShape][]) {
    definitions[type] = {
      type,
      baseShape,
      variants: generateShapeVariants(baseShape),
      color: PIECE_COLORS[type],
      name: PIECE_NAMES[type],
    }
  }

  return definitions
}

/**
 * Get all pentomino definitions
 */
export const PENTOMINO_DEFINITIONS = createPentominoDefinitions()

/**
 * Get a specific pentomino definition
 */
export function getPentominoDefinition(type: PentominoType): PentominoDefinition {
  return PENTOMINO_DEFINITIONS[type]
}

/**
 * Get all pentomino types
 */
export function getAllPentominoTypes(): PentominoType[] {
  return Object.keys(PENTOMINO_DEFINITIONS) as PentominoType[]
}

/**
 * Get a specific variant of a pentomino piece
 */
export function getPentominoVariant(type: PentominoType, variantIndex: number): PentominoShape {
  const definition = getPentominoDefinition(type)
  return definition.variants[variantIndex] || definition.baseShape
}

/**
 * Get the number of variants for a pentomino piece
 */
export function getPentominoVariantCount(type: PentominoType): number {
  return getPentominoDefinition(type).variants.length
}

/**
 * Create a new pentomino piece instance
 */
export function createPentominoPiece(
  type: PentominoType,
  id?: string,
  position = { x: 0, y: 0 },
  variantIndex = 0
) {
  return {
    id: id || `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    position,
    variantIndex,
    isPlaced: false,
    isDragging: false,
    zIndex: 0,
  }
}

/**
 * Validate that all pentomino definitions are correct
 */
export function validatePentominoDefinitions(): boolean {
  const types = getAllPentominoTypes()
  
  // Check that we have exactly 12 pieces
  if (types.length !== 12) {
    console.error(`Expected 12 pentomino types, got ${types.length}`)
    return false
  }

  // Check that each piece has exactly 5 cells
  for (const type of types) {
    const definition = getPentominoDefinition(type)
    if (definition.baseShape.cells.length !== 5) {
      console.error(`Pentomino ${type} has ${definition.baseShape.cells.length} cells, expected 5`)
      return false
    }

    // Check that all variants have 5 cells
    for (let i = 0; i < definition.variants.length; i++) {
      const variant = definition.variants[i]
      if (variant.cells.length !== 5) {
        console.error(`Pentomino ${type} variant ${i} has ${variant.cells.length} cells, expected 5`)
        return false
      }
    }
  }

  return true
}

/**
 * Get statistics about pentomino definitions
 */
export function getPentominoStats() {
  const stats = {
    totalPieces: 0,
    totalVariants: 0,
    variantCounts: {} as Record<PentominoType, number>,
    totalCells: 0,
  }

  for (const type of getAllPentominoTypes()) {
    const definition = getPentominoDefinition(type)
    stats.totalPieces++
    stats.totalVariants += definition.variants.length
    stats.variantCounts[type] = definition.variants.length
    stats.totalCells += definition.baseShape.cells.length
  }

  return stats
}

// Validate definitions on module load
if (process.env.NODE_ENV === 'development') {
  if (!validatePentominoDefinitions()) {
    throw new Error('Invalid pentomino definitions detected!')
  }
}
