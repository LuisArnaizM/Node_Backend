const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrderController');
const authenticateToken = require('../middlewares/auth');
const { validateData, workOrderSchema, updateWorkOrderSchema } = require('../middlewares/validation');

// Rutas públicas (solo GET con cache)
router.get('/', workOrderController.getAllOrders);
router.get('/stats', workOrderController.getStats);
router.get('/by-status/:status', workOrderController.getOrdersByStatus);
router.get('/:id', workOrderController.getOrderById);

// Rutas protegidas (requieren autenticación JWT)
router.post('/', 
  authenticateToken, 
  validateData(workOrderSchema), 
  workOrderController.createOrder
);

router.put('/:id', 
  authenticateToken, 
  validateData(updateWorkOrderSchema), 
  workOrderController.updateOrder
);

router.patch('/:id/complete',
  authenticateToken,
  workOrderController.completeOrder
);

router.delete('/:id', 
  authenticateToken, 
  workOrderController.deleteOrder
);

module.exports = router;
