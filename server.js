const http = require('http');
const url = require('url');
const controllers = require('./controllers');
const { sendError, sendJsonResponse } = require('./utils');

const PORT = process.env.PORT || 3000;

function handleRoutes(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;
  
  console.log(`${method} ${path}`);
  
  if (method === 'OPTIONS') {
    res.statusCode = 200;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.end();
    return;
  }
  
  try {
    if (path === '/api/rooms' && method === 'GET') {
      return controllers.getRooms(req, res);
    }
    
    if (path.match(/^\/api\/rooms\/[^\/]+$/) && method === 'GET') {
      return controllers.getRoomById(req, res);
    }
    
    if (path.match(/^\/api\/rooms\/[^\/]+\/reservations$/) && method === 'GET') {
      return controllers.getReservationsByRoom(req, res);
    }
    
    if (path === '/api/reservations' && method === 'POST') {
      return controllers.createReservation(req, res);
    }
    
    if (path === '/api/reservations' && method === 'GET') {
      return controllers.getReservations(req, res);
    }
    
    if (path.match(/^\/api\/reservations\/[^\/]+$/) && method === 'DELETE') {
      return controllers.cancelReservation(req, res);
    }
    
    if (path === '/' && method === 'GET') {
      return sendApiDocumentation(res);
    }
    
    sendError(res, 404, 'Endpoint no encontrado');
    
  } catch (error) {
    console.error('Error en el servidor:', error);
    sendError(res, 500, 'Error interno del servidor');
  }
}

function sendApiDocumentation(res) {
  const documentation = {
    title: "API de Reservas de Salas de Estudio",
    version: "1.0.0",
    description: "API REST para gestionar reservas de salas en una biblioteca o centro de coworking",
    endpoints: {
      "GET /api/rooms": {
        description: "Obtiene todas las salas disponibles",
        response: "Array de salas con id, nombre y capacidad"
      },
      "GET /api/rooms/:id": {
        description: "Obtiene información de una sala específica",
        parameters: { id: "ID de la sala" },
        response: "Objeto sala"
      },
      "GET /api/rooms/:id/reservations": {
        description: "Obtiene todas las reservas de una sala específica",
        parameters: { id: "ID de la sala" },
        response: "Array de reservas de la sala"
      },
      "POST /api/reservations": {
        description: "Crea una nueva reserva",
        body: {
          roomId: "ID de la sala a reservar",
          fecha: "Fecha de la reserva (YYYY-MM-DD)",
          horaInicio: "Hora de inicio (HH:MM)",
          horaFin: "Hora de fin (HH:MM)",
          nombreUsuario: "Nombre del usuario que reserva",
          numeroPersonas: "Número de personas (entero)"
        },
        response: "Objeto reserva creada"
      },
      "GET /api/reservations": {
        description: "Obtiene todas las reservas activas",
        response: "Array de todas las reservas"
      },
      "DELETE /api/reservations/:id": {
        description: "Cancela una reserva específica",
        parameters: { id: "ID de la reserva a cancelar" },
        response: "Objeto reserva cancelada"
      }
    },
    examples: {
      "Crear reserva": {
        method: "POST",
        url: "/api/reservations",
        body: {
          roomId: "sala-001",
          fecha: "2025-06-29",
          horaInicio: "09:00",
          horaFin: "11:00",
          nombreUsuario: "Juan Pérez",
          numeroPersonas: 3
        }
      }
    }
  };
  
  sendJsonResponse(res, 200, documentation);
}

const server = http.createServer(handleRoutes);

server.on('error', (error) => {
  console.error('Error del servidor:', error);
});

server.listen(PORT, () => {
  console.log('🚀 Servidor iniciado exitosamente');
  console.log(`📡 Servidor corriendo en http://localhost:${PORT}`);
  console.log('📚 Documentación disponible en http://localhost:3000');
  console.log('🛑 Para detener el servidor, presiona Ctrl+C');
  console.log('');
  console.log('📋 Endpoints disponibles:');
  console.log('  GET    /api/rooms                    - Lista todas las salas');
  console.log('  GET    /api/rooms/:id                - Obtiene una sala específica');
  console.log('  GET    /api/rooms/:id/reservations   - Reservas de una sala');
  console.log('  POST   /api/reservations             - Crea nueva reserva');
  console.log('  GET    /api/reservations             - Lista todas las reservas');
  console.log('  DELETE /api/reservations/:id         - Cancela una reserva');
});

process.on('SIGTERM', () => {
  console.log('📤 Recibida señal SIGTERM, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n📤 Recibida señal SIGINT, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});
