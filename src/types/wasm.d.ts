/**
 * Type declarations for WebAssembly modules
 */

declare module '/wasm/pentomino_solver.js' {
  interface PentominoSolverWasm {
    new(): any
    init_board(width: number, height: number, blocked_cells: Array<{x: number, y: number}>): void
    set_config(max_solutions: number, max_time: number): void
    solve(): {
      success: boolean
      solutions_found: number
      steps_explored: number
      solving_time: number
      timeout?: boolean
      error?: string
    }
    get_board(): number[][]
    stop(): void
    get_progress(): {
      steps_explored: number
      solutions_found: number
      time_elapsed: number
    }
  }

  interface PentominoSolverModule {
    PentominoSolver: {
      new(): PentominoSolverWasm
    }
  }

  const factory: () => Promise<PentominoSolverModule>
  export default factory
}

declare module '/wasm/fallback.js' {
  interface FallbackSolver {
    new(): any
    init_board(width: number, height: number, blocked_cells: Array<{x: number, y: number}>): void
    set_config(max_solutions: number, max_time: number): void
    solve(): {
      success: boolean
      solutions_found: number
      steps_explored: number
      solving_time: number
      timeout?: boolean
      error?: string
    }
    get_board(): number[][]
    stop(): void
    get_progress(): {
      steps_explored: number
      solutions_found: number
      time_elapsed: number
    }
  }

  interface FallbackModule {
    PentominoSolver: {
      new(): FallbackSolver
    }
  }

  const factory: () => FallbackModule
  export default factory
}
