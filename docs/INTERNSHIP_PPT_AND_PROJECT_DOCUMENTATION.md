# LocalGo Services — Internship Presentation & Project Documentation
**Review 1 & 2 Presentation Guide | Department of Computer Applications | MITS Deemed to be University**

---

## 📌 Document Overview
This document contains the complete technical and presentation documentation for **LocalGo Services**, an on-demand local service marketplace. It is organized specifically to help you build your **PowerPoint slides**, write your **internship report**, and answer **evaluator/viva questions** in clear, simple English.

---

## 📑 Table of Contents
1. [Slide 1: Title & Student Details](#slide-1-title--student-details)
2. [Slide 2: Organization & Internship Profile](#slide-2-organization--internship-profile)
3. [Slide 3: Problem Statement](#slide-3-problem-statement)
4. [Slide 4: Proposed Solution & Key Objectives](#slide-4-proposed-solution--key-objectives)
5. [Slide 5: Comprehensive Technology Stack](#slide-5-comprehensive-technology-stack)
6. [Slide 6: System Architecture & Workflow](#slide-6-system-architecture--workflow)
7. [Slide 7: Core Modules & Role-Based Portals](#slide-7-core-modules--role-based-portals)
8. [Slide 8: Database Design & Firestore Schema](#slide-8-database-design--firestore-schema)
9. [Slide 9: Key Technical Implementations & Algorithms](#slide-9-key-technical-implementations--algorithms)
10. [Slide 10: Screenshots & UI Walkthrough](#slide-10-screenshots--ui-walkthrough)
11. [Slide 11: Challenges Overcome & Solutions](#slide-11-challenges-overcome--solutions)
12. [Slide 12: Future Enhancements & Conclusion](#slide-12-future-enhancements--conclusion)
13. [🎓 Evaluator / Viva Q&A Cheat Sheet](#-evaluator--viva-qa-cheat-sheet)

---

## Slide 1: Title & Student Details

### Slide Content:
* **Project Title**: **LocalGo Services — Location-First On-Demand Home Service Marketplace**
* **Project Type**: Full-Stack Web Application (Internship Project)
* **Student Name**: Vivek Boggala
* **Department**: Department of Computer Applications
* **Institution**: MITS Deemed to be University
* **Presentation Stage**: Internship Review 1 / Review 2

---

## Slide 2: Organization & Internship Profile

### Slide Bullet Points:
* **Role**: Full-Stack Web Development Intern
* **Domain**: Cloud Computing, Real-Time Web Applications & Geolocation Services
* **Internship Objective**: 
  * Design, develop, and deploy an enterprise-grade service booking web platform.
  * Implement end-to-end user journeys for both service seekers and independent technicians.
  * Deploy a resilient distributed architecture using cloud databases and serverless web hosting.

### Simple English Explanation for PPT:
> *"During my internship, I worked as a Full-Stack Web Development Intern. My primary task was to design and develop **LocalGo Services**, a location-aware web marketplace that helps household users discover and book verified doorstep technicians like electricians, plumbers, and AC repair experts."*

---

## Slide 3: Problem Statement

### Slide Bullet Points:
* **Unorganized Local Market**: Traditional directories (classified ads or phone lists) lack verification and trust.
* **Inaccurate Proximity**: Customers often call service workers who are too far away, leading to excessive delays or high travel charges.
* **Lack of Price Transparency**: Customers have no upfront price visibility before inviting a technician home.
* **Double-Booking & Manual Clashes**: Providers manage schedules via phone calls, resulting in frequent appointment conflicts.
* **No Real-Time Tracking**: Customers have no way to know if a technician is on the way or when the job starts.

### Simple English Explanation for PPT:
> *"In most cities and towns, finding an electrician or plumber on short notice is frustrating. Phone directories give unverified contacts, prices are arbitrary, and there is no tracking. LocalGo solves this by providing verified profiles, upfront pricing, and real-time status updates."*

---

## Slide 4: Proposed Solution & Key Objectives

### Slide Bullet Points:
* **Location-Based Discovery**: Uses device GPS and the mathematical Haversine formula to surface the nearest active professionals within a customizable radius (3 km to 25 km).
* **Dual Portal Architecture**:
  * **Customer Portal**: Search services, view nearby providers on an interactive map, and book with one click.
  * **Provider Portal**: Accept/reject jobs, track live jobs, toggle online availability, and view daily earnings.
* **Conflict-Free Scheduling**: Prevents booking overlapping time slots for the same technician.
* **Secure OTP Verification**: 6-digit start and completion codes to ensure work is verified before payment.
* **Cloud-First Scalability**: Integrated with Google Cloud Firestore for real-time live document synchronization.

---

## Slide 5: Comprehensive Technology Stack

| Layer | Technologies Used | Purpose / Responsibility |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18.3, Vite 5.3** | Lightning-fast component rendering, single-page application routing |
| **Styling & UI** | **Tailwind CSS 3.4, Lucide React** | Clean, responsive design, custom card patterns, accessibility icons |
| **Mapping Engine** | **Leaflet 1.9, React-Leaflet 4.2** | Interactive OpenStreetMap integration, custom technician map pins |
| **Backend REST API** | **Java 21, Spring Boot 3.2.5** | Robust enterprise business logic, validation, conflict engine |
| **Cloud Database** | **Google Cloud Firestore** | NoSQL cloud collection storage with live document snapshot listeners |
| **Authentication** | **Firebase Auth & Spring Security 6** | Secure JWT bearer token verification and role-based route guards |
| **Spatial Engine** | **Geohash (Base32) & Haversine Formula** | Sub-second bounding box queries and exact distance calculations |
| **Hosting & CI/CD** | **Vercel (Frontend), Render (Backend), GitHub** | Automated Git-triggered cloud deployment and hosting |

---

## Slide 6: System Architecture & Workflow

```
[ Customer Web App ]               [ Provider Portal App ]
       │                                     │
       ├──────────────┬──────────────────────┤
       │ HTTPS REST   │ WebSocket Listener   │
       ▼              ▼                      ▼
[ Spring Boot 3 REST API ]        [ Google Cloud Firestore ]
  ├── Security Filter (JWT)         ├── users collection
  ├── Spatial Proximity Engine       ├── providers collection
  ├── Slot Conflict Prevention       ├── services collection
  └── OTP Verification Flow          └── bookings collection (Live Sync)
```

### 3-Tier Workflow:
1. **Client Tier**: Separate lightweight Vite apps for Customer and Provider, consuming JSON REST APIs.
2. **Application Tier**: Spring Boot handles booking validations, spatial filtering, OTP checks, and status state machine.
3. **Data Tier**: Cloud Firestore stores collections and pushes instant WebSocket updates to connected clients.

---

## Slide 7: Core Modules & Role-Based Portals

### 1. Customer Portal
* **Service Catalog**: 10 curated categories (Electrical, Plumbing, AC Repair, Cleaning, Painting, Appliance Repair, Gadget Clinic, etc.).
* **Smart Filter & Radius Slider**: Filter technicians by rating (3+ to 5 stars), maximum rate, and distance (3–25 km).
* **Interactive Map View**: Visual pins showing nearby technicians in Indiranagar, Koramangala, Whitefield, etc.
* **Doorstep Booking Engine**: Choose appointment date, time slot, payment mode (Cash/Online), and submit address.
* **My Bookings Dashboard**: Multi-tab tracking (`REQUESTED`, `ACCEPTED`, `ON_THE_WAY`, `IN_PROGRESS`, `COMPLETED`).

### 2. Service Provider Portal
* **Live Incoming Requests**: Accept or reject new doorstep jobs within the provider's coverage radius.
* **Active Job Controller**: Step-by-step progress buttons (*On the Way*, *Arrived*, *Start Work with OTP*, *Complete*).
* **Availability Toggle**: Real-time switch to go Offline/Online instantly.
* **Financial Analytics**: Total realized earnings, pending payouts, and a 7-day visual revenue trend.

### 3. Administrator Portal
* Provider credential verification (license & ID check).
* Service catalog category configuration.
* Platform-wide booking analytics and review moderation.

---

## Slide 8: Database Design & Firestore Schema

### Primary Collections:

#### 1. `users` Collection
* Stores customer and provider identities.
* Attributes: `id` (UID), `name`, `email`, `phone`, `role` (`CUSTOMER` / `PROVIDER` / `ADMIN`), `city`, `createdAt`.

#### 2. `providers` Collection (e.g. Master Electrician)
* Stores verified provider profiles and service rates.
* Attributes: `id`, `name`, `primaryServiceId` (`electrician`), `experienceYears`, `rating` (e.g. 4.92), `completedJobs` (148), `serviceRadiusKm` (15 km), `startingPrice` (₹249), `latitude`, `longitude`, `geohash`, `available` (boolean), `verificationStatus` (`VERIFIED`), `services` (array of sub-services).

#### 3. `bookings` Collection
* Stores individual service requests and lifecycle states.
* Attributes: `id` (e.g. `BOOK-1001`), `customerId`, `providerId`, `serviceName`, `status` (`REQUESTED` → `ACCEPTED` → `ON_THE_WAY` → `ARRIVED` → `IN_PROGRESS` → `COMPLETED`), `amount`, `startOtp` (4 digits), `completionOtp` (4 digits), `scheduledDate`, `scheduledTime`, `paymentStatus`.

---

## Slide 9: Key Technical Implementations & Algorithms

### 1. Haversine Distance Formula (Proximity Matching)
Calculates spherical distance across the earth's curved surface between customer $(lat_1, lon_1)$ and provider $(lat_2, lon_2)$:
* Evaluates distance: $d = 2R \cdot \arcsin(\sqrt{\sin^2(\Delta lat / 2) + \cos(lat_1)\cos(lat_2)\sin^2(\Delta lon / 2)})$
* Eliminates technicians outside the provider's designated coverage radius (e.g., > 15 km) before rendering markers.

### 2. Time-Slot Conflict Prevention
Before confirming an appointment, the system queries Firestore for existing bookings for the specified provider:
* Validates $(new\_start < existing\_end) \land (new\_end > existing\_start)$ to prevent double-booking.

### 3. 2-Step OTP Security Flow
* **Start OTP**: Given by customer upon technician arrival to initiate the job timer safely.
* **Completion OTP**: Given only after the repair is inspected and customer is satisfied.

---

## Slide 10: Screenshots & UI Walkthrough

| Screen | Key Elements to Point Out to Evaluator |
| :--- | :--- |
| **Landing Page** (`/`) | Modern typography, grid texture background, 10 quick-service category cards, instant search bar. |
| **Login Page** (`/login`) | **1-Click Quick Demo Login** buttons (Customer & Electrician) for fast presentation demos. |
| **Customer Dashboard** (`/dashboard`) | Location badge (Bengaluru), category filters, nearby verified electrician cards with rating and distance. |
| **Electrician Profile** (`/providers/prov-elec-1`) | Rajesh Kumar's 9-year experience badge, starting rate ₹249, service breakdown, verified customer testimonials. |
| **Interactive Map** (`/map`) | Leaflet map with technician pins and interactive sidebar cards. |
| **My Bookings** (`/my-bookings`) | Status badges (`IN_PROGRESS`, `ACCEPTED`, `COMPLETED`), OTP badges, and re-booking button. |
| **Provider Dashboard** (`/provider/dashboard`) | Active job monitor, today's requests badge (3), total earnings (₹52,450), and availability toggle. |

---

## Slide 11: Challenges Overcome & Solutions

1. **Challenge: Real-Time vs. REST Consistency**
   * *Problem*: Users did not see booking status changes without manually refreshing the browser.
   * *Solution*: Implemented Firestore `onSnapshot` WebSocket listeners on client apps so cards transition live (e.g. from `REQUESTED` to `ACCEPTED`) without page reloads.

2. **Challenge: GPS Permission Denial in Web Browsers**
   * *Problem*: Some users block browser location permissions.
   * *Solution*: Built a manual Location Selector with fallback cities (Bengaluru, Chennai, Hyderabad, Delhi) so the user is never blocked from finding providers.

3. **Challenge: Presentation / Demo Reliability (Offline Fallback)**
   * *Problem*: Cloud servers can experience cold starts or slow networks during a viva presentation.
   * *Solution*: Implemented an intelligent client-side Axios fallback interceptor that smoothly serves local temporary data if network latency exceeds limits.

---

## Slide 12: Future Enhancements & Conclusion

### Future Enhancements:
* **In-App Real-Time Chat & VoIP**: Direct messaging between customer and technician without sharing personal phone numbers.
* **Integrated Payment Gateways**: Native Razorpay / UPI intent deep-linking with escrow payouts.
* **AI-Powered Technician Dispatch**: Machine learning model predicting technician arrival time based on live traffic data.

### Conclusion:
* LocalGo Services successfully addresses the fragmented local service sector.
* Combines **modern frontend engineering (React 18)**, **scalable cloud infrastructure (Firestore + Spring Boot)**, and **location intelligence** to deliver a reliable, enterprise-ready marketplace.

---

## 🎓 Evaluator / Viva Q&A Cheat Sheet

#### Q1: Why did you choose Google Cloud Firestore instead of MySQL / PostgreSQL?
> **Answer**: *"Firestore provides native real-time document listeners (`onSnapshot`). This allows instant status updates (like technician arriving or job started) to appear on the customer's phone without polling the server every few seconds. Its flexible schema also makes it easy to store varying provider service lists and hourly rates."*

#### Q2: How does the location matching work?
> **Answer**: *"We capture the user's latitude and longitude via the browser Geolocation API. On the backend, we filter technicians using 12-character Base32 Geohash indexing and calculate the exact distance using the Haversine formula, filtering out anyone outside the provider's designated coverage radius (e.g., 10 or 15 km)."*

#### Q3: How do you secure user authentication?
> **Answer**: *"Authentication is handled through Firebase Authentication. The client receives a signed JWT ID token on login. Every subsequent API call sends this token in the `Authorization: Bearer <token>` header, which our Spring Boot `FirebaseAuthenticationFilter` verifies using the Firebase Admin SDK."*

#### Q4: What prevents two customers from booking the same electrician at the same time?
> **Answer**: *"Our Spring Boot service enforces a database query checking for overlapping time windows before confirming any booking. If another booking exists for that technician on the same date with an overlapping duration, it rejects the request with a `BookingConflictException`."*

#### Q5: What was your specific contribution to this project?
> **Answer**: *"I worked across the full stack: building the React components and responsive UI with Tailwind CSS, integrating Leaflet interactive maps, configuring Spring Boot REST controllers, establishing the Firestore schema, and deploying the application across Vercel and Render."*
