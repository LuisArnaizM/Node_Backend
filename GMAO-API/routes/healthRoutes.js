const express = require('express');
const { sequelize } = require('@config/database');
const { cacheHelpers } = require('@config/redis');

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'unknown',
        redis: 'unknown'
      }
    };

    // Verificar conexión a la base de datos
    try {
      await sequelize.authenticate();
      healthCheck.services.database = 'connected';
    } catch (error) {
      healthCheck.services.database = 'disconnected';
      healthCheck.status = 'DEGRADED';
    }

    // Verificar conexión a Redis
    try {
      await cacheHelpers.set('health_check', 'ok', 10);
      const redisTest = await cacheHelpers.get('health_check');
      healthCheck.services.redis = redisTest === 'ok' ? 'connected' : 'disconnected';
    } catch (error) {
      healthCheck.services.redis = 'disconnected';
      healthCheck.status = 'DEGRADED';
    }

    // Determinar código de estado HTTP
    const statusCode = healthCheck.status === 'OK' ? 200 : 503;
    
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Endpoint básico de ping
router.get('/ping', (req, res) => {
  res.json({ 
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
