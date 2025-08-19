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

// Init Middleware
app.use(express.json({ extended: false }));

const allowedOrigins = [
  'https://book-space-one.vercel.app',
  'https://book-space-ovhl69ldy-equinoxs-projects-2265d853.vercel.app/',
  'http://localhost:5173',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
}));

// Define Routes
app.use('/api/auth', require('./src/routes/auth.cjs'));
app.use('/api/places', require('./src/routes/places.cjs'));
app.use('/api/bookings', require('./src/routes/bookings.cjs'));
app.use('/api/stats', require('./src/routes/stats.cjs'));
app.use('/api/users', require('./src/routes/users.cjs'));

const PORT = process.env.PORT || 5000;

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