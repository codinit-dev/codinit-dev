#!/usr/bin/env node

/**
 * Root-level script to verify build
 * This wraps the build verification package and can be run from anywhere
 *
 * Usage:
 *   node scripts/verify-build.js
 *   node scripts/verify-build.js --mode enforce
 *   node scripts/verify-build.js --mode warn --verbose
 *   node scripts/verify-build.js --metadata build-info.json
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const packageDir = path.join(__dirname, '../packages/codinit-dev');
const args = process.argv.slice(2);

// Check if the package is built
const distPath = path.join(packageDir, 'dist/index.js');

if (!fs.existsSync(distPath)) {
  console.log('Building verification package...');

  try {
    execSync('pnpm build', { cwd: packageDir, stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to build verification package');
    process.exit(1);
  }
}

// Import the verification functions
const { collectBuildMetadata, performVerification } = require(distPath);

// Parse arguments
const modeFlag = args.indexOf('--mode');
const verboseFlag = args.indexOf('--verbose');
const metadataFlag = args.indexOf('--metadata');

const mode = modeFlag !== -1 && args[modeFlag + 1] ? args[modeFlag + 1] : 'warn';
const verbose = verboseFlag !== -1;

let metadata;

// Load metadata from file or collect fresh
if (metadataFlag !== -1 && args[metadataFlag + 1]) {
  const metadataPath = path.resolve(process.cwd(), args[metadataFlag + 1]);

  if (fs.existsSync(metadataPath)) {
    metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    console.log(`\nLoaded metadata from: ${metadataPath}`);
  } else {
    console.error(`\nError: Metadata file not found: ${metadataPath}`);
    process.exit(1);
  }
} else {
  metadata = collectBuildMetadata();
}

// Perform verification
const config = {
  mode: mode === 'enforce' ? 'enforce' : 'warn',
  verbose,
};

performVerification(metadata, config);
