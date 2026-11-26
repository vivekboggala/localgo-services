const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc } = require('@firebase/firestore');
const fs = require('fs');
const path = require('path');
const { describe, it, before, after, beforeEach } = require('node:test');

let testEnv;

before(async () => {
  const rulesPath = path.resolve(__dirname, '..', 'firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8');

  testEnv = await initializeTestEnvironment({
    projectId: 'localgo-824dd',
    firestore: {
      rules,
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'bookings/booking_1'), {
        customerId: 'customer_123',
        providerId: 'provider_456',
        status: 'ACCEPTED',
      });
      await setDoc(doc(db, 'bookings/booking_1/secrets/otp'), {
        customerId: 'customer_123',
        startOtp: '4829',
      });
      await setDoc(doc(db, 'notifications/notif_1'), {
        userId: 'user_123',
        title: 'Booking Confirmed',
      });
      await setDoc(doc(db, 'users/user_123'), { name: 'Customer User' });
      await setDoc(doc(db, 'providers/provider_456'), {
        name: 'Provider Bob',
        available: true,
        serviceRadiusKm: 15,
      });
      await setDoc(doc(db, 'providers/provider_with_pii'), {
        name: 'Leaked Provider',
        email: 'secret@example.com',
        phone: '+91 99999 00000',
      });
      await setDoc(doc(db, 'provider_private/provider_456'), {
        email: 'bob@example.com',
        phone: '+91 98765 43210',
      });
      await setDoc(doc(db, 'services/srv_1'), { name: 'Cleaning' });
      await setDoc(doc(db, 'reviews/rev_1'), { rating: 5 });
      await setDoc(doc(db, 'favorites/fav_1'), { customerId: 'customer_123' });
    });
  }
});

describe('Firestore Security Rules', () => {
  describe('Bookings & Secret OTP Access Control', () => {
    it('customer can read their own booking', async () => {
      const db = testEnv.authenticatedContext('customer_123').firestore();
      await assertSucceeds(getDoc(doc(db, 'bookings/booking_1')));
    });

    it('customer CANNOT read another customer booking', async () => {
      const db = testEnv.authenticatedContext('other_customer_999').firestore();
      await assertFails(getDoc(doc(db, 'bookings/booking_1')));
    });

    it('provider can read booking assigned to them', async () => {
      const db = testEnv.authenticatedContext('provider_456').firestore();
      await assertSucceeds(getDoc(doc(db, 'bookings/booking_1')));
    });

    it('provider CANNOT read booking assigned to another provider', async () => {
      const db = testEnv.authenticatedContext('other_provider_888').firestore();
      await assertFails(getDoc(doc(db, 'bookings/booking_1')));
    });

    it('signed-out user CANNOT read bookings', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(getDoc(doc(db, 'bookings/booking_1')));
    });

    it('customer CAN read their own startOtp secret', async () => {
      const db = testEnv.authenticatedContext('customer_123').firestore();
      await assertSucceeds(getDoc(doc(db, 'bookings/booking_1/secrets/otp')));
    });

    it('assigned provider CANNOT read customer startOtp secret', async () => {
      const db = testEnv.authenticatedContext('provider_456').firestore();
      await assertFails(getDoc(doc(db, 'bookings/booking_1/secrets/otp')));
    });

    it('other customer CANNOT read startOtp secret', async () => {
      const db = testEnv.authenticatedContext('other_customer_999').firestore();
      await assertFails(getDoc(doc(db, 'bookings/booking_1/secrets/otp')));
    });

    it('signed-out user CANNOT read startOtp secret', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(getDoc(doc(db, 'bookings/booking_1/secrets/otp')));
    });

    it('client CANNOT write to startOtp secret', async () => {
      const customerDb = testEnv.authenticatedContext('customer_123').firestore();
      await assertFails(setDoc(doc(customerDb, 'bookings/booking_1/secrets/otp'), { startOtp: '0000' }));

      const providerDb = testEnv.authenticatedContext('provider_456').firestore();
      await assertFails(setDoc(doc(providerDb, 'bookings/booking_1/secrets/otp'), { startOtp: '0000' }));
    });
  });

  describe('Provider Privacy & Public Read Control', () => {
    it('public clients can read sanitized provider document without email/phone', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertSucceeds(getDoc(doc(unauthDb, 'providers/provider_456')));

      const authDb = testEnv.authenticatedContext('customer_123').firestore();
      await assertSucceeds(getDoc(doc(authDb, 'providers/provider_456')));
    });

    it('clients CANNOT read a provider document containing email or phone', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(getDoc(doc(unauthDb, 'providers/provider_with_pii')));

      const authDb = testEnv.authenticatedContext('customer_123').firestore();
      await assertFails(getDoc(doc(authDb, 'providers/provider_with_pii')));
    });

    it('NO client (including provider owner) can read or write provider_private', async () => {
      const ownerDb = testEnv.authenticatedContext('provider_456').firestore();
      await assertFails(getDoc(doc(ownerDb, 'provider_private/provider_456')));
      await assertFails(setDoc(doc(ownerDb, 'provider_private/provider_456'), { phone: '000' }));

      const customerDb = testEnv.authenticatedContext('customer_123').firestore();
      await assertFails(getDoc(doc(customerDb, 'provider_private/provider_456')));
    });
  });

  describe('Notifications Access Control', () => {
    it('user can read their own notifications', async () => {
      const db = testEnv.authenticatedContext('user_123').firestore();
      await assertSucceeds(getDoc(doc(db, 'notifications/notif_1')));
    });

    it('user CANNOT read another user notification', async () => {
      const db = testEnv.authenticatedContext('other_user_777').firestore();
      await assertFails(getDoc(doc(db, 'notifications/notif_1')));
    });

    it('signed-out user CANNOT read notifications', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(getDoc(doc(db, 'notifications/notif_1')));
    });
  });

  describe('Zero Client Writes Enforced Across All Collections', () => {
    const collections = ['bookings', 'notifications', 'users', 'providers', 'provider_private', 'services', 'reviews', 'favorites'];

    for (const col of collections) {
      it(`authenticated client CANNOT write to ${col}`, async () => {
        const db = testEnv.authenticatedContext('customer_123').firestore();
        await assertFails(setDoc(doc(db, `${col}/test_doc`), { test: true }));
      });

      it(`unauthenticated client CANNOT write to ${col}`, async () => {
        const db = testEnv.unauthenticatedContext().firestore();
        await assertFails(setDoc(doc(db, `${col}/test_doc`), { test: true }));
      });
    }
  });

  describe('Disallowed Reads for Non-Listener Collections', () => {
    const closedCollections = ['users', 'provider_private', 'services', 'reviews', 'favorites'];

    for (const col of closedCollections) {
      it(`clients CANNOT read ${col}`, async () => {
        const db = testEnv.authenticatedContext('customer_123').firestore();
        await assertFails(getDoc(doc(db, `${col}/some_doc`)));
      });

      it(`unauthenticated users CANNOT read ${col}`, async () => {
        const db = testEnv.unauthenticatedContext().firestore();
        await assertFails(getDoc(doc(db, `${col}/some_doc`)));
      });
    }
  });
});
