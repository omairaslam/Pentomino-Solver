import { useState, useCallback } from 'react'
import { PiecePalette } from './components/PiecePalette'
import { SolverPanel } from './components/SolverPanel'
import { BoardConfigPanel } from './components/BoardConfigPanel'
import { createBoard, placePiece, removePiece } from './utils/board-utils'
import { applySolutionToBoard, clearSolution } from './utils/solution-application'
import { createPentominoPiece, getAllPentominoTypes } from './utils/pentomino-definitions'
import { DEFAULT_PRESET } from './utils/constants'
import { useDragAndDrop } from './hooks/useDragAndDrop'
import { usePieceManipulation } from './hooks/usePieceManipulation'
import type { PentominoPiece, Point, SolverResult, PresetConfig } from './types'
import './styles/App.css'

function App() {
  // Board configuration state
  const [currentPreset, setCurrentPreset] = useState<PresetConfig>(DEFAULT_PRESET)
  const [board, setBoard] = useState(() => createBoard(DEFAULT_PRESET))

  // Create all pentomino pieces
  const [pieces, setPieces] = useState<PentominoPiece[]>(() => {
    return getAllPentominoTypes().map((type) =>
      createPentominoPiece(type, `${type}-piece`, { x: 0, y: 0 })
    )
  })

  const [selectedPieceId, setSelectedPieceId] = useState<string>()
  const [currentSolution, setCurrentSolution] = useState<SolverResult | null>(null)

  // Handle piece updates
  const handlePieceUpdate = useCallback((updatedPiece: PentominoPiece) => {
    setPieces(prev => prev.map(p => p.id === updatedPiece.id ? updatedPiece : p))
  }, [])

  // Handle piece placement
  const handlePiecePlace = useCallback((piece: PentominoPiece, position: Point) => {
    setBoard(prev => {
      const newBoard = { ...prev }
      placePiece(newBoard, piece, position)
      return newBoard
    })
  }, [])

  // Handle piece removal
  const handlePieceRemove = useCallback((piece: PentominoPiece) => {
    setBoard(prev => {
      const newBoard = { ...prev }
      removePiece(newBoard, piece)
      return newBoard
    })
  }, [])

  // Set up piece manipulation
  const pieceManipulation = usePieceManipulation({
    pieces,
    board,
    onPieceUpdate: handlePieceUpdate,
    onPiecePlace: handlePiecePlace,
    onPieceRemove: handlePieceRemove,
  })

  // Set up drag and drop
  const dragAndDrop = useDragAndDrop({
    board,
    pieces,
    onPieceDrop: (piece, position) => {
      pieceManipulation.placePiece(piece, position)
    },
  })

  // Handle piece selection
  const handlePieceSelect = useCallback((piece: PentominoPiece) => {
    setSelectedPieceId(piece.id)
  }, [])

  // Handle piece rotation
  const handlePieceRotate = useCallback((piece: PentominoPiece) => {
    pieceManipulation.rotatePiece(piece, true)
  }, [pieceManipulation])

  // Handle piece flipping
  const handlePieceFlip = useCallback((piece: PentominoPiece) => {
    pieceManipulation.flipPiece(piece, true)
  }, [pieceManipulation])

  // Handle solution application
  const handleSolutionApplied = useCallback((solutionIndex: number) => {
    if (!currentSolution || !currentSolution.solutions[solutionIndex]) {
      console.warn('No solution available to apply')
      return
    }

    const solution = currentSolution.solutions[solutionIndex]
    const result = applySolutionToBoard(board, pieces, solution)

    if (result.success) {
      setPieces(result.updatedPieces)
      console.log(`Successfully applied solution ${solutionIndex + 1}`)
    } else {
      console.error('Failed to apply solution:', result.failedPlacements)
      if (result.error) {
        console.error('Error:', result.error)
      }
    }
  }, [currentSolution, board, pieces])

  // Reset board
  const handleResetBoard = useCallback(() => {
    clearSolution(board, pieces)

    // Update pieces state
    setPieces(prev => prev.map(piece => ({
      ...piece,
      isPlaced: false,
      position: { x: 0, y: 0 },
      zIndex: 0,
    })))

    setSelectedPieceId(undefined)
    setCurrentSolution(null)
  }, [board, pieces])

  // Handle solver completion
  const handleSolverComplete = useCallback((result: SolverResult) => {
    setCurrentSolution(result)
    console.log('Solver completed:', result)
  }, [])

  // Handle board preset change
  const handlePresetChange = useCallback((preset: PresetConfig) => {
    setCurrentPreset(preset)
    const newBoard = createBoard(preset)
    setBoard(newBoard)
    setCurrentSolution(null) // Clear any existing solution

    // Reset all pieces to palette
    setPieces(pieces => pieces.map(piece => ({
      ...piece,
      position: { x: 0, y: 0 },
      isPlaced: false,
      zIndex: 0
    })))

    setSelectedPieceId(undefined)
    console.log('Board preset changed to:', preset.name)
  }, [])

  // Placeholder handlers for future board interaction
  // const handleCellClick = (position: { x: number; y: number }) => {
  //   console.log('Cell clicked:', position)
  // }

  // const handleCellHover = (position: { x: number; y: number } | null) => {
  //   console.log('Cell hovered:', position)
  // }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Pentomino Solver</h1>
        <p>Interactive puzzle solving with step-by-step visualization</p>
      </header>

      <main className="app-main">
        <div className="demo-section">
          <h2>Pentomino Solver - Interactive Demo</h2>
          <p>
            Drag pieces from the palette to the board. Use the controls to rotate and flip pieces.
            The board shows valid drop zones when dragging.
          </p>

          {/* Board Configuration Panel */}
          <BoardConfigPanel
            currentPreset={currentPreset}
            onPresetChange={handlePresetChange}
            className="board-config"
          />

          <div className="game-layout">
            <div className="board-area">
              <div className="board-placeholder">
                <p>Interactive Board (Canvas-based)</p>
                <p>{currentPreset.name} - {currentPreset.width}×{currentPreset.height}</p>
                <div className="placeholder-grid">
                  {Array.from({ length: Math.min(currentPreset.height, 8) }, (_, y) => (
                    <div key={y} className="grid-row">
                      {Array.from({ length: Math.min(currentPreset.width, 8) }, (_, x) => {
                        const isBlocked = currentPreset.blockedCells.some(cell =>
                          cell.x === x && cell.y === y
                        )
                        return (
                          <div
                            key={x}
                            className={`grid-cell ${isBlocked ? 'blocked' : 'empty'}`}
                          />
                        )
                      })}
                    </div>
                  ))}
                  {(currentPreset.width > 8 || currentPreset.height > 8) && (
                    <div className="grid-overflow">
                      <span>Board is larger than preview (showing {Math.min(currentPreset.width, 8)}×{Math.min(currentPreset.height, 8)})</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="board-controls">
                <button className="btn" onClick={handleResetBoard}>
                  🔄 Reset Board
                </button>
              </div>
            </div>

            <div className="side-panels">
              <div className="pieces-area">
                <PiecePalette
                  pieces={pieces}
                  selectedPieceId={selectedPieceId}
                  onPieceSelect={handlePieceSelect}
                  onPieceRotate={handlePieceRotate}
                  onPieceFlip={handlePieceFlip}
                  onDragStart={dragAndDrop.startDrag}
                  onDragEnd={() => dragAndDrop.endDrag()}
                  layout="grid"
                />
              </div>

              <div className="solver-area">
                <SolverPanel
                  board={board}
                  onSolutionApplied={handleSolutionApplied}
                  onSolvingComplete={handleSolverComplete}
                />
              </div>
            </div>
          </div>

          <div className="info-panel">
            <h3>Board Information</h3>
            <ul>
              <li><strong>Size:</strong> {board.config.width}×{board.config.height}</li>
              <li><strong>Empty Cells:</strong> {board.emptyCellCount}</li>
              <li><strong>Blocked Cells:</strong> {board.config.blockedCells.length}</li>
              <li><strong>Configuration:</strong> {board.config.name}</li>
            </ul>

            <h3>Pentomino Pieces</h3>
            <div className="pieces-info">
              {getAllPentominoTypes().map(type => (
                <span key={type} className="piece-badge" style={{ backgroundColor: `var(--piece-${type.toLowerCase()})` }}>
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
