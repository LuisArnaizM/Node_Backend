const WorkOrder = require('../models/WorkOrder');
const { cacheHelpers } = require('../config/redis');
const { Op } = require('sequelize');

class WorkOrderController {
  // GET /api/work-orders - Obtener todas las órdenes (con cache)
  async getAllOrders(req, res, next) {
    try {
      const { status, assignedTo, priority, page = 1, limit = 10 } = req.query;
      
      // Crear clave de cache única basada en los parámetros
      const cacheKey = `work_orders:${JSON.stringify({ status, assignedTo, priority, page, limit })}`;
      
      // Intentar obtener del cache primero
      const cachedData = await cacheHelpers.get(cacheKey);
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData.orders,
          count: cachedData.count,
          totalPages: cachedData.totalPages,
          currentPage: parseInt(page),
          cached: true
        });
      }

      // Construir condiciones de búsqueda
      const where = {};
      if (status) where.status = status;
      if (assignedTo) where.assignedTo = assignedTo;
      if (priority) where.priority = priority;

      // Paginación
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Consultar base de datos
      const { count, rows: orders } = await WorkOrder.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      const result = {
        orders,
        count,
        totalPages
      };

      // Guardar en cache
      await cacheHelpers.set(cacheKey, result);

      res.json({
        success: true,
        data: orders,
        count,
        totalPages,
        currentPage: parseInt(page),
        cached: false
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/work-orders/:id - Obtener una orden por ID (con cache)
  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const cacheKey = `work_order:${id}`;

      // Intentar obtener del cache
      const cachedOrder = await cacheHelpers.get(cacheKey);
      if (cachedOrder) {
        return res.json({
          success: true,
          data: cachedOrder,
          cached: true
        });
      }

      // Consultar base de datos
      const order = await WorkOrder.findByPk(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Orden no encontrada',
          message: `No se encontró una orden con ID: ${id}`
        });
      }

      // Guardar en cache
      await cacheHelpers.set(cacheKey, order);

      res.json({
        success: true,
        data: order,
        cached: false
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

      // Invalidar cache de listados
      await cacheHelpers.delPattern('work_orders:*');

      res.status(201).json({
        success: true,
        message: 'Orden de trabajo creada exitosamente',
        data: newOrder
      });
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          error: 'Errores de validación',
          details: validationErrors
        });
      }
      next(error);
    }
  }

  // PUT /api/work-orders/:id - Actualizar orden
  async updateOrder(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const order = await WorkOrder.findByPk(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Orden no encontrada',
          message: `No se encontró una orden con ID: ${id}`
        });
      }

      const updatedOrder = await order.update(updateData);

      // Invalidar cache
      await cacheHelpers.del(`work_order:${id}`);
      await cacheHelpers.delPattern('work_orders:*');

      res.json({
        success: true,
        message: 'Orden de trabajo actualizada exitosamente',
        data: updatedOrder
      });
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          error: 'Errores de validación',
          details: validationErrors
        });
      }
      next(error);
    }
  }

  // DELETE /api/work-orders/:id - Eliminar orden
  async deleteOrder(req, res, next) {
    try {
      const { id } = req.params;
      
      const order = await WorkOrder.findByPk(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Orden no encontrada',
          message: `No se encontró una orden con ID: ${id}`
        });
      }

      await order.destroy();

      // Invalidar cache
      await cacheHelpers.del(`work_order:${id}`);
      await cacheHelpers.delPattern('work_orders:*');

      res.json({
        success: true,
        message: 'Orden de trabajo eliminada exitosamente',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/work-orders/stats - Obtener estadísticas (con cache)
  async getStats(req, res, next) {
    try {
      const cacheKey = 'work_orders:stats';

      // Intentar obtener del cache
      const cachedStats = await cacheHelpers.get(cacheKey);
      if (cachedStats) {
        return res.json({
          success: true,
          data: cachedStats,
          cached: true
        });
      }

      // Calcular estadísticas
      const [
        totalOrders,
        pendingOrders,
        inProgressOrders,
        completedOrders,
        cancelledOrders,
        overDueOrders
      ] = await Promise.all([
        WorkOrder.count(),
        WorkOrder.count({ where: { status: 'pendiente' } }),
        WorkOrder.count({ where: { status: 'en_progreso' } }),
        WorkOrder.count({ where: { status: 'completada' } }),
        WorkOrder.count({ where: { status: 'cancelada' } }),
        WorkOrder.count({
          where: {
            dueDate: { [Op.lt]: new Date() },
            status: { [Op.notIn]: ['completada', 'cancelada'] }
          }
        })
      ]);

      const stats = {
        total: totalOrders,
        byStatus: {
          pendiente: pendingOrders,
          en_progreso: inProgressOrders,
          completada: completedOrders,
          cancelada: cancelledOrders
        },
        overdue: overDueOrders,
        completionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(2) : 0
      };

      // Guardar en cache por 15 minutos (las estadísticas cambian menos frecuentemente)
      await cacheHelpers.set(cacheKey, stats, 900);

      res.json({
        success: true,
        data: stats,
        cached: false
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/work-orders/by-status/:status - Obtener órdenes por estado
  async getOrdersByStatus(req, res, next) {
    try {
      const { status } = req.params;
      const cacheKey = `work_orders:status:${status}`;

      // Intentar obtener del cache
      const cachedOrders = await cacheHelpers.get(cacheKey);
      if (cachedOrders) {
        return res.json({
          success: true,
          data: cachedOrders,
          cached: true
        });
      }

      const orders = await WorkOrder.findByStatus(status);

      // Guardar en cache
      await cacheHelpers.set(cacheKey, orders);

      res.json({
        success: true,
        data: orders,
        cached: false
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/work-orders/:id/complete - Marcar orden como completada
  async completeOrder(req, res, next) {
    try {
      const { id } = req.params;
      
      const order = await WorkOrder.findByPk(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Orden no encontrada'
        });
      }

      await order.markAsCompleted();

      // Invalidar cache
      await cacheHelpers.del(`work_order:${id}`);
      await cacheHelpers.delPattern('work_orders:*');

      res.json({
        success: true,
        message: 'Orden marcada como completada',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WorkOrderController();
