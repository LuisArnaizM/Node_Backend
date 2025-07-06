const express = require('express');
const router = express.Router();
const workOrderController = require('@controllers/workOrderController');
const { authenticateToken, requireAdminOrTechnician, requireAdmin } = require('@middlewares/auth');
const { validateData, workOrderSchema, updateWorkOrderSchema } = require('@middlewares/validation');

// Usar middlewares de prueba si estamos en modo de prueba
const isTestMode = process.env.NODE_ENV === 'test';
const securityMiddleware = isTestMode 
  ? require('@middlewares/testSecurity')
  : require('@middlewares/security');

const { generalLimiter, createLimiter, sanitizeInput } = securityMiddleware;

// Aplicar rate limiting general y sanitización
router.use(generalLimiter);
router.use(sanitizeInput);

// Rutas públicas (solo GET con cache)
router.get('/', workOrderController.getAllOrders);
router.get('/stats', workOrderController.getStats);
router.get('/by-status/:status', workOrderController.getOrdersByStatus);
router.get('/:id', workOrderController.getOrderById);

// Rutas que requieren autenticación y rol de técnico o admin
router.post('/', 
  createLimiter,
  authenticateToken, 
  requireAdminOrTechnician,
  validateData(workOrderSchema), 
  workOrderController.createOrder
);

router.put('/:id', 
  authenticateToken, 
  requireAdminOrTechnician,
  validateData(updateWorkOrderSchema), 
  workOrderController.updateOrder
);

router.patch('/:id/complete',
  authenticateToken,
  requireAdminOrTechnician,
  workOrderController.completeOrder
);

// Rutas que requieren rol de administrador
router.delete('/:id', 
  authenticateToken, 
  requireAdmin,
  workOrderController.deleteOrder
);

module.exports = router;
