#!/usr/bin/env node

/**
 * Verification script that can be run during or after build
 *
 * Usage:
 *   node scripts/verify-build.js
 *   node scripts/verify-build.js --mode enforce
 *   node scripts/verify-build.js --mode warn --verbose
 *   node scripts/verify-build.js --metadata build-info.json
 */

const { collectBuildMetadata } = require('../dist/collector');
const { performVerification } = require('../dist/verifier');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

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
