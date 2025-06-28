require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Importar middlewares
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./middlewares/logger');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const workOrderRoutes = require('./routes/workOrderRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));
app.use(logger);

// Crear carpeta data si no existe
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Crear archivo ordenes.json si no existe
const ordenesFile = path.join(dataDir, 'ordenes.json');
if (!fs.existsSync(ordenesFile)) {
  fs.writeFileSync(ordenesFile, JSON.stringify([], null, 2));
}

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/work-orders', workOrderRoutes);

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: 'API GMAO - Gestión de Órdenes de Trabajo',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/login',
      workOrders: '/api/work-orders'
    }
  });
});

app.use(errorHandler);

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    message: `La ruta ${req.originalUrl} no existe`
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

module.exports = app;
