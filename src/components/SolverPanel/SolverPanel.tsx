import React, { useState } from 'react'
import type { Board, SolverAlgorithm, SolverEngine } from '../../types'
import { useSolver } from '../../hooks/useSolver'
import './SolverPanel.css'

interface SolverPanelProps {
  board: Board
  onSolutionApplied?: (solutionIndex: number) => void
  className?: string
}

export const SolverPanel: React.FC<SolverPanelProps> = ({
  board,
  onSolutionApplied,
  className = '',
}) => {
  const [selectedSolutionIndex, setSelectedSolutionIndex] = useState(0)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const {
    isLoading,
    result,
    config,
    progress,
    solve,
    stop,
    setAlgorithm,
    setEngine,
    setMaxTime,
    setMaxSolutions,
    setTrackSteps,
    loadRecommendedConfig,
    availableAlgorithms,
    availableEngines,
    getAlgorithmDescription,
    getEngineDescription,
  } = useSolver({
    onSolutionFound: (solution) => {
      console.log('Solution found:', solution)
    },
    onSolvingComplete: (solverResult) => {
      console.log('Solving complete:', solverResult)
    },
  })

  const handleSolve = async () => {
    try {
      await solve(board)
    } catch (error) {
      console.error('Solving failed:', error)
    }
  }

  const handleApplySolution = () => {
    if (result?.solutions && result.solutions.length > 0) {
      onSolutionApplied?.(selectedSolutionIndex)
    }
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className={`solver-panel ${className}`}>
      <div className="solver-header">
        <h3>Solver</h3>
        <div className="solver-status">
          {isLoading && <span className="status-indicator loading">Solving...</span>}
          {result?.success && <span className="status-indicator success">Complete</span>}
          {result?.success === false && <span className="status-indicator error">Failed</span>}
        </div>
      </div>

      <div className="solver-controls">
        <div className="control-group">
          <label htmlFor="algorithm-select">Algorithm:</label>
          <select
            id="algorithm-select"
            value={config.algorithm}
            onChange={(e) => setAlgorithm(e.target.value as SolverAlgorithm)}
            disabled={isLoading}
          >
            {availableAlgorithms.map(algorithm => (
              <option key={algorithm} value={algorithm}>
                {algorithm === 'backtracking' ? 'Backtracking' : 'Dancing Links'}
              </option>
            ))}
          </select>
          <div className="control-description">
            {getAlgorithmDescription(config.algorithm)}
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="engine-select">Engine:</label>
          <select
            id="engine-select"
            value={config.engine}
            onChange={(e) => setEngine(e.target.value as SolverEngine)}
            disabled={isLoading}
          >
            {availableEngines.map(engine => (
              <option key={engine} value={engine}>
                {engine === 'javascript' ? 'JavaScript' : 'WebAssembly'}
              </option>
            ))}
          </select>
          <div className="control-description">
            {getEngineDescription(config.engine)}
          </div>
        </div>

        <div className="preset-buttons">
          <button
            className="btn btn-sm"
            onClick={() => loadRecommendedConfig('educational')}
            disabled={isLoading}
          >
            Educational
          </button>
          <button
            className="btn btn-sm"
            onClick={() => loadRecommendedConfig('performance')}
            disabled={isLoading}
          >
            Performance
          </button>
          <button
            className="btn btn-sm"
            onClick={() => loadRecommendedConfig('visualization')}
            disabled={isLoading}
          >
            Visualization
          </button>
        </div>

        <button
          className="advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
          type="button"
        >
          {showAdvanced ? '▼' : '▶'} Advanced Settings
        </button>

        {showAdvanced && (
          <div className="advanced-settings">
            <div className="control-group">
              <label htmlFor="max-time">Max Time (seconds):</label>
              <input
                id="max-time"
                type="number"
                min="1"
                max="300"
                value={config.maxTime ? config.maxTime / 1000 : 30}
                onChange={(e) => setMaxTime(parseInt(e.target.value) * 1000)}
                disabled={isLoading}
              />
            </div>

            <div className="control-group">
              <label htmlFor="max-solutions">Max Solutions:</label>
              <input
                id="max-solutions"
                type="number"
                min="1"
                max="1000"
                value={config.maxSolutions || 10}
                onChange={(e) => setMaxSolutions(parseInt(e.target.value))}
                disabled={isLoading}
              />
            </div>

            <div className="control-group">
              <label>
                <input
                  type="checkbox"
                  checked={config.trackSteps}
                  onChange={(e) => setTrackSteps(e.target.checked)}
                  disabled={isLoading}
                />
                Track steps for visualization
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="solver-actions">
        {!isLoading ? (
          <button className="btn btn-primary solve-btn" onClick={handleSolve}>
            🧩 Solve Puzzle
          </button>
        ) : (
          <button className="btn btn-secondary solve-btn" onClick={stop}>
            ⏹️ Stop Solving
          </button>
        )}
      </div>

      {isLoading && (
        <div className="solver-progress">
          <div className="progress-stats">
            <div>Steps: {progress.stepsExplored.toLocaleString()}</div>
            <div>Solutions: {progress.solutionsFound}</div>
            <div>Time: {formatTime(progress.timeElapsed)}</div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '100%' }}></div>
          </div>
        </div>
      )}

      {result && (
        <div className="solver-results">
          <div className="results-summary">
            <h4>Results</h4>
            <div className="summary-stats">
              <div>✅ Success: {result.success ? 'Yes' : 'No'}</div>
              <div>🔍 Solutions: {result.solutions.length}</div>
              <div>⏱️ Time: {formatTime(result.totalTime)}</div>
              <div>👣 Steps: {result.stepsExplored.toLocaleString()}</div>
            </div>
          </div>

          {result.error && (
            <div className="error-message">
              ❌ Error: {result.error}
            </div>
          )}

          {result.solutions.length > 0 && (
            <div className="solutions-list">
              <div className="solution-selector">
                <label htmlFor="solution-select">Solution:</label>
                <select
                  id="solution-select"
                  value={selectedSolutionIndex}
                  onChange={(e) => setSelectedSolutionIndex(parseInt(e.target.value))}
                >
                  {result.solutions.map((_, index) => (
                    <option key={index} value={index}>
                      Solution {index + 1}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-sm apply-btn"
                  onClick={handleApplySolution}
                >
                  Apply to Board
                </button>
              </div>

              {result.solutions[selectedSolutionIndex] && (
                <div className="solution-details">
                  <div>Pieces: {result.solutions[selectedSolutionIndex].placements.length}</div>
                  <div>Solve time: {formatTime(result.solutions[selectedSolutionIndex].solvingTime)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
