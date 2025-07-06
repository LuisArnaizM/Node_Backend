const express = require('express');
const router = express.Router();
const authController = require('@controllers/authController');
const { authenticateToken, requireAdmin } = require('@middlewares/auth');

// Usar middlewares de prueba si estamos en modo de prueba
const isTestMode = process.env.NODE_ENV === 'test';
const securityMiddleware = isTestMode 
  ? require('@middlewares/testSecurity')
  : require('@middlewares/security');

const { 
  authLimiter, 
  validateRegistration, 
  validateLogin, 
  handleValidationErrors,
  sanitizeInput
} = securityMiddleware;

const { body } = require('express-validator');

// Aplicar sanitización a todas las rutas
router.use(sanitizeInput);

// Rutas públicas con rate limiting
router.post('/register', 
  authLimiter,
  validateRegistration,
  handleValidationErrors,
  authController.register
);

router.post('/login', 
  authLimiter,
  validateLogin,
  handleValidationErrors,
  authController.login
);

// Rutas protegidas (requieren autenticación)
router.get('/verify', 
  authenticateToken, 
  authController.verifyToken
);

router.get('/profile', 
  authenticateToken, 
  authController.getProfile
);

router.post('/change-password',
  authenticateToken,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('La contraseña actual es obligatoria'),
    body('newPassword')
      .isLength({ min: 8, max: 100 })
      .withMessage('La nueva contraseña debe tener entre 8 y 100 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('La nueva contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 símbolo')
  ],
  handleValidationErrors,
  authController.changePassword
);

module.exports = router;
module.exports = router;
