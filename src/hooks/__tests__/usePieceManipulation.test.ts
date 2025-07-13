import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePieceManipulation } from '../usePieceManipulation'
import { createBoard } from '../../utils/board-utils'
import { createPentominoPiece } from '../../utils/pentomino-definitions'
import type { BoardConfig, PentominoPiece } from '../../types'

describe('usePieceManipulation', () => {
  const testBoardConfig: BoardConfig = {
    name: 'Test Board',
    description: 'Test board for manipulation',
    width: 6,
    height: 6,
    blockedCells: [],
  }

  const mockOnPieceUpdate = vi.fn()
  const mockOnPiecePlace = vi.fn()
  const mockOnPieceRemove = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should rotate a piece clockwise', () => {
    const board = createBoard(testBoardConfig)
    const piece = createPentominoPiece('F', 'test-f', { x: 0, y: 0 }, 0)
    const pieces = [piece]

    const { result } = renderHook(() =>
      usePieceManipulation({
        pieces,
        board,
        onPieceUpdate: mockOnPieceUpdate,
        onPiecePlace: mockOnPiecePlace,
        onPieceRemove: mockOnPieceRemove,
      })
    )

    act(() => {
      result.current.rotatePiece(piece, true)
    })

    expect(mockOnPieceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: piece.id,
        variantIndex: 1, // Should increment from 0 to 1
      })
    )
  })

  it('should rotate a piece counter-clockwise', () => {
    const board = createBoard(testBoardConfig)
    const piece = createPentominoPiece('F', 'test-f', { x: 0, y: 0 }, 2)
    const pieces = [piece]

    const { result } = renderHook(() =>
      usePieceManipulation({
        pieces,
        board,
        onPieceUpdate: mockOnPieceUpdate,
        onPiecePlace: mockOnPiecePlace,
        onPieceRemove: mockOnPieceRemove,
      })
    )

    act(() => {
      result.current.rotatePiece(piece, false)
    })

    expect(mockOnPieceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: piece.id,
        variantIndex: 1, // Should decrement from 2 to 1
      })
    )
  })

  it('should flip a piece horizontally', () => {
    const board = createBoard(testBoardConfig)
    const piece = createPentominoPiece('F', 'test-f', { x: 0, y: 0 }, 0)
    const pieces = [piece]

    const { result } = renderHook(() =>
      usePieceManipulation({
        pieces,
        board,
        onPieceUpdate: mockOnPieceUpdate,
        onPiecePlace: mockOnPiecePlace,
        onPieceRemove: mockOnPieceRemove,
      })
    )

    act(() => {
      result.current.flipPiece(piece, true)
    })

    expect(mockOnPieceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: piece.id,
        variantIndex: expect.any(Number),
      })
    )
  })

  it('should place a piece at a valid position', () => {
    const board = createBoard(testBoardConfig)
    const piece = createPentominoPiece('I', 'test-i', { x: 0, y: 0 }, 0)
    const pieces = [piece]

    const { result } = renderHook(() =>
      usePieceManipulation({
        pieces,
        board,
        onPieceUpdate: mockOnPieceUpdate,
        onPiecePlace: mockOnPiecePlace,
        onPieceRemove: mockOnPieceRemove,
      })
    )

    const position = { x: 0, y: 0 }

    act(() => {
      const success = result.current.placePiece(piece, position)
      expect(success).toBe(true)
    })

    expect(mockOnPiecePlace).toHaveBeenCalledWith(
      expect.objectContaining({
        id: piece.id,
        position,
        isPlaced: true,
      }),
      position
    )
    expect(mockOnPieceUpdate).toHaveBeenCalled()
  })

  it('should not place a piece at an invalid position', () => {
    const board = createBoard(testBoardConfig)
    const piece = createPentominoPiece('I', 'test-i', { x: 0, y: 0 }, 0)
    const pieces = [piece]

    const { result } = renderHook(() =>
      usePieceManipulation({
        pieces,
        board,
        onPieceUpdate: mockOnPieceUpdate,
        onPiecePlace: mockOnPiecePlace,
        onPieceRemove: mockOnPieceRemove,
      })
    )

    // Try to place I-piece (5 cells wide) at position that would go out of bounds
    const invalidPosition = { x: 3, y: 0 }

    act(() => {
      const success = result.current.placePiece(piece, invalidPosition)
      expect(success).toBe(false)
    })

    expect(mockOnPiecePlace).not.toHaveBeenCalled()
    expect(mockOnPieceUpdate).not.toHaveBeenCalled()
  })

  it('should remove a placed piece', () => {
    const board = createBoard(testBoardConfig)
    const piece: PentominoPiece = {
      ...createPentominoPiece('I', 'test-i', { x: 0, y: 0 }, 0),
      isPlaced: true,
    }
    const pieces = [piece]

    const { result } = renderHook(() =>
      usePieceManipulation({
        pieces,
        board,
        onPieceUpdate: mockOnPieceUpdate,
        onPiecePlace: mockOnPiecePlace,
        onPieceRemove: mockOnPieceRemove,
      })
    )

    act(() => {
      const success = result.current.removePiece(piece)
      expect(success).toBe(true)
    })

    expect(mockOnPieceRemove).toHaveBeenCalledWith(piece)
    expect(mockOnPieceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: piece.id,
        isPlaced: false,
        position: { x: 0, y: 0 },
        zIndex: 0,
      })
    )
  })

  it('should get valid positions for a piece', () => {
    const board = createBoard(testBoardConfig)
    const piece = createPentominoPiece('I', 'test-i', { x: 0, y: 0 }, 0)
    const pieces = [piece]

    const { result } = renderHook(() =>
      usePieceManipulation({
        pieces,
        board,
        onPieceUpdate: mockOnPieceUpdate,
        onPiecePlace: mockOnPiecePlace,
        onPieceRemove: mockOnPieceRemove,
      })
    )

    const validPositions = result.current.getValidPositions(piece)

    // I-piece (5 cells wide) should have valid positions
    expect(validPositions.length).toBeGreaterThan(0)
    
    // Should include position (0,0)
    expect(validPositions).toContainEqual({ x: 0, y: 0 })
    
    // Should not include positions that would go out of bounds
    expect(validPositions).not.toContainEqual({ x: 2, y: 0 })
  })

  it('should snap to the nearest valid position', () => {
    const board = createBoard(testBoardConfig)
    const piece = createPentominoPiece('I', 'test-i', { x: 0, y: 0 }, 0)
    const pieces = [piece]

    const { result } = renderHook(() =>
      usePieceManipulation({
        pieces,
        board,
        onPieceUpdate: mockOnPieceUpdate,
        onPiecePlace: mockOnPiecePlace,
        onPieceRemove: mockOnPieceRemove,
      })
    )

    // Try to snap to a position close to a valid position
    const approximatePosition = { x: 0.7, y: 0.3 }
    const snappedPosition = result.current.snapToGrid(piece, approximatePosition)

    // Should snap to the nearest valid position (could be (0,0) or (1,0) depending on valid positions)
    expect(snappedPosition).toBeTruthy()
    expect(snappedPosition!.x).toBeGreaterThanOrEqual(0)
    expect(snappedPosition!.y).toBeGreaterThanOrEqual(0)
  })

  it('should return null when snapping to a position too far from valid positions', () => {
    const board = createBoard(testBoardConfig)
    const piece = createPentominoPiece('I', 'test-i', { x: 0, y: 0 }, 0)
    const pieces = [piece]

    const { result } = renderHook(() =>
      usePieceManipulation({
        pieces,
        board,
        onPieceUpdate: mockOnPieceUpdate,
        onPiecePlace: mockOnPiecePlace,
        onPieceRemove: mockOnPieceRemove,
      })
    )

    // Try to snap to a position far from any valid position
    const farPosition = { x: 10, y: 10 }
    const snappedPosition = result.current.snapToGrid(piece, farPosition)

    expect(snappedPosition).toBeNull()
  })
})
