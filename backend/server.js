require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Initialize database
connectDB();

const app = express();

// Core Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static file serving for receipt uploads (support inline viewing for JPG, PNG, JFIF, etc.)
if (express.static.mime && express.static.mime.define) {
  express.static.mime.define({ 'image/jpeg': ['jfif', 'JFIF'] });
}
const uploadOptions = {
  setHeaders: (res, filePath) => {
    if (/\.jfif$/i.test(filePath)) {
      res.setHeader('Content-Type', 'image/jpeg');
    }
    const req = res.req;
    if (req && req.query && req.query.download === 'true') {
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    } else {
      res.setHeader('Content-Disposition', 'inline');
    }
  },
};
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), uploadOptions));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), uploadOptions));

// Serve frontend client files
app.use(express.static(path.join(__dirname, '../frontend')));

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'ExpenseAI — AI-Powered Expense Management System',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount Feature API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/receipts', require('./routes/receiptRoutes'));
app.use('/api/policies', require('./routes/policyRoutes'));
app.use('/api/budgets', require('./routes/budgetRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/approvals', require('./routes/approvalRoutes'));
app.use('/api/mileage', require('./routes/mileageRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/integrations', require('./routes/integrationRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Dedicated Home Page route
app.get(['/home', '/home.html'], (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/home.html'));
});

// Fallback for SPA routing if needed
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const { exec } = require('child_process');

// Centralized Error Handler
app.use(errorHandler);

// Helper function to auto-open browser in development mode
function openBrowser(url) {
  if (process.env.NODE_ENV === 'test' || process.env.CI || process.env.NO_OPEN === 'true') {
    return;
  }
  const cmd = process.platform === 'win32'
    ? `start ${url}`
    : process.platform === 'darwin'
      ? `open ${url}`
      : `xdg-open ${url}`;

  exec(cmd, (err) => {
    if (err && process.platform === 'win32') {
      exec(`start "" "${url}"`, () => {});
    }
  });
}

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 ExpenseAI Full-Stack Development Server Active`);
  console.log(`-------------------------------------------------------`);
  console.log(`🌐 Frontend Web App:  http://localhost:${PORT}/`);
  console.log(`⚙️  Backend REST API:  http://localhost:${PORT}/api`);
  console.log(`🩺 API Health Check:  http://localhost:${PORT}/api/health`);
  console.log(`-------------------------------------------------------`);
  console.log(`📄 Key Pages Available:`);
  console.log(`   • Home / Landing:  http://localhost:${PORT}/`);
  console.log(`   • Sign In Portal:  http://localhost:${PORT}/login.html`);
  console.log(`   • Live Dashboard:  http://localhost:${PORT}/dashboard.html`);
  console.log(`   • Expense List:    http://localhost:${PORT}/expenses.html`);
  console.log(`   • Receipt & OCR:   http://localhost:${PORT}/receipts.html`);
  console.log(`   • Budgets:         http://localhost:${PORT}/budgets.html`);
  console.log(`   • Reports:         http://localhost:${PORT}/reports.html`);
  console.log(`   • Approvals:       http://localhost:${PORT}/approvals.html`);
  console.log(`   • Mileage:         http://localhost:${PORT}/mileage.html`);
  console.log(`   • AI Assistant:    http://localhost:${PORT}/assistant.html`);
  console.log(`   • Settings:        http://localhost:${PORT}/settings.html`);
  console.log(`=======================================================`);
  console.log(`✨ Watching for changes across both frontend/ and backend/...`);

  // Auto-launch the web app in the default browser in dev mode
  if (process.env.NODE_ENV !== 'production') {
    setTimeout(() => {
      openBrowser(`http://localhost:${PORT}/`);
    }, 500);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[ExpenseAI] Unhandled Rejection:', err.message);
});
