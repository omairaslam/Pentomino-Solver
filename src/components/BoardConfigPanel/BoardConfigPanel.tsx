import React from 'react'
import type { PresetConfig } from '../../types'
import { BOARD_PRESETS } from '../../utils/constants'
import './BoardConfigPanel.css'

interface BoardConfigPanelProps {
  currentPreset: PresetConfig
  onPresetChange: (preset: PresetConfig) => void
  className?: string
}

export const BoardConfigPanel: React.FC<BoardConfigPanelProps> = ({
  currentPreset,
  onPresetChange,
  className = '',
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#22c55e'
      case 'medium': return '#f59e0b'
      case 'hard': return '#ef4444'
      case 'expert': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '🟢'
      case 'medium': return '🟡'
      case 'hard': return '🔴'
      case 'expert': return '🟣'
      default: return '⚪'
    }
  }

  return (
    <div className={`board-config-panel ${className}`}>
      <div className="config-header">
        <h3>Board Configuration</h3>
        <div className="current-board-info">
          <span className="board-size">{currentPreset.width}×{currentPreset.height}</span>
          <span 
            className="difficulty-badge"
            style={{ color: getDifficultyColor(currentPreset.difficulty || 'medium') }}
          >
            {getDifficultyIcon(currentPreset.difficulty || 'medium')} {currentPreset.difficulty || 'medium'}
          </span>
        </div>
      </div>

      <div className="preset-grid">
        {BOARD_PRESETS.map((preset) => (
          <button
            key={preset.id}
            className={`preset-card ${currentPreset.id === preset.id ? 'active' : ''}`}
            onClick={() => onPresetChange(preset)}
          >
            <div className="preset-header">
              <h4>{preset.name}</h4>
              <div className="preset-meta">
                <span className="preset-size">{preset.width}×{preset.height}</span>
                <span 
                  className="preset-difficulty"
                  style={{ color: getDifficultyColor(preset.difficulty || 'medium') }}
                >
                  {getDifficultyIcon(preset.difficulty || 'medium')}
                </span>
              </div>
            </div>
            
            <p className="preset-description">{preset.description}</p>
            
            <div className="preset-stats">
              <div className="stat">
                <span className="stat-label">Empty Cells:</span>
                <span className="stat-value">
                  {preset.width * preset.height - preset.blockedCells.length}
                </span>
              </div>
              {preset.solutionCount && (
                <div className="stat">
                  <span className="stat-label">Known Solutions:</span>
                  <span className="stat-value">{preset.solutionCount.toLocaleString()}</span>
                </div>
              )}
              {preset.blockedCells.length > 0 && (
                <div className="stat">
                  <span className="stat-label">Blocked Cells:</span>
                  <span className="stat-value">{preset.blockedCells.length}</span>
                </div>
              )}
            </div>

            {/* Visual preview of the board */}
            <div className="preset-preview">
              <div 
                className="preview-grid"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(preset.width, 8)}, 1fr)`,
                  gridTemplateRows: `repeat(${Math.min(preset.height, 8)}, 1fr)`
                }}
              >
                {Array.from({ length: Math.min(preset.width * preset.height, 64) }, (_, i) => {
                  const x = i % Math.min(preset.width, 8)
                  const y = Math.floor(i / Math.min(preset.width, 8))
                  const isBlocked = preset.blockedCells.some(cell => 
                    cell.x === x && cell.y === y
                  )
                  return (
                    <div
                      key={i}
                      className={`preview-cell ${isBlocked ? 'blocked' : 'empty'}`}
                    />
                  )
                })}
              </div>
              {(preset.width > 8 || preset.height > 8) && (
                <div className="preview-overflow">
                  <span>...</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="config-info">
        <h4>Current Board: {currentPreset.name}</h4>
        <div className="board-details">
          <div className="detail-item">
            <span className="detail-label">Size:</span>
            <span className="detail-value">{currentPreset.width} × {currentPreset.height}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Total Cells:</span>
            <span className="detail-value">{currentPreset.width * currentPreset.height}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Empty Cells:</span>
            <span className="detail-value">
              {currentPreset.width * currentPreset.height - currentPreset.blockedCells.length}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Pentomino Cells:</span>
            <span className="detail-value">60 (12 pieces × 5 cells)</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Valid for Pentominos:</span>
            <span className={`detail-value ${
              currentPreset.width * currentPreset.height - currentPreset.blockedCells.length === 60 
                ? 'valid' : 'invalid'
            }`}>
              {currentPreset.width * currentPreset.height - currentPreset.blockedCells.length === 60 
                ? '✅ Yes' : '❌ No'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
