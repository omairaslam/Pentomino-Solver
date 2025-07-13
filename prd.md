# Product Requirements Document (PRD): Pentomino Solver Web App Clone

## Overview

**Goal:**  
Develop a web-based Pentomino Solver application that enables users to interactively solve pentomino puzzles, visualize solutions, and explore different board configurations. The application should closely replicate the features and user experience of the reference app at https://sugyan.com/pentomino-solver-webapp/.
Code an algorithmic visualization for fitting the 12 pentominoes in an 8x8 grid with a 2x2 hole in the center but no other holes. Each piece should be used exactly once, no less, no more.

## 1. Target Users

- Puzzle enthusiasts
- Students and educators in mathematics or computer science
- Casual gamers interested in logic puzzles

## 2. Core Features

### 2.1. Puzzle Board

- **Resizable Grid:**  
  Allow users to select or input custom grid sizes (e.g., 6x10, 5x12, etc.).
- **Board Visualization:**  
  Display the board as a grid of squares, with clear visual distinction for empty, filled, and blocked cells.
- **Blocked Cells:**  
  Enable users to mark/unmark cells as "blocked" (not to be filled by pentominoes).

### 2.2. Pentomino Pieces

- **All 12 Pentominoes:**  
  Provide draggable representations of the twelve standard pentomino shapes (F, I, L, N, P, T, U, V, W, X, Y, Z).
- **Piece Manipulation:**  
  - Drag and drop pieces onto the board.
  - Rotate and flip pieces (via UI buttons or keyboard shortcuts).
  - Snap pieces to valid positions on the grid.
- **Piece Inventory:**  
  Show which pieces are available and which have been placed.

### 2.3. Solver Functionality

- **Auto-Solve:**  
  Button to automatically solve the current board using all available pentominoes.
- **Step-by-Step Visualization:**  
  Option to animate the solving process step by step, with controls for play, pause, and step forward/back.
- **Multiple Solutions:**  
  Allow users to view multiple solutions (where they exist) and navigate between them.
- **Solution Count:**  
  Display the total number of solutions found for the current configuration.

### 2.4. User Interaction & Controls

- **Reset Board:**  
  Button to clear the board and reset all pieces.
- **Undo/Redo:**  
  Support undo and redo actions for piece placement and board changes.
- **Custom Board Input:**  
  Allow users to define custom board shapes and blocked cells.
- **Responsive Design:**  
  Application should be usable on both desktop and mobile devices.

### 2.5. Visual Feedback

- **Highlighting:**  
  Highlight valid drop zones when dragging a piece.
- **Error Handling:**  
  Prevent overlapping pieces and provide clear feedback if a move is invalid.
- **Piece Colors:**  
  Each pentomino should have a distinct color for easy identification.

### 2.6. Built-in Example / Preset

- **8x8 Grid with Central 2x2 Hole:**  
  The application must include, as a built-in example or preset, the classic challenge of fitting all 12 pentominoes into an 8x8 grid with a 2x2 hole in the center (and no other holes).
  - This preset should be easily selectable from the main menu or presets list.
  - The solver and visualization features must fully support this configuration, including step-by-step animation and solution counting.

## 3. Technical Requirements

### 3.1. Frontend

- **Framework:**  
  React.js (preferred), Vue.js, or Svelte.
- **Rendering:**  
  Use HTML5 Canvas or SVG for board and piece rendering.
- **State Management:**  
  Use built-in state (React hooks or equivalent) or a state management library for complex interactions.

### 3.2. Backend (Optional)

- **Solver Algorithm:**  
  Implement the pentomino solver in JavaScript/TypeScript, using efficient algorithms such as backtracking or Knuth’s Algorithm X (Dancing Links) for exact cover problems.
- **WebAssembly (Optional):**  
  For performance, consider integrating a solver written in C++/Rust compiled to WebAssembly.

### 3.3. Performance

- Solver should handle standard board sizes (e.g., 6x10, 5x12) and return solutions within a few seconds.
- UI should remain responsive during solving (use Web Workers or async logic).

### 3.4. Deployment

- **Platform Requirement:**  
  The application must be deployed to a modern cloud platform that offers a generous free tier suitable for personal and educational projects (e.g., Vercel, Netlify, GitHub Pages, or similar).
  - Deployment instructions should be included in the deliverables.
  - The platform should support custom domains and HTTPS.
  - The free tier should be sufficient for expected user traffic and features.

## 4. Non-Functional Requirements

- **Accessibility:**  
  Keyboard navigation and screen reader support.
- **Localization:**  
  Structure for supporting multiple languages in the future.
- **Theming:**  
  Light and dark mode support.

## 5. Example User Flows

### 5.1. Manual Play

1. User selects a board size or creates a custom board.
2. User drags pentomino pieces onto the board, rotating/flipping as needed.
3. User attempts to fill the board with all pieces, optionally using undo/redo.

### 5.2. Auto-Solve

1. User configures the board (e.g., selects the 8x8 with central 2x2 hole preset).
2. User clicks "Solve" to trigger the solver.
3. Solution(s) are visualized step-by-step or all at once.
4. User can browse through different solutions if multiple exist.

### 5.3. Using Built-in Preset

1. User opens the presets menu.
2. User selects the "8x8 grid with central 2x2 hole" example.
3. The board is automatically configured with this layout.
4. User can proceed to solve manually or use the auto-solver and visualization features.

## 6. UI Mockups (Textual)

| Area             | Description                                                                 |
|------------------|-----------------------------------------------------------------------------|
| Top Bar          | App title, board size selector, solve/reset buttons, presets dropdown        |
| Main Area        | Puzzle grid (interactive), draggable pentomino pieces below or beside grid   |
| Controls Panel   | Rotate/flip buttons, undo/redo, solution navigation, animation controls      |
| Status/Feedback  | Display for solution count, error messages, and current action hints         |

## 7. References & Algorithms

- **Pentomino Solver Algorithm:**  
  Use backtracking or Knuth's Algorithm X (Dancing Links) for efficient solution finding.
- **UI/UX Inspiration:**  
  Reference the look and feel of https://sugyan.com/pentomino-solver-webapp/ and similar puzzle solvers.
- **Open Source Examples:**  
  - Python-based pentomino solver
  - JavaScript-based implementations

## 8. Stretch Features (Optional)

- **Save/Load Puzzles:**  
  Allow users to save and load custom board states.
- **Export Solutions:**  
  Export solutions as images or printable sheets.
- **Leaderboard:**  
  Track fastest manual solves or most solutions found by users.

## 9. Acceptance Criteria

- All 12 pentominoes can be placed, rotated, and flipped on a configurable board.
- The solver finds and displays at least one solution for standard boards and the 8x8 with central 2x2 hole preset.
- The UI is responsive, user-friendly, and visually clear.
- Application works on desktop and mobile browsers.
- The app is deployed to a platform with a generous free tier, with deployment instructions provided.

## 10. Deliverables

- Complete web application source code and deployment instructions.
- Documentation for codebase, solver logic, and UI components.
- README with usage instructions and troubleshooting tips.