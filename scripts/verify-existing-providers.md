# Migration: Verify Existing Providers in Firestore

This document describes how to update existing documents in the `providers` Firestore collection to set `verificationStatus: "VERIFIED"`.

> **Note:** Per project rules, this script is **NOT** automatically executed. Review and execute manually when appropriate.

---

## Method 1: Node.js Admin Script (Recommended)

### Prerequisites
1. Set the environment variable pointing to your service account key:
   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\your\serviceAccountKey.json"
   ```
2. Navigate to your project directory.

### Script (`scripts/verify-providers.js`)
Create a file `scripts/verify-providers.js` with the following contents:

```javascript
const admin = require('firebase-admin');

// Initialize with environment credentials
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID || 'localgo-824dd'
});

const db = admin.firestore();

async function verifyAllExistingProviders() {
  console.log('Fetching all providers from Firestore...');
  const snapshot = await db.collection('providers').get();

  if (snapshot.empty) {
    console.log('No provider documents found in collection "providers".');
    return;
  }

  console.log(`Found ${snapshot.size} provider(s). Starting batch update...`);

  // Firestore allows up to 500 operations per batch
  const BATCH_SIZE = 400;
  let batch = db.batch();
  let opCount = 0;
  let updatedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    // Only update if verificationStatus is missing or not yet VERIFIED
    if (!data.verificationStatus || data.verificationStatus === 'PENDING') {
      batch.update(doc.ref, { verificationStatus: 'VERIFIED' });
      opCount++;
      updatedCount++;

      if (opCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`Committed batch of ${opCount} updates.`);
        batch = db.batch();
        opCount = 0;
      }
    }
  }

  if (opCount > 0) {
    await batch.commit();
    console.log(`Committed final batch of ${opCount} updates.`);
  }

  console.log(`Successfully verified ${updatedCount} provider(s).`);
}

verifyAllExistingProviders()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
```

### Execution
Run the script using Node:
```powershell
node scripts/verify-providers.js
```

---

## Method 2: Firebase Console Manual Update
If you only have a few providers in development:
1. Open the [Firebase Console](https://console.firebase.google.com).
2. Select project **localgo-824dd** -> **Firestore Database**.
3. Select the `providers` collection.
4. For each document, click **Add field**:
   - Field name: `verificationStatus`
   - Type: `string`
   - Value: `VERIFIED`
5. Click **Save**.
