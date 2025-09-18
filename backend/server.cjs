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

const allowedOrigins = [
  'https://book-space-3xmh.vercel.app',
  'https://book-space.vercel.app'  // Adding alternative domain
];

// Enhanced CORS configuration for cross-origin cookies
app.use(cors({
  origin: (origin, callback) => {
    console.log('Request origin:', origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Origin not allowed by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

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