# BookSpace — Functionality & File Responsibility Map

> **Generated on:** 2026-03-08

---

## 1. Application Overview

**BookSpace** is a venue booking system for Padre Conceição College of Engineering (PCCE), Goa. It allows authenticated users to browse college venues, request bookings, and track their bookings. Admins can manage venues, approve/reject booking requests, manage users, and generate reports.

**Tech Stack:**
- **Frontend:** React 19 + Vite + Tailwind CSS 4 + React Router v7 + Axios + Recharts + React Big Calendar
- **Backend:** Express 5 (Node.js) + Mongoose (MongoDB Atlas) + JWT + Nodemailer + PDFKit + docx
- **Deployment:** Frontend on Vercel, Backend on Render

---

## 2. File-to-Functionality Map

### Backend Files

| File | Responsibility |
|------|---------------|
| `backend/server.cjs` | Express app entry point. Sets up CORS, cookie parser, body parser, static file serving, health check, routes, graceful shutdown |
| `backend/seed-admin.cjs` | One-time script to create the initial admin user in the database |
| `backend/src/config/config.env` | Environment variables: MongoDB URI, JWT secret, email credentials |
| `backend/src/config/config.env.example` | Template for config.env with documentation |
| `backend/src/config/db.cjs` | MongoDB connection using Mongoose with auto-reconnect handling |
| `backend/src/middleware/auth.cjs` | JWT authentication middleware. Extracts token from `Authorization` header or cookies, verifies it, fetches fresh user role from DB, attaches `req.user` |
| `backend/src/middleware/verifyRole.cjs` | Role-based authorization middleware. Checks `req.user.role` against allowed roles array |
| `backend/src/models/User.cjs` | Mongoose schema for users: name, email, password, phone, role, status (pending/active/rejected), isDeleted (soft delete), resetPasswordOtp fields |
| `backend/src/models/Place.cjs` | Mongoose schema for venues: name, capacity, details, location, image, status, facilities [{name, email, message}] |
| `backend/src/models/Booking.cjs` | Mongoose schema for bookings: userId, placeId, eventTitle, reason, description, eventStartTime, eventEndTime, status (pending/approved/rejected), requestedFacilities [{name, email}] |
| `backend/src/routes/auth.cjs` | Authentication routes: send-otp, signup (with OTP verification), login (JWT + cookie), check-email, forgot-password, verify-otp, reset-password, logout |
| `backend/src/routes/bookings.cjs` | Booking CRUD routes: check-availability, create (with overlap detection + transaction), update status (approve/reject with email notifications), edit/delete, list (my-bookings, recent, pending, approved, all), report generation (PDF/DOCX) |
| `backend/src/routes/places.cjs` | Venue CRUD routes: upload-image (multer), create/update/delete (admin only), list all, get by ID, get popular (aggregation), get bookings for a place |
| `backend/src/routes/stats.cjs` | Admin statistics: total places, active bookings, pending approvals, today's bookings, total bookings, rejected bookings, bookings-by-month chart data |
| `backend/src/routes/users.cjs` | User management: get/update current user profile, change password, list users (paginated + search), approve/reject/soft-delete users (admin only) |
| `backend/src/utils/email.cjs` | Email service using Nodemailer + Gmail SMTP. Singleton transporter, sends HTML formatted emails, validates email format before sending |
| `backend/src/utils/logger.cjs` | Environment-aware logger. Suppresses debug/info logs in production. Sanitizes email addresses in production auth logs |

### Frontend Files

| File | Responsibility |
|------|---------------|
| `frontend/src/main.jsx` | App entry with BrowserRouter, AuthProvider, ThemeProvider |
| `frontend/src/App.jsx` | Route definitions: public routes (login, signup), user routes (dashboard, my-bookings, settings, place details), admin routes (dashboard, requests, bookings, venues, users, settings) |
| `frontend/src/config/api-config.js` | API base URL config: production → Render, dev → localhost:10000 with health check fallback |
| `frontend/src/utils/api.js` | Shared Axios instance with request/response interceptors, auto-attaches auth token, logs API calls, handles 401 by clearing token |
| `frontend/src/utils/logger.js` | Frontend logging utility, suppressed in production |
| `frontend/src/context/AuthContext.jsx` | Authentication state (user, loading, login, logout, refreshUser). Manages localStorage token + userData caching. Supports offline fallback using cached data |
| `frontend/src/context/ThemeContext.jsx` | Dark/light/system theme management using localStorage + CSS class toggling |
| `frontend/src/auth/LoginPage.jsx` | Login form: email + password, forgot password modal trigger, navigates to admin/user dashboard based on role |
| `frontend/src/auth/SignupPage.jsx` | Multi-step signup: email → send OTP → enter OTP + details → submit. Shows success message on completion |
| `frontend/src/admin/AdminDashboardPage.jsx` | Admin dashboard: stats grid (6 stat cards), monthly bookings bar chart (Recharts), quick actions |
| `frontend/src/admin/BookingRequestsPage.jsx` | Pending bookings list for admin: approve/reject with reason modal, email notifications on status change |
| `frontend/src/admin/AllBookingsPage.jsx` | All bookings table with filtering (status, venue, date range), sorting, search, pagination, export to PDF/DOCX |
| `frontend/src/admin/VenueManagementPage.jsx` | Venue CRUD UI: add/edit/delete venues using a modal form with image upload, facilities management, confirmation dialogs |
| `frontend/src/admin/UserManagementPage.jsx` | User management table: search, filter by status, paginated list, approve/reject/delete actions |
| `frontend/src/user/UserDashboardPage.jsx` | User dashboard: available venues grid, popular places list, recent bookings |
| `frontend/src/user/MyBookingsPage.jsx` | User's booking history: edit/delete for pending bookings |
| `frontend/src/places/PlaceDetailsPage.jsx` | Venue detail page with interactive calendar (React Big Calendar), event color coding, booking modal trigger, event details popup |
| `frontend/src/venues/VenueDetailPage.jsx` | Simplified venue detail view (used elsewhere) |
| `frontend/src/settings/SettingsPage.jsx` | Profile settings (name, phone), password change, theme selection |
| `frontend/src/components/shared/Layout.jsx` | Page layout with sidebar navigation and mobile sidebar |
| `frontend/src/components/shared/Sidebar.jsx` | Navigation sidebar: different links for admin vs user role |
| `frontend/src/components/shared/PrivateRoute.jsx` | Route guard: redirects unauthenticated users to login, non-admins away from admin routes, admins away from user routes |
| `frontend/src/components/shared/BookingModal.jsx` | Booking creation/editing form: place selector, date/time pickers (12h format), facilities selection, real-time availability check |
| `frontend/src/components/shared/ConfirmationModal.jsx` | Reusable confirmation dialog for destructive actions |
| `frontend/src/components/shared/ForgotPasswordModal.jsx` | 3-step forgot password flow: enter email → verify OTP → set new password |
| `frontend/src/components/shared/BookingModal.jsx` | Booking form modal with availability checking |
| `frontend/src/components/admin/VenueModal.jsx` | Admin venue create/edit modal with image upload and facilities management |
| `frontend/src/components/admin/AdminStatsGrid.jsx` | Six stat cards for admin dashboard |
| `frontend/src/components/admin/AdminQuickActions.jsx` | Quick action buttons for admin |
| `frontend/src/components/ui/*.jsx` | Reusable UI primitives: Badge, Button, Card, Input, Select, StatCard, Toast, BookingCard, EmptyState, and skeleton loaders |

---

## 3. Key Business Rules & Functionality Details

### 3.1 User Registration & Approval Flow
1. User submits email → backend sends 6-digit OTP via Gmail SMTP
2. User enters OTP + details (name, password, phone) → account created with `status: 'pending'`
3. Admin sees pending users in User Management → approves or rejects
4. Approval/rejection sends email notification to user
5. Only `active` users can log in

### 3.2 Authentication Flow
- Login returns JWT (24h expiry) in both httpOnly cookie and response body
- Frontend stores token in localStorage and sends via `Authorization: Bearer` header
- Backend auth middleware checks header first, then cookie
- Auth middleware fetches fresh user role from DB on every request (prevents stale cached JWT role)
- Rate limiting: 5 login attempts per 15 minutes, 3 OTP requests per 5 minutes

### 3.3 Booking Flow
1. User browses venues (public) → selects a venue → views calendar of existing bookings
2. Clicks "Book Now" → booking modal opens with date/time pickers
3. **Minimum booking date:** Tomorrow (frontend enforces 24-hour advance booking via `getMinDate()`)
4. **Maximum booking date:** 1 month from today (frontend enforces via `getMaxDate()`)
5. Real-time availability check: frontend calls `POST /bookings/check-availability` as user types
6. Overlap detection: Only checks against `approved` bookings (not pending)
7. Booking created with `status: 'pending'`
8. Admin reviews in Booking Requests page → approves or rejects
9. On approval: double-checks for overlaps, sends email to user + requested facility managers
10. On rejection: requires reason, sends email to user

### 3.4 Time Gap Between Bookings
- **Current implementation: ZERO time gap is enforced between consecutive bookings**
- The overlap check uses strict boundary comparison: back-to-back bookings (e.g., 9:00–10:00 and 10:00–11:00) are allowed
- No buffer/gap time is configured for venue setup or cleanup
- This is the overlap query used:
  ```
  eventStartTime < newEndTime AND eventEndTime > newStartTime
  ```
  This means two bookings that share an edge (end of one = start of next) do NOT overlap and are both allowed

### 3.5 Venue Management (Admin Only)
- CRUD operations on venues with image upload (multer, max 5MB, jpeg/jpg/png/gif/webp)
- Venues have facilities: [{name, email, message}] — these are staff contacts notified on booking approval
- Deleting a venue is blocked if it has active or pending bookings

### 3.6 User Management (Admin Only)
- List users with pagination (max 100/page), search (name/email), filter by status
- Approve pending users (sends email)
- Reject users (sends email)
- Soft-delete users (`isDeleted: true`) — prevents login, admin cannot delete themselves

### 3.7 Reporting & Export (Admin Only)
- Export bookings as PDF or DOCX with filters (status, venue, date range, search)
- PDF: paginated table with alternating row colors
- DOCX: table format using the `docx` library

### 3.8 Admin Dashboard Statistics
- Total venues, active bookings (approved + future), pending approvals, today's bookings
- Total bookings count, rejected bookings count
- Monthly bookings bar chart (current year aggregation)

### 3.9 Password Reset Flow
1. User enters email → backend sends OTP (anti-enumeration: same response whether email exists or not)
2. User enters OTP → verified against DB
3. User enters new password → hashed and saved, OTP cleared

### 3.10 Theme System
- Light, Dark, System modes stored in localStorage
- Toggled via Settings page
- Applied via `dark` class on `<html>` element

---

## 4. API Endpoints Summary

### Auth (`/api/auth`)
| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/send-otp` | Public | Send signup verification OTP |
| POST | `/signup` | Public | Register new user (with OTP) |
| POST | `/login` | Public | Login, returns JWT |
| POST | `/check-email` | Public | Check if email exists |
| POST | `/forgot-password` | Public | Send password reset OTP |
| POST | `/verify-otp` | Public | Verify password reset OTP |
| POST | `/reset-password` | Public | Reset password with OTP |
| POST | `/logout` | Public | Clear auth cookie |

### Bookings (`/api/bookings`)
| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/check-availability` | Public | Check venue availability |
| POST | `/` | User | Create a booking |
| PUT | `/:id/status` | Admin | Approve/reject booking |
| PUT | `/:id` | User (owner) | Edit pending booking |
| DELETE | `/:id` | Owner/Admin | Delete a booking |
| GET | `/my-bookings` | User | Get user's bookings |
| GET | `/recent` | User | Get user's recent bookings |
| GET | `/pending` | Admin | Get all pending bookings |
| GET | `/approved` | Admin | Get all approved bookings |
| GET | `/` | Admin | Get all bookings |
| GET | `/report` | Admin | Export bookings (PDF/DOCX) |

### Places (`/api/places`)
| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/upload-image` | Admin | Upload venue image |
| POST | `/` | Admin | Create venue |
| PUT | `/:id` | Admin | Update venue |
| DELETE | `/:id` | Admin | Delete venue |
| GET | `/popular` | Public | Get top 5 popular venues |
| GET | `/:id` | Public | Get venue details |
| GET | `/` | Public | Get all venues |
| GET | `/:id/bookings` | User | Get bookings for a venue |

### Users (`/api/users`)
| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/me` | User | Get current user profile |
| PUT | `/me` | User | Update profile (name, phone) |
| PUT | `/me/password` | User | Change password |
| GET | `/` | Admin | List all users (paginated) |
| PUT | `/:id/approve` | Admin | Approve user |
| PUT | `/:id/reject` | Admin | Reject user |
| DELETE | `/:id` | Admin | Soft-delete user |

### Stats (`/api/stats`)
| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/` | Admin | Dashboard statistics |
| GET | `/bookings-by-month` | Admin | Monthly bookings chart data |

### Health
| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/health` | Public | Server + DB health check |
