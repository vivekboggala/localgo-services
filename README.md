# LocalGo Services — Local Service Booking Marketplace

LocalGo Services is a full-stack local service booking marketplace built with **Java 21**, **Spring Boot 3**, **Google Cloud Firestore** (Firebase Admin SDK), **Firebase Authentication**, **React 18**, **Vite**, **Tailwind CSS**, and **Leaflet Maps**. Customers discover verified nearby professionals using geolocation and Geohash + Haversine matching, providers manage live duty status and step-by-step service jobs in a dedicated studio, and administrators verify providers and moderate reviews from an admin console.

---

## Architecture & Applications

The repository is organized into a Spring Boot REST API and three independent Vite React frontends:

| Component | Path | Dev Port | Purpose |
|---|---|---|---|
| **Backend API** | `backend/` | `8080` | Spring Boot 3.2.5 REST API, Firebase Auth token filter, Firestore transactions, Bucket4j rate limiting, scheduled expiry |
| **Customer App** | `customer-app/` | `5173` | Service discovery, map search, booking creation, live timeline & Start OTP, favorites, notifications, reviews |
| **Provider App** | `provider-app/` | `5174` | Provider onboarding, Online/Offline duty heartbeat, incoming requests, Start OTP verification, cash confirmation, earnings |
| **Admin App** | `admin-app/` | `5175` | KPI dashboard, provider verification queue, user directory, booking audit, review moderation |
| **Rules Tests** | `firestore-rules-tests/` | — | Node test suite against Firestore Emulator verifying access controls |

---

## Features Implemented

### Customer (`customer-app`)
- **Location Discovery**: Browser geolocation detection with manual city preset selection (`Bengaluru`, `Hyderabad`, `Chennai`, `Madanapalle`, `Palamaner`, `Mumbai`, `Delhi`).
- **Nearby Search & Interactive Map**: Geohash bounding-box + Haversine distance filtering sorted by distance, rating, or price (Online providers ranked first), plus Leaflet/OpenStreetMap pin map.
- **Booking & Conflict Prevention**: Atomic Firestore transaction prevents overlapping appointments across `ACCEPTED`, `ON_THE_WAY`, `ARRIVED`, and `IN_PROGRESS`. Price is computed server-side from the provider's service `startingPrice` (in paise).
- **Single Arrival OTP**: Customer receives a 4-digit `startOtp` stored in customer-only `bookings/{id}/secrets/otp` and shares it upon provider arrival.
- **Auto-Expiry**: Unaccepted `REQUESTED` bookings expire to `EXPIRED` after 10 minutes with a customer notification.
- **Favorites, Notifications & Reviews**: `/favorites` saved providers page, `/notifications` live feed, and 1–5 star post-completion reviews.
- **Cold-Start Retry UX**: Automatic `GET` retry with a `"Server is waking up, retrying..."` banner during Render cold starts.

### Service Provider (`provider-app`)
- **Uber/Rapido-Style Duty & Presence**: Explicit Online/Offline toggle paired with periodic presence heartbeats (`120s` timeout).
- **Request & Job Execution Flow**: Real-time request queue (`REQUESTED` -> `ACCEPTED`/`REJECTED` -> `ON_THE_WAY` -> `ARRIVED` -> `IN_PROGRESS` via customer Start OTP -> `COMPLETED`).
- **Payment Handling**: On `COMPLETED`, `paymentStatus` remains `PENDING` (neither `UPI` nor `CASH` is auto-marked `PAID`). For `CASH` bookings, the provider clicks **Confirm Cash Received** (`PUT /api/provider/bookings/{id}/confirm-cash`) to set `paymentStatus = PAID`.
- **Earnings Analytics**: Realized revenue calculated strictly from `COMPLETED` + `PAID` bookings across 7-day and 30-day charts.

### Administrator (`admin-app`)
- **Platform KPIs & Trends**: Overview counts, realized revenue, and daily trend chart.
- **Provider Verification**: Approve (`VERIFIED`) or reject (`REJECTED` with mandatory notes) pending provider registrations.
- **Paginated Audit Tables**: Cursor-paginated views for Providers, Users, Bookings, and Reviews (`limit` + `cursor`), plus review hide/unhide moderation (excluded from public listings and rating averages).

---

## Tech Stack

- **Backend**: Java 21 LTS, Spring Boot 3.2.5, Spring Security 6, Bucket4j 8.10.1, `firebase-admin` 9.3.0, `ch.hsr:geohash` 1.4.0, JavaMail
- **Frontend**: React 18.3, Vite 5.3, Tailwind CSS 3.4, React Router DOM 6.23, Axios 1.7, Firebase SDK 10.12, Leaflet 1.9 / React-Leaflet 4.2, Recharts, `react-hot-toast`
- **Database**: Google Cloud Firestore (Native Mode)

---

## Firestore Collections & Security Rules

```text
Firestore Root
├── users/{uid}                         # Role, profile metadata, emailVerified (backend-only)
├── providers/{uid}                     # Public non-sensitive discovery fields only (no email/phone)
├── provider_private/{uid}              # Provider email & phone (backend-only via Admin SDK)
├── services/{serviceId}                # 10 seeded service categories
├── bookings/{bookingId}                # Booking state, schedule, amount (paise), paymentMethod/Status
│   └── secrets/otp                     # Customer-only subdoc holding 4-digit startOtp
├── notifications/{notifId}             # Per-user notifications (field: read)
├── reviews/{reviewId}                  # Customer reviews & moderation hidden flag
├── favorites/{customerId_providerId}   # Customer bookmarked providers
└── otp_verifications/{id}              # SHA-256 hashed 6-digit email OTPs (backend-only)
```

Security rules (`firestore.rules`) deny all direct client writes (`allow write: if false`), block public reads on `providers/{id}` containing `email` or `phone`, restrict `bookings/{id}/secrets/otp` strictly to the booking's `customerId`, and lock `provider_private`, `users`, `services`, `reviews`, and `favorites` from direct client access.

---

## API Overview

- **Auth (`/api/auth`)**: `POST /send-otp`, `POST /resend-otp`, `POST /verify-email`, `POST /verify-otp`, `POST /register`, `POST /register/provider`, `POST /forgot-password`, `POST /verify-reset-otp`, `POST /reset-password`, `GET /me` (OTP endpoints protected by Bucket4j per-IP and per-email rate limits returning HTTP `429`)
- **Services (`/api/services`)**: `GET /`, `GET /{id}`
- **Public Providers (`/api/providers`)**: `GET /nearby`, `GET /{id}`, `GET /{id}/reviews?limit=&cursor=`
- **Bookings (`/api/bookings`)**: `POST /`, `GET /my`, `GET /{id}`, `PUT /{id}/cancel`
- **Reviews (`/api/reviews`)**: `POST /`
- **Favorites (`/api/favorites`)**: `POST /{providerId}`, `DELETE /{providerId}`, `GET /`, `GET /{providerId}/check`
- **Notifications (`/api/notifications`)**: `GET /?limit=&cursor=`, `GET /unread-count`, `PUT /{id}/read`, `PUT /read-all`
- **Provider Portal (`/api/provider`)**: `GET /dashboard`, `GET /requests`, `GET /bookings`, `PUT /bookings/{id}/status`, `PUT /bookings/{id}/confirm-cash`, `GET /earnings`, `GET /analytics/earnings-trend`, `GET /profile`, `PUT /profile`, `PUT /availability`, `PUT /presence`
- **Admin (`/api/admin`)**: `GET /dashboard`, `GET /analytics/trends`, `GET /providers`, `PUT /providers/{id}/verify`, `GET /users`, `GET /bookings`, `GET /reviews`, `PUT /reviews/{id}/hide`

---

## Configuration & Environment Variables

| Variable Name | Description | Default |
|---|---|---|
| `FIREBASE_CREDENTIALS_PATH` / `APP_FIREBASE_CREDENTIAL_PATH` | Path to Firebase Admin SDK service account JSON (or pass JSON via `FIREBASE_CREDENTIALS_JSON`) | **Required** |
| `APP_FIREBASE_PROJECT_ID` | Firebase Project ID | `localgo-824dd` |
| `DEMO_PROVIDER_PASSWORD` | Password used by `DataSeeder` for seeded demo provider/admin Firebase Auth accounts (no hardcoded fallback; credential seeding skipped if unset) | Empty |
| `BREVO_API_KEY` / `RESEND_API_KEY` / `EMAIL_WEBHOOK_URL` | Optional HTTP transactional email providers for OTP delivery | Empty |
| `MAIL_USERNAME` / `MAIL_PASSWORD` / `MAIL_FROM` | Optional SMTP credentials for OTP delivery | Empty |
| `DEV_OTP_LOGGING` | Log OTPs to console during local development only | `false` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated extra CORS origins merged with localhost & Vercel defaults | Empty |
| `VITE_API_BASE_URL` | Backend base URL for frontend Vite apps | `https://localgo-services-1.onrender.com/` |

---

## Local Setup & Testing

```bash
# 1. Backend tests (Java 21 + Maven)
cd backend
mvn test

# 2. Firestore security rules tests (requires Java 21 + Firebase CLI)
cd firestore-rules-tests
npm install
firebase emulators:exec --only firestore "npm test"

# 3. Frontend builds
cd customer-app && npm install && npm run build
cd ../provider-app && npm install && npm run build
cd ../admin-app && npm install && npm run build
```

---

## License

Licensed under the MIT License.
