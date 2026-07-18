const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, 'src', 'config', 'config.env') });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./src/config/db.cjs');
const logger = require('./src/utils/logger.cjs');

const cookieParser = require('cookie-parser');

// Connect to Database
connectDB();


const app = express();
app.use(cookieParser());

// Trust proxy only in production (Render reverse proxy)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Init Middleware with body size limit to prevent DoS
// Skip global body parser for db import route (it has its own 50mb limit)
app.use((req, res, next) => {
  if (req.path === '/api/db/import') return next();
  express.json({ limit: '10kb' })(req, res, next);
});
app.use((req, res, next) => {
  if (req.path === '/api/db/import') return next();
  express.urlencoded({ extended: false, limit: '10kb' })(req, res, next);
});

// Define allowed origins
// Set CORS_ORIGINS in config.env as a comma-separated list of production frontend URLs
const envOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = [
  ...envOrigins,
  '*'
];

// Simplify the CORS configuration - use a single approach
// This creates a cleaner middleware chain and reduces conflicts
app.use(cors({
  origin: function (origin, callback) {
    logger.debug('CORS request from origin:', origin);
    
    // Reject requests with no origin in production (prevents CSRF from non-browser clients)
    // Allow in development for tools like curl/Postman
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        logger.warn('Request with no origin blocked in production');
        return callback(new Error('Not allowed by CORS'));
      }
      logger.debug('Request has no origin, allowing in dev mode');
      return callback(null, true);
    }
    
    // Check if origin is in our allowed list
    if (allowedOrigins.includes(origin)) {
      logger.debug('Origin allowed by CORS:', origin);
      callback(null, true);
    } else {
      logger.warn('Origin blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization,X-Auth-Token,X-Request-ID,X-Request-Source',
  exposedHeaders: 'Content-Length,Content-Range',
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400  // Cache preflight request results for 24 hours
}));

// Log all requests for debugging
app.use((req, res, next) => {
  logger.request(req.method, req.path, req.headers.origin);
  next();
});

// NOTE: Uploaded files are served via authenticated route in places.cjs (B-05 fix)
// Removed: app.use('/uploads', express.static(...)) — was publicly accessible

// Health check endpoint with database connectivity verification
app.get('/api/health', async (req, res) => {
  try {
    // Check MongoDB connection state
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const dbState = mongoose.connection.readyState;
    const dbStateNames = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    if (dbState !== 1) {
      return res.status(503).json({
        status: 'unhealthy',
        message: 'Service unavailable',
        uptime: process.uptime()
      });
    }
    
    await mongoose.connection.db.admin().ping();
    
    res.status(200).json({
      status: 'healthy',
      message: 'Server is running',
      uptime: process.uptime()
    });
  } catch (err) {
    logger.error('Health check failed:', err.message);
    res.status(503).json({
      status: 'unhealthy',
      message: 'Service unavailable',
      uptime: process.uptime()
    });
  }
});

// Define Routes
app.use('/api/auth', require('./src/routes/auth.cjs'));
app.use('/api/places', require('./src/routes/places.cjs'));
app.use('/api/bookings', require('./src/routes/bookings.cjs'));
app.use('/api/stats', require('./src/routes/stats.cjs'));
app.use('/api/users', require('./src/routes/users.cjs'));
app.use('/api/db', require('./src/routes/db.cjs'));

const PORT = process.env.PORT || 10000;

const server = app.listen(PORT, () => logger.important(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process gracefully
  server.close(() => {
    logger.important('Server closed due to unhandled rejection');
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err, origin) => {
  logger.error(`Uncaught Exception: ${err.message}\nException origin: ${origin}`);
  // Close server & exit process gracefully
  server.close(() => {
    logger.important('Server closed due to uncaught exception');
    process.exit(1);
  });
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.important('SIGTERM received. Shutting down gracefully...');
  
  // Clean up auth module (OTP cleanup interval)
  try {
    const authModule = require('./src/routes/auth.cjs');
    if (authModule.cleanup) {
      authModule.cleanup();
    }
  } catch (err) {
    logger.error('Error during auth module cleanup:', err.message);
  }
  
  server.close(() => {
    logger.important('Server closed');
    process.exit(0);
  });
});