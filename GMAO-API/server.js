const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar configuraciones
const { sequelize } = require('./config/database');
const { connectRedis } = require('./config/redis');

// Importar middlewares
const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const workOrderRoutes = require('./routes/workOrderRoutes');

const app = express();

// Middlewares globales
app.use(logger);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta principal
app.get('/', (req, res) => {
    res.json({
        message: 'GMAO API - Versión 2.0 con Base de Datos y Redis Cache',
        version: '2.0.0',
        features: [
            'MySQL Database con Sequelize',
            'Redis Cache con TTL de 30 minutos',
            'Invalidación automática de cache',
            'Paginación inteligente',
            'Filtros avanzados'
        ],
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

// Función para inicializar conexiones
const initializeConnections = async () => {
    try {
        // Conectar a MySQL
        await sequelize.authenticate();
        console.log('✅ Conectado a MySQL');
        
        // Sincronizar modelos (solo en desarrollo)
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            console.log('✅ Modelos sincronizados');
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
📝 Documentación: http://localhost:${PORT}
        `);
    });
};

startServer();