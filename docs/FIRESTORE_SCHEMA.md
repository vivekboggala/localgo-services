# LocalGo Services — Firestore Database Schema

This document specifies the Firestore database architecture for the LocalGo application, including collection structures, document field types, storage conventions, and API DTO mapping behaviors.

---

## 1. Global Architecture Conventions

- **Storage Engine**: Google Cloud Firestore (Document Store).
- **Primary Keys**: Firestore Document IDs (e.g., auto-generated UUIDs or Firebase Auth UIDs).
- **Timestamps**: Stored as native Firestore Timestamps (serialized from `java.util.Date`).
- **Currency & Pricing**: Stored as **64-bit Integers (`Long`) in the smallest currency unit (paise)**, where `100 paise = 1 INR`. Currency is converted to INR (`BigDecimal`) only at the API response serialization boundary or UI presentation layer to prevent floating-point rounding errors.
- **Geographic Location**: Captured as coordinate pairs (`latitude`, `longitude` as `Double`), with a 12-character Base32 `geohash` for spatial indexing and proximity querying.

---

## 2. Collections and Document Schemas

### 2.1. `users`
Represents registered platform accounts (Customers, Providers, Administrators). Document ID matches the Firebase Authentication UID (`request.auth.uid`).

| Field Name | Type | Constraints / Description | Example |
|---|---|---|---|
| `id` | `String` | Document ID, matches Firebase Auth UID | `"u_abc123"` |
| `name` | `String` | Full name of the user | `"Rahul Sharma"` |
| `email` | `String` | Lowercase email address | `"rahul@example.com"` |
| `phone` | `String` | Phone number with country code | `"+919876543210"` |
| `role` | `String` | `"CUSTOMER"`, `"PROVIDER"`, `"ADMIN"` | `"CUSTOMER"` |
| `createdAt` | `Timestamp` | Account creation timestamp | `2026-10-06T12:00:00Z` |

---

### 2.2. `providers`
Contains service provider profiles, service catalogs, coverage areas, and operational ratings. Document ID matches the provider's Firebase Auth UID.

| Field Name | Type | Unit / Format | Description |
|---|---|---|---|
| `id` | `String` | — | Document ID, matches Firebase Auth UID |
| `name` | `String` | — | Provider full or business name |
| `email` | `String` | — | Lowercase contact email |
| `phone` | `String` | — | Contact phone number |
| `description` | `String` | — | Professional bio / description |
| `experienceYears` | `Integer` | Years | Years of domain experience |
| `latitude` | `Double` | Degrees | Geolocation latitude coordinate |
| `longitude` | `Double` | Degrees | Geolocation longitude coordinate |
| `serviceRadiusKm` | `Double` | Kilometers | Maximum operational radius (default: `10.0`) |
| `geohash` | `String` | Base32 | 12-character spatial geohash for range queries |
| `verificationStatus` | `String` | Enum String | `"PENDING"`, `"VERIFIED"`, `"REJECTED"` |
| `available` | `Boolean` | — | Availability flag (`true` = Online, `false` = Busy) |
| `rating` | `Double` | 0.0 to 5.0 | Average rating score across customer reviews |
| `completedJobs` | `Integer` | Count | Total count of successfully completed jobs |
| `services` | `Array<Map>` | Sub-objects | Array of service offerings (see below) |

#### Storage Shape of `providers.services[]`
Stored in Firestore as an array of embedded maps:
```json
[
  {
    "serviceId": "srv_ac_repair_01",
    "serviceName": "AC Deep Cleaning & Repair",
    "startingPrice": 49900
  }
]
```
- `serviceId` (`String`): Identifier linking to master `services` catalog.
- `serviceName` (`String`): Display name of the service.
- `startingPrice` (`Long`): **Stored in paise** (e.g., `49900` paise = ₹499.00).

#### API Response Shape (`ProviderResponse.services`)
When serialized by Spring Boot for client applications:
```json
[
  {
    "id": "srv_ac_repair_01",
    "name": "AC Deep Cleaning & Repair",
    "active": true
  }
]
```
The lowest `startingPrice` across the array is converted to rupees (`startingPrice: 499.00`) and surfaced at the root of `ProviderResponse`.

#### Response-Only DTO Fields in `ProviderResponse`
The following fields exist on the Java `ProviderResponse` DTO for legacy API compatibility, but are **not** persisted as standalone fields in the Firestore `providers` document:

| DTO Field | Source / Origin in Architecture | Default Value |
|---|---|---|
| `address` | Legacy SQL field; location in Firestore is governed by `latitude`/`longitude` | `null` |
| `city` | Derived dynamically on client via reverse-geocoding coordinates if needed | `null` |
| `state` | Derived dynamically on client via reverse-geocoding coordinates if needed | `null` |
| `country` | Derived dynamically on client via reverse-geocoding coordinates if needed | `null` |
| `postalCode` | Derived dynamically on client via reverse-geocoding coordinates if needed | `null` |
| `profileImage` | Stored via Firebase Storage bucket URL if configured | `null` |
| `serviceArea` | Computed or represented by `serviceRadiusKm` | `null` |
| `distanceKm` | Dynamically calculated per-request relative to customer search coordinates | Calculated |

---

### 2.3. `services`
Master catalog of service types available on LocalGo.

| Field Name | Type | Description |
|---|---|---|
| `id` | `String` | Document ID (e.g., `"srv_cleaning"`) |
| `name` | `String` | Service name (e.g., `"House Cleaning"`) |
| `category` | `String` | Category grouping (e.g., `"HOME_MAINTENANCE"`) |
| `icon` | `String` | Icon key or URL (e.g., `"Wrench"`, `"Sparkles"`) |
| `description` | `String` | Overview of service offerings |
| `defaultDurationMins` | `Integer` | Estimated duration in minutes (e.g., `60`) |

---

### 2.4. `bookings`
Central transactional collection managing service appointments.

| Field Name | Type | Unit / Format | Description |
|---|---|---|---|
| `id` | `String` | — | Document ID (UUID) |
| `customerId` | `String` | — | Firebase Auth UID of customer |
| `customerName` | `String` | — | Customer full name at time of booking |
| `customerPhone` | `String` | — | Customer phone number |
| `providerId` | `String` | — | Firebase Auth UID of provider |
| `providerName` | `String` | — | Provider full or business name |
| `providerPhone` | `String` | — | Provider contact phone |
| `serviceId` | `String` | — | ID of requested service |
| `serviceName` | `String` | — | Snapshot name of service |
| `description` | `String` | — | Customer problem description / instructions |
| `latitude` | `Double` | Degrees | Customer doorstep latitude |
| `longitude` | `Double` | Degrees | Customer doorstep longitude |
| `address` | `String` | — | Formatted customer doorstep address |
| `scheduledDate` | `String` | `YYYY-MM-DD` | Appointment date (ISO-8601 string) |
| `scheduledTime` | `String` | `HH:mm` | Appointment start time (24-hour format) |
| `estimatedDurationMins`| `Integer` | Minutes | Estimated duration of the job |
| `status` | `String` | Enum String | `"REQUESTED"`, `"ACCEPTED"`, `"ON_THE_WAY"`, `"ARRIVED"`, `"IN_PROGRESS"`, `"COMPLETED"`, `"CANCELLED"`, `"REJECTED"` |
| `cancelledBy` | `String` | — | `"CUSTOMER"` or `"PROVIDER"` (if cancelled) |
| `cancellationReason` | `String` | — | Reason provided upon cancellation |
| `amount` | `Long` | **Paise** | Booking cost stored in paise (100 paise = 1 INR) |
| `paymentMethod` | `String` | — | `"CASH"`, `"UPI"`, `"CARD"` |
| `paymentStatus` | `String` | Enum String | `"PENDING"`, `"PAID"`, `"REFUNDED"` |
| `createdAt` | `Timestamp`| — | Timestamp when booking was created |

---

### 2.5. `notifications`
User notifications for real-time alerts and inbox display.

| Field Name | Type | Description |
|---|---|---|
| `id` | `String` | Document ID |
| `userId` | `String` | Target user UID (`request.auth.uid`) |
| `title` | `String` | Notification headline |
| `message` | `String` | Notification body text |
| `type` | `String` | Enum: `"BOOKING_CREATED"`, `"BOOKING_ACCEPTED"`, `"BOOKING_STATUS_UPDATE"`, `"BOOKING_CANCELLED"`, `"GENERAL"` |
| `read` | `Boolean` | Read flag (`false` = unread, `true` = read) |
| `createdAt` | `Timestamp` | Creation timestamp |

---

### 2.6. `reviews`
Customer ratings and reviews for completed bookings.

| Field Name | Type | Description |
|---|---|---|
| `id` | `String` | Document ID |
| `bookingId` | `String` | Associated booking document ID |
| `customerId` | `String` | Reviewing customer UID |
| `customerName` | `String` | Reviewing customer display name |
| `providerId` | `String` | Target provider UID |
| `rating` | `Double` | Rating score (1.0 to 5.0) |
| `comment` | `String` | Feedback review comment |
| `createdAt` | `Timestamp` | Creation timestamp |

---

### 2.7. `favorites`
Saved bookmarks for favorite service providers.

| Field Name | Type | Description |
|---|---|---|
| `id` | `String` | Composite key: `${customerId}_${providerId}` |
| `customerId` | `String` | Customer UID |
| `providerId` | `String` | Bookmarked provider UID |
| `createdAt` | `Timestamp` | Timestamp when marked as favorite |

---

## 3. Security Rules Access Matrix

| Collection | Client Read Permission | Client Write Permission | Server (Admin SDK) |
|---|---|---|---|
| `bookings` | Customer (`customerId == auth.uid`) or Provider (`providerId == auth.uid`) | **Deny All** (`false`) | Full Read/Write |
| `notifications` | Owner (`userId == auth.uid`) | **Deny All** (`false`) | Full Read/Write |
| `users` | **Deny All** (`false`) | **Deny All** (`false`) | Full Read/Write |
| `providers` | **Deny All** (`false`) | **Deny All** (`false`) | Full Read/Write |
| `services` | **Deny All** (`false`) | **Deny All** (`false`) | Full Read/Write |
| `reviews` | **Deny All** (`false`) | **Deny All** (`false`) | Full Read/Write |
| `favorites` | **Deny All** (`false`) | **Deny All** (`false`) | Full Read/Write |
| *All other paths* | **Deny All** (`false`) | **Deny All** (`false`) | Full Read/Write |
