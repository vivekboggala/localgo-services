# LocalGo Services — Local Service Booking Marketplace

LocalGo Services is a full-stack, enterprise-grade local service booking marketplace application built using Java 21, Spring Boot 3, MySQL 8+, React 18, Vite, Tailwind CSS, Leaflet Maps, and Gmail SMTP OTP authentication. The platform enables customers to discover verified nearby service professionals (such as electricians, plumbers, AC repair technicians, and gadget repair experts) using real-time geolocation matching, Haversine formula distance calculations, and interactive map tracking.

---

## Table of Contents

1. [Project Title](#localgo-services--local-service-booking-marketplace)
2. [Project Overview](#project-overview)
3. [Problem Statement](#problem-statement)
4. [Project Objectives](#project-objectives)
5. [Key Features](#key-features)
6. [Technology Stack](#technology-stack)
7. [System Architecture](#system-architecture)
8. [Project Structure](#project-structure)
9. [User Roles and Access](#user-roles-and-access)
10. [Core Modules](#core-modules)
11. [Authentication and Security](#authentication-and-security)
12. [Booking Lifecycle](#booking-lifecycle)
13. [Location-Based Provider Discovery](#location-based-provider-discovery)
14. [Database Entities and Schema](#database-entities-and-schema)
15. [API Overview](#api-overview)
16. [Frontend Structure and Routing](#frontend-structure-and-routing)
17. [Configuration and Environment Variables](#configuration-and-environment-variables)
18. [Prerequisites](#prerequisites)
19. [Local Installation and Setup](#local-installation-and-setup)
20. [Running the Application](#running-the-application)
21. [Production Deployment](#production-deployment)
22. [Testing](#testing)
23. [Project Status](#project-status)
24. [Future Enhancements](#future-enhancements)
25. [License](#license)

---

## Project Overview

LocalGo Services connects households and business customers with qualified local service providers. Inspired by modern location-first marketplaces, the platform incorporates automatic browser geolocation detection, custom service coverage radius calculations, multi-step booking workflows, booking time slot conflict prevention, provider earnings tracking, admin moderation controls, and a secure Email OTP verification engine using standard Gmail SMTP.

---

## Problem Statement

Finding reliable, on-demand local service professionals in specific geographic locations remains fragmented and inefficient:

- **Unverified Listings**: Customers lack verified information regarding provider skills, service radii, and past performance ratings.
- **Inaccurate Proximity**: Traditional directories fail to filter providers based on dynamic user location and service boundaries.
- **Scheduling Conflicts**: Manual phone-based bookings lead to double-booking and unorganized appointment tracking.
- **Security Vulnerabilities**: Legacy systems store raw access codes or lack two-factor verification during registration and credential recovery.
- **Lack of Platform Moderation**: Absence of administrative tools for provider verification and review moderation permits fraudulent activity.

---

## Project Objectives

- **Geographic Precision**: Implement mathematical Haversine distance calculations at the database query level to surface nearby available service providers.
- **Conflict Prevention**: Enforce database-backed time slot overlap validation before confirming bookings.
- **Secure Authentication**: Provide a zero-cost Email OTP authentication pipeline using Spring Mail and Gmail SMTP with SHA-256 hashed OTP storage.
- **Role-Based Workflows**: Deliver dedicated user interfaces for Customers, Service Providers, and Administrators.
- **Production-Ready Standards**: Maintain clean architecture, responsive UI components, RESTful API conventions, and strict state management.

---

## Key Features

### Customer
- **Location-First Discovery**: Automatic GPS location detection via Browser Geolocation API with manual fallback selection for local areas.
- **Nearby Provider Search**: Filters verified providers within a specified radius (km) sorted by distance, rating, or price.
- **Interactive Leaflet Map**: Displays user coordinates alongside color-coded provider pins (Green = Available, Gray = Busy).
- **Multi-Step Booking Wizard**: Select service, enter problem details, choose date and time slot, confirm doorstep address, and select payment method (Cash / UPI).
- **Booking Conflict Prevention**: System blocks overlapping appointment bookings for the selected provider.
- **Visual Status Timeline**: Real-time progress stepper (`REQUESTED -> ACCEPTED -> ON_THE_WAY -> IN_PROGRESS -> COMPLETED`) with cancellation tracking.
- **Repeat Booking ("Book Again")**: One-click repeat booking pre-filling past booking details with fresh date/time selection.
- **Customer Favorites**: Bookmark favorite providers with persistent DB storage.
- **Direct Phone Contact**: Instant phone dialer button enabled upon booking acceptance.
- **Reviews and Ratings**: Submit 1 to 5 star ratings and reviews for completed bookings.
- **Account Security**: Email verification via 6-digit OTP, self-service password reset, and authenticated password changes.

### Service Provider
- **Provider Studio & Profile**: Manage business description, experience years, service area, primary service starting prices, and coverage radius (km).
- **Interactive Request Queue**: View incoming customer requests with one-click Accept or Reject.
- **Active Job Lifecycle Management**: Step bookings through `ACCEPTED -> ON_THE_WAY -> IN_PROGRESS -> COMPLETED`.
- **One-Tap Availability Toggle**: Switch operational status between Online (Available) and Offline (Busy).
- **Realized Earnings Analytics**: View summary metrics and interactive trend charts generated strictly from completed and paid bookings.
- **Security & Settings**: Change account password with current BCrypt password verification.

### Administrator
- **Platform Analytics Dashboard**: Overview metrics (total customers, total providers, pending verifications, active/completed bookings, total revenue) and interactive revenue trend charts.
- **Provider Verification Workflow**: Review new provider registrations and grant `VERIFIED` status or issue rejection.
- **Service Category CRUD**: Create, edit, and update default service durations and categories.
- **Review Moderation**: Toggle review visibility (`hidden = true/false`) to suppress inappropriate content.
- **Platform Bookings Audit**: Complete audit trail of platform-wide bookings and cancellation logs.

---

## Technology Stack

### Backend
- **Language**: Java 21 LTS
- **Framework**: Spring Boot 3.2.5
- **Security**: Spring Security 6, JWT (`jjwt 0.12.5`), BCrypt Password Encoder
- **Email Infrastructure**: `spring-boot-starter-mail` via Gmail SMTP (`smtp.gmail.com:587`, STARTTLS)
- **Persistence**: Spring Data JPA, Hibernate ORM
- **Database**: MySQL 8.0+
- **Build Tool**: Apache Maven

### Frontend
- **Framework**: React 18.3 (ES Modules)
- **Build Tool**: Vite 5.3
- **Styling**: Tailwind CSS 3.4
- **Routing**: React Router DOM 6.23
- **HTTP Client**: Axios with request/response interceptors
- **Mapping**: Leaflet 1.9 & React-Leaflet 4.2 (OpenStreetMap tiles)
- **Data Visualization**: Recharts 3.10
- **Iconography & UI**: Lucide React 1.14, React Hot Toast 2.6

---

## System Architecture

```
[ Client Web Browser ]
        |
        |  HTTP/HTTPS (REST API + JWT Bearer Header)
        v
[ React 18 / Vite SPA ]
   ├── AuthContext & Custom Hooks (useAuth, useLocation, useNotifications)
   ├── React Router Navigation & Protected Routes
   └── Axios Service Modules
        |
        v
[ Spring Boot 3 REST Backend ]
   ├── SecurityFilter (JwtAuthenticationFilter & SecurityConfig)
   ├── Controller Layer (REST Endpoints)
   ├── Service Layer (Business Logic, OtpService, EmailService, Haversine Engine)
   └── Repository Layer (Spring Data JPA & Native MySQL Queries)
        |
        +-----------------------+-----------------------+
        |                                               |
        v                                               v
[ MySQL Database ]                           [ Gmail SMTP Server ]
  (Users, Profiles, Bookings,                  (TLS Port 587 -
   OtpVerifications, Services)                  6-digit HTML OTP Delivery)
```

---

## Project Structure

```
Project Hail Mary/
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/localgo/
│       │   │   ├── LocalGoApplication.java
│       │   │   ├── config/
│       │   │   │   ├── CorsConfig.java
│       │   │   │   └── SecurityConfig.java
│       │   │   ├── controller/
│       │   │   │   ├── AdminController.java
│       │   │   │   ├── AuthController.java
│       │   │   │   ├── BookingController.java
│       │   │   │   ├── FavoriteController.java
│       │   │   │   ├── NotificationController.java
│       │   │   │   ├── ProviderController.java
│       │   │   │   ├── ProviderPortalController.java
│       │   │   │   ├── ReviewController.java
│       │   │   │   └── ServiceController.java
│       │   │   ├── dto/
│       │   │   │   ├── request/
│       │   │   │   └── response/
│       │   │   ├── entity/
│       │   │   │   ├── Address.java
│       │   │   │   ├── Booking.java
│       │   │   │   ├── Favorite.java
│       │   │   │   ├── Notification.java
│       │   │   │   ├── OtpVerification.java
│       │   │   │   ├── ProviderProfile.java
│       │   │   │   ├── ProviderServiceEntity.java
│       │   │   │   ├── Review.java
│       │   │   │   ├── ServiceEntity.java
│       │   │   │   └── User.java
│       │   │   ├── enums/
│       │   │   │   ├── BookingStatus.java
│       │   │   │   ├── NotificationType.java
│       │   │   │   ├── OtpPurpose.java
│       │   │   │   ├── PaymentStatus.java
│       │   │   │   ├── Role.java
│       │   │   │   └── VerificationStatus.java
│       │   │   ├── exception/
│       │   │   │   ├── BadRequestException.java
│       │   │   │   ├── BookingConflictException.java
│       │   │   │   ├── GlobalExceptionHandler.java
│       │   │   │   ├── ResourceNotFoundException.java
│       │   │   │   └── UnauthorizedException.java
│       │   │   ├── repository/
│       │   │   ├── security/
│       │   │   │   ├── CustomUserDetailsService.java
│       │   │   │   ├── JwtAuthEntryPoint.java
│       │   │   │   ├── JwtAuthenticationFilter.java
│       │   │   │   └── JwtTokenProvider.java
│       │   │   ├── seed/
│       │   │   │   └── DataSeeder.java
│       │   │   └── service/
│       │   │       ├── AdminService.java
│       │   │       ├── AuthService.java
│       │   │       ├── BookingService.java
│       │   │       ├── EmailService.java
│       │   │       ├── FavoriteService.java
│       │   │       ├── LocationService.java
│       │   │       ├── NotificationService.java
│       │   │       ├── OtpService.java
│       │   │       ├── ProviderDashboardService.java
│       │   │       ├── ProviderService.java
│       │   │       ├── ReviewService.java
│       │   │       └── ServiceCategoryService.java
│       │   └── resources/
│       │       └── application.properties
│       └── test/
│           └── java/com/localgo/
│               └── LocalGoApplicationTests.java
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── api/
        │   └── axios.js
        ├── components/
        │   ├── admin/
        │   ├── auth/
        │   ├── common/
        │   ├── customer/
        │   ├── map/
        │   └── provider/
        ├── context/
        │   └── AuthContext.jsx
        ├── hooks/
        │   ├── useAuth.js
        │   ├── useLocation.js
        │   └── useNotifications.js
        ├── layouts/
        │   ├── AdminLayout.jsx
        │   ├── CustomerLayout.jsx
        │   ├── MainLayout.jsx
        │   └── ProviderLayout.jsx
        ├── pages/
        │   ├── LandingPage.jsx
        │   ├── LoginPage.jsx
        │   ├── SignupPage.jsx
        │   ├── admin/
        │   ├── auth/
        │   ├── customer/
        │   └── provider/
        ├── routes/
        │   └── AppRoutes.jsx
        └── services/
            ├── adminService.js
            ├── bookingService.js
            ├── favoriteService.js
            ├── notificationService.js
            ├── providerPortalService.js
            ├── providerService.js
            ├── reviewService.js
            └── serviceService.js
```

### Purpose of Key Directories

- **`backend/src/main/java/com/localgo/config/`**: Contains security filter chain definitions, CORS policies, and password encoder bean configurations.
- **`backend/src/main/java/com/localgo/controller/`**: Exposes REST API controllers handling HTTP requests and mapping responses using `ApiResponse<T>`.
- **`backend/src/main/java/com/localgo/entity/`**: Defines JPA domain models representing database tables, indexes, and constraints.
- **`backend/src/main/java/com/localgo/repository/`**: Data access layer containing Spring Data JPA interfaces and custom native queries for Haversine distance and conflict checking.
- **`backend/src/main/java/com/localgo/service/`**: Implements core business logic, transactional boundaries, mail dispatching, and OTP hashing.
- **`frontend/src/api/`**: Centralized Axios client configured with automatic JWT Authorization header injection and 401 response interceptors.
- **`frontend/src/context/`**: React Context providing global user authentication state, token persistence, and login/logout handlers.
- **`frontend/src/routes/`**: Centralized route definitions and `ProtectedRoute` guards mapping URLs to layout components and page views.

---

## User Roles and Access

| Role | Operational Scope | Accessible Endpoints & Views |
|---|---|---|
| **Public / Anonymous** | Service discovery, provider lookup, authentication | `GET /api/services`, `GET /api/providers/nearby`, `/login`, `/signup`, `/verify-email`, `/forgot-password` |
| **Customer** | Booking management, provider search, favorites, reviews | `POST /api/bookings`, `GET /api/bookings/my`, `POST/DELETE /api/favorites/*`, `POST /api/reviews`, `/dashboard`, `/profile` |
| **Provider** | Service requests, active job updates, availability toggle | `GET /api/provider/dashboard`, `PUT /api/provider/bookings/*/status`, `POST /api/provider/availability`, `/provider/dashboard` |
| **Admin** | System management, provider verification, moderation | `/api/admin/*`, `PUT /api/admin/providers/*/verify`, `POST/PUT /api/admin/services`, `/admin/dashboard` |

---

## Core Modules

### 1. Authentication and Security Module
Handles user registration, login, Email OTP verification, JWT generation, password resets, and authenticated password modifications.

### 2. Location and Discovery Module
Uses browser geolocation and Haversine formula calculation queries to return verified providers operating within coverage limits.

### 3. Booking Management Module
Manages booking creation, duration estimation, time slot overlap conflict validation, status workflow progression, and cancellation auditing.

### 4. Provider Studio Module
Provides service providers with active job queues, status steppers, availability toggling, profile configuration, and revenue analytics.

### 5. Admin Control Module
Offers administrative tools for verifying newly registered service providers, managing service category master data, auditing bookings, and moderating reviews.

---

## Authentication and Security

- **JSON Web Tokens (JWT)**: Stateless authentication via `JwtTokenProvider` generating signed HS256 tokens valid for 24 hours. Tokens are validated on protected requests by `JwtAuthenticationFilter`.
- **BCrypt Hashing**: Passwords are hashed using `BCryptPasswordEncoder` prior to database insertion. Current passwords must pass BCrypt matching before updates are processed.
- **Email OTP Engine**: Standard 6-digit numeric OTPs generated via `SecureRandom`.
  - Raw OTPs are **never** stored in the database.
  - Stored as SHA-256 hashes inside the `otp_verifications` table.
  - Enforces a 5-minute expiration timestamp (`expiresAt`).
  - Limits validation attempts to 5 failed tries per code.
  - Implements a 30-second resend cooldown timer.
  - Invalidates older active codes upon issuing a new request or upon successful verification.
- **Email Enumeration Protection**: The `POST /api/auth/forgot-password` endpoint returns a generic success message regardless of whether the submitted email address exists in the system.
- **Method-Level & Route Security**: Enforced using `@EnableMethodSecurity` and `SecurityConfig` matcher chains (`.requestMatchers("/api/admin/**").hasRole("ADMIN")`).

---

## Booking Lifecycle

```
[ CUSTOMER ]               [ PROVIDER ]              [ PROVIDER ]             [ PROVIDER ]
  Creates                     Accepts                  On The Way               In Progress
  Booking                     Job                      To Address               Work Started
     |                           |                         |                        |
     v                           v                         v                        v
 REQUESTED  ------------->   ACCEPTED   ------------->  ON_THE_WAY -------------> IN_PROGRESS
     |                           |                         |                        |
     | (Reject)                  | (Cancel + Reason)       | (Cancel + Reason)      v
     v                           v                         v                    COMPLETED
  REJECTED                   CANCELLED                 CANCELLED             (Payment PAID)
```

### Implemented Booking Statuses (`BookingStatus` Enum)
- `REQUESTED`: Initial state upon customer submission.
- `ACCEPTED`: Provider has reviewed and accepted the appointment request.
- `REJECTED`: Provider declined the booking request.
- `ON_THE_WAY`: Provider is currently traveling to the customer address.
- `IN_PROGRESS`: Service work is actively underway.
- `COMPLETED`: Service successfully completed; payment status set to `PAID`.
- `CANCELLED`: Booking cancelled by customer or provider prior to `IN_PROGRESS` stage.

---

## Location-Based Provider Discovery

Provider discovery combines client-side geolocation detection with server-side spatial distance calculation:

1. **Client Coordinate Capture**: The frontend `useLocation` hook invokes `navigator.geolocation.getCurrentPosition()` to retrieve user latitude and longitude coordinates, falling back to manual location selections if permission is denied.
2. **Haversine Distance Query**: `ProviderProfileRepository` executes a MySQL native query filtering verified and available providers using the spherical law of cosines:

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

3. **Coverage Enforcement**: Results are filtered to ensure the calculated `distance_km` does not exceed the provider's defined `service_radius_km`.

---

## Database Entities and Schema

```
+------------------+         +-----------------------+         +-----------------------+
|      User        | 1     1 |    ProviderProfile    | 1     * | ProviderServiceEntity |
+------------------+---------+-----------------------+---------+-----------------------+
| id (PK)          |         | id (PK)               |         | id (PK)               |
| email (Unique)   |         | user_id (FK)          |         | provider_id (FK)      |
| password         |         | verification_status   |         | service_id (FK)       |
| role             |         | service_radius_km     |         | starting_price        |
| email_verified   |         | latitude, longitude   |         +-----------------------+
+------------------+         +-----------------------+
         |                               |
         | 1                             | 1
         |                               |
         v *                             v *
+----------------------------------------------------+
|                      Booking                       |
+----------------------------------------------------+
| id (PK)                                            |
| customer_id (FK -> User)                           |
| provider_id (FK -> ProviderProfile)                |
| service_id (FK -> ServiceEntity)                   |
| status (REQUESTED, ACCEPTED, IN_PROGRESS, etc.)    |
| scheduled_date, scheduled_time, duration_mins      |
| amount, payment_status, payment_method             |
+----------------------------------------------------+
```

### Entity List
- **`User`**: Base identity entity storing credentials, role (`CUSTOMER`, `PROVIDER`, `ADMIN`), and `emailVerified` boolean.
- **`ProviderProfile`**: Extends provider users with business details, ratings, coordinates, and verification status.
- **`ServiceEntity`**: Catalog of service categories (e.g., AC Repair, Electrician, Plumber) with default duration settings.
- **`ProviderServiceEntity`**: Junction mapping providers to offered services and specific starting prices.
- **`Booking`**: Central transaction entity linking customer, provider, service, schedule, address, status, and payment attributes.
- **`Review`**: Customer reviews, ratings (1–5 stars), and admin moderation visibility flags (`hidden`).
- **`Favorite`**: Junction tracking saved customer-provider pairs with unique constraint `uk_favorite_customer_provider`.
- **`Notification`**: In-app notifications for booking updates and status changes.
- **`OtpVerification`**: Stores SHA-256 hashed OTPs, expiration timestamps, attempt counters, and verification purposes (`EMAIL_VERIFICATION`, `PASSWORD_RESET`).
- **`Address`**: Structured address details linked to users.

---

## API Overview

### Authentication Controller (`/api/auth`)
- `POST /api/auth/register`: Register a customer account (triggers verification OTP).
- `POST /api/auth/register/provider`: Register a service provider account (triggers verification OTP).
- `POST /api/auth/login`: Authenticate user credentials and return JWT token.
- `POST /api/auth/verify-email`: Validate 6-digit OTP code and set `emailVerified = true`.
- `POST /api/auth/resend-otp`: Resend OTP code respecting the 30-second cooldown.
- `POST /api/auth/forgot-password`: Send password reset code (returns generic success response).
- `POST /api/auth/reset-password`: Validate reset code and set new BCrypt password.
- `POST /api/auth/change-password` (Authenticated): Update password after current BCrypt password check.
- `GET /api/auth/me` (Authenticated): Retrieve authenticated user profile data.

### Service Category Controller (`/api/services`)
- `GET /api/services`: List all active service categories.
- `GET /api/services/{id}`: Retrieve specific service category details.

### Provider Controller (`/api/providers`)
- `GET /api/providers/nearby`: Search nearby available providers using lat, lng, radius, and service filters.
- `GET /api/providers/{id}`: Fetch detailed provider profile.
- `GET /api/providers/{id}/reviews`: Fetch published provider reviews.

### Booking Controller (`/api/bookings`)
- `POST /api/bookings`: Create a new appointment booking (performs conflict check).
- `GET /api/bookings/my`: List customer bookings.
- `GET /api/bookings/{id}`: Retrieve detailed booking information.
- `PUT /api/bookings/{id}/cancel`: Cancel a booking with reason.

### Provider Portal Controller (`/api/provider`)
- `GET /api/provider/dashboard`: Retrieve provider studio dashboard metrics.
- `GET /api/provider/requests`: List incoming booking requests.
- `GET /api/provider/bookings`: List provider assigned bookings.
- `PUT /api/provider/bookings/{id}/status`: Progress booking status (`ACCEPTED`, `ON_THE_WAY`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`).
- `POST /api/provider/availability`: Toggle operational status (Online/Offline).
- `PUT /api/provider/profile`: Update business profile settings.
- `GET /api/provider/analytics/earnings-trend`: Fetch earnings trend data for charts.

### Admin Controller (`/api/admin`)
- `GET /api/admin/dashboard`: Fetch platform summary stats and metrics.
- `GET /api/admin/analytics/trends`: Fetch platform revenue trends.
- `GET /api/admin/users`: List platform user accounts.
- `GET /api/admin/providers`: List provider profiles and verification states.
- `PUT /api/admin/providers/{id}/verify`: Verify or reject provider profile.
- `POST /api/admin/services`: Create a new service category.
- `PUT /api/admin/services/{id}`: Update an existing service category.
- `GET /api/admin/bookings`: Audit all platform bookings.
- `PUT /api/admin/reviews/{id}/visibility`: Moderation toggle for review visibility.

### Favorite Controller (`/api/favorites`)
- `POST /api/favorites/{providerId}`: Save a provider to customer favorites.
- `DELETE /api/favorites/{providerId}`: Remove a provider from customer favorites.
- `GET /api/favorites`: List favorited providers.

### Notification Controller (`/api/notifications`)
- `GET /api/notifications`: Retrieve user notifications.
- `PUT /api/notifications/read-all`: Mark notifications as read.

---

## Frontend Structure and Routing

### Layout Components
- **`MainLayout`**: Navigation header and footer layout wrapper for public pages.
- **`CustomerLayout`**: Customer portal navigation, location bar, and unread notification counter wrapper.
- **`ProviderLayout`**: Provider studio sidebar, job alert banner, and status controls layout.
- **`AdminLayout`**: Administrative control panel sidebar and header view layout.

### Centralized Routes (`AppRoutes.jsx`)

| Route Path | Layout | Component | Access Guard |
|---|---|---|---|
| `/` | `MainLayout` | `LandingPage` | Public |
| `/services` | `MainLayout` | `ServiceListPage` | Public |
| `/login` | None | `LoginPage` | Public |
| `/signup` | None | `SignupPage` | Public |
| `/verify-email` | None | `VerifyEmailPage` | Public |
| `/forgot-password` | None | `ForgotPasswordPage` | Public |
| `/dashboard` | `CustomerLayout` | `CustomerDashboard` | Protected (`CUSTOMER`) |
| `/profile` | `CustomerLayout` | `ProfilePage` | Protected |
| `/providers/nearby` | `CustomerLayout` | `NearbyProvidersPage` | Public / Customer |
| `/providers/:id` | `CustomerLayout` | `ProviderDetailPage` | Public / Customer |
| `/map` | `CustomerLayout` | `MapPage` | Public / Customer |
| `/book/:providerId` | `CustomerLayout` | `BookingFlow` | Protected (`CUSTOMER`) |
| `/my-bookings` | `CustomerLayout` | `MyBookingsPage` | Protected (`CUSTOMER`) |
| `/bookings/:id` | `CustomerLayout` | `BookingDetailPage` | Protected |
| `/notifications` | `CustomerLayout` | `NotificationsPage` | Protected |
| `/provider/dashboard` | `ProviderLayout` | `ProviderDashboard` | Protected (`PROVIDER`) |
| `/provider/requests` | `ProviderLayout` | `ProviderRequests` | Protected (`PROVIDER`) |
| `/provider/jobs` | `ProviderLayout` | `ProviderActiveJob` | Protected (`PROVIDER`) |
| `/provider/bookings` | `ProviderLayout` | `ProviderBookings` | Protected (`PROVIDER`) |
| `/provider/earnings` | `ProviderLayout` | `ProviderEarnings` | Protected (`PROVIDER`) |
| `/provider/profile` | `ProviderLayout` | `ProviderProfile` | Protected (`PROVIDER`) |
| `/admin/dashboard` | `AdminLayout` | `AdminDashboard` | Protected (`ADMIN`) |
| `/admin/users` | `AdminLayout` | `AdminUsers` | Protected (`ADMIN`) |
| `/admin/providers` | `AdminLayout` | `AdminProviders` | Protected (`ADMIN`) |
| `/admin/services` | `AdminLayout` | `AdminServices` | Protected (`ADMIN`) |
| `/admin/bookings` | `AdminLayout` | `AdminBookings` | Protected (`ADMIN`) |
| `/admin/reviews` | `AdminLayout` | `AdminReviews` | Protected (`ADMIN`) |

---

## Configuration and Environment Variables

Configuration parameters are managed through Spring Boot `application.properties` and environment variable overrides:

| Variable Name | Description | Default Value (Development) |
|---|---|---|
| `DB_USERNAME` | MySQL Database User | `root` |
| `DB_PASSWORD` | MySQL Database Password | `root` |
| `JWT_SECRET` | Secret key for signing JWT tokens | Pre-configured dev key |
| `MAIL_USERNAME` | Gmail address for SMTP dispatch | Empty (Triggers dev fallback if unconfigured) |
| `MAIL_PASSWORD` | 16-character Gmail App Password | Empty |
| `INITIAL_ADMIN_EMAIL` | Email for seeding initial Admin account | Empty |
| `INITIAL_ADMIN_PASSWORD` | Password for seeding initial Admin account | Empty |
| `DEV_OTP_LOGGING` | Enable console logging of OTPs for local dev | `false` |

---

## Prerequisites

- **Java Development Kit (JDK)**: Version 21 LTS
- **Node.js**: Version 18.0.0 or 20.0.0+
- **Database**: MySQL Server 8.0+
- **Build Tool**: Apache Maven 3.8+ (or included wrapper)
- **Version Control**: Git

---

## Local Installation and Setup

### 1. Database Creation
Launch MySQL CLI or MySQL Workbench and execute:

```sql
CREATE DATABASE localgo_db;
```

### 2. Backend Setup
Navigate to the `backend` directory:

```cmd
cd backend
```

Compile the project:

```cmd
mvn clean compile
```

### 3. Frontend Setup
Navigate to the `frontend` directory:

```cmd
cd frontend
npm install
```

---

## Running the Application

### 1. Launch Backend Service
Set optional environment variables in your terminal prompt before launching:

```cmd
set MAIL_USERNAME=your-email@gmail.com
set MAIL_PASSWORD=your-16-char-app-password
set INITIAL_ADMIN_EMAIL=admin@localgo.com
set INITIAL_ADMIN_PASSWORD=AdminPassword123!
set DEV_OTP_LOGGING=true

cd backend
mvn spring-boot:run
```
The Spring Boot server will start on `http://localhost:8080`. Hibernate will initialize table schemas, and `DataSeeder` will populate the service category master catalog.

### 2. Launch Frontend Dev Server
In a separate terminal window, start Vite:

```cmd
cd frontend
npm run dev
```
The application interface will be accessible at `http://localhost:5173`. Vite proxy routes `/api` requests to `http://localhost:8080`.

---

## Production Deployment

### Recommended Architecture
- **Backend Application**: Hosted as a standalone Web Service on platforms such as Render, Railway, or AWS Elastic Beanstalk using Java 21 containerized environments.
- **Frontend Application**: Deployed to static hosting providers such as Vercel, Netlify, or AWS CloudFront pointing API requests to the backend URL.
- **Database**: Hosted on managed MySQL instances (such as Aiven, PlanetScale, or AWS RDS MySQL).
- **Email Delivery**: Gmail SMTP using App Passwords for low-volume production, or dedicated transactional mail providers (SendGrid, Amazon SES) for high-volume environments.

---

## Testing

### Backend Unit and Integration Compilation
Execute Maven test suites:

```cmd
cd backend
mvn test
```

### Frontend Build Verification
Verify ES module bundling and Vite production compilation:

```cmd
cd frontend
npm run build
```

---

## Project Status

LocalGo Services is fully implemented and operational. Core features — including Haversine discovery, conflict prevention, status workflow transitions, dynamic analytics, interactive Leaflet map integration, and free Gmail SMTP Email OTP authentication — pass compilation and build checks with 0 errors.

---

## Future Enhancements

- **Real-Time Push Notifications**: Integrate WebSocket (STOMP/SockJS) communication for instant provider job alert popups.
- **Payment Gateway Integration**: Integrate commercial payment gateways (such as Razorpay or Stripe) for automated online payments.
- **Multi-Language Support (i18n)**: Provide localization support for regional languages.
- **Provider Identity Verification**: Integrate third-party API verification for provider government ID documentation.

---

## License

This project is licensed under the MIT License — see the project license files for complete details.
