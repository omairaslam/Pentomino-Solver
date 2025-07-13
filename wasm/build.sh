#!/bin/bash

# WebAssembly build script for Pentomino Solver
# Requires Emscripten SDK to be installed and activated

set -e

echo "🔧 Building Pentomino Solver WebAssembly module..."

# Check if Emscripten is available
if ! command -v emcc &> /dev/null; then
    echo "❌ Error: Emscripten compiler (emcc) not found!"
    echo "Please install Emscripten SDK:"
    echo "1. git clone https://github.com/emscripten-core/emsdk.git"
    echo "2. cd emsdk"
    echo "3. ./emsdk install latest"
    echo "4. ./emsdk activate latest"
    echo "5. source ./emsdk_env.sh"
    exit 1
fi

echo "✅ Emscripten found: $(emcc --version | head -n1)"

# Create output directory
mkdir -p ../public/wasm

# Compile C++ to WebAssembly
echo "🚀 Compiling C++ to WebAssembly..."

emcc pentomino_solver.cpp \
    -o ../public/wasm/pentomino_solver.js \
    -s WASM=1 \
    -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="PentominoSolverModule" \
    -s ENVIRONMENT='web' \
    -s SINGLE_FILE=0 \
    -s USE_ES6_IMPORT_META=0 \
    -s EXPORT_ES6=1 \
    --bind \
    -O3 \
    -flto \
    --closure 1 \
    -s ASSERTIONS=0 \
    -s SAFE_HEAP=0 \
    -s STACK_OVERFLOW_CHECK=0 \
    -s DEMANGLE_SUPPORT=0

echo "✅ WebAssembly compilation complete!"

# Check output files
if [ -f "../public/wasm/pentomino_solver.js" ] && [ -f "../public/wasm/pentomino_solver.wasm" ]; then
    echo "📦 Generated files:"
    echo "   - pentomino_solver.js ($(du -h ../public/wasm/pentomino_solver.js | cut -f1))"
    echo "   - pentomino_solver.wasm ($(du -h ../public/wasm/pentomino_solver.wasm | cut -f1))"
else
    echo "❌ Error: Expected output files not found!"
    exit 1
fi

echo "🎉 WebAssembly build successful!"
echo ""
echo "📋 Next steps:"
echo "1. The WASM module is now available in public/wasm/"
echo "2. The TypeScript wrapper will automatically load it"
echo "3. Users can select 'WebAssembly' engine in the solver panel"
echo "4. Expect 10-100x performance improvement for complex puzzles!"
