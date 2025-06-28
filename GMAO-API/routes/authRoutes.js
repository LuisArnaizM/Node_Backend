const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middlewares/auth');
const { validateData, loginSchema } = require('../middlewares/validation');

// POST /api/auth/login - Autenticación
router.post('/login', validateData(loginSchema), authController.login);

// GET /api/auth/verify - Verificar token (ruta protegida)
router.get('/verify', authenticateToken, authController.verifyToken);

module.exports = router;
