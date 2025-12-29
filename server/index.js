const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const { connectDB } = require('./config/mongodb');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Multer configuration for file uploads
const uploadMaxMb = Number(process.env.UPLOAD_MAX_MB || 500);
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: Math.max(1, uploadMaxMb) * 1024 * 1024 } // 500MB limit
});

console.log(`📦 Upload max size: ${Math.max(1, uploadMaxMb)} MB (UPLOAD_MAX_MB)`);

// Health check endpoint (FIRST - before routes)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
console.log('\n🔄 Loading routes...\n');

try {
  const authRoutes = require('./routes/auth-complete');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');
} catch (e) {
  console.error('❌ Error loading auth routes:', e.message);
}

try {
  const modelRoutes = require('./routes/model-complete');
  app.use('/api/model', modelRoutes);
  console.log('✅ Model routes loaded');
} catch (e) {
  console.error('❌ Error loading model routes:', e.message);
}

try {
  const dataRoutes = require('./routes/data-complete');
  app.use('/api/data', dataRoutes);
  console.log('✅ Data routes loaded');
} catch (e) {
  console.error('❌ Error loading data routes:', e.message);
}

try {
  const trainingRoutes = require('./routes/training-complete');
  app.use('/api/training', trainingRoutes);
  console.log('✅ Training routes loaded');
} catch (e) {
  console.error('❌ Error loading training routes:', e.message);
}

try {
  const dashboardRoutes = require('./routes/dashboard');
  app.use('/api/dashboard', dashboardRoutes);
  console.log('✅ Dashboard routes loaded');
} catch (e) {
  console.error('❌ Error loading dashboard routes:', e.message);
}

try {
  const reportsRoutes = require('./routes/reports');
  app.use('/api/reports', reportsRoutes);
  console.log('✅ Reports routes loaded');
} catch (e) {
  console.error('❌ Error loading reports routes:', e.message);
}

try {
  const filesRoutes = require('./routes/files');
  app.use('/api/files', filesRoutes);
  console.log('✅ Files routes loaded');
} catch (e) {
  console.error('❌ Error loading files routes:', e.message);
}

try {
  const notificationsRoutes = require('./routes/notifications');
  app.use('/api/notifications', notificationsRoutes);
  console.log('✅ Notifications routes loaded');
} catch (e) {
  console.error('❌ Error loading notifications routes:', e.message);
}

try {
  const kaggleRoutes = require('./routes/kaggle-routes');
  app.use('/api/kaggle', kaggleRoutes);
  console.log('✅ Kaggle routes loaded');
} catch (e) {
  console.error('❌ Error loading kaggle routes:', e.message);
}

try {
  const geminiRoutes = require('./routes/gemini-routes');
  app.use('/api/gemini', geminiRoutes);
  console.log('✅ Gemini routes loaded');
} catch (e) {
  console.error('❌ Error loading gemini routes:', e.message);
}

try {
  const mlopsRoutes = require('./routes/mlops-routes');
  app.use('/api/mlops', mlopsRoutes);
  console.log('✅ MLops routes loaded');
} catch (e) {
  console.error('❌ Error loading mlops routes:', e.message);
}

try {
  const mnistRoutes = require('./routes/mnist-routes');
  app.use('/api/mnist', mnistRoutes);
  console.log('✅ MNIST routes loaded');
} catch (e) {
  console.error('❌ Error loading mnist routes:', e.message);
}

try {
  const audioRoutes = require('./routes/audio-routes');
  app.use('/api/audio', audioRoutes);
  console.log('✅ Audio routes loaded');
} catch (e) {
  console.error('❌ Error loading audio routes:', e.message);
}

// Serve Angular app (only if dist exists)
const distPath = path.join(__dirname, '../dist/deeplearning-app');
const fs = require('fs');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Fallback to Angular index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error handling - Centralized
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Start server with MongoDB connection
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Login: http://localhost:${PORT}/api/auth/login`);
      console.log(`📝 Register: http://localhost:${PORT}/api/auth/register\n`);
    });

    // Handle errors
    server.on('error', (err) => {
      console.error('❌ Server error:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

module.exports = app;
