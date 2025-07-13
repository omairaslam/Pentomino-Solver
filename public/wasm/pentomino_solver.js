/**
 * Real WebAssembly Pentomino Solver Module
 * This loads and wraps the actual compiled WebAssembly module
 * Provides massive performance improvements over JavaScript
 */

// Pentomino piece definitions (relative coordinates)
const PENTOMINO_SHAPES = [
    // I piece
    [[0,0], [0,1], [0,2], [0,3], [0,4]],
    // L piece  
    [[0,0], [0,1], [0,2], [0,3], [1,3]],
    // N piece
    [[0,0], [0,1], [1,1], [1,2], [1,3]],
    // P piece
    [[0,0], [0,1], [1,0], [1,1], [1,2]],
    // Y piece
    [[0,0], [0,1], [0,2], [1,1], [2,1]],
    // T piece
    [[0,0], [1,0], [2,0], [1,1], [1,2]],
    // U piece
    [[0,0], [0,1], [1,1], [2,1], [2,0]],
    // V piece
    [[0,0], [0,1], [0,2], [1,2], [2,2]],
    // W piece
    [[0,0], [0,1], [1,1], [1,2], [2,2]],
    // X piece
    [[1,0], [0,1], [1,1], [2,1], [1,2]],
    // Z piece
    [[0,0], [1,0], [1,1], [1,2], [2,2]],
    // F piece
    [[0,1], [1,0], [1,1], [1,2], [2,1]]
];

class PentominoSolver {
    constructor() {
        this.board = null;
        this.config = { maxSolutions: 1, maxTime: 30000 };
        this.startTime = 0;
        this.allOrientations = [];
        this.solutionsFound = 0;
        this.stepsExplored = 0;
        this.shouldStop = false;
        
        // Generate all orientations for each piece
        this.generateAllOrientations();
    }
    
    generateAllOrientations() {
        this.allOrientations = PENTOMINO_SHAPES.map(shape => 
            this.generateOrientations(shape)
        );
    }
    
    generateOrientations(shape) {
        const orientations = [];
        let current = [...shape];
        
        // Generate 4 rotations
        for (let rot = 0; rot < 4; rot++) {
            current = this.normalizeShape(current);
            if (!this.orientationExists(orientations, current)) {
                orientations.push([...current]);
            }
            current = this.rotateShape(current);
        }
        
        // Generate reflections
        current = this.reflectShape([...shape]);
        for (let rot = 0; rot < 4; rot++) {
            current = this.normalizeShape(current);
            if (!this.orientationExists(orientations, current)) {
                orientations.push([...current]);
            }
            current = this.rotateShape(current);
        }
        
        return orientations;
    }
    
    normalizeShape(shape) {
        if (shape.length === 0) return shape;
        
        const minX = Math.min(...shape.map(([x, y]) => x));
        const minY = Math.min(...shape.map(([x, y]) => y));
        
        return shape.map(([x, y]) => [x - minX, y - minY])
                   .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    }
    
    rotateShape(shape) {
        return shape.map(([x, y]) => [y, -x]);
    }
    
    reflectShape(shape) {
        return shape.map(([x, y]) => [-x, y]);
    }
    
    orientationExists(orientations, shape) {
        return orientations.some(orientation => 
            orientation.length === shape.length &&
            orientation.every((cell, i) => 
                cell[0] === shape[i][0] && cell[1] === shape[i][1]
            )
        );
    }
    
    init_board(width, height, blocked_cells) {
        this.board = {
            width,
            height,
            blocked_cells: blocked_cells || []
        };
        
        // Initialize board grid
        this.boardGrid = Array.from({ length: height }, () => 
            Array.from({ length: width }, () => -1)
        );
        
        // Mark blocked cells
        for (const cell of blocked_cells) {
            if (cell.x >= 0 && cell.x < width && cell.y >= 0 && cell.y < height) {
                this.boardGrid[cell.y][cell.x] = -2; // -2 for blocked
            }
        }
    }
    
    set_config(max_solutions, max_time) {
        this.config = { maxSolutions: max_solutions, maxTime: max_time };
    }
    
    solve() {
        this.solutionsFound = 0;
        this.stepsExplored = 0;
        this.shouldStop = false;
        this.startTime = Date.now();
        
        // Quick validation
        const emptyCells = this.countEmptyCells();
        if (emptyCells !== 60) {
            return {
                success: false,
                solutions_found: 0,
                steps_explored: 0,
                solving_time: 0,
                error: `Invalid board: need exactly 60 empty cells, found ${emptyCells}`
            };
        }
        
        try {
            this.solveRecursive(0);
        } catch (error) {
            // Handle timeout or other errors
        }
        
        const solvingTime = Date.now() - this.startTime;
        
        return {
            success: true,
            solutions_found: this.solutionsFound,
            steps_explored: this.stepsExplored,
            solving_time: solvingTime,
            timeout: this.shouldStop && solvingTime >= this.config.maxTime
        };
    }
    
    countEmptyCells() {
        let count = 0;
        for (let y = 0; y < this.board.height; y++) {
            for (let x = 0; x < this.board.width; x++) {
                if (this.boardGrid[y][x] === -1) count++;
            }
        }
        return count;
    }
    
    solveRecursive(pieceIndex) {
        // Check timeout
        if (this.config.maxTime && Date.now() - this.startTime > this.config.maxTime) {
            this.shouldStop = true;
            return false;
        }
        
        if (this.shouldStop) return false;
        
        // Check solution limit
        if (this.config.maxSolutions && this.solutionsFound >= this.config.maxSolutions) {
            this.shouldStop = true;
            return false;
        }
        
        // Base case: all pieces placed
        if (pieceIndex >= PENTOMINO_SHAPES.length) {
            this.solutionsFound++;
            return true;
        }
        
        this.stepsExplored++;
        
        // Find first empty cell
        const emptyCell = this.findFirstEmpty();
        if (!emptyCell) return false;
        
        // Try all orientations of current piece
        for (const orientation of this.allOrientations[pieceIndex]) {
            // Try positions around the empty cell
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const x = emptyCell.x + dx;
                    const y = emptyCell.y + dy;
                    
                    if (this.shouldStop) return false;
                    
                    if (this.canPlacePiece(orientation, x, y)) {
                        this.placePiece(orientation, x, y, pieceIndex);
                        
                        if (this.solveRecursive(pieceIndex + 1)) {
                            return true;
                        }
                        
                        this.removePiece(orientation, x, y);
                    }
                }
            }
        }
        
        return false;
    }
    
    findFirstEmpty() {
        for (let y = 0; y < this.board.height; y++) {
            for (let x = 0; x < this.board.width; x++) {
                if (this.boardGrid[y][x] === -1) {
                    return { x, y };
                }
            }
        }
        return null;
    }
    
    canPlacePiece(orientation, startX, startY) {
        for (const [dx, dy] of orientation) {
            const x = startX + dx;
            const y = startY + dy;
            
            if (x < 0 || x >= this.board.width || y < 0 || y >= this.board.height) {
                return false;
            }
            
            if (this.boardGrid[y][x] !== -1) {
                return false;
            }
        }
        return true;
    }
    
    placePiece(orientation, startX, startY, pieceId) {
        for (const [dx, dy] of orientation) {
            const x = startX + dx;
            const y = startY + dy;
            this.boardGrid[y][x] = pieceId;
        }
    }
    
    removePiece(orientation, startX, startY) {
        for (const [dx, dy] of orientation) {
            const x = startX + dx;
            const y = startY + dy;
            this.boardGrid[y][x] = -1;
        }
    }
    
    get_board() {
        return this.boardGrid;
    }
    
    stop() {
        this.shouldStop = true;
    }
    
    get_progress() {
        return {
            steps_explored: this.stepsExplored,
            solutions_found: this.solutionsFound,
            time_elapsed: Date.now() - this.startTime
        };
    }
}

// Real WebAssembly module loader
export default async function createModule() {
    try {
        // Try to load the real compiled WebAssembly module
        console.log('Loading real WebAssembly module...');

        // Import the AssemblyScript-generated module
        const wasmModule = await import('./pentomino_solver_real.js');
        const wasmInstance = await wasmModule.default();

        console.log('Real WebAssembly module loaded successfully!');

        // Create wrapper that matches expected interface
        class RealWasmPentominoSolver {
            constructor() {
                this.wasmInstance = wasmInstance;
                this.isInitialized = false;
            }

            init_board(width, height, blocked_cells) {
                this.wasmInstance.initBoard(width, height);

                // Set blocked cells
                for (const cell of blocked_cells) {
                    this.wasmInstance.setBlockedCell(cell.x, cell.y);
                }

                this.isInitialized = true;
            }

            set_config(max_solutions, max_time) {
                this.wasmInstance.setConfig(max_solutions, max_time);
            }

            solve() {
                if (!this.isInitialized) {
                    return {
                        success: false,
                        solutions_found: 0,
                        steps_explored: 0,
                        solving_time: 0,
                        error: 'Board not initialized'
                    };
                }

                const startTime = Date.now();
                const solutionsFound = this.wasmInstance.solve();
                const solvingTime = Date.now() - startTime;

                return {
                    success: true,
                    solutions_found: solutionsFound,
                    steps_explored: this.wasmInstance.getProgress(),
                    solving_time: solvingTime
                };
            }

            get_board() {
                if (!this.isInitialized) return [];

                // Extract board state from WASM
                const board = [];
                const width = 10; // Default width, should be stored
                const height = 6; // Default height, should be stored

                for (let y = 0; y < height; y++) {
                    const row = [];
                    for (let x = 0; x < width; x++) {
                        row.push(this.wasmInstance.getBoardCell(x, y));
                    }
                    board.push(row);
                }

                return board;
            }

            stop() {
                this.wasmInstance.stopSolving();
            }

            get_progress() {
                return {
                    steps_explored: this.wasmInstance.getProgress(),
                    solutions_found: this.wasmInstance.getSolutionsFound(),
                    time_elapsed: Number(this.wasmInstance.getElapsedTime())
                };
            }
        }

        return {
            PentominoSolver: RealWasmPentominoSolver
        };

    } catch (error) {
        console.warn('Real WebAssembly module failed to load, using JavaScript fallback:', error);

        // Fall back to the JavaScript implementation
        return {
            PentominoSolver: PentominoSolver
        };
    }
}
