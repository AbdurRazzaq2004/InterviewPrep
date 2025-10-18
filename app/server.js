const express = require('express');
const app = express();

// Environment variables with defaults
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const APP_VERSION = process.env.APP_VERSION || '1.0.0';
const BUILD_NUMBER = process.env.BUILD_NUMBER || 'unknown';

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: APP_VERSION,
    buildNumber: BUILD_NUMBER
  });
});

// Main endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Hello from Docker Practice App!',
    environment: NODE_ENV,
    version: APP_VERSION,
    buildNumber: BUILD_NUMBER,
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// API endpoint
app.get('/api/status', (req, res) => {
  res.json({
    application: 'docker-practice-app',
    status: 'running',
    environment: NODE_ENV,
    version: APP_VERSION,
    buildNumber: BUILD_NUMBER,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`📦 Version: ${APP_VERSION}`);
  console.log(`🔢 Build: ${BUILD_NUMBER}`);
});

module.exports = app;