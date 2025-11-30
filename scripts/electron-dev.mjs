import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔧 Running: ${command} ${args.join(' ')}\n`);

    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options,
    });

    child.on('error', (error) => {
      console.error(`Error executing ${command}:`, error);
      reject(error);
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

async function buildElectron() {
  console.log('\n📦 Building Electron app for development...\n');

  try {
    console.log('Step 1/3: Building Remix renderer for Electron...');
    await runCommand('pnpm', ['electron:build:renderer']);

    console.log('\n✅ Renderer build complete!\n');

    console.log('Step 2/3: Building Electron main and preload...');
    await runCommand('pnpm', ['electron:build:deps']);

    console.log('\n✅ Main and preload build complete!\n');

    console.log('Step 3/3: Starting Electron...');

    const electronPath = join(rootDir, 'node_modules/.bin/electron');
    const mainPath = join(rootDir, 'build/electron/main/index.mjs');

    if (!fs.existsSync(mainPath)) {
      throw new Error(`Main process file not found at: ${mainPath}`);
    }

    const electronProcess = spawn(electronPath, [mainPath], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
    });

    electronProcess.on('exit', (code) => {
      console.log(`\n👋 Electron exited with code ${code}\n`);
      process.exit(code || 0);
    });

    electronProcess.on('error', (error) => {
      console.error('Failed to start Electron:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildElectron();
