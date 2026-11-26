#!/usr/bin/env node
/**
 * Idempotent Firestore Migration: Copy legacy PII (`email`, `phone`) from public
 * `providers/{id}` documents into `provider_private/{id}` and null those fields
 * on `providers/{id}` so public reads satisfy `hasNoSensitiveProviderFields()`
 * in `firestore.rules`.
 *
 * SAFETY:
 *   - Runs in DRY-RUN mode by default. Pass `--apply` to write changes.
 *   - Uses `FIREBASE_CREDENTIALS_PATH`, `GOOGLE_APPLICATION_CREDENTIALS`,
 *     `APP_FIREBASE_CREDENTIAL_PATH`, or `FIREBASE_CREDENTIALS_JSON` env var.
 *
 * Usage:
 *   cd scripts && npm install
 *   FIREBASE_CREDENTIALS_PATH=../service-account.json node migrate-provider-private-fields.mjs
 *   FIREBASE_CREDENTIALS_PATH=../service-account.json node migrate-provider-private-fields.mjs --apply
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

function hasNonEmptyValue(val) {
  if (val === undefined || val === null) return false;
  if (typeof val === 'string') return val.trim().length > 0;
  return true;
}

async function run() {
  console.log(`\n=== LocalGo Provider Private Fields Migration (${APPLY ? 'APPLY MODE' : 'DRY-RUN MODE'}) ===\n`);

  initializeApp({
    credential: loadCredential(),
    projectId: process.env.APP_FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || undefined,
  });

  const db = getFirestore();
  const providersSnap = await db.collection('providers').get();

  let totalScanned = 0;
  let alreadyClean = 0;
  let privateWritten = 0;
  let publicCleaned = 0;

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

  for (const doc of providersSnap.docs) {
    totalScanned += 1;
    const data = doc.data() || {};

    const hasEmailKey = Object.prototype.hasOwnProperty.call(data, 'email') && data.email !== null;
    const hasPhoneKey = Object.prototype.hasOwnProperty.call(data, 'phone') && data.phone !== null;

    if (!hasEmailKey && !hasPhoneKey) {
      alreadyClean += 1;
      continue;
    }

    const hasNonEmptyEmail = hasNonEmptyValue(data.email);
    const hasNonEmptyPhone = hasNonEmptyValue(data.phone);

    const privateRef = db.collection('provider_private').doc(doc.id);
    const privateSnap = await privateRef.get();
    const privateData = privateSnap.exists ? privateSnap.data() || {} : {};

    const privatePatch = {};
    if (hasNonEmptyEmail && !hasNonEmptyValue(privateData.email)) {
      privatePatch.email = String(data.email).trim();
    }
    if (hasNonEmptyPhone && !hasNonEmptyValue(privateData.phone)) {
      privatePatch.phone = String(data.phone).trim();
    }

    const needsPrivateWrite = Object.keys(privatePatch).length > 0;

    if (APPLY) {
      if (needsPrivateWrite) {
        batch.set(
          privateRef,
          {
            id: doc.id,
            ...privatePatch,
            migratedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        batchOps += 1;
      }

      const publicNullPatch = {};
      if (hasEmailKey) publicNullPatch.email = null;
      if (hasPhoneKey) publicNullPatch.phone = null;

      batch.update(doc.ref, publicNullPatch);
      batchOps += 1;
      await commitBatchIfNeeded();
    }

    if (needsPrivateWrite) privateWritten += 1;
    publicCleaned += 1;
    console.log(
      `[${APPLY ? 'MIGRATED' : 'WOULD MIGRATE'}] provider=${doc.id} hasEmail=${hasNonEmptyEmail} hasPhone=${hasNonEmptyPhone} privateWrite=${needsPrivateWrite}`
    );
  }

  await commitBatchIfNeeded(true);

  console.log('\n=== Summary ===');
  console.log(`Scanned providers            : ${totalScanned}`);
  console.log(`Already clean                : ${alreadyClean}`);
  console.log(`provider_private ${APPLY ? 'written' : 'to write'}   : ${privateWritten}`);
  console.log(`Public docs ${APPLY ? 'nulled' : 'to null'}        : ${publicCleaned}`);
  console.log(APPLY ? '\nMigration applied cleanly.' : '\nDry-run complete. Re-run with --apply to commit writes.');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exitCode = 1;
});
