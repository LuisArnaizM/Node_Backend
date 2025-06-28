const fs = require('fs');
const path = require('path');

// Rutas de los archivos de datos
const ROOMS_FILE = path.join(__dirname, 'data', 'rooms.json');
const RESERVATIONS_FILE = path.join(__dirname, 'data', 'reservations.json');

/**
 * Lee datos desde un archivo JSON
 * @param {string} filePath - Ruta del archivo
 * @returns {Array} - Array con los datos del archivo
 */
function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error leyendo archivo ${filePath}:`, error);
    return [];
  }
}

/**
 * Escribe datos a un archivo JSON
 * @param {string} filePath - Ruta del archivo
 * @param {Array} data - Datos a escribir
 */
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error escribiendo archivo ${filePath}:`, error);
    throw error;
  }
}

/**
 * Obtiene todas las salas
 * @returns {Array} - Array de salas
 */
function getRooms() {
  return readJsonFile(ROOMS_FILE);
}

/**
 * Obtiene todas las reservas
 * @returns {Array} - Array de reservas
 */
function getReservations() {
  return readJsonFile(RESERVATIONS_FILE);
}

/**
 * Guarda las reservas en el archivo
 * @param {Array} reservations - Array de reservas
 */
function saveReservations(reservations) {
  writeJsonFile(RESERVATIONS_FILE, reservations);
}

/**
 * Busca una sala por su ID
 * @param {string} roomId - ID de la sala
 * @returns {Object|null} - Objeto sala o null si no existe
 */
function findRoomById(roomId) {
  const rooms = getRooms();
  return rooms.find(room => room.id === roomId) || null;
}

/**
 * Busca una reserva por su ID
 * @param {string} reservationId - ID de la reserva
 * @returns {Object|null} - Objeto reserva o null si no existe
 */
function findReservationById(reservationId) {
  const reservations = getReservations();
  return reservations.find(reservation => reservation.id === reservationId) || null;
}

/**
 * Verifica si una sala está disponible en una franja horaria
 * @param {string} roomId - ID de la sala
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {string} horaInicio - Hora de inicio en formato HH:MM
 * @param {string} horaFin - Hora de fin en formato HH:MM
 * @returns {boolean} - true si está disponible, false si no
 */
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

/**
 * Genera un ID único para reservas
 * @returns {string} - ID único
 */
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
