import { describe, it, expect } from 'vitest'
import {
  PENTOMINO_DEFINITIONS,
  getPentominoDefinition,
  getAllPentominoTypes,
  getPentominoVariant,
  getPentominoVariantCount,
  createPentominoPiece,
  validatePentominoDefinitions,
  getPentominoStats,
} from '../pentomino-definitions'
import type { PentominoType } from '@/types'

describe('Pentomino Definitions', () => {
  it('should have exactly 12 pentomino types', () => {
    const types = getAllPentominoTypes()
    expect(types).toHaveLength(12)
    expect(types.sort()).toEqual(['F', 'I', 'L', 'N', 'P', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'])
  })

  it('should have valid definitions for all pieces', () => {
    expect(validatePentominoDefinitions()).toBe(true)
  })

  it('should have exactly 5 cells for each piece', () => {
    getAllPentominoTypes().forEach(type => {
      const definition = getPentominoDefinition(type)
      expect(definition.baseShape.cells).toHaveLength(5)
      
      // Check all variants also have 5 cells
      definition.variants.forEach((variant, index) => {
        expect(variant.cells, `${type} variant ${index}`).toHaveLength(5)
      })
    })
  })

  it('should have unique colors for all pieces', () => {
    const colors = new Set()
    getAllPentominoTypes().forEach(type => {
      const definition = getPentominoDefinition(type)
      expect(colors.has(definition.color)).toBe(false)
      colors.add(definition.color)
    })
    expect(colors.size).toBe(12)
  })

  it('should generate valid variants for each piece', () => {
    getAllPentominoTypes().forEach(type => {
      const variantCount = getPentominoVariantCount(type)
      expect(variantCount).toBeGreaterThan(0)
      expect(variantCount).toBeLessThanOrEqual(8) // Max possible unique orientations
      
      // Test getting each variant
      for (let i = 0; i < variantCount; i++) {
        const variant = getPentominoVariant(type, i)
        expect(variant.cells).toHaveLength(5)
        expect(variant.bounds.width).toBeGreaterThan(0)
        expect(variant.bounds.height).toBeGreaterThan(0)
      }
    })
  })

  it('should create valid piece instances', () => {
    getAllPentominoTypes().forEach(type => {
      const piece = createPentominoPiece(type)
      expect(piece.type).toBe(type)
      expect(piece.id).toBeTruthy()
      expect(piece.position).toEqual({ x: 0, y: 0 })
      expect(piece.variantIndex).toBe(0)
      expect(piece.isPlaced).toBe(false)
      expect(piece.isDragging).toBe(false)
      expect(piece.zIndex).toBe(0)
    })
  })

  it('should create piece instances with custom parameters', () => {
    const customId = 'test-piece'
    const customPosition = { x: 5, y: 3 }
    const customVariant = 2
    
    const piece = createPentominoPiece('F', customId, customPosition, customVariant)
    expect(piece.id).toBe(customId)
    expect(piece.position).toEqual(customPosition)
    expect(piece.variantIndex).toBe(customVariant)
  })

  it('should provide correct statistics', () => {
    const stats = getPentominoStats()
    expect(stats.totalPieces).toBe(12)
    expect(stats.totalCells).toBe(60) // 12 pieces × 5 cells each
    expect(stats.totalVariants).toBeGreaterThan(12) // At least one variant per piece
    expect(Object.keys(stats.variantCounts)).toHaveLength(12)
  })

  describe('Individual piece shapes', () => {
    it('should have correct F-piece shape', () => {
      const f = getPentominoDefinition('F')
      const cells = f.baseShape.cells.sort((a, b) => a.y - b.y || a.x - b.x)
      // F-piece:  ⬛⬛
      //          ⬛⬛
      //           ⬛
      expect(cells).toEqual([
        { x: 1, y: 0 }, { x: 2, y: 0 }, // Top row
        { x: 0, y: 1 }, { x: 1, y: 1 }, // Middle row
        { x: 1, y: 2 } // Bottom row
      ])
    })

    it('should have correct I-piece shape', () => {
      const i = getPentominoDefinition('I')
      const cells = i.baseShape.cells.sort((a, b) => a.y - b.y || a.x - b.x)
      // I-piece: ⬛⬛⬛⬛⬛
      expect(cells).toEqual([
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }
      ])
    })

    it('should have correct X-piece shape', () => {
      const x = getPentominoDefinition('X')
      const cells = x.baseShape.cells.sort((a, b) => a.y - b.y || a.x - b.x)
      // X-piece:  ⬛
      //          ⬛⬛⬛
      //           ⬛
      expect(cells).toEqual([
        { x: 1, y: 0 }, // Top
        { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, // Middle
        { x: 1, y: 2 } // Bottom
      ])
    })
  })

  describe('Piece variants', () => {
    it('should generate different variants for asymmetric pieces', () => {
      // F, N, P, Y are fully asymmetric and should have 8 variants
      const fullyAsymmetricPieces: PentominoType[] = ['F', 'N', 'P', 'Y']

      fullyAsymmetricPieces.forEach(type => {
        const variantCount = getPentominoVariantCount(type)
        expect(variantCount, `${type} should have 8 variants`).toBe(8)
      })

      // Z has some symmetry and should have 4 variants
      expect(getPentominoVariantCount('Z')).toBe(4)
    })

    it('should generate correct variants for symmetric pieces', () => {
      // I should have 2 variants (horizontal and vertical)
      expect(getPentominoVariantCount('I')).toBe(2)
      
      // X should have 1 variant (fully symmetric)
      expect(getPentominoVariantCount('X')).toBe(1)
    })

    it('should have normalized variants (starting at 0,0)', () => {
      getAllPentominoTypes().forEach(type => {
        const definition = getPentominoDefinition(type)
        definition.variants.forEach((variant, index) => {
          const minX = Math.min(...variant.cells.map(c => c.x))
          const minY = Math.min(...variant.cells.map(c => c.y))
          expect(minX, `${type} variant ${index} should start at x=0`).toBe(0)
          expect(minY, `${type} variant ${index} should start at y=0`).toBe(0)
        })
      })
    })
  })
})
