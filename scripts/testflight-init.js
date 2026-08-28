#!/usr/bin/env node
/**
 * scripts/testflight-init.js — go from "fresh clone" to "build queued for TestFlight"
 * in a single pass, by leaning entirely on eas-cli for the slow/hard parts:
 *
 *   - codesigning certificates + provisioning profiles  → eas credentials
 *   - bundle ID registration with Apple                 → eas build (first run)
 *   - App Store Connect app record creation              → eas submit
 *   - IPA upload + TestFlight queue                      → eas submit
 *
 * What this script does is the *config glue* between the user's Apple account
 * and EAS, then kicks off the first build with --auto-submit. EAS handles the
 * rest. Time budget: ~10 min hands-on here, then ~20-25 min EAS build,
 * ~5 min submit, ~10-30 min Apple-side TestFlight processing.
 *
 * Run from the mobile-app-starter repo root:
 *   node scripts/testflight-init.js                  # fully interactive
 *   node scripts/testflight-init.js \
 *     --apple-team-id A1B2C3D4E5 \
 *     --ascapi-issuer-id 11111111-1111-1111-1111-111111111111 \
 *     --ascapi-key-id ABC123XYZ9 \
 *     --ascapi-key-path ~/Downloads/AuthKey_ABC123XYZ9.p8 \
 *     --yes
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const { spawnSync, execSync } = require('child_process');

const PROJECT_ROOT = process.cwd();
const APP_JSON_PATH = path.join(PROJECT_ROOT, 'app.json');
const EAS_JSON_PATH = path.join(PROJECT_ROOT, 'eas.json');
const CREDENTIALS_DIR = path.join(PROJECT_ROOT, 'credentials');

if (!fs.existsSync(APP_JSON_PATH)) {
  console.error('Run this from the mobile-app-starter repo root (no app.json here).');
  process.exit(1);
}

// --- option parsing -----------------------------------------------------------

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  if (i === -1) return undefined;
  return argv[i + 1];
};
const bool = (name) => argv.includes(name);

const opts = {
  appleTeamId:      flag('--apple-team-id'),
  ascIssuerId:      flag('--ascapi-issuer-id'),
  ascKeyId:         flag('--ascapi-key-id'),
  ascKeyPath:       flag('--ascapi-key-path'),
  sku:              flag('--sku'),
  language:         flag('--language') || 'en-US',
  skipBuild:        bool('--skip-build'),
  nonInteractive:   bool('--non-interactive'),
  yes:              bool('--yes'),
  help:             bool('--help') || bool('-h')
};

if (opts.help) {
  console.log(`Usage: node scripts/testflight-init.js [options]

  --apple-team-id ID           10-char Apple Team ID (from developer.apple.com → Membership)
  --ascapi-issuer-id UUID      App Store Connect API key Issuer ID
  --ascapi-key-id ID           App Store Connect API key ID (e.g. ABC123XYZ9)
  --ascapi-key-path PATH       Path to AuthKey_*.p8 file downloaded from ASC
  --sku SKU                    App SKU (default: bundle identifier)
  --language LANG              Primary language (default: en-US)
  --skip-build                 Configure eas.json + creds only; don't trigger a build
  --non-interactive            Fail if any required input missing instead of prompting
  --yes                        Skip the final "proceed with EAS build?" confirmation
  -h, --help                   Show this message
`);
  process.exit(0);
}

// --- helpers ------------------------------------------------------------------

function section(t) { console.log(`\n== ${t} ==`); }
function info(s)    { console.log(`  ${s}`); }
function die(s)     { console.error(s); process.exit(1); }

function which(cmd) {
  try { return execSync(`command -v ${cmd}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
  catch { return null; }
}

function run(cmd, args, { capture = false, inherit = true } = {}) {
  const res = spawnSync(cmd, args, {
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : (inherit ? 'inherit' : 'ignore'),
    encoding: 'utf8'
  });
  return res;
}

let rlInstance;
function rl() {
  if (!rlInstance) rlInstance = readline.createInterface({ input: process.stdin, output: process.stdout });
  return rlInstance;
}
function prompt(label, defaultValue) {
  return new Promise((resolve) => {
    const tail = defaultValue ? ` [${defaultValue}]` : '';
    rl().question(`${label}${tail}: `, (a) => resolve((a && a.trim()) || defaultValue || ''));
  });
}
async function confirm(question, defaultNo = true) {
  const a = await prompt(`${question} ${defaultNo ? '[y/N]' : '[Y/n]'}`);
  if (!a) return !defaultNo;
  return a.toLowerCase() === 'y' || a.toLowerCase() === 'yes';
}
async function need(value, label) {
  if (value) return value;
  if (opts.nonInteractive) die(`Missing ${label} (running --non-interactive)`);
  let v;
  while (!v) v = await prompt(label);
  return v;
}

function expandHome(p) {
  if (!p) return p;
  return p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;
}

// --- 1. eas-cli + login -------------------------------------------------------

async function ensureEas() {
  section('Checking eas-cli');
  let easPath = which('eas');
  if (!easPath) {
    info('eas-cli not found.');
    if (opts.nonInteractive) die('Install eas-cli first: npm install -g eas-cli');
    if (await confirm('Install eas-cli globally now (npm install -g eas-cli)?', false)) {
      const r = run('npm', ['install', '-g', 'eas-cli']);
      if (r.status !== 0) die('npm install failed.');
      easPath = which('eas') || die('eas still not on PATH after install.');
    } else {
      die('Cannot continue without eas-cli.');
    }
  }
  info(`eas-cli: ${easPath}`);

  // Login check — `eas whoami` exits 0 if logged in.
  const who = run('eas', ['whoami'], { capture: true, inherit: false });
  if (who.status !== 0) {
    info('Not logged into Expo. Launching `eas login`...');
    const r = run('eas', ['login']);
    if (r.status !== 0) die('eas login failed.');
  } else {
    info(`expo user: ${who.stdout.trim()}`);
  }
}

// --- 2. bundle id sanity ------------------------------------------------------

function readAppJson() {
  return JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));
}
function writeAppJson(obj) {
  fs.writeFileSync(APP_JSON_PATH, JSON.stringify(obj, null, 2) + '\n');
}

function checkBundleId() {
  section('Checking bundle identifier');
  const appJson = readAppJson();
  const bundleId = appJson?.expo?.ios?.bundleIdentifier;
  if (!bundleId) die('app.json is missing expo.ios.bundleIdentifier — run rails-ai-starter/bin/new-app first to set it.');
  if (bundleId.startsWith('com.example.')) {
    console.error(`  bundle id is the placeholder "${bundleId}" — set a real one before submitting.`);
    console.error('  Run bin/new-app with --bundle-id, or edit app.json manually.');
    if (opts.nonInteractive) process.exit(1);
  }
  info(`bundle id: ${bundleId}`);
  return bundleId;
}

// --- 3. gather ASC creds ------------------------------------------------------

async function gatherCreds(bundleId) {
  section('App Store Connect credentials');
  console.log(`  Generate an API key (one-time) at:
    https://appstoreconnect.apple.com/access/integrations/api
  Role: "App Manager" (or "Admin"). You'll get an Issuer ID, a Key ID,
  and a downloadable AuthKey_<KEYID>.p8 file. The .p8 can only be
  downloaded once — save it somewhere safe.\n`);

  opts.appleTeamId  = await need(opts.appleTeamId,  'Apple Team ID (10 chars)');
  opts.ascIssuerId  = await need(opts.ascIssuerId,  'ASC API Key Issuer ID (UUID)');
  opts.ascKeyId     = await need(opts.ascKeyId,     'ASC API Key ID (10 chars)');
  opts.ascKeyPath   = expandHome(await need(opts.ascKeyPath, 'Path to AuthKey_*.p8 file'));
  // SKU is internal to ASC; bundle id is a safe, conventional default. Override with --sku.
  opts.sku        ||= bundleId;

  if (!fs.existsSync(opts.ascKeyPath)) die(`Key file not found: ${opts.ascKeyPath}`);

  // Copy the .p8 into ./credentials/ so eas.json can reference it with a
  // stable, project-relative path. credentials/ is covered by .gitignore's
  // global *.p8 rule, but we'll also add the dir explicitly.
  if (!fs.existsSync(CREDENTIALS_DIR)) fs.mkdirSync(CREDENTIALS_DIR);
  const destPath = path.join(CREDENTIALS_DIR, path.basename(opts.ascKeyPath));
  if (path.resolve(opts.ascKeyPath) !== path.resolve(destPath)) {
    fs.copyFileSync(opts.ascKeyPath, destPath);
    fs.chmodSync(destPath, 0o600);
    info(`copied key → ${path.relative(PROJECT_ROOT, destPath)} (chmod 600)`);
  }
  opts.ascKeyPath = `./credentials/${path.basename(destPath)}`;

  const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
  const gi = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
  if (!gi.split('\n').some((l) => l.trim() === 'credentials/')) {
    fs.appendFileSync(gitignorePath, '\n# ASC API key — never commit\ncredentials/\n');
    info('added credentials/ to .gitignore');
  }
}

// --- 4. write eas.json --------------------------------------------------------

function writeEasJson(bundleId) {
  section('Writing eas.json');
  let easJson = {};
  if (fs.existsSync(EAS_JSON_PATH)) {
    try { easJson = JSON.parse(fs.readFileSync(EAS_JSON_PATH, 'utf8')); } catch { easJson = {}; }
    info('eas.json exists — patching fields, keeping existing config');
  }

  easJson.cli  ||= { version: '>= 5.0.0' };
  easJson.build ||= {};
  easJson.build.development ||= { developmentClient: true, distribution: 'internal' };
  easJson.build.preview     ||= { distribution: 'internal', ios: { simulator: true } };
  easJson.build.production  ||= { autoIncrement: true };

  easJson.submit ||= {};
  easJson.submit.production ||= {};
  easJson.submit.production.ios = {
    appleTeamId:        opts.appleTeamId,
    ascAppId:           'auto',
    ascApiKeyId:        opts.ascKeyId,
    ascApiKeyIssuerId:  opts.ascIssuerId,
    ascApiKeyPath:      opts.ascKeyPath,
    sku:                opts.sku,
    language:           opts.language
  };

  fs.writeFileSync(EAS_JSON_PATH, JSON.stringify(easJson, null, 2) + '\n');
  info(`wrote ${path.relative(PROJECT_ROOT, EAS_JSON_PATH)}`);
}

// --- 5. eas init (project link) -----------------------------------------------

function ensureProjectLink() {
  section('Linking project to EAS');
  const appJson = readAppJson();
  const projectId = appJson?.expo?.extra?.eas?.projectId;
  if (projectId) {
    info(`already linked: ${projectId}`);
    return;
  }
  info('running `eas init` — this will create the EAS project record and write the projectId into app.json');
  const r = run('eas', ['init', '--non-interactive']);
  if (r.status !== 0) {
    // Fall back to interactive (eas init usually wants to confirm slug/owner)
    info('non-interactive init failed; trying interactive');
    const r2 = run('eas', ['init']);
    if (r2.status !== 0) die('eas init failed.');
  }
}

// --- 6. build + auto-submit ---------------------------------------------------

async function triggerBuild() {
  if (opts.skipBuild) {
    info('--skip-build set — configuration done, not starting an EAS build.');
    return;
  }
  section('Build + submit');
  console.log(`  About to run:
    eas build --platform ios --profile production --auto-submit

  This queues a cloud iOS build on EAS (~20-25 min), then submits the resulting
  IPA to TestFlight (~5 min upload + 10-30 min Apple processing). The build
  consumes one slot from your Expo plan's monthly build quota.\n`);

  if (!opts.yes && !opts.nonInteractive) {
    if (!(await confirm('Start the EAS build now?', true))) {
      info('Skipped — re-run with --yes or kick it off manually:');
      info('  eas build --platform ios --profile production --auto-submit');
      return;
    }
  }
  const r = run('eas', ['build', '--platform', 'ios', '--profile', 'production', '--auto-submit']);
  if (r.status !== 0) die('eas build failed — check the output above.');
}

// --- main ---------------------------------------------------------------------

(async function main() {
  try {
    await ensureEas();
    const bundleId = checkBundleId();
    await gatherCreds(bundleId);
    writeEasJson(bundleId);
    ensureProjectLink();
    await triggerBuild();

    section('Done');
    console.log(`  - eas.json:           configured for production builds + TestFlight submit
  - ASC API key:         ${opts.ascKeyPath} (chmod 600, gitignored)
  - Bundle identifier:   ${bundleId}
  - Apple Team ID:       ${opts.appleTeamId}

  Next steps:
    1. Wait for the EAS build to finish (check the link printed above, or run
       \`eas build:list --status finished --limit 1\`)
    2. TestFlight processing takes ~10-30 min on Apple's side after submit
    3. In App Store Connect → TestFlight, add internal testers (no review needed)
       or set up an external group (requires Apple beta review, ~24h first time)
`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    if (rlInstance) rlInstance.close();
  }
})();
