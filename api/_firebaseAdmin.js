import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

/**
 * Server-side Firestore access (bypasses security rules — never expose raw data from here).
 * Configure ONE of:
 *   FIREBASE_SERVICE_ACCOUNT       – the service-account JSON on a single line (use this on Vercel)
 *   FIREBASE_SERVICE_ACCOUNT_PATH  – path to the downloaded service-account .json file (handy locally)
 * Returns null when neither is set.
 */
export function getAdminDb() {
  if (!getApps().length) {
    let raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw && process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      raw = readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8');
    }
    if (!raw) return null;

    const account = JSON.parse(raw);
    if (account.private_key) account.private_key = account.private_key.replace(/\\n/g, '\n');
    initializeApp({ credential: cert(account) });
  }
  return getFirestore();
}
