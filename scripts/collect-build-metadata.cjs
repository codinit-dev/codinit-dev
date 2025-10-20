#!/usr/bin/env node

/**
 * Root-level script to collect build metadata
 * This wraps the build verification package and can be run from anywhere
 *
 * Usage:
 *   node scripts/collect-build-metadata.js
 *   node scripts/collect-build-metadata.js --output build-info.json
 *   node scripts/collect-build-metadata.js --embed app/utils/build-info.ts
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

// Import and run the collector
const { collectBuildMetadata } = require(distPath);
const metadata = collectBuildMetadata();

// Display metadata
console.log('\n' + '='.repeat(60));
console.log('Build Metadata Collected');
console.log('='.repeat(60));
console.log(`Commit:      ${metadata.commit}`);
console.log(`Branch:      ${metadata.branch}`);
console.log(`Timestamp:   ${metadata.timestamp}`);
console.log(`Builder:     ${metadata.builder}`);
console.log(`Environment: ${metadata.environment}`);
console.log(`Official:    ${metadata.isOfficial ? 'YES' : 'NO'}`);

if (metadata.buildNumber) {
  console.log(`Build #:     ${metadata.buildNumber}`);
}

if (metadata.tags && metadata.tags.length > 0) {
  console.log(`Tags:        ${metadata.tags.join(', ')}`);
}

if (metadata.signature) {
  console.log(`Signature:   ${metadata.signature.slice(0, 16)}...`);
}

console.log('='.repeat(60) + '\n');

// Handle output flags
const outputFlag = args.indexOf('--output');
const embedFlag = args.indexOf('--embed');

// Output to JSON file
if (outputFlag !== -1 && args[outputFlag + 1]) {
  const outputPath = path.resolve(process.cwd(), args[outputFlag + 1]);
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
  console.log(`✓ Metadata written to: ${outputPath}\n`);
}

// Embed as TypeScript module
if (embedFlag !== -1 && args[embedFlag + 1]) {
  const embedPath = path.resolve(process.cwd(), args[embedFlag + 1]);
  const tsContent = `/**
 * Auto-generated build metadata
 * Generated at: ${new Date().toISOString()}
 * DO NOT EDIT MANUALLY
 */

export const BUILD_METADATA = ${JSON.stringify(metadata, null, 2)} as const;

export type BuildMetadata = typeof BUILD_METADATA;
`;

  // Ensure directory exists
  fs.mkdirSync(path.dirname(embedPath), { recursive: true });
  fs.writeFileSync(embedPath, tsContent);
  console.log(`✓ Metadata embedded in: ${embedPath}\n`);
}

// Exit successfully
process.exit(0);
