const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const itemsRoutes = require('./routes/items.routes');
const salesRoutes = require('./routes/sales.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const usersRoutes = require('./routes/users.routes');
const categoriesRoutes = require('./routes/categories.routes');
const procurementRoutes = require('./routes/procurement.routes');
const stockTakesRoutes = require('./routes/stockTakes.routes');

const app = express();

// Security middleware — relaxed for desktop/Electron usage
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS — allow web dev server, Electron, and localhost origins
const allowedOrigins = [
  config.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, Electron, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow file:// origins (Electron desktop)
    if (origin.startsWith('file://')) return callback(null, true);
    // Allow all Vercel deployment URLs
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    pharmacy: config.PHARMACY.name
  });
});

// Pharmacy info endpoint (public)
app.get('/api/pharmacy-info', (req, res) => {
  res.json(config.PHARMACY);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/stock-takes', stockTakesRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ──────────────────────────────────────────────────
// Serve static frontend in production (for Electron)
// ──────────────────────────────────────────────────
if (config.NODE_ENV === 'production') {
  // Try multiple possible locations for the built frontend
  const frontendPaths = [
    path.join(__dirname, '../../frontend/dist'),      // backend/src -> frontend/dist (dev tree)
    path.join(__dirname, '../../frontend'),           // desktop/backend -> desktop/frontend (packaged copy)
    path.join(process.cwd(), '..', 'frontend'),       // relative to CWD
    path.join(process.cwd(), 'frontend'),             // CWD/frontend
    path.join(__dirname, '../../../desktop/frontend'), // from backend src -> desktop/frontend
    path.join(__dirname, '../../../frontend/dist')     // from backend src -> frontend/dist
  ];

  let frontendDir = null;
  const fs = require('fs');
  for (const fp of frontendPaths) {
    // Check for index.html AND assets/ dir to confirm it's a production build
    if (fs.existsSync(path.join(fp, 'index.html')) && fs.existsSync(path.join(fp, 'assets'))) {
      frontendDir = fp;
      break;
    }
  }

  if (frontendDir) {
    console.log(`Serving frontend from: ${frontendDir}`);
    app.use(express.static(frontendDir));

    // SPA fallback — serve index.html for all non-API routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendDir, 'index.html'));
    });
  } else {
    console.warn('⚠ Frontend build not found — only API available');
    app.get('/', (req, res) => {
      res.json({ message: 'MORERAN CHEMIST API is running. Frontend build not found.' });
    });
  }
}

// Error handler
app.use(errorHandler);

module.exports = app;
