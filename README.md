# 📍 LocalGo Services — Local Service Booking Marketplace

**LocalGo Services** is a full-stack, production-quality local service booking marketplace application built with **Java 21, Spring Boot 3, MySQL 8+, React.js, Vite, Tailwind CSS, and Leaflet Maps**.

Inspired by modern location-first mobility and marketplace applications (Uber, Ola, Rapido), LocalGo Services connects customers with verified nearby service providers (plumbers, electricians, AC technicians, repair experts) using real-time geolocation distance calculations and interactive map tracking.

---

## 🚀 Key Features by Role

### 👤 Customer Portal
- **Location-First Discovery**: Automatic GPS location detection via Browser Geolocation API with manual area fallback (Madanapalle & nearby regions).
- **Nearby Provider Search**: Haversine formula calculation filters providers by distance (km) and coverage radius (`service_radius_km`).
- **Interactive Leaflet Map**: Split desktop and responsive mobile map views with custom customer markers and color-coded provider pins (Green = Available, Gray = Busy).
- **Multi-Step Booking Flow**:
  1. Service category selection
  2. Problem description & instructions
  3. Appointment date & time slot selection
  4. Doorstep address confirmation
  5. Payment method selection (Cash after service / UPI)
- **Booking Conflict Detection**: System prevents overlapping time slot bookings for the same provider.
- **Visual Status Timeline Tracker**: Real-time progress stepper (`REQUESTED → ACCEPTED → ON_THE_WAY → IN_PROGRESS → COMPLETED`) with distinct terminal badges for `REJECTED` and `CANCELLED` (showing `cancelled_by` and reason).
- **Direct Phone Contact**: Instant `tel:` calling button enabled once booking status reaches `ACCEPTED`.
- **In-App Notifications**: Real-time unread notification count badge with 30s auto-polling.
- **Reviews & Ratings**: Rate completed services (1–5 stars) with comments, automatically updating provider profile average ratings.

### 🛠️ Service Provider Studio
- **Provider Onboarding**: Register business details, service area, coverage radius (km), experience years, starting prices, and initial location coordinates.
- **Interactive Request Queue**: View incoming customer booking requests with one-click **Accept** (runs conflict check) or **Reject** (sets status to `REJECTED`).
- **Active Job Lifecycle Management**:
  - `ACCEPTED → ON_THE_WAY` (notifies customer)
  - `ON_THE_WAY → IN_PROGRESS` (notifies customer)
  - `IN_PROGRESS → COMPLETED` (marks payment `PAID`, increments completed jobs)
  - Provider cancellation from `ACCEPTED` or `ON_THE_WAY` with mandatory reason (disallowed once `IN_PROGRESS`).
- **One-Tap Availability Toggle**: Switch status between Online (`Available`) and Offline (`Busy`).
- **Realized Earnings Summary**: Tracks revenue calculated strictly from `COMPLETED` jobs where `paymentStatus = PAID`.

### 🛡️ Admin Control Panel
- **Platform Oversight Dashboard**: Total customers, total providers, pending verifications, active bookings, completed bookings, and total realized platform revenue.
- **Provider Verification Workflow**: Inspect new provider registrations and set status to `VERIFIED` or `REJECTED`.
- **Service Category Management (CRUD)**: Add, edit, or deactivate service categories with custom `default_duration_mins`.
- **Review Moderation**: Toggle review visibility (`hidden = true/false`) for abusive or fake content, automatically excluding hidden reviews from provider ratings.
- **Platform Bookings Audit**: View all platform bookings with status timeline and cancellation audit trail.

---

## 🛠️ Tech Stack

### Backend
- **Language**: Java 21 LTS
- **Framework**: Spring Boot 3.2.5
- **Security**: Spring Security 6, JWT Authentication (`jjwt 0.12.5`), BCrypt password hashing
- **Persistence**: Spring Data JPA, Hibernate ORM
- **Database**: MySQL 8.0+
- **Build Tool**: Maven

### Frontend
- **Framework**: React 18.3
- **Build Tool**: Vite 5.3
- **Styling**: Tailwind CSS 3.4
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios (with JWT bearer request interceptor & 401 response interceptor)
- **Maps**: Leaflet 1.9 & React-Leaflet 4.2 (OpenStreetMap tiles)

---

## 📦 Project Structure

```
d:\Project Hail Mary\
├── backend\
│   ├── pom.xml
│   └── src\main\java\com\localgo\
│       ├── config\          # SecurityConfig, CorsConfig
│       ├── controller\      # AuthController, ServiceController, ProviderController, BookingController, NotificationController, ProviderPortalController, AdminController, ReviewController
│       ├── dto\             # Request & Response DTOs
│       ├── entity\          # User, ProviderProfile, ServiceEntity, ProviderServiceEntity, Booking, Review, Address, Notification
│       ├── enums\           # Role, BookingStatus, VerificationStatus, PaymentStatus, NotificationType
│       ├── exception\       # GlobalExceptionHandler & custom exceptions
│       ├── repository\      # Spring Data JPA repositories & native Haversine/conflict queries
│       ├── security\        # JwtTokenProvider, JwtAuthenticationFilter, CustomUserDetailsService, JwtAuthEntryPoint
│       ├── seed\            # DataSeeder (seeds services, admin, customer, providers around Madanapalle)
│       └── service\         # AuthService, LocationService, ProviderService, BookingService, NotificationService, ProviderDashboardService, AdminService, ReviewService
└── frontend\
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src\
        ├── api\             # Axios instance
        ├── components\      # Common, Customer, Provider, Admin, Map components
        ├── context\         # AuthContext
        ├── hooks\           # useAuth, useLocation, useNotifications
        ├── layouts\         # MainLayout, CustomerLayout, ProviderLayout, AdminLayout
        ├── pages\           # Customer, Provider, Admin pages
        ├── routes\          # AppRoutes
        └── services\        # Frontend API client modules
```

---

## ⚙️ How to Setup & Run

### 1. Database Setup
Ensure MySQL Server 8.0 is running on localhost port 3306 with user `root` and password `root` (or configure credentials in `backend/src/main/resources/application.properties`).

Create database:
```sql
CREATE DATABASE localgo_db;
```

### 2. Run Backend
Navigate to the `backend` directory and run:
```bash
# Set JAVA_HOME to JDK 21 if necessary
mvn spring-boot:run
```
*The backend starts on `http://localhost:8080`. Hibernate auto-creates MySQL tables, and `DataSeeder` populates sample services, admin, customer, and provider accounts.*

### 3. Run Frontend
Navigate to the `frontend` directory and run:
```bash
npm install
npm run dev
```
*The frontend dev server starts on `http://localhost:5173` with Vite proxy configured to `/api` -> `http://localhost:8080`.*

---

## 📧 Free Email OTP & Authentication Configuration

LocalGo Services uses standard Spring Mail (`spring-boot-starter-mail`) connected to **Gmail SMTP** (`smtp.gmail.com:587`, STARTTLS) to deliver 6-digit numeric OTPs for account verification and password reset.

### 🔑 Gmail App Password Setup
1. Log into your Google Account.
2. Navigate to **Security** -> Enable **2-Step Verification**.
3. Search for **App Passwords** under security settings.
4. Generate a new App Password for "LocalGo App".
5. Copy the 16-character generated password (e.g., `abcd efgh ijkl mnop`).

### ⚠️ Gmail SMTP Sending Limits
- Standard free `@gmail.com` accounts have a limit of **500 emails per 24-hour rolling period**.
- Google Workspace accounts have a limit of **2,000 emails per 24 hours**.
- For production scalability beyond 500 OTPs/day, configure a dedicated SMTP provider.

---

## 🔐 Environment Variables Configuration

Set these environment variables before starting the backend application:

```bash
# Gmail SMTP Credentials (Optional for local dev, fallback logging available)
export MAIL_USERNAME="your-email@gmail.com"
export MAIL_PASSWORD="your-16-char-app-password"

# Initial System Admin Creation
export INITIAL_ADMIN_EMAIL="admin@localgo.com"
export INITIAL_ADMIN_PASSWORD="YourSecureAdminPassword123!"

# Optional: Enable OTP print logging in server console for local dev
export DEV_OTP_LOGGING="true"
```

---

## 🔑 Initial Access (Production Ready Data)

| Role | How to Access | Notes |
|---|---|---|
| **Admin** | Environment variables `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` | Pre-verified system administrator account |
| **Customer** | Self-signup via `/signup` -> Email OTP verification | Verify email with 6-digit code sent via Gmail SMTP |
| **Provider** | Self-signup via `/signup` -> Email OTP verification | Registered providers require admin verification |

---

## 📐 Core Algorithm Implementations

### Haversine Distance Formula (MySQL Native Query)
Located in `ProviderProfileRepository.java`:
```sql
SELECT pp.*,
  (6371 * ACOS(
    COS(RADIANS(:lat)) * COS(RADIANS(pp.latitude)) *
    COS(RADIANS(pp.longitude) - RADIANS(:lng)) +
    SIN(RADIANS(:lat)) * SIN(RADIANS(pp.latitude))
  )) AS distance_km
FROM provider_profiles pp
WHERE pp.verification_status = 'VERIFIED'
  AND pp.available = true
  AND pp.latitude BETWEEN :lat - (:radius / 111.0) AND :lat + (:radius / 111.0)
  AND pp.longitude BETWEEN :lng - (:radius / (111.0 * COS(RADIANS(:lat))))
                       AND :lng + (:radius / (111.0 * COS(RADIANS(:lat))))
HAVING distance_km <= :radius
   AND distance_km <= pp.service_radius_km
ORDER BY distance_km ASC;
```

### Booking Conflict Detection Query
Located in `BookingRepository.java`:
```sql
SELECT COUNT(b) FROM Booking b
WHERE b.provider.id = :providerId
  AND b.scheduledDate = :date
  AND b.status IN ('ACCEPTED', 'ON_THE_WAY', 'IN_PROGRESS')
  AND (
    (:requestedTime >= b.scheduledTime AND :requestedTime < FUNCTION('ADDTIME', b.scheduledTime, FUNCTION('SEC_TO_TIME', b.estimatedDurationMins * 60)))
    OR
    (FUNCTION('ADDTIME', :requestedTime, FUNCTION('SEC_TO_TIME', :durationMins * 60)) > b.scheduledTime AND FUNCTION('ADDTIME', :requestedTime, FUNCTION('SEC_TO_TIME', :durationMins * 60)) <= FUNCTION('ADDTIME', b.scheduledTime, FUNCTION('SEC_TO_TIME', b.estimatedDurationMins * 60)))
    OR
    (b.scheduledTime >= :requestedTime AND b.scheduledTime < FUNCTION('ADDTIME', :requestedTime, FUNCTION('SEC_TO_TIME', :durationMins * 60)))
  )
```

---

## 📄 License
This project is open-source and built for commercial-quality demonstration.
