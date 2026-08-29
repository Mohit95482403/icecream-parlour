const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();

// Trust reverse proxy (Render / Vercel / Nginx)
app.set('trust proxy', 1);

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Configure CORS for production (Vercel) and development (localhost)
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server, Postman)
    if (!origin) return callback(null, true);

    // Exact match in allowed origins list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow localhost/127.0.0.1 on any port in development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }

    // Allow any Vercel deployment preview or production domain
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Lightweight in-memory rate limiter for sensitive routes
const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 50, message = 'Too many requests, please try again later.' }) => {
  const requests = new Map();

  // Cleanup old records periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requests.entries()) {
      if (now - record.startTime > windowMs) {
        requests.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = requests.get(ip);

    if (!record || now - record.startTime > windowMs) {
      requests.set(ip, { count: 1, startTime: now });
      return next();
    }

    record.count += 1;
    if (record.count > max) {
      return res.status(429).json({
        success: false,
        error: { message, code: 'RATE_LIMIT_EXCEEDED' }
      });
    }

    next();
  };
};

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 30, // 30 attempts per 15 mins
  message: 'Too many authentication attempts. Please try again after 15 minutes.'
});

const paymentRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: 'Too many payment/checkout attempts. Please try again shortly.'
});

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Base Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: "GLACÉ API is healthy and running",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Routes with sensitive route protection
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);
app.use('/api/admin/login', authRateLimiter);
app.use('/api/payments', paymentRateLimiter);

app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/collections', require('./routes/collectionRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/checkout', require('./routes/checkoutRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/customers/me/addresses', require('./routes/addressRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/gift-cards', require('./routes/giftCardRoutes'));
app.use('/api/banner', require('./routes/bannerRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/admin/users', require('./routes/adminUserRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
});

// Centralized Production-Ready Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);

  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode === 500
      ? 'An unexpected server error occurred. Please try again later.'
      : (err.message || 'Internal Server Error'),
    errors: err.errors || []
  });
});

module.exports = app;
