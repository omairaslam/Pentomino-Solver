/**
 * WebAssembly fallback module
 * Provides a graceful fallback when the real WASM module is not available
 */

// Create a mock module that matches the WASM interface
const createFallbackModule = () => {
  console.warn('WebAssembly module not available, using fallback implementation')
  
  return {
    PentominoSolver: class {
      constructor() {
        this.board = null
        this.config = { maxSolutions: 1, maxTime: 30000 }
        this.startTime = 0
      }
      
      init_board(width, height, blocked_cells) {
        this.board = {
          width,
          height,
          blocked_cells: blocked_cells || []
        }
      }
      
      set_config(max_solutions, max_time) {
        this.config = { maxSolutions: max_solutions, maxTime: max_time }
      }
      
      solve() {
        this.startTime = Date.now()
        
        // Simulate quick failure for fallback
        return {
          success: false,
          solutions_found: 0,
          steps_explored: 0,
          solving_time: Date.now() - this.startTime,
          error: 'WebAssembly module not available. Please use JavaScript engine for full functionality.'
        }
      }
      
      get_board() {
        return []
      }
      
      stop() {
        // No-op for fallback
      }
      
      get_progress() {
        return {
          steps_explored: 0,
          solutions_found: 0,
          time_elapsed: Date.now() - this.startTime
        }
      }
    }
  }
}

// Export as ES6 module
export default createFallbackModule
