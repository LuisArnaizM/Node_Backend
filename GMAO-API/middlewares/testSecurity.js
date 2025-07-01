// Middleware de seguridad para pruebas - sin rate limiting
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

// Rate limiters deshabilitados para pruebas
const authLimiter = (req, res, next) => next();
const generalLimiter = (req, res, next) => next();
const createLimiter = (req, res, next) => next();

// Configuración de Helmet simplificada para pruebas
const helmetConfig = helmet({
  contentSecurityPolicy: false, // Deshabilitado para pruebas
  crossOriginEmbedderPolicy: false
});

// Sanitización de input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Eliminar caracteres peligrosos
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
};

const sanitizeRequestBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'string') {
            obj[key] = sanitizeInput(obj[key]);
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          }
        }
      }
    };
    sanitizeObject(req.body);
  }
  next();
};

// Middleware de sanitización para todas las rutas
const sanitizeInputMiddleware = (req, res, next) => {
  sanitizeRequestBody(req, res, next);
};

// CSRF Protection simplificado para pruebas
const csrfProtection = (req, res, next) => {
  // En pruebas, permitir todas las requests
  next();
};

// Validadores de registro
const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos'),
  
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('La contraseña debe contener al menos: una minúscula, una mayúscula, un número y un carácter especial'),
  
  body('role')
    .optional()
    .isIn(['admin', 'technician', 'viewer'])
    .withMessage('El rol debe ser admin, technician o viewer')
];

// Validadores de login
const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('El nombre de usuario es requerido'),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

// Validación de contraseñas
const passwordValidators = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('La contraseña debe contener al menos: una minúscula, una mayúscula, un número y un carácter especial')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Errores de validación',
      details: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

module.exports = {
  authLimiter,
  generalLimiter,
  createLimiter,
  helmetConfig,
  sanitizeRequestBody,
  sanitizeInput: sanitizeInputMiddleware,
  csrfProtection,
  passwordValidators,
  validateRegistration,
  validateLogin,
  handleValidationErrors
};
