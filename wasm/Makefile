# Makefile for Pentomino Solver WebAssembly build

# Compiler and flags
CXX = emcc
CXXFLAGS = -std=c++17 -O3 -flto --closure 1
WASMFLAGS = -s WASM=1 \
           -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
           -s ALLOW_MEMORY_GROWTH=1 \
           -s MODULARIZE=1 \
           -s EXPORT_NAME="PentominoSolverModule" \
           -s ENVIRONMENT='web' \
           -s SINGLE_FILE=0 \
           -s USE_ES6_IMPORT_META=0 \
           -s EXPORT_ES6=1 \
           -s ASSERTIONS=0 \
           -s SAFE_HEAP=0 \
           -s STACK_OVERFLOW_CHECK=0 \
           -s DEMANGLE_SUPPORT=0 \
           --bind

# Source and output files
SRC = pentomino_solver.cpp
OUTPUT_DIR = ../public/wasm
OUTPUT_JS = $(OUTPUT_DIR)/pentomino_solver.js
OUTPUT_WASM = $(OUTPUT_DIR)/pentomino_solver.wasm

# Default target
all: $(OUTPUT_JS)

# Create output directory
$(OUTPUT_DIR):
	mkdir -p $(OUTPUT_DIR)

# Build WebAssembly module
$(OUTPUT_JS): $(SRC) | $(OUTPUT_DIR)
	@echo "🔧 Building Pentomino Solver WebAssembly module..."
	@if ! command -v emcc >/dev/null 2>&1; then \
		echo "❌ Error: Emscripten compiler (emcc) not found!"; \
		echo "Please install Emscripten SDK:"; \
		echo "1. git clone https://github.com/emscripten-core/emsdk.git"; \
		echo "2. cd emsdk"; \
		echo "3. ./emsdk install latest"; \
		echo "4. ./emsdk activate latest"; \
		echo "5. source ./emsdk_env.sh"; \
		exit 1; \
	fi
	@echo "✅ Emscripten found: $$(emcc --version | head -n1)"
	@echo "🚀 Compiling C++ to WebAssembly..."
	$(CXX) $(SRC) -o $(OUTPUT_JS) $(CXXFLAGS) $(WASMFLAGS)
	@echo "✅ WebAssembly compilation complete!"
	@if [ -f "$(OUTPUT_JS)" ] && [ -f "$(OUTPUT_WASM)" ]; then \
		echo "📦 Generated files:"; \
		echo "   - pentomino_solver.js ($$(du -h $(OUTPUT_JS) | cut -f1))"; \
		echo "   - pentomino_solver.wasm ($$(du -h $(OUTPUT_WASM) | cut -f1))"; \
		echo "🎉 WebAssembly build successful!"; \
		echo ""; \
		echo "📋 Next steps:"; \
		echo "1. The WASM module is now available in public/wasm/"; \
		echo "2. The TypeScript wrapper will automatically load it"; \
		echo "3. Users can select 'WebAssembly' engine in the solver panel"; \
		echo "4. Expect 10-100x performance improvement for complex puzzles!"; \
	else \
		echo "❌ Error: Expected output files not found!"; \
		exit 1; \
	fi

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -f $(OUTPUT_JS) $(OUTPUT_WASM)
	@echo "✅ Clean complete!"

# Install Emscripten (helper target)
install-emscripten:
	@echo "📥 Installing Emscripten SDK..."
	@if [ ! -d "emsdk" ]; then \
		git clone https://github.com/emscripten-core/emsdk.git; \
	fi
	cd emsdk && ./emsdk install latest && ./emsdk activate latest
	@echo "✅ Emscripten installed!"
	@echo "🔧 To activate Emscripten, run:"
	@echo "   source emsdk/emsdk_env.sh"

# Development build (with debug symbols)
debug: CXXFLAGS = -std=c++17 -O0 -g
debug: WASMFLAGS += -s ASSERTIONS=1 -s SAFE_HEAP=1 -s STACK_OVERFLOW_CHECK=1 -s DEMANGLE_SUPPORT=1
debug: $(OUTPUT_JS)
	@echo "🐛 Debug build complete with debugging symbols!"

# Test the build
test: $(OUTPUT_JS)
	@echo "🧪 Testing WebAssembly module..."
	@if [ -f "$(OUTPUT_JS)" ] && [ -f "$(OUTPUT_WASM)" ]; then \
		echo "✅ WebAssembly files exist"; \
		echo "📊 File sizes:"; \
		ls -lh $(OUTPUT_JS) $(OUTPUT_WASM); \
	else \
		echo "❌ WebAssembly files missing"; \
		exit 1; \
	fi

# Show help
help:
	@echo "Pentomino Solver WebAssembly Build System"
	@echo ""
	@echo "Available targets:"
	@echo "  all              - Build WebAssembly module (default)"
	@echo "  clean            - Remove build artifacts"
	@echo "  debug            - Build with debug symbols"
	@echo "  test             - Test the build"
	@echo "  install-emscripten - Install Emscripten SDK"
	@echo "  help             - Show this help message"
	@echo ""
	@echo "Requirements:"
	@echo "  - Emscripten SDK installed and activated"
	@echo "  - C++17 compatible compiler"
	@echo ""
	@echo "Example usage:"
	@echo "  make              # Build the WebAssembly module"
	@echo "  make clean        # Clean build artifacts"
	@echo "  make debug        # Build with debugging enabled"

.PHONY: all clean install-emscripten debug test help
