/**
 * Envía una respuesta JSON
 * @param {Object} res - Objeto response de HTTP
 * @param {number} statusCode - Código de estado HTTP
 * @param {Object} data - Datos a enviar
 */
function sendJsonResponse(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(data, null, 2));
}

/**
 * Envía una respuesta de éxito
 * @param {Object} res - Objeto response de HTTP
 * @param {Object} data - Datos a enviar
 * @param {string} message - Mensaje de éxito
 */
function sendSuccess(res, data, message = 'Operación exitosa') {
  sendJsonResponse(res, 200, {
    success: true,
    message,
    data
  });
}

/**
 * Envía una respuesta de error
 * @param {Object} res - Objeto response de HTTP
 * @param {number} statusCode - Código de estado HTTP
 * @param {string} message - Mensaje de error
 */
function sendError(res, statusCode, message) {
  sendJsonResponse(res, statusCode, {
    success: false,
    error: message
  });
}

/**
 * Parsea el cuerpo de la petición JSON
 * @param {Object} req - Objeto request de HTTP
 * @returns {Promise} - Promise que resuelve con los datos parseados
 */
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        if (body) {
          resolve(JSON.parse(body));
        } else {
          resolve({});
        }
      } catch (error) {
        reject(new Error('JSON inválido'));
      }
    });
    
    req.on('error', reject);
  });
}

/**
 * Extrae parámetros de la URL
 * @param {string} url - URL completa
 * @param {string} basePath - Ruta base
 * @returns {Object} - Objeto con los parámetros extraídos
 */
function extractUrlParams(url, basePath) {
  const urlParts = url.split('?')[0].split('/');
  const basePathParts = basePath.split('/');
  
  const params = {};
  
  for (let i = 0; i < basePathParts.length; i++) {
    if (basePathParts[i].startsWith(':')) {
      const paramName = basePathParts[i].substring(1);
      params[paramName] = urlParts[i];
    }
  }
  
  return params;
}

/**
 * Valida los campos requeridos
 * @param {Object} data - Datos a validar
 * @param {Array} requiredFields - Campos requeridos
 * @returns {Object} - Objeto con isValid y mensaje de error
 */
function validateRequiredFields(data, requiredFields) {
  for (const field of requiredFields) {
    if (!data[field] || data[field].toString().trim() === '') {
      return {
        isValid: false,
        error: `El campo '${field}' es requerido`
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Valida formato de fecha (YYYY-MM-DD)
 * @param {string} fecha - Fecha a validar
 * @returns {boolean} - true si es válida, false si no
 */
function isValidDate(fecha) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(fecha)) return false;
  
  const date = new Date(fecha);
  return date instanceof Date && !isNaN(date);
}

/**
 * Valida formato de hora (HH:MM)
 * @param {string} hora - Hora a validar
 * @returns {boolean} - true si es válida, false si no
 */
function isValidTime(hora) {
  const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;
  return timeRegex.test(hora);
}

module.exports = {
  sendJsonResponse,
  sendSuccess,
  sendError,
  parseRequestBody,
  extractUrlParams,
  validateRequiredFields,
  isValidDate,
  isValidTime
};
