# BookSpace — Knowledge Transfer (KT) Document

> **Project:** PCCE BookSpace — Venue Booking System  
> **Date:** 2026-03-08  
> **Prepared for:** Incoming developer / new team member onboarding  
> **Classification:** Internal — Engineering Team

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Environment Setup & Prerequisites](#4-environment-setup--prerequisites)
5. [How to Run Locally](#5-how-to-run-locally)
6. [Configuration & Environment Variables](#6-configuration--environment-variables)
7. [Database Schema](#7-database-schema)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Core Modules & Business Logic](#9-core-modules--business-logic)
10. [API Reference](#10-api-reference)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Deployment Architecture](#12-deployment-architecture)
13. [Key Decisions & Trade-offs](#13-key-decisions--trade-offs)
14. [Known Issues & Technical Debt](#14-known-issues--technical-debt)
15. [Testing](#15-testing)
16. [Runbooks & Common Operations](#16-runbooks--common-operations)
17. [Glossary](#17-glossary)
18. [Handover Checklist](#18-handover-checklist)

---

## 1. Project Overview

**BookSpace** is a web application built for Padre Conceição College of Engineering (PCCE), Goa. It enables college staff and faculty to:

- Browse available venues (halls, rooms, auditoriums) on campus
- Request bookings for events with specific date/time ranges
- Track booking status (pending → approved/rejected)
- Receive email notifications on booking approvals/rejections

Admins can:
- Manage venues (CRUD + image upload)
- Approve or reject booking requests
- Manage user accounts (approve, reject, delete)
- View dashboard statistics and generate reports (PDF/DOCX)

**User Flow:** Signup (with email OTP verification) → Admin approval → Login → Browse venues → Book → Admin approves → Email notification → Done

---

## 2. Architecture & Tech Stack

```
┌─────────────────┐         ┌─────────────────┐         ┌──────────────┐
│   Frontend      │  HTTPS  │    Backend       │  TCP    │  MongoDB     │
│   (React/Vite)  │◄───────►│   (Express.js)   │◄───────►│  Atlas       │
│   Vercel        │         │   Render         │         │  (Cloud)     │
└─────────────────┘         └─────────────────┘         └──────────────┘
                                    │
                                    │ SMTP
                                    ▼
                            ┌──────────────┐
                            │  Gmail SMTP  │
                            │  (Nodemailer)│
                            └──────────────┘
```

### Tech Stack Details

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend Framework** | React | 19.x | UI components & state management |
| **Build Tool** | Vite | 7.x | Dev server, HMR, production build |
| **CSS** | Tailwind CSS | 4.x | Utility-first styling |
| **Routing** | React Router | 7.x | Client-side routing |
| **HTTP Client** | Axios | 1.x | API calls with interceptors |
| **Charts** | Recharts | 3.x | Admin dashboard charts |
| **Calendar** | React Big Calendar | 1.x | Interactive venue booking calendar |
| **Icons** | Lucide React | 0.536 | SVG icons |
| **Backend Framework** | Express | 5.x | REST API server |
| **Database ORM** | Mongoose | 8.x | MongoDB object modeling |
| **Database** | MongoDB Atlas | — | Cloud-hosted NoSQL database |
| **Authentication** | JWT (jsonwebtoken) | 9.x | Token-based auth |
| **Password Hashing** | bcrypt / bcryptjs | 6.x / 3.x | Secure password storage |
| **Email** | Nodemailer | 7.x | SMTP email delivery |
| **File Upload** | Multer | 2.x | Image upload handling |
| **PDF Generation** | PDFKit | 0.15 | Report export to PDF |
| **DOCX Generation** | docx | 8.x | Report export to Word |
| **Validation** | express-validator | 7.x | Request input validation |
| **Rate Limiting** | express-rate-limit | 8.x | Brute-force protection |

---

## 3. Repository Structure

```
BookSpace/
├── SETUP.md                    # Complete setup & deployment guide
├── functionality.md            # Functionality & file responsibility map
├── KT-Document.md              # This file
│
├── backend/
│   ├── package.json            # Backend dependencies & scripts
│   ├── server.cjs              # Express server entry point
│   ├── seed-admin.cjs          # Admin account seed script
│   ├── uploads/venue/          # Uploaded venue images (gitignored in prod)
│   └── src/
│       ├── config/
│       │   ├── config.env          # Environment variables (DO NOT COMMIT)
│       │   ├── config.env.example  # Env var template
│       │   └── db.cjs              # MongoDB connection setup
│       ├── middleware/
│       │   ├── auth.cjs            # JWT authentication middleware
│       │   └── verifyRole.cjs      # Role-based authorization middleware
│       ├── models/
│       │   ├── User.cjs            # User model (name, email, password, role, status)
│       │   ├── Place.cjs           # Venue model (name, capacity, location, facilities)
│       │   └── Booking.cjs         # Booking model (userId, placeId, times, status)
│       ├── routes/
│       │   ├── auth.cjs            # Auth routes (login, signup, OTP, reset password)
│       │   ├── bookings.cjs        # Booking CRUD + reports
│       │   ├── places.cjs          # Venue CRUD + image upload
│       │   ├── stats.cjs           # Admin dashboard statistics
│       │   └── users.cjs           # User management + profile
│       └── utils/
│           ├── email.cjs           # Nodemailer email service
│           └── logger.cjs          # Environment-aware logging
│
└── frontend/
    ├── package.json
    ├── vite.config.js          # Vite config with dev proxy & Tailwind
    ├── .env.example            # Frontend env var template
    ├── index.html              # HTML entry point
    └── src/
        ├── main.jsx            # React entry point
        ├── App.jsx             # Route definitions
        ├── index.css           # Global styles + Tailwind
        ├── config/
        │   └── api-config.js   # API base URL — reads VITE_API_URL env var
        ├── context/
        │   ├── AuthContext.jsx  # Authentication state & token management
        │   └── ThemeContext.jsx # Dark/light/system theme provider
        ├── auth/
        │   ├── LoginPage.jsx   # Login form
        │   └── SignupPage.jsx  # Signup with OTP verification
        ├── admin/
        │   ├── AdminDashboardPage.jsx   # Admin stats + charts
        │   ├── BookingRequestsPage.jsx  # Approve/reject pending bookings
        │   ├── AllBookingsPage.jsx      # All bookings table + export
        │   ├── VenueManagementPage.jsx  # Venue CRUD
        │   └── UserManagementPage.jsx   # User approval/management
        ├── user/
        │   ├── UserDashboardPage.jsx    # User home (venues + recent bookings)
        │   └── MyBookingsPage.jsx       # User's booking history
        ├── places/
        │   └── PlaceDetailsPage.jsx     # Venue detail + calendar + booking
        ├── settings/
        │   └── SettingsPage.jsx         # Profile, password, theme settings
        ├── components/
        │   ├── shared/   # Layout, Sidebar, PrivateRoute, BookingModal, etc.
        │   ├── admin/    # AdminStatsGrid, VenueModal, AdminQuickActions
        │   └── ui/       # Badge, Button, Card, Input, Select, Toast, Skeletons
        ├── utils/
        │   ├── api.js    # Shared Axios instance
        │   └── logger.js # Frontend logger
        └── styles/
            └── custom-calendar.css  # React Big Calendar custom styles
```

---

## 4. Environment Setup & Prerequisites

### Required Software

| Software | Minimum Version | Purpose |
|----------|----------------|---------|
| Node.js | 18.x | Runtime for backend and frontend tooling |
| npm | 9.x | Package manager (comes with Node.js) |
| Git | 2.x | Version control |
| MongoDB Atlas account | — | Cloud database (or local MongoDB for dev) |
| Gmail account with App Password | — | Email sending (2FA must be enabled) |

### Gmail App Password Setup

1. Enable 2-Factor Authentication on the Google Account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate a new App Password for "Mail"
4. Use the generated 16-character password as `EMAIL_PASS`

---

## 5. How to Run Locally

### Backend

```bash
cd backend
npm install

# Create config.env from the example
cp src/config/config.env.example src/config/config.env
# Edit config.env with your actual values (MongoDB URI, JWT secret, email creds)

# Seed the admin user (first time only)
node seed-admin.cjs

# Start the server
node server.cjs
# Server runs on http://localhost:10000
```

### Frontend

```bash
cd frontend
npm install

# Start dev server
npm run dev
# Runs on http://localhost:5173
# API calls proxied to http://localhost:10000 via Vite proxy
```

### Accessing the App

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:10000/api
- **Health Check:** http://localhost:10000/api/health
- **Default Admin:** admin@bookspace.com / Admin@123 (after running seed script)

---

## 6. Configuration & Environment Variables

### Backend (`backend/src/config/config.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/collegeDB` |
| `JWT_SECRET` | Secret key for signing JWTs (min 32 chars) | Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `EMAIL_USER` | Gmail address for sending emails | `yourapp@gmail.com` |
| `EMAIL_PASS` | Gmail App Password (NOT regular password) | `xxxx xxxx xxxx xxxx` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Server port (default: 10000) | `10000` |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend URLs | `https://your-app.vercel.app` |

### Frontend (Vite environment variables)

| Variable | Description | When needed |
|----------|-------------|-------------|
| `VITE_API_URL` | Full backend API URL, e.g. `https://your-backend.onrender.com/api` | Production only. Not needed for local dev — Vite proxy handles it |

---

## 7. Database Schema

### Users Collection (`users`)

```
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique, indexed),
  password: String (required, bcrypt hashed),
  phone: String (optional),
  role: String (default: 'user'),           // 'user' | 'admin'
  status: String (default: 'pending'),       // 'pending' | 'active' | 'rejected'
  isDeleted: Boolean (default: false),       // Soft delete flag
  date: Date (default: now),
  resetPasswordOtp: String (optional),       // Temporary OTP for password reset
  resetPasswordOtpExpires: Date (optional)   // OTP expiry timestamp
}
Indexes: email, status, isDeleted
```

### Places Collection (`places`)

```
{
  _id: ObjectId,
  name: String (required),
  capacity: Number (required),
  details: String (optional),
  location: String (optional),
  image: String (default: ''),               // Path to uploaded image
  status: String (default: 'available'),
  facilities: [{                              // Staff contacts for the venue
    name: String (required),
    email: String (required),
    message: String (required)
  }],
  createdAt: Date (default: now),
  updatedAt: Date (default: now)
}
Indexes: status, name
```

### Bookings Collection (`bookings`)

```
{
  _id: ObjectId,
  userId: ObjectId → users (required),
  placeId: ObjectId → places (required),
  eventTitle: String (required),
  reason: String (optional),
  description: String (optional),
  eventStartTime: Date (required),
  eventEndTime: Date (required),
  status: String (default: 'pending'),       // 'pending' | 'approved' | 'rejected'
  requestedFacilities: [{                    // Facilities requested for this booking
    name: String (required),
    email: String (required)
  }],
  requestedAt: Date (default: now)
}
Indexes: (placeId + status), userId, (eventStartTime + eventEndTime), status, (placeId + eventStartTime + eventEndTime)
```

---

## 8. Authentication & Authorization

### Authentication Flow

```
User Login
    │
    ├─► POST /api/auth/login (email + password)
    │       │
    │       ├─► Validate input (express-validator)
    │       ├─► Find user in DB
    │       ├─► Check user.status === 'active' && !user.isDeleted
    │       ├─► Compare password with bcrypt
    │       ├─► Generate JWT (payload: {user: {id, name, role}}, expiry: 24h)
    │       ├─► Set httpOnly cookie (token, secure, sameSite: none)
    │       └─► Return { token, user: {id, name, email, role} }
    │
    │
Subsequent API Calls
    │
    ├─► Request includes:
    │       - Authorization: Bearer <token> (header)
    │       - OR token cookie (httpOnly)
    │
    ├─► auth.cjs middleware:
    │       ├─► Extract token from header or cookie
    │       ├─► jwt.verify(token, JWT_SECRET)
    │       ├─► Fetch fresh user from DB (prevents stale role in JWT)
    │       ├─► Check user exists, not deleted, status is active
    │       └─► Attach req.user = {id, name, role}
    │
    └─► verifyRole.cjs middleware (for admin routes):
            └─► Check req.user.role is in allowed roles array
```

### Rate Limiting

| Endpoint Group | Window | Max Attempts |
|---------------|--------|-------------|
| Login (`/api/auth/login`) | 15 minutes | 5 |
| OTP endpoints (send-otp, forgot-password, verify-otp) | 5 minutes | 3 |

### Username/Password Policy

| Field | Constraint |
|-------|-----------|
| Email | Must be valid email format, normalized |
| Password (signup) | Minimum 6 characters |
| Password (change) | Minimum 8 characters |
| Name | 2-50 characters, trimmed, HTML-escaped |

---

## 9. Core Modules & Business Logic

### 9.1 OTP System

- OTPs are stored in-memory (`otpStore` object in `auth.cjs`) — NOT in database
- OTP format: 6-digit random number
- Expiry: 10 minutes
- Cleanup: Expired OTPs purged every 5 minutes via `setInterval`
- **Implication:** OTPs are lost on server restart. If the server has multiple instances, OTPs won't be shared.

### 9.2 Booking Overlap Detection

The system checks for time conflicts when:
1. A user creates a new booking
2. An admin approves a booking

**Overlap query logic (for approved bookings only):**
```javascript
Booking.find({
  placeId: targetPlaceId,
  status: 'approved',
  $or: [
    { eventStartTime: { $lt: newEnd, $gte: newStart } },
    { eventEndTime: { $lte: newEnd, $gt: newStart } },
    { eventStartTime: { $lte: newStart }, eventEndTime: { $gte: newEnd } },
    { eventStartTime: { $gte: newStart }, eventEndTime: { $lte: newEnd } }
  ]
})
```

**Key behaviors:**
- Only approved bookings are considered — pending bookings can overlap
- Back-to-back bookings are allowed (no buffer gap)
- The check on creation uses a MongoDB session/transaction to prevent race conditions
- The admin approval check uses a simpler overlap query

### 9.3 Email Notification System

Emails are sent on these events:
| Event | Recipients |
|-------|-----------|
| OTP for signup | Registering user |
| OTP for password reset | User requesting reset |
| Booking approved | Booking owner + requested facility managers |
| Booking rejected | Booking owner |
| User account approved | User |
| User account rejected | User |
| User account deleted | User |

**Email transport:** Gmail SMTP via Nodemailer (singleton transporter with connection pooling)

### 9.4 File Upload (Venue Images)

- Storage: Local filesystem at `backend/uploads/venue/`
- Naming: `venue-<timestamp>-<random>.ext`
- Allowed types: jpeg, jpg, png, gif, webp
- Max size: 5MB
- Served statically at `/uploads/venue/<filename>`
- **Note:** Uploads are NOT on a CDN. In a multi-instance deployment, uploaded files are only on the instance that received the upload.

### 9.5 Report Generation

- Endpoint: `GET /api/bookings/report?format=pdf|docx&status=...&placeId=...&dateFrom=...&dateTo=...&search=...&sortKey=...&sortDirection=...`
- PDF: PDFKit with pagination, alternating row colors, header row, footer page numbers
- DOCX: docx library with table layout
- Both support all the same filters

---

## 10. API Reference

See `functionality.md` for the complete API endpoints table with methods, paths, access levels, and descriptions.

---

## 11. Frontend Architecture

### State Management

- **Auth state:** React Context (`AuthContext`) — user object, loading flag, login/logout/refreshUser functions
- **Theme state:** React Context (`ThemeContext`) — themeMode (light/dark/system), darkMode boolean
- **Page-level state:** `useState` hooks within each page component — no global state management library

### Routing Strategy

```
/login              → LoginPage (public)
/signup             → SignupPage (public)
/                   → Redirects based on auth + role

/dashboard          → UserDashboardPage (user only)
/my-bookings        → MyBookingsPage (user only)
/settings           → SettingsPage (user only)
/places/:id         → PlaceDetailsPage (user only)

/admin              → AdminDashboardPage (admin only)
/admin/requests     → BookingRequestsPage (admin only)
/admin/bookings     → AllBookingsPage (admin only)
/admin/venues       → VenueManagementPage (admin only)
/admin/users        → UserManagementPage (admin only)
/admin/settings     → SettingsPage (admin only)
/admin/places/:id   → PlaceDetailsPage (admin only)
```

All authenticated routes are wrapped in `<PrivateRoute>` which:
- Redirects to `/login` if not authenticated
- Redirects admins away from user routes
- Redirects non-admins away from admin routes

### API Communication

Two Axios instances exist (this is a known issue — see bugs.md BUG-024):
1. `frontend/src/utils/api.js` — used by most pages and components
2. `frontend/src/context/AuthContext.jsx` — has its own instance for auth-related calls

Both use:
- `withCredentials: true` for cookies
- `Authorization: Bearer <token>` header from localStorage
- Request/response interceptors for logging and auth error handling
- 60-second timeout

---

## 12. Deployment Architecture

### Frontend — Vercel

- Build command: `npm run build` (Vite)
- Output: `dist/`
- Set `VITE_API_URL` environment variable in Vercel dashboard to your backend URL (e.g. `https://your-backend.onrender.com/api`)
- Vercel auto-detects Vite and handles SPA routing (no `vercel.json` required)

### Backend — VPS (Node.js + PM2 + Nginx)

- Start command: `node server.cjs` (managed by PM2)
- Port: 10000 (via `PORT` env var), exposed via Nginx reverse proxy
- Health check: `GET /api/health` (checks MongoDB connection)
- Set `CORS_ORIGINS` to your frontend domain so cross-origin requests are allowed

### Database — MongoDB Atlas

- Database name: `collegeDB`
- Collections: `users`, `places`, `bookings`

### CORS Configuration

Allowed origins are configured via the `CORS_ORIGINS` environment variable (comma-separated).
Localhost origins (`localhost:3000`, `localhost:5173`, `127.0.0.1:5173`) are always allowed.
Set `CORS_ORIGINS=https://your-app.vercel.app` on the backend in production.

---

## 13. Key Decisions & Trade-offs

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| In-memory OTP storage | Simple, no DB overhead for temporary data | Lost on restart; doesn't work with multiple instances |
| JWT in cookie + response body | Cookie for security, body for frontend flexibility | Dual approach creates confusion; body token in localStorage is less secure |
| Fresh DB lookup in auth middleware | Ensures role/status changes are immediately enforced | Adds a DB query to every authenticated request |
| Frontend offline fallback | Handles Render cold starts gracefully | Can show stale user data; potential security concern |
| CommonJS (`.cjs`) for backend | Explicit module format, avoids ESM/CJS compatibility issues | Less modern; can't use top-level await |
| No time gap between bookings | Simpler overlap logic | No buffer for venue setup/cleanup between events |
| Soft delete for users | Preserves data integrity (bookings reference userId) | Deleted users remain in DB; cleanup needed eventually |
| `sameSite: 'none'` cookies | Required for cross-domain (Vercel → Render) | Opens up CSRF risk |
| No WebSocket / real-time | Simpler architecture | Calendar doesn't auto-update; users must manually refresh |

---

## 14. Known Issues & Technical Debt

See `bugs.md` for the complete bug list. Key highlights:

1. **CRITICAL:** Credentials committed in config.env — must be rotated
2. **CRITICAL:** Weak JWT secret — must be replaced
3. **HIGH:** Token exposed in response body + stored in localStorage
4. **MEDIUM:** No CSRF protection with cross-domain cookies
5. **MEDIUM:** Two separate Axios instances with different base URLs
6. **MEDIUM:** No minimum time gap between bookings
7. **MEDIUM:** Pending bookings can overlap with each other
8. **MEDIUM:** No backend validation for future dates on bookings

### Technical Debt Backlog

- [ ] Consolidate to single Axios instance across frontend
- [ ] Move OTP storage to Redis or database for multi-instance support
- [ ] Add WebSocket support for real-time calendar updates
- [ ] Implement CSRF tokens or switch to `sameSite: 'lax'`
- [ ] Add automated tests (unit + integration)
- [ ] Set up CI/CD pipeline
- [ ] Move file uploads to cloud storage (S3/Cloudinary)
- [ ] Add request logging/monitoring (e.g., Sentry)
- [ ] Implement pagination on bookings list endpoints
- [ ] Add proper `.gitignore` to prevent committing `config.env`

---

## 15. Testing

### Current State

- **No automated tests exist** in the repository
- `@playwright/test` is installed in frontend `dependencies` (should be in devDependencies) but no test files are present
- All testing has been manual

### Recommended Test Strategy

| Type | Tool | Priority |
|------|------|----------|
| Backend API tests | Jest + Supertest | High |
| Frontend component tests | Vitest + React Testing Library | Medium |
| E2E tests | Playwright | Medium |
| Load testing | Artillery or k6 | Low |

### Key Test Scenarios to Cover

1. Login with correct/incorrect credentials
2. Signup + OTP flow
3. Booking creation with overlap detection
4. Booking approval with email notification
5. Admin cannot delete themselves
6. Venue deletion blocked with active bookings
7. Rate limiting enforcement
8. JWT expiration handling

---

## 16. Runbooks & Common Operations

### Create Admin User

```bash
cd backend
node seed-admin.cjs
# Credentials are read from src/config/config.env (ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASS)
```

### Rotate JWT Secret

1. Generate new secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
2. Update `JWT_SECRET` in Render environment variables
3. Restart backend service
4. **Impact:** All existing sessions will be invalidated; users must log in again

### Rotate Email Credentials

1. Generate new Gmail App Password
2. Update `EMAIL_PASS` in Render environment variables
3. Restart backend service

### Clear All Pending Bookings (MongoDB Shell)

```javascript
db.bookings.deleteMany({ status: 'pending' })
```

### Manually Approve a User (MongoDB Shell)

```javascript
db.users.updateOne({ email: 'user@email.com' }, { $set: { status: 'active' } })
```

### Check Server Health

```bash
curl https://your-backend.onrender.com/api/health
```

---

## 17. Glossary

| Term | Definition |
|------|-----------|
| **Place / Venue** | A bookable location on campus (hall, room, auditorium) |
| **Booking** | A request to reserve a venue for a specific time range |
| **Facility** | A staff contact (e.g., AV manager, caretaker) associated with a venue who is notified on booking approval |
| **OTP** | One-Time Password — 6-digit code sent via email for verification |
| **Soft Delete** | Marking a record as deleted (`isDeleted: true`) without removing it from the database |
| **Cold Start** | Delay when Render's free tier spins up the backend after inactivity |

---

## 18. Handover Checklist

### For the Outgoing Developer

- [ ] All code pushed to repository
- [ ] Environment variables documented in `config.env.example`
- [ ] Admin credentials shared securely (not via chat/email)
- [ ] Database access details shared securely
- [ ] Render and Vercel dashboard access transferred
- [ ] Gmail account access (for email service) transferred or documented
- [ ] Known issues documented in `bugs.md`
- [ ] This KT document reviewed and updated

### For the Incoming Developer

- [ ] Repository cloned and running locally
- [ ] Environment variables configured (`config.env` created from example)
- [ ] Seed admin created and login verified
- [ ] Frontend + backend running locally
- [ ] Understood auth flow (signup → OTP → admin approval → login)
- [ ] Understood booking flow (browse → book → admin approval → emails)
- [ ] Reviewed `bugs.md` for critical security issues
- [ ] Access to Render dashboard (backend deployment)
- [ ] Access to Vercel dashboard (frontend deployment)
- [ ] Access to MongoDB Atlas dashboard
- [ ] Access to Gmail account used for email service

---

*End of Knowledge Transfer Document*
