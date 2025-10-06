#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync, rmSync } from 'fs';

const execAsync = promisify(exec);

const sourceIcon = 'public/Assets.xcassets/AppIcon.appiconset/ios-marketing.png';
const outputIcon = 'public/icon.icns';
const iconsetDir = '/tmp/macos_icon.iconset';

async function convertIcon() {
  try {
    console.log('🎨 Converting iOS icon to macOS .icns...');

    // Clean and create iconset directory
    if (existsSync(iconsetDir)) {
      rmSync(iconsetDir, { recursive: true });
    }
    mkdirSync(iconsetDir);

    // Generate all required sizes
    const sizes = [
      { size: 16, name: 'icon_16x16.png' },
      { size: 32, name: 'icon_16x16@2x.png' },
      { size: 32, name: 'icon_32x32.png' },
      { size: 64, name: 'icon_32x32@2x.png' },
      { size: 128, name: 'icon_128x128.png' },
      { size: 256, name: 'icon_128x128@2x.png' },
      { size: 256, name: 'icon_256x256.png' },
      { size: 512, name: 'icon_256x256@2x.png' },
      { size: 512, name: 'icon_512x512.png' },
      { size: 1024, name: 'icon_512x512@2x.png' },
    ];

    console.log('📐 Generating icon sizes...');
    for (const { size, name } of sizes) {
      const cmd = `sips -z ${size} ${size} "${sourceIcon}" --out "${iconsetDir}/${name}"`;
      await execAsync(cmd);
      console.log(`  ✓ ${name} (${size}x${size})`);
    }

    // Convert to icns
    console.log('🔨 Creating .icns file...');
    await execAsync(`iconutil -c icns "${iconsetDir}" -o "${outputIcon}"`);

    // Clean up
    rmSync(iconsetDir, { recursive: true });

    console.log(`✅ Icon created successfully: ${outputIcon}`);
    console.log('ℹ️  macOS will automatically apply rounded corners to your app icon');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

convertIcon();
