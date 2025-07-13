#include <vector>
#include <array>
#include <algorithm>
#include <chrono>
#include <emscripten/bind.h>
#include <emscripten/val.h>

using namespace emscripten;

// Pentomino piece definitions (relative coordinates)
const std::vector<std::vector<std::pair<int, int>>> PENTOMINO_SHAPES = {
    // I piece
    {{0,0}, {0,1}, {0,2}, {0,3}, {0,4}},
    // L piece  
    {{0,0}, {0,1}, {0,2}, {0,3}, {1,3}},
    // N piece
    {{0,0}, {0,1}, {1,1}, {1,2}, {1,3}},
    // P piece
    {{0,0}, {0,1}, {1,0}, {1,1}, {1,2}},
    // Y piece
    {{0,0}, {0,1}, {0,2}, {1,1}, {2,1}},
    // T piece
    {{0,0}, {1,0}, {2,0}, {1,1}, {1,2}},
    // U piece
    {{0,0}, {0,1}, {1,1}, {2,1}, {2,0}},
    // V piece
    {{0,0}, {0,1}, {0,2}, {1,2}, {2,2}},
    // W piece
    {{0,0}, {0,1}, {1,1}, {1,2}, {2,2}},
    // X piece
    {{1,0}, {0,1}, {1,1}, {2,1}, {1,2}},
    // Z piece
    {{0,0}, {1,0}, {1,1}, {1,2}, {2,2}},
    // F piece
    {{0,1}, {1,0}, {1,1}, {1,2}, {2,1}}
};

class PentominoSolver {
private:
    std::vector<std::vector<int>> board;
    std::vector<std::vector<std::vector<std::pair<int, int>>>> all_orientations;
    int width, height;
    int solutions_found;
    int max_solutions;
    int steps_explored;
    std::chrono::steady_clock::time_point start_time;
    int max_time_ms;
    bool should_stop;
    
    // Generate all rotations and reflections of a piece
    std::vector<std::vector<std::pair<int, int>>> generate_orientations(
        const std::vector<std::pair<int, int>>& shape) {
        
        std::vector<std::vector<std::pair<int, int>>> orientations;
        std::vector<std::pair<int, int>> current = shape;
        
        // Generate 4 rotations
        for (int rot = 0; rot < 4; rot++) {
            // Normalize to origin
            normalize_shape(current);
            
            // Add if not already present
            if (std::find(orientations.begin(), orientations.end(), current) == orientations.end()) {
                orientations.push_back(current);
            }
            
            // Rotate 90 degrees clockwise: (x,y) -> (y,-x)
            for (auto& cell : current) {
                int new_x = cell.second;
                int new_y = -cell.first;
                cell.first = new_x;
                cell.second = new_y;
            }
        }
        
        // Generate reflections
        current = shape;
        // Reflect horizontally: (x,y) -> (-x,y)
        for (auto& cell : current) {
            cell.first = -cell.first;
        }
        
        // Generate 4 rotations of reflection
        for (int rot = 0; rot < 4; rot++) {
            normalize_shape(current);
            
            if (std::find(orientations.begin(), orientations.end(), current) == orientations.end()) {
                orientations.push_back(current);
            }
            
            for (auto& cell : current) {
                int new_x = cell.second;
                int new_y = -cell.first;
                cell.first = new_x;
                cell.second = new_y;
            }
        }
        
        return orientations;
    }
    
    // Normalize shape to have minimum coordinates at origin
    void normalize_shape(std::vector<std::pair<int, int>>& shape) {
        if (shape.empty()) return;
        
        int min_x = shape[0].first;
        int min_y = shape[0].second;
        
        for (const auto& cell : shape) {
            min_x = std::min(min_x, cell.first);
            min_y = std::min(min_y, cell.second);
        }
        
        for (auto& cell : shape) {
            cell.first -= min_x;
            cell.second -= min_y;
        }
        
        // Sort for consistent comparison
        std::sort(shape.begin(), shape.end());
    }
    
    // Check if piece can be placed at position
    bool can_place_piece(const std::vector<std::pair<int, int>>& orientation, 
                        int start_x, int start_y) {
        for (const auto& cell : orientation) {
            int x = start_x + cell.first;
            int y = start_y + cell.second;
            
            if (x < 0 || x >= width || y < 0 || y >= height) {
                return false;
            }
            
            if (board[y][x] != -1) {
                return false;
            }
        }
        return true;
    }
    
    // Place piece on board
    void place_piece(const std::vector<std::pair<int, int>>& orientation, 
                    int start_x, int start_y, int piece_id) {
        for (const auto& cell : orientation) {
            int x = start_x + cell.first;
            int y = start_y + cell.second;
            board[y][x] = piece_id;
        }
    }
    
    // Remove piece from board
    void remove_piece(const std::vector<std::pair<int, int>>& orientation, 
                     int start_x, int start_y) {
        for (const auto& cell : orientation) {
            int x = start_x + cell.first;
            int y = start_y + cell.second;
            board[y][x] = -1;
        }
    }
    
    // Find first empty cell (for systematic placement)
    std::pair<int, int> find_first_empty() {
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                if (board[y][x] == -1) {
                    return {x, y};
                }
            }
        }
        return {-1, -1}; // No empty cells
    }
    
    // Backtracking solver
    bool solve_recursive(int piece_index) {
        // Check timeout
        auto current_time = std::chrono::steady_clock::now();
        auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
            current_time - start_time).count();
        
        if (max_time_ms > 0 && elapsed > max_time_ms) {
            should_stop = true;
            return false;
        }
        
        if (should_stop) return false;
        
        // Check solution limit
        if (max_solutions > 0 && solutions_found >= max_solutions) {
            should_stop = true;
            return false;
        }
        
        // Base case: all pieces placed
        if (piece_index >= PENTOMINO_SHAPES.size()) {
            solutions_found++;
            return true;
        }
        
        steps_explored++;
        
        // Find first empty cell for systematic placement
        auto empty_cell = find_first_empty();
        if (empty_cell.first == -1) {
            return false; // No empty cells but pieces remaining
        }
        
        // Try all orientations of current piece
        for (const auto& orientation : all_orientations[piece_index]) {
            // Try positions in a small area around the first empty cell
            int search_radius = 2;
            int start_x = std::max(0, empty_cell.first - search_radius);
            int end_x = std::min(width, empty_cell.first + search_radius + 1);
            int start_y = std::max(0, empty_cell.second - search_radius);
            int end_y = std::min(height, empty_cell.second + search_radius + 1);
            
            for (int y = start_y; y < end_y; y++) {
                for (int x = start_x; x < end_x; x++) {
                    if (should_stop) return false;
                    
                    if (can_place_piece(orientation, x, y)) {
                        place_piece(orientation, x, y, piece_index);
                        
                        if (solve_recursive(piece_index + 1)) {
                            return true; // Found solution
                        }
                        
                        remove_piece(orientation, x, y);
                    }
                }
            }
        }
        
        return false;
    }

public:
    PentominoSolver() : solutions_found(0), max_solutions(1), steps_explored(0), 
                       max_time_ms(30000), should_stop(false) {
        // Generate all orientations for each piece
        all_orientations.resize(PENTOMINO_SHAPES.size());
        for (size_t i = 0; i < PENTOMINO_SHAPES.size(); i++) {
            all_orientations[i] = generate_orientations(PENTOMINO_SHAPES[i]);
        }
    }
    
    // Initialize board
    void init_board(int w, int h, const std::vector<std::pair<int, int>>& blocked_cells) {
        width = w;
        height = h;
        board.assign(height, std::vector<int>(width, -1));
        
        // Mark blocked cells
        for (const auto& cell : blocked_cells) {
            if (cell.first >= 0 && cell.first < width && 
                cell.second >= 0 && cell.second < height) {
                board[cell.second][cell.first] = -2; // -2 for blocked
            }
        }
    }
    
    // Set solver configuration
    void set_config(int max_sols, int max_time) {
        max_solutions = max_sols;
        max_time_ms = max_time;
    }
    
    // Solve the puzzle
    val solve() {
        solutions_found = 0;
        steps_explored = 0;
        should_stop = false;
        start_time = std::chrono::steady_clock::now();
        
        // Quick validation
        int empty_cells = 0;
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                if (board[y][x] == -1) {
                    empty_cells++;
                }
            }
        }
        
        // Need exactly 60 cells for 12 pentomino pieces
        if (empty_cells != 60) {
            val result = val::object();
            result.set("success", false);
            result.set("solutions_found", 0);
            result.set("steps_explored", 0);
            result.set("solving_time", 0);
            result.set("error", "Invalid board: need exactly 60 empty cells");
            return result;
        }
        
        bool found = solve_recursive(0);
        
        auto end_time = std::chrono::steady_clock::now();
        auto solving_time = std::chrono::duration_cast<std::chrono::milliseconds>(
            end_time - start_time).count();
        
        val result = val::object();
        result.set("success", true);
        result.set("solutions_found", solutions_found);
        result.set("steps_explored", steps_explored);
        result.set("solving_time", solving_time);
        
        if (should_stop && solving_time >= max_time_ms) {
            result.set("timeout", true);
        }
        
        return result;
    }
    
    // Get current board state
    val get_board() {
        val board_array = val::array();
        for (int y = 0; y < height; y++) {
            val row = val::array();
            for (int x = 0; x < width; x++) {
                row.call<void>("push", board[y][x]);
            }
            board_array.call<void>("push", row);
        }
        return board_array;
    }
    
    // Stop solving
    void stop() {
        should_stop = true;
    }
    
    // Get progress
    val get_progress() {
        auto current_time = std::chrono::steady_clock::now();
        auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
            current_time - start_time).count();
        
        val progress = val::object();
        progress.set("steps_explored", steps_explored);
        progress.set("solutions_found", solutions_found);
        progress.set("time_elapsed", elapsed);
        return progress;
    }
};

// Emscripten bindings
EMSCRIPTEN_BINDINGS(pentomino_solver) {
    class_<PentominoSolver>("PentominoSolver")
        .constructor<>()
        .function("init_board", &PentominoSolver::init_board)
        .function("set_config", &PentominoSolver::set_config)
        .function("solve", &PentominoSolver::solve)
        .function("get_board", &PentominoSolver::get_board)
        .function("stop", &PentominoSolver::stop)
        .function("get_progress", &PentominoSolver::get_progress);
        
    register_vector<std::pair<int, int>>("VectorPairIntInt");
}
