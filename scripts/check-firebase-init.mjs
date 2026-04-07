import { initializeApp } from 'firebase/app';
import { readFile } from 'fs/promises';
import { join } from 'path';

function parseEnv(content) {
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const l = line.trim();
    if (!l || l.startsWith('#')) continue;
    const eq = l.indexOf('=');
    if (eq === -1) continue;
    const key = l.slice(0, eq).trim();
    const val = l.slice(eq + 1).trim();
    out[key] = val.replace(/^"|"$/g, '');
  }
  return out;
}

async function loadEnvFile() {
  try {
    const p = join(process.cwd(), '.env.local');
    const txt = await readFile(p, 'utf8');
    return parseEnv(txt);
  } catch (err) {
    return {};
  }
}

async function main() {
  try {
    const env = await loadEnvFile();
    const cfg = {
      apiKey: env.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '',
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      databaseURL: env.VITE_FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL || '',
      projectId: env.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: env.VITE_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || '',
      measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || process.env.VITE_FIREBASE_MEASUREMENT_ID || '',
    };

    // measurementId is optional for basic initialization
    const required = ['apiKey','authDomain','projectId','appId'];
    const missing = required.filter((k) => !cfg[k]);
    if (missing.length) {
      console.error('Missing env vars:', missing.join(', '));
      process.exitCode = 2;
      return;
    }

    const app = initializeApp(cfg);
    console.log('Firebase initialized. App name:', app.name || '[DEFAULT]');
    console.log('Config projectId:', cfg.projectId);
  } catch (err) {
    console.error('Firebase initialization failed:', err && err.message ? err.message : err);
    process.exitCode = 1;
  }
}

main();
