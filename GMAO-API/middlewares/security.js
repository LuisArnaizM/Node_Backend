const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Configuración de rate limiting
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: 'Demasiadas solicitudes',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Personalizar la clave para rate limiting
    keyGenerator: (req) => {
      return req.headers['x-forwarded-for'] || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress ||
             req.ip;
    }
  });
};

// Rate limiters específicos
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutos
  5, // máximo 5 intentos
  'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.'
);

const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutos
  100, // máximo 100 requests
  'Demasiadas solicitudes desde esta IP. Intenta de nuevo en 15 minutos.'
);

const createLimiter = createRateLimiter(
  5 * 60 * 1000, // 5 minutos
  10, // máximo 10 creaciones
  'Demasiadas creaciones. Intenta de nuevo en 5 minutos.'
);

// Configuración de Helmet para seguridad HTTP
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Para compatibilidad con APIs
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Sanitización de entrada
const sanitizeInput = (req, res, next) => {
  // Función recursiva para limpiar objetos
  const sanitizeObject = (obj) => {
    if (obj !== null && typeof obj === 'object') {
      for (let key in obj) {
        if (typeof obj[key] === 'string') {
          // Primero codificar entidades HTML para caracteres especiales
          obj[key] = obj[key]
            .replace(/&/g, '&amp;') // Debe ir primero
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
          
          // Luego remover tags HTML y código malicioso
          obj[key] = obj[key]
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // XSS básico
            .replace(/<[^>]*>/g, '') // Remover todos los tags HTML
            .replace(/javascript:/gi, '') // URLs javascript
            .replace(/on\w+\s*=/gi, '') // Event handlers
            .trim();
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      }
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }
  if (req.query) {
    sanitizeObject(req.query);
  }
  if (req.params) {
    sanitizeObject(req.params);
  }

  next();
};

// Validaciones específicas para autenticación
const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números, guiones y guiones bajos'),
  
  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8, max: 100 })
    .withMessage('La contraseña debe tener entre 8 y 100 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 símbolo'),
  
  body('role')
    .optional()
    .isIn(['admin', 'technician', 'viewer'])
    .withMessage('Rol inválido')
];

const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('El nombre de usuario es obligatorio')
    .isLength({ max: 50 })
    .withMessage('Nombre de usuario demasiado largo'),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria')
    .isLength({ max: 100 })
    .withMessage('Contraseña demasiado larga')
];

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Errores de validación',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Middleware anti-CSRF básico (para APIs REST)
const csrfProtection = (req, res, next) => {
  // Para APIs REST, verificamos el Content-Type y Origin
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    
    // Verificar Content-Type para APIs JSON
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(403).json({
        success: false,
        error: 'Posible ataque CSRF',
        message: 'Content-Type requerido para operaciones de modificación'
      });
    }
  }
  
  next();
};

// Validación de contraseña segura
const passwordValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('La contraseña debe contener al menos: una minúscula, una mayúscula, un número y un carácter especial'),
  handleValidationErrors
];

module.exports = {
  helmetConfig,
  authLimiter,
  generalLimiter,
  createLimiter,
  sanitizeInput,
  validateRegistration,
  validateLogin,
  handleValidationErrors,
  csrfProtection,
  passwordValidation
};
