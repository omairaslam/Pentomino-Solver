import type { Point, Dimensions, PentominoShape } from '@/types'

/**
 * Check if two points are equal
 */
export function pointsEqual(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}

/**
 * Add two points together
 */
export function addPoints(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y }
}

/**
 * Subtract point b from point a
 */
export function subtractPoints(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y }
}

/**
 * Calculate distance between two points
 */
export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Check if a point is within bounds
 */
export function isPointInBounds(point: Point, bounds: Dimensions): boolean {
  return point.x >= 0 && point.x < bounds.width && point.y >= 0 && point.y < bounds.height
}

/**
 * Rotate a point around the origin by 90 degrees clockwise
 */
export function rotatePoint90CW(point: Point): Point {
  return { x: point.y, y: -point.x }
}

/**
 * Rotate a point around the origin by 90 degrees counter-clockwise
 */
export function rotatePoint90CCW(point: Point): Point {
  return { x: -point.y, y: point.x }
}

/**
 * Flip a point horizontally around the origin
 */
export function flipPointHorizontal(point: Point): Point {
  return { x: -point.x, y: point.y }
}

/**
 * Flip a point vertically around the origin
 */
export function flipPointVertical(point: Point): Point {
  return { x: point.x, y: -point.y }
}

/**
 * Normalize a shape so its top-left cell is at (0, 0)
 */
export function normalizeShape(cells: Point[]): PentominoShape {
  if (cells.length === 0) {
    return { cells: [], bounds: { width: 0, height: 0 } }
  }

  // Find bounding box
  const minX = Math.min(...cells.map(p => p.x))
  const minY = Math.min(...cells.map(p => p.y))
  const maxX = Math.max(...cells.map(p => p.x))
  const maxY = Math.max(...cells.map(p => p.y))

  // Normalize cells to start at (0, 0)
  const normalizedCells = cells.map(p => ({
    x: p.x - minX,
    y: p.y - minY,
  }))

  return {
    cells: normalizedCells,
    bounds: {
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    },
  }
}

/**
 * Rotate a shape 90 degrees clockwise
 */
export function rotateShape90CW(shape: PentominoShape): PentominoShape {
  const rotatedCells = shape.cells.map(rotatePoint90CW)
  return normalizeShape(rotatedCells)
}

/**
 * Rotate a shape 90 degrees counter-clockwise
 */
export function rotateShape90CCW(shape: PentominoShape): PentominoShape {
  const rotatedCells = shape.cells.map(rotatePoint90CCW)
  return normalizeShape(rotatedCells)
}

/**
 * Flip a shape horizontally
 */
export function flipShapeHorizontal(shape: PentominoShape): PentominoShape {
  const flippedCells = shape.cells.map(flipPointHorizontal)
  return normalizeShape(flippedCells)
}

/**
 * Flip a shape vertically
 */
export function flipShapeVertical(shape: PentominoShape): PentominoShape {
  const flippedCells = shape.cells.map(flipPointVertical)
  return normalizeShape(flippedCells)
}

/**
 * Generate all unique rotations and flips of a shape
 */
export function generateShapeVariants(baseShape: PentominoShape): PentominoShape[] {
  const variants: PentominoShape[] = []
  const seen = new Set<string>()

  // Helper to add unique variants
  const addVariant = (shape: PentominoShape) => {
    const key = shapeToString(shape)
    if (!seen.has(key)) {
      seen.add(key)
      variants.push(shape)
    }
  }

  // Start with base shape
  let current = baseShape
  addVariant(current)

  // Generate 4 rotations
  for (let i = 0; i < 3; i++) {
    current = rotateShape90CW(current)
    addVariant(current)
  }

  // Flip horizontally and generate 4 rotations
  current = flipShapeHorizontal(baseShape)
  addVariant(current)
  for (let i = 0; i < 3; i++) {
    current = rotateShape90CW(current)
    addVariant(current)
  }

  return variants
}

/**
 * Convert a shape to a string representation for comparison
 */
export function shapeToString(shape: PentominoShape): string {
  const sortedCells = [...shape.cells].sort((a, b) => a.y - b.y || a.x - b.x)
  return sortedCells.map(p => `${p.x},${p.y}`).join('|')
}

/**
 * Check if two shapes are identical
 */
export function shapesEqual(a: PentominoShape, b: PentominoShape): boolean {
  return shapeToString(a) === shapeToString(b)
}

/**
 * Get the cells occupied by a piece at a specific position
 */
export function getPieceCells(shape: PentominoShape, position: Point): Point[] {
  return shape.cells.map(cell => addPoints(cell, position))
}

/**
 * Check if a piece can be placed at a position without going out of bounds
 */
export function canPlaceInBounds(
  shape: PentominoShape,
  position: Point,
  boardBounds: Dimensions
): boolean {
  const pieceCells = getPieceCells(shape, position)
  return pieceCells.every(cell => isPointInBounds(cell, boardBounds))
}

/**
 * Calculate the center point of a shape
 */
export function getShapeCenter(shape: PentominoShape): Point {
  if (shape.cells.length === 0) {
    return { x: 0, y: 0 }
  }

  const sumX = shape.cells.reduce((sum, cell) => sum + cell.x, 0)
  const sumY = shape.cells.reduce((sum, cell) => sum + cell.y, 0)

  return {
    x: sumX / shape.cells.length,
    y: sumY / shape.cells.length,
  }
}

/**
 * Get the bounding box of multiple points
 */
export function getBoundingBox(points: Point[]): { min: Point; max: Point; size: Dimensions } {
  if (points.length === 0) {
    return {
      min: { x: 0, y: 0 },
      max: { x: 0, y: 0 },
      size: { width: 0, height: 0 },
    }
  }

  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  return {
    min: { x: minX, y: minY },
    max: { x: maxX, y: maxY },
    size: { width: maxX - minX + 1, height: maxY - minY + 1 },
  }
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Linear interpolation between two points
 */
export function lerpPoint(a: Point, b: Point, t: number): Point {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
  }
}
