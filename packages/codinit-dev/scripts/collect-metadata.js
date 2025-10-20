#!/usr/bin/env node

/**
 * Build-time script to collect and embed build metadata
 *
 * Usage:
 *   node scripts/collect-metadata.js
 *   node scripts/collect-metadata.js --output build-info.json
 *   node scripts/collect-metadata.js --embed src/generated/build-info.ts
 */

const { collectBuildMetadata } = require('../dist/collector');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const outputFlag = args.indexOf('--output');
const embedFlag = args.indexOf('--embed');

// Collect build metadata
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

// Exit with appropriate code
process.exit(metadata.isOfficial ? 0 : 0); // Always exit 0 to allow builds
