#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

const dmgSpec = {
  title: 'CodinIT.dev',
  icon: 'public/icon.png',
  background: 'assets/dmg-background.png', // Optional - create if needed
  'icon-size': 80,
  window: {
    size: {
      width: 600,
      height: 400,
    },
  },
  contents: [
    { x: 180, y: 170, type: 'file', path: 'dist/CodinIT.dev-darwin-arm64/CodinIT.dev.app' },
    { x: 420, y: 170, type: 'link', path: '/Applications' },
  ],
};

async function createDMG() {
  try {
    console.log('🔨 Creating DMG specification...');

    // Write DMG spec
    await fs.writeFile('dmg-spec.json', JSON.stringify(dmgSpec, null, 2));

    console.log('📦 Building DMG...');

    // Create DMG
    const { stdout, stderr } = await execAsync('npx appdmg dmg-spec.json dist/CodinIT.dev.dmg');

    if (stdout) {
      console.log(stdout);
    }

    if (stderr) {
      console.error(stderr);
    }

    console.log('✅ DMG created successfully: dist/CodinIT.dev.dmg');

    // Clean up
    await fs.unlink('dmg-spec.json');
  } catch (error) {
    console.error('❌ Error creating DMG:', error.message);
    process.exit(1);
  }
}

createDMG();
