import { useState, useCallback, useRef } from 'react'
import type { 
  Board, 
  SolverConfig, 
  SolverResult, 
  SolverSolution,
  SolverAlgorithm,
  SolverEngine 
} from '../types'
import { SolverFactory, type PentominoSolver } from '../solvers/SolverFactory'
import { performanceMonitor } from '../utils/performance'

interface UseSolverProps {
  onSolutionFound?: (solution: SolverSolution) => void
  onSolvingComplete?: (result: SolverResult) => void
  onProgress?: (progress: { stepsExplored: number; solutionsFound: number; timeElapsed: number }) => void
}

export function useSolver({
  onSolutionFound,
  onSolvingComplete,
  onProgress,
}: UseSolverProps = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SolverResult | null>(null)
  const [config, setConfig] = useState<SolverConfig>(() => SolverFactory.getDefaultConfig())
  const [progress, setProgress] = useState<{
    stepsExplored: number
    solutionsFound: number
    timeElapsed: number
  }>({ stepsExplored: 0, solutionsFound: 0, timeElapsed: 0 })

  const solverRef = useRef<PentominoSolver | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Start solving
  const solve = useCallback(async (board: Board, solverConfig?: Partial<SolverConfig>) => {
    if (isLoading) {
      console.warn('Solver is already running')
      return
    }

    const finalConfig = { ...config, ...solverConfig }
    
    // Validate configuration
    const errors = SolverFactory.validateConfig(finalConfig)
    if (errors.length > 0) {
      throw new Error(`Invalid solver configuration: ${errors.join(', ')}`)
    }

    setIsLoading(true)
    setResult(null)
    setProgress({ stepsExplored: 0, solutionsFound: 0, timeElapsed: 0 })

    try {
      // Create solver instance
      solverRef.current = SolverFactory.createSolver(finalConfig)

      // Start performance monitoring
      const boardConfigStr = `${board.config.width}x${board.config.height}`
      performanceMonitor.startBenchmark(boardConfigStr, finalConfig.algorithm)

      // Start progress tracking
      progressIntervalRef.current = setInterval(() => {
        if (solverRef.current) {
          const currentProgress = solverRef.current.getProgress()
          setProgress(currentProgress)
          onProgress?.(currentProgress)
        }
      }, 100) // Update every 100ms

      // Solve the puzzle
      const solverResult = await solverRef.current.solve(board)

      // End performance monitoring
      performanceMonitor.endBenchmark(
        solverResult.stepsExplored,
        solverResult.solutions.length
      )

      // Notify about solutions found
      if (solverResult.solutions.length > 0) {
        solverResult.solutions.forEach((solution: SolverSolution) => {
          onSolutionFound?.(solution)
        })
      }

      setResult(solverResult)
      onSolvingComplete?.(solverResult)

      return solverResult
    } catch (error) {
      const errorResult: SolverResult = {
        success: false,
        solutions: [],
        totalTime: 0,
        stepsExplored: progress.stepsExplored,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
      
      setResult(errorResult)
      onSolvingComplete?.(errorResult)
      throw error
    } finally {
      setIsLoading(false)
      solverRef.current = null
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [isLoading, config, progress.stepsExplored, onSolutionFound, onSolvingComplete, onProgress])

  // Stop solving
  const stop = useCallback(() => {
    if (solverRef.current) {
      solverRef.current.stop()
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    
    setIsLoading(false)
  }, [])

  // Update solver configuration
  const updateConfig = useCallback((newConfig: Partial<SolverConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  // Set algorithm
  const setAlgorithm = useCallback((algorithm: SolverAlgorithm) => {
    updateConfig({ algorithm })
  }, [updateConfig])

  // Set engine
  const setEngine = useCallback((engine: SolverEngine) => {
    updateConfig({ engine })
  }, [updateConfig])

  // Set max time
  const setMaxTime = useCallback((maxTime: number) => {
    updateConfig({ maxTime })
  }, [updateConfig])

  // Set max solutions
  const setMaxSolutions = useCallback((maxSolutions: number) => {
    updateConfig({ maxSolutions })
  }, [updateConfig])

  // Toggle step tracking
  const setTrackSteps = useCallback((trackSteps: boolean) => {
    updateConfig({ trackSteps })
  }, [updateConfig])

  // Reset to default configuration
  const resetConfig = useCallback(() => {
    setConfig(SolverFactory.getDefaultConfig())
  }, [])

  // Load recommended configuration
  const loadRecommendedConfig = useCallback((useCase: 'educational' | 'performance' | 'visualization') => {
    setConfig(SolverFactory.getRecommendedConfig(useCase))
  }, [])

  // Get available options
  const availableAlgorithms = SolverFactory.getAvailableAlgorithms()
  const availableEngines = SolverFactory.getAvailableEngines()

  // Get descriptions
  const getAlgorithmDescription = useCallback((algorithm: SolverAlgorithm) => {
    return SolverFactory.getAlgorithmDescription(algorithm)
  }, [])

  const getEngineDescription = useCallback((engine: SolverEngine) => {
    return SolverFactory.getEngineDescription(engine)
  }, [])

  return {
    // State
    isLoading,
    result,
    config,
    progress,
    
    // Actions
    solve,
    stop,
    updateConfig,
    setAlgorithm,
    setEngine,
    setMaxTime,
    setMaxSolutions,
    setTrackSteps,
    resetConfig,
    loadRecommendedConfig,
    
    // Available options
    availableAlgorithms,
    availableEngines,
    
    // Descriptions
    getAlgorithmDescription,
    getEngineDescription,
  }
}
