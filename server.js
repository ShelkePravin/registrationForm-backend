const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');

const app = express();

/* ============================
   CORS CONFIGURATION
============================ */
const allowedOrigins = [
  'http://localhost:5175', // your Vite frontend
  'http://localhost:5173',
  'http://localhost:3000',
  'https://graceful-crisp-800723.netlify.app'
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow Postman / curl / server-to-server
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.netlify.app')
    ) {
      return callback(null, true);
    }

    //  DO NOT throw error
    return callback(null, false);
  },
  credentials: true
};

app.use(cors(corsOptions));


/* ============================
   MIDDLEWARES
============================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ============================
   ROUTES
============================ */
app.use('/api', userRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Registration API is running',
    mongoStatus:
      mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

/* ============================
   MONGODB CONNECTION
============================ */
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error(' ERROR: MONGODB_URI is not defined');
  process.exit(1);
}

console.log(' Connecting to MongoDB...');

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log(' Connected to MongoDB');
    console.log(' Database:', mongoose.connection.name);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error(' MongoDB connection error:', err.message);
    process.exit(1);
  });

/* ============================
   MONGOOSE EVENTS
============================ */
mongoose.connection.on('error', err => {
  console.error(' MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn(' MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log(' MongoDB reconnected');
});

/* ============================
   ERROR HANDLING
============================ */
app.use((err, req, res, next) => {
  console.error(' Unhandled error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

/* ============================
   GRACEFUL SHUTDOWN
============================ */
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log(' Server shut down gracefully');
  process.exit(0);
});
