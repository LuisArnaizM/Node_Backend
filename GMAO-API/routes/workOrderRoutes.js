const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrderController');
const authenticateToken = require('../middlewares/auth');
const { validateData, workOrderSchema, updateWorkOrderSchema } = require('../middlewares/validation');

// Rutas públicas (solo GET)
router.get('/', workOrderController.getAllOrders);
router.get('/stats', workOrderController.getStats);
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

router.delete('/:id', 
  authenticateToken, 
  workOrderController.deleteOrder
);

module.exports = router;
