const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, 'src', 'config', 'config.env') });

const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db.cjs');

const cookieParser = require('cookie-parser');

// Connect to Database
connectDB();


const app = express();
app.use(cookieParser());

// Set trust proxy to trust the Render reverse proxy
app.set('trust proxy', 1);

// Init Middleware
app.use(express.json({ extended: false }));

// Define allowed origins
const allowedOrigins = [
  'https://book-space-3xmh.vercel.app',
  'https://book-space.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'  // Add Vite default development port
];

// Simplify the CORS configuration - use a single approach
// This creates a cleaner middleware chain and reduces conflicts
app.use(cors({
  origin: function (origin, callback) {
    console.log('CORS request from origin:', origin);
    
    // Allow requests with no origin (like mobile apps, curl requests, or server-to-server)
    if (!origin) {
      console.log('Request has no origin, allowing');
      return callback(null, true);
    }
    
    // Check if origin is in our allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('Origin allowed by CORS:', origin);
      callback(null, true);
    } else {
      console.log('Origin blocked by CORS:', origin);
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
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Define Routes
app.use('/api/auth', require('./src/routes/auth.cjs'));
app.use('/api/places', require('./src/routes/places.cjs'));
app.use('/api/bookings', require('./src/routes/bookings.cjs'));
app.use('/api/stats', require('./src/routes/stats.cjs'));
app.use('/api/users', require('./src/routes/users.cjs'));

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err, origin) => {
  console.error(`Caught exception: ${err.message}\n` + `Exception origin: ${origin}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});