/**
 * Performance monitoring utilities for the pentomino solver
 */

export interface PerformanceMetrics {
  totalTime: number
  stepsExplored: number
  solutionsFound: number
  cacheHits: number
  cacheMisses: number
  averageStepsPerSolution: number
  stepsPerSecond: number
  memoryUsage?: number
}

export interface BenchmarkResult {
  boardConfig: string
  algorithm: string
  metrics: PerformanceMetrics
  timestamp: number
}

/**
 * Performance monitor for tracking solver performance
 */
export class PerformanceMonitor {
  private benchmarks: BenchmarkResult[] = []
  private currentBenchmark: Partial<BenchmarkResult> | null = null
  private startTime: number = 0
  private startMemory: number = 0

  /**
   * Start monitoring a solver run
   */
  startBenchmark(boardConfig: string, algorithm: string): void {
    this.startTime = performance.now()
    this.startMemory = this.getMemoryUsage()
    
    this.currentBenchmark = {
      boardConfig,
      algorithm,
      timestamp: Date.now(),
    }
  }

  /**
   * End monitoring and record results
   */
  endBenchmark(
    stepsExplored: number,
    solutionsFound: number,
    cacheHits: number = 0,
    cacheMisses: number = 0
  ): BenchmarkResult | null {
    if (!this.currentBenchmark) {
      console.warn('No benchmark in progress')
      return null
    }

    const totalTime = performance.now() - this.startTime
    const endMemory = this.getMemoryUsage()
    
    const metrics: PerformanceMetrics = {
      totalTime,
      stepsExplored,
      solutionsFound,
      cacheHits,
      cacheMisses,
      averageStepsPerSolution: solutionsFound > 0 ? stepsExplored / solutionsFound : 0,
      stepsPerSecond: totalTime > 0 ? (stepsExplored / totalTime) * 1000 : 0,
      memoryUsage: endMemory - this.startMemory,
    }

    const result: BenchmarkResult = {
      ...this.currentBenchmark as Required<Omit<BenchmarkResult, 'metrics'>>,
      metrics,
    }

    this.benchmarks.push(result)
    this.currentBenchmark = null

    return result
  }

  /**
   * Get memory usage (if available)
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize || 0
    }
    return 0
  }

  /**
   * Get all benchmark results
   */
  getBenchmarks(): BenchmarkResult[] {
    return [...this.benchmarks]
  }

  /**
   * Get benchmark results for a specific algorithm
   */
  getBenchmarksForAlgorithm(algorithm: string): BenchmarkResult[] {
    return this.benchmarks.filter(b => b.algorithm === algorithm)
  }

  /**
   * Get performance statistics for an algorithm
   */
  getAlgorithmStats(algorithm: string): {
    totalRuns: number
    averageTime: number
    averageStepsPerSecond: number
    successRate: number
    bestTime: number
    worstTime: number
  } {
    const results = this.getBenchmarksForAlgorithm(algorithm)
    
    if (results.length === 0) {
      return {
        totalRuns: 0,
        averageTime: 0,
        averageStepsPerSecond: 0,
        successRate: 0,
        bestTime: 0,
        worstTime: 0,
      }
    }

    const times = results.map(r => r.metrics.totalTime)
    const stepsPerSecond = results.map(r => r.metrics.stepsPerSecond)
    const successfulRuns = results.filter(r => r.metrics.solutionsFound > 0).length

    return {
      totalRuns: results.length,
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      averageStepsPerSecond: stepsPerSecond.reduce((a, b) => a + b, 0) / stepsPerSecond.length,
      successRate: successfulRuns / results.length,
      bestTime: Math.min(...times),
      worstTime: Math.max(...times),
    }
  }

  /**
   * Compare performance between algorithms
   */
  compareAlgorithms(algorithm1: string, algorithm2: string): {
    algorithm1: string
    algorithm2: string
    timeRatio: number // algorithm1 / algorithm2
    stepsRatio: number
    successRateComparison: string
  } {
    const stats1 = this.getAlgorithmStats(algorithm1)
    const stats2 = this.getAlgorithmStats(algorithm2)

    return {
      algorithm1,
      algorithm2,
      timeRatio: stats2.averageTime > 0 ? stats1.averageTime / stats2.averageTime : 0,
      stepsRatio: stats2.averageStepsPerSecond > 0 ? stats1.averageStepsPerSecond / stats2.averageStepsPerSecond : 0,
      successRateComparison: stats1.successRate > stats2.successRate ? 'better' : 
                           stats1.successRate < stats2.successRate ? 'worse' : 'equal',
    }
  }

  /**
   * Export benchmark data as JSON
   */
  exportData(): string {
    return JSON.stringify({
      benchmarks: this.benchmarks,
      exportTime: Date.now(),
      version: '1.0.0',
    }, null, 2)
  }

  /**
   * Import benchmark data from JSON
   */
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      if (data.benchmarks && Array.isArray(data.benchmarks)) {
        this.benchmarks = data.benchmarks
        return true
      }
    } catch (error) {
      console.error('Failed to import benchmark data:', error)
    }
    return false
  }

  /**
   * Clear all benchmark data
   */
  clear(): void {
    this.benchmarks = []
    this.currentBenchmark = null
  }

  /**
   * Get a summary of recent performance
   */
  getRecentSummary(hours: number = 24): {
    totalRuns: number
    algorithms: string[]
    averageTime: number
    totalSolutions: number
  } {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000)
    const recent = this.benchmarks.filter(b => b.timestamp > cutoff)

    const algorithms = [...new Set(recent.map(b => b.algorithm))]
    const totalTime = recent.reduce((sum, b) => sum + b.metrics.totalTime, 0)
    const totalSolutions = recent.reduce((sum, b) => sum + b.metrics.solutionsFound, 0)

    return {
      totalRuns: recent.length,
      algorithms,
      averageTime: recent.length > 0 ? totalTime / recent.length : 0,
      totalSolutions,
    }
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor()

/**
 * Utility function to format time in human-readable format
 */
export function formatTime(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)}ms`
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`
  } else {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }
}

/**
 * Utility function to format large numbers
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  } else {
    return num.toString()
  }
}
