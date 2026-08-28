#!/usr/bin/env node
// scripts/preflight.js — fast, read-only state check for the mobile starter.
// Prints simple key=value lines so Claude (or a human) can tell where this
// project is in the setup flow. Always exits 0.

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);

function check(k, v) { console.log(`${k}=${v}`); }
function has(cmd) {
  try { execSync(`command -v ${cmd}`, { stdio: ['ignore', 'pipe', 'ignore'] }); return true; }
  catch { return false; }
}

// --- Toolchain ---
check('node',    has('node') ? execSync('node -v').toString().trim().replace(/^v/, '') : 'missing');
check('npm',     has('npm')  ? execSync('npm -v').toString().trim() : 'missing');
check('eas_cli', has('eas')  ? 'installed' : 'missing');

// --- Project state ---
check('node_modules', fs.existsSync('node_modules') ? 'installed' : 'missing');
check('env_file',     fs.existsSync('.env') ? 'present' : 'missing');
check('eas_json',     fs.existsSync('eas.json') ? 'present' : 'missing');

// app.json: bundle id and whether bin/new-app has run (slug + bundle no longer
// placeholders).
try {
  const j = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  const expo = j.expo || {};
  const slug = expo.slug || '';
  const bundleId = expo.ios && expo.ios.bundleIdentifier;
  const projectId = expo.extra && expo.extra.eas && expo.extra.eas.projectId;

  check('app_slug',  slug || 'unset');
  check('bundle_id', bundleId || 'unset');
  check('renamed',   (slug && slug !== 'mobile-app-starter') ? 'yes' : 'no');
  check('eas_linked', projectId ? `yes (${projectId})` : 'no');
  check('bundle_placeholder', bundleId && bundleId.startsWith('com.example.') ? 'yes' : 'no');
} catch {
  check('app_json', 'unreadable');
}

// ASC key present in ./credentials (no network call).
try {
  const credDir = path.join(ROOT, 'credentials');
  if (fs.existsSync(credDir)) {
    const p8 = fs.readdirSync(credDir).filter((f) => f.endsWith('.p8'));
    check('asc_key', p8.length ? p8[0] : 'missing');
  } else {
    check('asc_key', 'missing');
  }
} catch {
  check('asc_key', 'missing');
}
