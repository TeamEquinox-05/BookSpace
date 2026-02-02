# BookSpace - College Venue Booking System

A full-stack web application for managing venue bookings at Padre Conceição College of Engineering (PCCE). Built with React, Node.js, Express, and MongoDB.

## Features

### User Features
- **User Authentication**: Secure signup with email OTP verification, login, and password reset
- **Venue Browsing**: View available venues with details (capacity, amenities, cost)
- **Booking Management**: Create, view, edit, and cancel booking requests
- **Real-time Availability**: Check venue availability before booking
- **Email Notifications**: Receive notifications for booking status updates

### Admin Features
- **Dashboard**: Overview of bookings, venues, and statistics
- **Booking Approval**: Approve or reject booking requests with reasons
- **Venue Management**: Create, edit, and delete venues
- **User Management**: Approve, reject, or remove user accounts
- **Reports**: Generate PDF/DOCX reports with filters (date range, status, venue)
- **Analytics**: Monthly booking charts and popular venues

## Tech Stack

### Frontend
- **React 19** with Vite for fast development
- **React Router v7** for navigation
- **Tailwind CSS v4** for styling
- **Framer Motion** for animations
- **Recharts** for data visualization
- **Lucide React** for icons
- **Axios** for API requests

### Backend
- **Node.js** with Express 5
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcrypt** for password hashing
- **express-validator** for input validation
- **express-rate-limit** for rate limiting
- **PDFKit** & **docx** for report generation
- **Nodemailer** for email notifications

## Project Structure

```
BookSpace/
├── backend/
│   ├── server.cjs              # Express server entry point
│   └── src/
│       ├── config/
│       │   ├── config.env      # Environment variables
│       │   └── db.cjs          # MongoDB connection
│       ├── middleware/
│       │   ├── auth.cjs        # JWT authentication middleware
│       │   └── verifyRole.cjs  # Role-based access control
│       ├── models/
│       │   ├── Booking.cjs     # Booking schema
│       │   ├── Place.cjs       # Venue schema
│       │   └── User.cjs        # User schema
│       ├── routes/
│       │   ├── auth.cjs        # Authentication routes
│       │   ├── bookings.cjs    # Booking CRUD routes
│       │   ├── places.cjs      # Venue CRUD routes
│       │   ├── stats.cjs       # Dashboard statistics
│       │   └── users.cjs       # User management routes
│       └── utils/
│           ├── email.cjs       # Email service
│           └── logger.cjs      # Logging utility
│
├── frontend/
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── admin/              # Admin pages
│   │   ├── auth/               # Login/Signup pages
│   │   ├── components/
│   │   │   ├── shared/         # Reusable components
│   │   │   └── ui/             # UI primitives
│   │   ├── context/            # React contexts (Auth, Theme)
│   │   ├── places/             # Venue detail pages
│   │   ├── user/               # User dashboard pages
│   │   └── utils/              # Utilities (api, logger)
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment configuration:
   ```bash
   # Create config.env in backend/src/config/
   touch src/config/config.env
   ```

4. Add the following environment variables to `config.env`:
   ```env
   # MongoDB Connection
   MONGO_URI=mongodb://localhost:27017/bookspace
   # Or for MongoDB Atlas:
   # MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/bookspace

   # JWT Secret (use a strong random string)
   JWT_SECRET=your-super-secret-jwt-key-change-this

   # Server Port
   PORT=5000

   # Node Environment
   NODE_ENV=development

   # Email Configuration (for OTP and notifications)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

5. Start the backend server:
   ```bash
   # Development with auto-reload
   npx nodemon server.cjs

   # Production
   npm start
   ```

   The server will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Create environment configuration:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` if you need to change the API URL:
   ```env
   # For local development
   VITE_API_URL=http://localhost:5000/api

   # For production (default)
   # VITE_API_URL=https://bookspace-be.onrender.com/api
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

   The app will open at `http://localhost:5173`

### Build for Production

```bash
# Frontend
cd frontend
npm run build
npm run preview  # Preview production build

# Backend - deploy server.cjs with Node.js
```

## API Documentation

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://bookspace-be.onrender.com/api`

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/send-otp` | Send OTP for signup | Public |
| POST | `/auth/signup` | Register new user | Public |
| POST | `/auth/login` | Login user | Public |
| POST | `/auth/logout` | Logout user | Public |
| POST | `/auth/forgot-password` | Request password reset OTP | Public |
| POST | `/auth/verify-otp` | Verify password reset OTP | Public |
| POST | `/auth/reset-password` | Reset password | Public |

### Bookings Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/bookings` | Get all bookings | Admin |
| GET | `/bookings/my-bookings` | Get user's bookings | Private |
| GET | `/bookings/pending` | Get pending bookings | Admin |
| GET | `/bookings/approved` | Get approved bookings | Admin |
| GET | `/bookings/recent` | Get recent bookings | Private |
| GET | `/bookings/report` | Generate report (PDF/DOCX) | Admin |
| POST | `/bookings` | Create booking | Private |
| POST | `/bookings/check-availability` | Check venue availability | Public |
| PUT | `/bookings/:id` | Update booking | Owner |
| PUT | `/bookings/:id/status` | Approve/Reject booking | Admin |
| DELETE | `/bookings/:id` | Delete booking | Owner/Admin |

### Places (Venues) Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/places` | Get all venues | Public |
| GET | `/places/:id` | Get venue by ID | Public |
| GET | `/places/popular` | Get popular venues | Public |
| GET | `/places/:id/bookings` | Get venue bookings | Private |
| POST | `/places` | Create venue | Admin |
| PUT | `/places/:id` | Update venue | Admin |
| DELETE | `/places/:id` | Delete venue | Admin |

### Users Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/users` | Get all users (paginated) | Admin |
| GET | `/users/me` | Get current user | Private |
| PUT | `/users/:id/approve` | Approve user | Admin |
| PUT | `/users/:id/reject` | Reject user | Admin |
| DELETE | `/users/:id` | Soft delete user | Admin |

### Statistics Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/stats` | Get dashboard statistics | Admin |
| GET | `/stats/bookings-by-month` | Get monthly booking chart data | Admin |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server and database health status |

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth with 24h expiry
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: express-validator for all inputs
- **NoSQL Injection Prevention**: Mongoose schema validation
- **XSS Prevention**: Input sanitization and output encoding
- **CORS Configuration**: Restricted to allowed origins
- **HTTP-Only Cookies**: Secure cookie handling

## Environment Variables

### Backend (`backend/src/config/config.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `PORT` | Server port (default: 5000) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `EMAIL_HOST` | SMTP host for emails | Yes |
| `EMAIL_PORT` | SMTP port | Yes |
| `EMAIL_USER` | SMTP username/email | Yes |
| `EMAIL_PASS` | SMTP password/app password | Yes |

### Frontend (`frontend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API base URL | No (has default) |

## Deployment

### Backend (Render)
1. Connect your GitHub repository
2. Set environment variables in Render dashboard
3. Deploy with `node backend/server.cjs` as start command

### Frontend (Vercel)
1. Connect your GitHub repository
2. Set `frontend` as the root directory
3. Set build command: `npm run build`
4. Set output directory: `dist`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is developed for Padre Conceição College of Engineering (PCCE).

## Support

For issues or questions, please open a GitHub issue or contact the development team.
