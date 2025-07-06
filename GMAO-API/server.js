// Configurar alias de módulos
require('module-alias/register');

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar configuraciones
const { sequelize } = require('@config/database');
const { connectRedis } = require('@config/redis');

// Importar middlewares
const logger = require('@middlewares/logger');
const errorHandler = require('@middlewares/errorHandler');
const { helmetConfig, csrfProtection } = require('@middlewares/security');

// Importar rutas
const authRoutes = require('@routes/authRoutes');
const workOrderRoutes = require('@routes/workOrderRoutes');

// Importar modelos
const User = require('@models/User');
const WorkOrder = require('@models/WorkOrder');

const app = express();

// Middlewares de seguridad (aplicar antes que otros middlewares)
app.use(helmetConfig);

// CORS configurado de manera segura
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (ej: aplicaciones móviles, Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(',');
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Middlewares globales
app.use(logger);
app.use(express.json({ limit: '10mb' })); // Limitar tamaño de payload
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Protección CSRF para operaciones de escritura
app.use(csrfProtection);

// Ruta principal
app.get('/', (req, res) => {
    res.json({
        message: 'GMAO API - Versión 2.0 con Seguridad Avanzada',
        version: '2.0.0',
        features: [
            'MySQL Database con Sequelize',
            'Redis Cache con TTL de 30 minutos',
            'Autenticación JWT con roles',
            'Hashing seguro de contraseñas (bcrypt)',
            'Rate limiting avanzado',
            'Sanitización de entrada',
            'Protección CSRF',
            'Middlewares de seguridad (Helmet)',
            'Validación robusta de datos'
        ],
        security: {
            authentication: 'JWT-based',
            passwordHashing: 'bcrypt with salt',
            rateLimiting: 'Express-rate-limit',
            inputSanitization: 'Custom middleware',
            csrfProtection: 'Content-Type validation',
            httpSecurity: 'Helmet.js'
        },
        endpoints: {
            auth: '/api/auth',
            workOrders: '/api/work-orders'
        }
    });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/work-orders', workOrderRoutes);

// Middleware de manejo de errores
app.use(errorHandler);

// Función para inicializar conexiones y crear usuario admin por defecto
const initializeConnections = async () => {
    try {
        // Conectar a MySQL
        await sequelize.authenticate();
        console.log('✅ Conectado a MySQL');
        
        // Sincronizar modelos (solo en desarrollo)
        if (process.env.NODE_ENV !== 'production') {
            try {
                await sequelize.sync({ alter: true });
                console.log('✅ Modelos sincronizados');
            } catch (syncError) {
                console.log('⚠️  Intentando sincronización básica...');
                await sequelize.sync();
                console.log('✅ Sincronización básica completada');
            }
            
            // Crear usuario admin por defecto si no existe
            try {
                const adminExists = await User.findOne({ where: { username: 'admin' } });
                if (!adminExists) {
                    await User.create({
                        username: 'admin',
                        email: 'admin@gmao.com',
                        password: 'Admin123!',
                        role: 'admin'
                    });
                    console.log('✅ Usuario admin creado (admin/Admin123!)');
                }
            } catch (userError) {
                console.log('⚠️  Usuario admin ya existe o error al crear');
            }
        }
        
        // Conectar a Redis
        await connectRedis();
        
    } catch (error) {
        console.error('❌ Error al conectar:', error);
        process.exit(1);
    }
};

// Iniciar servidor
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await initializeConnections();
    
    app.listen(PORT, () => {
        console.log(`
🚀 Servidor GMAO API v2.0 ejecutándose en puerto ${PORT}
🗄️  MySQL: Conectado
⚡ Redis Cache: Activo (TTL: 30 minutos)
� Seguridad: JWT + bcrypt + Rate Limiting + CSRF
👤 Usuario admin: admin/Admin123!
�📝 Documentación: http://localhost:${PORT}
        `);
    });
};

startServer();