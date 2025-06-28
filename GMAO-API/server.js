require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

// Importar configuraciones
const { testConnection, sequelize } = require('./config/database');
const { connectRedis } = require('./config/redis');

// Importar middlewares
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./middlewares/logger');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const workOrderRoutes = require('./routes/workOrderRoutesDB'); // Usando las nuevas rutas con BD

const app = express();
const PORT = process.env.PORT || 3000;

// Función para inicializar conexiones
const initializeConnections = async () => {
  try {
    // Conectar a la base de datos
    await testConnection();
    
    // Sincronizar modelos (en desarrollo - usar migraciones en producción)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Modelos sincronizados con la base de datos');
    }
    
    // Conectar a Redis
    await connectRedis();
    
    console.log('✅ Todas las conexiones inicializadas correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar conexiones:', error);
    process.exit(1);
  }
};

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));
app.use(logger);

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/work-orders', workOrderRoutes);

// Ruta de bienvenida con información de la API
app.get('/', (req, res) => {
  res.json({
    message: 'API GMAO - Gestión de Órdenes de Trabajo',
    version: '2.0.0',
    description: 'API con base de datos MySQL y cache Redis',
    features: [
      'Operaciones CRUD completas',
      'Cache Redis con TTL de 30 minutos',
      'Paginación',
      'Filtros por estado, técnico y prioridad',
      'Estadísticas en tiempo real',
      'Validación de datos'
    ],
    endpoints: {
      auth: '/api/auth/login',
      workOrders: {
        list: 'GET /api/work-orders',
        create: 'POST /api/work-orders',
        read: 'GET /api/work-orders/:id',
        update: 'PUT /api/work-orders/:id',
        delete: 'DELETE /api/work-orders/:id',
        complete: 'PATCH /api/work-orders/:id/complete',
        stats: 'GET /api/work-orders/stats',
        byStatus: 'GET /api/work-orders/by-status/:status'
      }
    },
    queryParameters: {
      list: {
        status: 'pendiente | en_progreso | completada | cancelada',
        assignedTo: 'nombre del técnico',
        priority: 'baja | media | alta | critica',
        page: 'número de página (default: 1)',
        limit: 'elementos por página (default: 10)'
      }
    }
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    message: `La ruta ${req.originalUrl} no existe`
  });
});

// Inicializar servidor
const startServer = async () => {
  try {
    await initializeConnections();
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📊 Panel de control: http://localhost:${PORT}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🔄 Cerrando servidor...');
  try {
    await sequelize.close();
    console.log('✅ Conexión a base de datos cerrada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al cerrar conexiones:', error);
    process.exit(1);
  }
});

// Iniciar el servidor
startServer();

module.exports = app;
