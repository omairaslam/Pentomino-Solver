import type { SolverConfig, SolverAlgorithm, SolverEngine } from '../types'
import { BacktrackingSolver } from './BacktrackingSolver'
import { DancingLinksSolver } from './DancingLinksSolver'
import { WebAssemblySolver } from './WebAssemblySolver'

/**
 * Interface for all solvers
 */
export interface PentominoSolver {
  solve(board: any): Promise<any>
  stop(): void
  getProgress(): {
    stepsExplored: number
    solutionsFound: number
    timeElapsed: number
  }
}

/**
 * Factory for creating pentomino solvers
 */
export class SolverFactory {
  /**
   * Create a solver instance based on configuration
   */
  static createSolver(config: SolverConfig): PentominoSolver {
    if (config.engine === 'webassembly') {
      // Check if WebAssembly is supported
      if (!WebAssemblySolver.isSupported()) {
        throw new Error('WebAssembly not supported in this environment. Please use JavaScript engine.')
      }

      // For now, WebAssembly solver is a prototype
      // In production, this would create optimized WASM-based solvers
      switch (config.algorithm) {
        case 'backtracking':
        case 'dancing-links':
          return new WebAssemblySolver(config)
        default:
          throw new Error(`WebAssembly implementation not available for algorithm: ${config.algorithm}`)
      }
    }

    // JavaScript engine implementations
    switch (config.algorithm) {
      case 'backtracking':
        return new BacktrackingSolver(config)

      case 'dancing-links':
        return new DancingLinksSolver(config)

      default:
        throw new Error(`Unknown algorithm: ${config.algorithm}`)
    }
  }

  /**
   * Get available algorithms
   */
  static getAvailableAlgorithms(): SolverAlgorithm[] {
    return ['backtracking', 'dancing-links']
  }

  /**
   * Get available engines
   */
  static getAvailableEngines(): SolverEngine[] {
    const engines: SolverEngine[] = ['javascript']

    // Add WebAssembly if supported
    if (WebAssemblySolver.isSupported()) {
      engines.push('webassembly')
    }

    return engines
  }

  /**
   * Get default solver configuration
   */
  static getDefaultConfig(): SolverConfig {
    return {
      algorithm: 'backtracking',
      engine: 'javascript',
      maxTime: 30000, // 30 seconds
      maxSolutions: 10,
      trackSteps: true,
    }
  }

  /**
   * Validate solver configuration
   */
  static validateConfig(config: SolverConfig): string[] {
    const errors: string[] = []

    if (!this.getAvailableAlgorithms().includes(config.algorithm)) {
      errors.push(`Invalid algorithm: ${config.algorithm}`)
    }

    if (!this.getAvailableEngines().includes(config.engine)) {
      errors.push(`Invalid engine: ${config.engine}`)
    }

    if (config.maxTime && config.maxTime <= 0) {
      errors.push('maxTime must be positive')
    }

    if (config.maxSolutions && config.maxSolutions <= 0) {
      errors.push('maxSolutions must be positive')
    }

    return errors
  }

  /**
   * Get algorithm description
   */
  static getAlgorithmDescription(algorithm: SolverAlgorithm): string {
    switch (algorithm) {
      case 'backtracking':
        return 'Recursive backtracking algorithm. Tries all possible piece placements systematically. Good for educational purposes and step-by-step visualization.'
      
      case 'dancing-links':
        return 'Knuth\'s Algorithm X with Dancing Links. Highly optimized for exact cover problems. Faster than backtracking but less intuitive for visualization.'
      
      default:
        return 'Unknown algorithm'
    }
  }

  /**
   * Get engine description
   */
  static getEngineDescription(engine: SolverEngine): string {
    switch (engine) {
      case 'javascript':
        return 'Pure JavaScript implementation. Good compatibility and debugging capabilities.'

      case 'webassembly':
        if (WebAssemblySolver.isSupported()) {
          return 'High-performance solver with WebAssembly-compatible optimizations. Significantly faster than standard JavaScript.'
        } else {
          return 'WebAssembly not supported in this environment. Please use a modern browser.'
        }

      default:
        return 'Unknown engine'
    }
  }

  /**
   * Get recommended configuration for different use cases
   */
  static getRecommendedConfig(useCase: 'educational' | 'performance' | 'visualization'): SolverConfig {
    const base = this.getDefaultConfig()

    switch (useCase) {
      case 'educational':
        return {
          ...base,
          algorithm: 'backtracking',
          engine: 'javascript',
          maxTime: 60000, // 1 minute
          maxSolutions: 5,
          trackSteps: true,
        }

      case 'performance':
        return {
          ...base,
          algorithm: 'dancing-links',
          engine: WebAssemblySolver.isSupported() ? 'webassembly' : 'javascript',
          maxTime: 10000, // 10 seconds
          maxSolutions: 100,
          trackSteps: false,
        }

      case 'visualization':
        return {
          ...base,
          algorithm: 'backtracking',
          engine: 'javascript',
          maxTime: 30000, // 30 seconds
          maxSolutions: 1,
          trackSteps: true,
        }

      default:
        return base
    }
  }
}
