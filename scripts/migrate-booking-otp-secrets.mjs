#!/usr/bin/env node
/**
 * Idempotent Firestore Migration: Move legacy inline `bookings/{id}.startOtp`
 * into the customer-only subcollection `bookings/{id}/secrets/otp` and delete
 * the plaintext `startOtp` field from the parent `bookings/{id}` document.
 *
 * SAFETY:
 *   - Runs in DRY-RUN mode by default. Pass `--apply` to write changes.
 *   - Uses `FIREBASE_CREDENTIALS_PATH` / `GOOGLE_APPLICATION_CREDENTIALS` or
 *     `FIREBASE_CREDENTIALS_JSON` environment variable for Admin SDK auth.
 *
 * Usage:
 *   cd scripts && npm install
 *   FIREBASE_CREDENTIALS_PATH=../service-account.json node migrate-booking-otp-secrets.mjs
 *   FIREBASE_CREDENTIALS_PATH=../service-account.json node migrate-booking-otp-secrets.mjs --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const APPLY = process.argv.includes('--apply');
const BATCH_LIMIT = 400;

function loadCredential() {
  const inlineJson = process.env.FIREBASE_CREDENTIALS_JSON;
  if (inlineJson && inlineJson.trim()) {
    return cert(JSON.parse(inlineJson));
  }

  const credPath =
    process.env.FIREBASE_CREDENTIALS_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.APP_FIREBASE_CREDENTIAL_PATH;

  if (credPath && credPath.trim()) {
    const resolved = path.resolve(credPath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Firebase credentials file not found: ${resolved}`);
    }
    return cert(JSON.parse(fs.readFileSync(resolved, 'utf8')));
  }

  return applicationDefault();
}

async function run() {
  console.log(`\n=== LocalGo Booking startOtp Secrets Migration (${APPLY ? 'APPLY MODE' : 'DRY-RUN MODE'}) ===\n`);

  initializeApp({
    credential: loadCredential(),
    projectId: process.env.APP_FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || undefined,
  });

  const db = getFirestore();
  const bookingsSnap = await db.collection('bookings').get();

  let totalScanned = 0;
  let alreadyClean = 0;
  let secretsWritten = 0;
  let inlineDeleted = 0;
  let skippedInvalid = 0;

  let batch = db.batch();
  let batchOps = 0;

  const commitBatchIfNeeded = async (force = false) => {
    if (!APPLY || batchOps === 0) return;
    if (force || batchOps >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      batchOps = 0;
    }
  };

  for (const doc of bookingsSnap.docs) {
    totalScanned += 1;
    const data = doc.data() || {};
    const legacyOtp = data.startOtp;
    const customerId = data.customerId;

    if (legacyOtp === undefined || legacyOtp === null || String(legacyOtp).trim() === '') {
      // Also clean up explicit `startOtp: null` key if present so doc schema matches new bookings
      if (Object.prototype.hasOwnProperty.call(data, 'startOtp')) {
        if (APPLY) {
          batch.update(doc.ref, { startOtp: FieldValue.delete() });
          batchOps += 1;
          await commitBatchIfNeeded();
        }
        inlineDeleted += 1;
      } else {
        alreadyClean += 1;
      }
      continue;
    }

    if (!customerId) {
      console.warn(`[SKIP] booking ${doc.id} has legacy startOtp but missing customerId.`);
      skippedInvalid += 1;
      continue;
    }

    const secretRef = doc.ref.collection('secrets').doc('otp');
    const secretSnap = await secretRef.get();
    const needsSecretWrite = !secretSnap.exists || !secretSnap.data()?.startOtp;

    if (APPLY) {
      if (needsSecretWrite) {
        batch.set(
          secretRef,
          {
            startOtp: String(legacyOtp),
            customerId: String(customerId),
            migratedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        batchOps += 1;
      }

      batch.update(doc.ref, { startOtp: FieldValue.delete() });
      batchOps += 1;
      await commitBatchIfNeeded();
    }

    if (needsSecretWrite) secretsWritten += 1;
    inlineDeleted += 1;
    console.log(
      `[${APPLY ? 'MIGRATED' : 'WOULD MIGRATE'}] booking=${doc.id} customerId=${customerId} secretWrite=${needsSecretWrite}`
    );
  }

  await commitBatchIfNeeded(true);

  console.log('\n=== Summary ===');
  console.log(`Scanned bookings       : ${totalScanned}`);
  console.log(`Already clean          : ${alreadyClean}`);
  console.log(`Secrets ${APPLY ? 'written' : 'to write'}    : ${secretsWritten}`);
  console.log(`Inline OTPs ${APPLY ? 'deleted' : 'to delete'}: ${inlineDeleted}`);
  console.log(`Skipped (no customerId): ${skippedInvalid}`);
  console.log(APPLY ? '\nMigration applied cleanly.' : '\nDry-run complete. Re-run with --apply to commit writes.');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exitCode = 1;
});
