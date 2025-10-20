#!/bin/bash

# Example build script for Cloudflare Pages
# Set this as your build command in Cloudflare Pages settings

set -e

echo "Installing dependencies..."
npm install -g pnpm@10.0.0
pnpm install

echo "Building verification package..."
cd packages/codinit-dev
pnpm build
cd ../..

echo "Collecting build metadata..."
cd packages/codinit-dev
export OFFICIAL_BUILD=true
node scripts/collect-metadata.js --output ../../build-metadata.json
node scripts/collect-metadata.js --embed ../../app/utils/build-info.ts
cd ../..

echo "Verifying build..."
cd packages/codinit-dev
node scripts/verify-build.js --mode warn --verbose
cd ../..

echo "Building application..."
pnpm run build

echo "Build completed successfully!"
