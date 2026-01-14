#!/usr/bin/env node

/**
 * Build script for ChatGPT Account Switcher Chrome Extension
 *
 * Creates a clean distribution folder with all necessary files
 * ready for Chrome Web Store submission or local installation.
 */

import { cpSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

// Files and directories to include in the build
const filesToCopy = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'popup.css',
  'icons',
  'LICENSE',
  'README.md',
];

console.log('🔨 Building ChatGPT Account Switcher...\n');

// Clean dist directory
if (existsSync(distDir)) {
  console.log('🧹 Cleaning dist directory...');
  rmSync(distDir, { recursive: true });
}

// Create dist directory
mkdirSync(distDir, { recursive: true });

// Copy files
console.log('📦 Copying files...');
for (const file of filesToCopy) {
  const src = join(rootDir, file);
  const dest = join(distDir, file);

  if (!existsSync(src)) {
    console.warn(`   ⚠️  Skipping missing file: ${file}`);
    continue;
  }

  cpSync(src, dest, { recursive: true });
  console.log(`   ✓ ${file}`);
}

console.log('\n✅ Build complete! Output: dist/');
console.log('\nTo create a zip for Chrome Web Store:');
console.log('  cd dist && zip -r ../chatgpt-account-switcher.zip .');
