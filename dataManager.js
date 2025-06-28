const fs = require('fs');
const path = require('path');

const ROOMS_FILE = path.join(__dirname, 'data', 'rooms.json');
const RESERVATIONS_FILE = path.join(__dirname, 'data', 'reservations.json');

function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error leyendo archivo ${filePath}:`, error);
    return [];
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error escribiendo archivo ${filePath}:`, error);
    throw error;
  }
}

function getRooms() {
  return readJsonFile(ROOMS_FILE);
}

function getReservations() {
  return readJsonFile(RESERVATIONS_FILE);
}

function saveReservations(reservations) {
  writeJsonFile(RESERVATIONS_FILE, reservations);
}

function findRoomById(roomId) {
  const rooms = getRooms();
  return rooms.find(room => room.id === roomId) || null;
}

function findReservationById(reservationId) {
  const reservations = getReservations();
  return reservations.find(reservation => reservation.id === reservationId) || null;
}

function isRoomAvailable(roomId, fecha, horaInicio, horaFin) {
  const reservations = getReservations();
  
  return !reservations.some(reservation => {
    if (reservation.roomId !== roomId || reservation.fecha !== fecha) {
      return false;
    }
    
    // Verificar solapamiento de horarios
    const existingStart = reservation.horaInicio;
    const existingEnd = reservation.horaFin;
    
    return (
      (horaInicio >= existingStart && horaInicio < existingEnd) ||
      (horaFin > existingStart && horaFin <= existingEnd) ||
      (horaInicio <= existingStart && horaFin >= existingEnd)
    );
  });
}

function generateReservationId() {
  return 'res-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

module.exports = {
  getRooms,
  getReservations,
  saveReservations,
  findRoomById,
  findReservationById,
  isRoomAvailable,
  generateReservationId
};
