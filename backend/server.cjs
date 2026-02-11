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

// Set trust proxy to trust the Render reverse proxy
app.set('trust proxy', 1);

// Init Middleware with body size limit to prevent DoS
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Define allowed origins
const allowedOrigins = [
  'https://book-space-3xmh.vercel.app',
  'https://book-space.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',  // Add Vite default development port
  'http://127.0.0.1:5173',
  'https://7143f8d8db88.ngrok-free.app',
    // Also allow 127.0.0.1 (same as localhost)
];

// Simplify the CORS configuration - use a single approach
// This creates a cleaner middleware chain and reduces conflicts
app.use(cors({
  origin: function (origin, callback) {
    logger.debug('CORS request from origin:', origin);
    
    // Allow requests with no origin (like mobile apps, curl requests, or server-to-server)
    if (!origin) {
      logger.debug('Request has no origin, allowing');
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
        message: 'Database connection is not available',
        database: dbStateNames[dbState] || 'unknown',
        uptime: process.uptime()
      });
    }
    
    // Optionally ping the database to ensure it's responsive
    await mongoose.connection.db.admin().ping();
    
    res.status(200).json({
      status: 'healthy',
      message: 'Server is running',
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (err) {
    logger.error('Health check failed:', err.message);
    res.status(503).json({
      status: 'unhealthy',
      message: 'Health check failed',
      error: err.message,
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