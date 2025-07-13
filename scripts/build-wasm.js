#!/usr/bin/env node

/**
 * WebAssembly build integration script
 * Builds the WASM module and integrates it into the development workflow
 */

import { execSync, spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const WASM_DIR = path.join(__dirname, '..', 'wasm')
const PUBLIC_WASM_DIR = path.join(__dirname, '..', 'public', 'wasm')

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'     // Reset
  }
  
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }
  
  console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`)
}

function checkEmscripten() {
  try {
    const version = execSync('emcc --version', { encoding: 'utf8' })
    log(`Emscripten found: ${version.split('\n')[0]}`, 'success')
    return true
  } catch (error) {
    log('Emscripten not found!', 'error')
    log('Please install Emscripten SDK:', 'info')
    log('1. git clone https://github.com/emscripten-core/emsdk.git', 'info')
    log('2. cd emsdk', 'info')
    log('3. ./emsdk install latest', 'info')
    log('4. ./emsdk activate latest', 'info')
    log('5. source ./emsdk_env.sh', 'info')
    return false
  }
}

function ensureDirectories() {
  if (!fs.existsSync(PUBLIC_WASM_DIR)) {
    fs.mkdirSync(PUBLIC_WASM_DIR, { recursive: true })
    log(`Created directory: ${PUBLIC_WASM_DIR}`, 'info')
  }
}

function buildWasm() {
  log('Building WebAssembly module...', 'info')
  
  try {
    // Change to WASM directory and run make
    process.chdir(WASM_DIR)
    execSync('make clean', { stdio: 'inherit' })
    execSync('make', { stdio: 'inherit' })
    
    log('WebAssembly build completed successfully!', 'success')
    return true
  } catch (error) {
    log('WebAssembly build failed!', 'error')
    log(error.message, 'error')
    return false
  }
}

function verifyBuild() {
  const jsFile = path.join(PUBLIC_WASM_DIR, 'pentomino_solver.js')
  const wasmFile = path.join(PUBLIC_WASM_DIR, 'pentomino_solver.wasm')
  
  if (fs.existsSync(jsFile) && fs.existsSync(wasmFile)) {
    const jsSize = fs.statSync(jsFile).size
    const wasmSize = fs.statSync(wasmFile).size
    
    log(`Generated files:`, 'success')
    log(`  - pentomino_solver.js (${(jsSize / 1024).toFixed(1)} KB)`, 'info')
    log(`  - pentomino_solver.wasm (${(wasmSize / 1024).toFixed(1)} KB)`, 'info')
    return true
  } else {
    log('Expected output files not found!', 'error')
    return false
  }
}

function updatePackageJson() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json')
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    // Add WASM build script if not present
    if (!packageJson.scripts['build:wasm']) {
      packageJson.scripts['build:wasm'] = 'node scripts/build-wasm.js'
      packageJson.scripts['build:all'] = 'npm run build:wasm && npm run build'
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
      log('Added WASM build scripts to package.json', 'success')
    }
  } catch (error) {
    log('Failed to update package.json', 'warning')
  }
}

function createDevScript() {
  const devScriptPath = path.join(__dirname, 'dev-with-wasm.js')
  const devScript = `#!/usr/bin/env node

/**
 * Development server with WebAssembly auto-rebuild
 */

import { spawn } from 'child_process'
import chokidar from 'chokidar'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🚀 Starting development server with WebAssembly support...')

// Start the main dev server
const devServer = spawn('npm', ['run', 'dev'], { stdio: 'inherit' })

// Watch for C++ file changes
const wasmWatcher = chokidar.watch(path.join(__dirname, '..', 'wasm', '*.cpp'))

wasmWatcher.on('change', (filePath) => {
  console.log(\`🔧 C++ file changed: \${filePath}\`)
  console.log('🔄 Rebuilding WebAssembly module...')
  
  const buildProcess = spawn('node', [path.join(__dirname, 'build-wasm.js')], { stdio: 'inherit' })
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ WebAssembly rebuild complete!')
    } else {
      console.log('❌ WebAssembly rebuild failed!')
    }
  })
})

process.on('SIGINT', () => {
  console.log('\\n🛑 Shutting down development server...')
  devServer.kill()
  wasmWatcher.close()
  process.exit(0)
})
`

  try {
    fs.writeFileSync(devScriptPath, devScript)
    fs.chmodSync(devScriptPath, '755')
    log('Created development script with WASM auto-rebuild', 'success')
  } catch (error) {
    log('Failed to create development script', 'warning')
  }
}

async function main() {
  log('WebAssembly Build Integration', 'info')
  log('==============================', 'info')
  
  // Check if we're in the right directory
  if (!fs.existsSync(WASM_DIR)) {
    log('WASM directory not found! Make sure you\'re in the project root.', 'error')
    process.exit(1)
  }
  
  // Check for Emscripten
  if (!checkEmscripten()) {
    log('Skipping WebAssembly build due to missing Emscripten', 'warning')
    log('The application will use JavaScript fallback', 'info')
    process.exit(0)
  }
  
  // Ensure directories exist
  ensureDirectories()
  
  // Build WebAssembly module
  if (!buildWasm()) {
    log('WebAssembly build failed!', 'error')
    process.exit(1)
  }
  
  // Verify build output
  if (!verifyBuild()) {
    log('Build verification failed!', 'error')
    process.exit(1)
  }
  
  // Update package.json with build scripts
  updatePackageJson()
  
  // Create development script
  createDevScript()
  
  log('WebAssembly integration complete!', 'success')
  log('', 'info')
  log('Next steps:', 'info')
  log('1. Run "npm run build:all" to build both WASM and JS', 'info')
  log('2. Run "npm run dev" to start development server', 'info')
  log('3. Select "WebAssembly" engine in the solver panel', 'info')
  log('4. Enjoy 10-100x performance improvement!', 'info')
}

// Run if called directly
const scriptPath = fileURLToPath(import.meta.url)
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === scriptPath
if (isMainModule) {
  console.log('🔧 Starting WebAssembly build script...')
  main().catch(error => {
    console.error('❌ Build script failed:', error)
    process.exit(1)
  })
}

export {
  checkEmscripten,
  buildWasm,
  verifyBuild
}
