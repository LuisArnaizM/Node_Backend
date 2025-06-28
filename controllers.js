const dataManager = require('./dataManager');
const { sendSuccess, sendError, parseRequestBody, validateRequiredFields, isValidDate, isValidTime } = require('./utils');

function getRooms(req, res) {
  try {
    const rooms = dataManager.getRooms();
    sendSuccess(res, rooms, 'Salas obtenidas exitosamente');
  } catch (error) {
    console.error('Error obteniendo salas:', error);
    sendError(res, 500, 'Error interno del servidor');
  }
}

function getRoomById(req, res) {
  try {
    const roomId = req.url.split('/')[3];
    
    if (!roomId) {
      return sendError(res, 400, 'ID de sala requerido');
    }
    
    const room = dataManager.findRoomById(roomId);
    
    if (!room) {
      return sendError(res, 404, 'Sala no encontrada');
    }
    
    sendSuccess(res, room, 'Sala obtenida exitosamente');
  } catch (error) {
    console.error('Error obteniendo sala:', error);
    sendError(res, 500, 'Error interno del servidor');
  }
}

async function createReservation(req, res) {
  try {
    const data = await parseRequestBody(req);
    
    const validation = validateRequiredFields(data, [
      'roomId', 'fecha', 'horaInicio', 'horaFin', 'nombreUsuario', 'numeroPersonas'
    ]);
    
    if (!validation.isValid) {
      return sendError(res, 400, validation.error);
    }
    
    const { roomId, fecha, horaInicio, horaFin, nombreUsuario, numeroPersonas } = data;
    
    if (!isValidDate(fecha)) {
      return sendError(res, 400, 'Formato de fecha inválido. Use YYYY-MM-DD');
    }
    
    if (!isValidTime(horaInicio) || !isValidTime(horaFin)) {
      return sendError(res, 400, 'Formato de hora inválido. Use HH:MM');
    }
    
    if (horaInicio >= horaFin) {
      return sendError(res, 400, 'La hora de fin debe ser posterior a la hora de inicio');
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (fecha < today) {
      return sendError(res, 400, 'No se pueden hacer reservas en fechas pasadas');
    }
    
    const room = dataManager.findRoomById(roomId);
    if (!room) {
      return sendError(res, 404, 'Sala no encontrada');
    }
    
    if (parseInt(numeroPersonas) > room.capacidad) {
      return sendError(res, 400, `La sala tiene capacidad máxima de ${room.capacidad} personas`);
    }
    
    if (parseInt(numeroPersonas) <= 0) {
      return sendError(res, 400, 'El número de personas debe ser mayor a 0');
    }
    
    if (!dataManager.isRoomAvailable(roomId, fecha, horaInicio, horaFin)) {
      return sendError(res, 409, 'La sala no está disponible en esa franja horaria');
    }
    
    const reservation = {
      id: dataManager.generateReservationId(),
      roomId,
      nombreSala: room.nombre,
      fecha,
      horaInicio,
      horaFin,
      nombreUsuario,
      numeroPersonas: parseInt(numeroPersonas),
      fechaCreacion: new Date().toISOString()
    };
    
    const reservations = dataManager.getReservations();
    reservations.push(reservation);
    dataManager.saveReservations(reservations);
    
    sendSuccess(res, reservation, 'Reserva creada exitosamente');
    
  } catch (error) {
    console.error('Error creando reserva:', error);
    sendError(res, 500, 'Error interno del servidor');
  }
}

function getReservations(req, res) {
  try {
    const reservations = dataManager.getReservations();
    sendSuccess(res, reservations, 'Reservas obtenidas exitosamente');
  } catch (error) {
    console.error('Error obteniendo reservas:', error);
    sendError(res, 500, 'Error interno del servidor');
  }
}

function cancelReservation(req, res) {
  try {
    const reservationId = req.url.split('/')[3];
    
    if (!reservationId) {
      return sendError(res, 400, 'ID de reserva requerido');
    }
    
    const reservations = dataManager.getReservations();
    const reservationIndex = reservations.findIndex(res => res.id === reservationId);
    
    if (reservationIndex === -1) {
      return sendError(res, 404, 'Reserva no encontrada');
    }
    
    const canceledReservation = reservations[reservationIndex];
    reservations.splice(reservationIndex, 1);
    dataManager.saveReservations(reservations);
    
    sendSuccess(res, canceledReservation, 'Reserva cancelada exitosamente');
    
  } catch (error) {
    console.error('Error cancelando reserva:', error);
    sendError(res, 500, 'Error interno del servidor');
  }
}

function getReservationsByRoom(req, res) {
  try {
    const roomId = req.url.split('/')[3];
    
    if (!roomId) {
      return sendError(res, 400, 'ID de sala requerido');
    }
    
    const room = dataManager.findRoomById(roomId);
    if (!room) {
      return sendError(res, 404, 'Sala no encontrada');
    }
    
    const reservations = dataManager.getReservations();
    const roomReservations = reservations.filter(reservation => reservation.roomId === roomId);
    
    sendSuccess(res, roomReservations, `Reservas de la sala ${room.nombre} obtenidas exitosamente`);
    
  } catch (error) {
    console.error('Error obteniendo reservas de sala:', error);
    sendError(res, 500, 'Error interno del servidor');
  }
}

module.exports = {
  getRooms,
  getRoomById,
  createReservation,
  getReservations,
  cancelReservation,
  getReservationsByRoom
};
