// ============================================================
// AURA DENTAL CLINIC — Cloud Server
// Node.js + Express + Socket.io + MySQL
// ============================================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Database connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'aura_dental',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test database connection
db.getConnection()
  .then(conn => {
    console.log('✅ MySQL Connected');
    conn.release();
  })
  .catch(err => {
    console.warn('⚠️  MySQL not connected:', err.message);
    console.log('   App will run in localStorage mode (static files only)');
  });

// Make db available to routes
app.locals.db = db;

// ============================================================
// SOCKET.IO REAL-TIME EVENTS
// ============================================================
io.on('connection', socket => {
  console.log('🔌 Client connected:', socket.id);

  // Doctor sends prescription → Reception gets instant alert
  socket.on('sendPrescription', data => {
    io.emit('newPrescription', {
      ...data,
      time: new Date().toISOString()
    });
    console.log('📋 Prescription sent:', data.patientName);
  });

  // Reception confirms print
  socket.on('prescriptionPrinted', data => {
    io.emit('prescriptionPrinted', {
      ...data,
      time: new Date().toISOString()
    });
  });

  // Payment confirmed
  socket.on('confirmPayment', data => {
    io.emit('paymentConfirmed', {
      ...data,
      time: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected:', socket.id);
  });
});

// ============================================================
// API ROUTES
// ============================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected'
  });
});

// HTTP fallback for real-time events (for clients without Socket.io)
app.post('/api/send-prescription', (req, res) => {
  io.emit('newPrescription', { ...req.body, time: new Date().toISOString() });
  res.json({ success: true });
});

app.post('/api/prescription-printed', (req, res) => {
  io.emit('prescriptionPrinted', { ...req.body, time: new Date().toISOString() });
  res.json({ success: true });
});

// Import route modules
try {
  app.use('/api', require('./routes/patients'));
  app.use('/api', require('./routes/visits'));
  app.use('/api', require('./routes/queue'));
  app.use('/api', require('./routes/reference'));
  console.log('✅ API routes loaded');
} catch (err) {
  console.warn('⚠️  API routes not loaded:', err.message);
  console.log('   App will serve static files only');
}

// ============================================================
// SERVE SINGLE PAGE APPLICATION
// ============================================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║   🦷  AURA DENTAL CLINIC — CLOUD READY        ║
║   🌐  Port: ${PORT.toString().padEnd(33)}║
║   🔌  Socket.io: ENABLED                      ║
║   💾  Database: ${(db ? 'MySQL' : 'localStorage').padEnd(28)}║
╚════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    db.end();
    process.exit(0);
  });
});
