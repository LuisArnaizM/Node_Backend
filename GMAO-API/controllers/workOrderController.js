const WorkOrder = require('../models/WorkOrder');

class WorkOrderController {
  // GET /api/work-orders - Obtener todas las órdenes
  async getAllOrders(req, res, next) {
    try {
      const { estado, tecnico } = req.query;
      let orders;

      if (estado) {
        orders = await WorkOrder.getByStatus(estado);
      } else if (tecnico) {
        orders = await WorkOrder.getByTechnician(tecnico);
      } else {
        orders = await WorkOrder.getAll();
      }

      res.json({
        success: true,
        data: orders,
        count: orders.length
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/work-orders/:id - Obtener una orden por ID
  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await WorkOrder.getById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Orden no encontrada',
          message: `No se encontró una orden con ID: ${id}`
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/work-orders - Crear nueva orden
  async createOrder(req, res, next) {
    try {
      const orderData = req.body;
      const newOrder = await WorkOrder.create(orderData);

      res.status(201).json({
        success: true,
        message: 'Orden de trabajo creada exitosamente',
        data: newOrder
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/work-orders/:id - Actualizar orden
  async updateOrder(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedOrder = await WorkOrder.update(id, updateData);

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          error: 'Orden no encontrada',
          message: `No se encontró una orden con ID: ${id}`
        });
      }

      res.json({
        success: true,
        message: 'Orden de trabajo actualizada exitosamente',
        data: updatedOrder
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/work-orders/:id - Eliminar orden
  async deleteOrder(req, res, next) {
    try {
      const { id } = req.params;
      const deletedOrder = await WorkOrder.delete(id);

      if (!deletedOrder) {
        return res.status(404).json({
          success: false,
          error: 'Orden no encontrada',
          message: `No se encontró una orden con ID: ${id}`
        });
      }

      res.json({
        success: true,
        message: 'Orden de trabajo eliminada exitosamente',
        data: deletedOrder
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/work-orders/stats - Obtener estadísticas
  async getStats(req, res, next) {
    try {
      const stats = await WorkOrder.getStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WorkOrderController();
