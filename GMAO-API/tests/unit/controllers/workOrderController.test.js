const workOrderController = require('../../../controllers/workOrderController');
const { Op } = require('sequelize');

// Mock del modelo WorkOrder
jest.mock('../../../models/WorkOrder');
const WorkOrder = require('../../../models/WorkOrder');

// Mock del cache de Redis
jest.mock('../../../config/redis', () => ({
  cacheHelpers: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delPattern: jest.fn()
  }
}));
const { cacheHelpers } = require('../../../config/redis');

describe('WorkOrderController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user-123', role: 'admin' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllOrders', () => {
    const mockOrders = [
      {
        id: 'order-1',
        title: 'First Order',
        description: 'First description',
        status: 'pendiente',
        priority: 'media'
      },
      {
        id: 'order-2',
        title: 'Second Order',
        description: 'Second description',
        status: 'en_progreso',
        priority: 'alta'
      }
    ];

    test('should get all orders without filters', async () => {
      req.query = {};
      
      cacheHelpers.get.mockResolvedValue(null); // No cache
      WorkOrder.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: mockOrders
      });
      cacheHelpers.set.mockResolvedValue();

      await workOrderController.getAllOrders(req, res, next);

      expect(WorkOrder.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        order: [['createdAt', 'DESC']],
        limit: 10,
        offset: 0
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrders,
        count: 2,
        totalPages: 1,
        currentPage: 1,
        cached: false
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should get orders with status filter', async () => {
      req.query = { status: 'pendiente' };
      
      cacheHelpers.get.mockResolvedValue(null);
      WorkOrder.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [mockOrders[0]]
      });

      await workOrderController.getAllOrders(req, res, next);

      expect(WorkOrder.findAndCountAll).toHaveBeenCalledWith({
        where: { status: 'pendiente' },
        order: [['createdAt', 'DESC']],
        limit: 10,
        offset: 0
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [mockOrders[0]],
        count: 1,
        totalPages: 1,
        currentPage: 1,
        cached: false
      });
    });

    test('should get orders with multiple filters', async () => {
      req.query = { 
        status: 'en_progreso', 
        assignedTo: 'John Doe', 
        priority: 'alta' 
      };
      
      cacheHelpers.get.mockResolvedValue(null);
      WorkOrder.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [mockOrders[1]]
      });

      await workOrderController.getAllOrders(req, res, next);

      expect(WorkOrder.findAndCountAll).toHaveBeenCalledWith({
        where: { 
          status: 'en_progreso',
          assignedTo: 'John Doe',
          priority: 'alta'
        },
        order: [['createdAt', 'DESC']],
        limit: 10,
        offset: 0
      });
    });

    test('should handle pagination correctly', async () => {
      req.query = { page: '2', limit: '5' };
      
      cacheHelpers.get.mockResolvedValue(null);
      WorkOrder.findAndCountAll.mockResolvedValue({
        count: 12,
        rows: mockOrders
      });

      await workOrderController.getAllOrders(req, res, next);

      expect(WorkOrder.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        order: [['createdAt', 'DESC']],
        limit: 5,
        offset: 5 // (page 2 - 1) * limit 5
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrders,
        count: 12,
        totalPages: 3, // Math.ceil(12/5)
        currentPage: 2,
        cached: false
      });
    });

    test('should return cached data when available', async () => {
      req.query = { status: 'pendiente' };
      
      const cachedData = {
        orders: mockOrders,
        count: 2,
        totalPages: 1
      };
      cacheHelpers.get.mockResolvedValue(cachedData);

      await workOrderController.getAllOrders(req, res, next);

      expect(WorkOrder.findAndCountAll).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: cachedData.orders,
        count: cachedData.count,
        totalPages: cachedData.totalPages,
        currentPage: 1,
        cached: true
      });
    });

    test('should cache results after database query', async () => {
      req.query = { status: 'pendiente' };
      
      cacheHelpers.get.mockResolvedValue(null);
      WorkOrder.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: mockOrders
      });

      await workOrderController.getAllOrders(req, res, next);

      const expectedCacheKey = `work_orders:${JSON.stringify({ status: 'pendiente', assignedTo: undefined, priority: undefined, page: 1, limit: 10 })}`;
      expect(cacheHelpers.set).toHaveBeenCalledWith(expectedCacheKey, {
        orders: mockOrders,
        count: 2,
        totalPages: 1
      });
    });

    test('should handle database errors', async () => {
      req.query = {};
      
      cacheHelpers.get.mockResolvedValue(null);
      WorkOrder.findAndCountAll.mockRejectedValue(new Error('Database error'));

      await workOrderController.getAllOrders(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(res.json).not.toHaveBeenCalled();
    });

    test('should handle cache errors gracefully', async () => {
      req.query = {};
      
      cacheHelpers.get.mockRejectedValue(new Error('Cache error'));

      await workOrderController.getAllOrders(req, res, next);

      // Should pass error to next middleware when cache fails
      expect(next).toHaveBeenCalledWith(new Error('Cache error'));
      expect(WorkOrder.findAndCountAll).not.toHaveBeenCalled();
    });
  });

  describe('getOrderById', () => {
    const mockOrder = {
      id: 'order-123',
      title: 'Test Order',
      description: 'Test description',
      status: 'pendiente',
      priority: 'media'
    };

    test('should get order by ID from database', async () => {
      req.params.id = 'order-123';
      
      cacheHelpers.get.mockResolvedValue(null); // No cache
      WorkOrder.findByPk.mockResolvedValue(mockOrder);
      cacheHelpers.set.mockResolvedValue();

      await workOrderController.getOrderById(req, res, next);

      expect(WorkOrder.findByPk).toHaveBeenCalledWith('order-123');
      expect(cacheHelpers.set).toHaveBeenCalledWith('work_order:order-123', mockOrder);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrder,
        cached: false
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return cached order when available', async () => {
      req.params.id = 'order-123';
      
      cacheHelpers.get.mockResolvedValue(mockOrder);

      await workOrderController.getOrderById(req, res, next);

      expect(WorkOrder.findByPk).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrder,
        cached: true
      });
    });

    test('should return 404 for non-existent order', async () => {
      req.params.id = 'non-existent';
      
      cacheHelpers.get.mockResolvedValue(null);
      WorkOrder.findByPk.mockResolvedValue(null);

      await workOrderController.getOrderById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Orden no encontrada',
        message: 'No se encontró una orden con ID: non-existent'
      });
      expect(cacheHelpers.set).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle database errors', async () => {
      req.params.id = 'order-123';
      
      cacheHelpers.get.mockResolvedValue(null);
      WorkOrder.findByPk.mockRejectedValue(new Error('Database error'));

      await workOrderController.getOrderById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('createOrder', () => {
    const validOrderData = {
      title: 'New Order',
      description: 'New order description',
      priority: 'alta',
      assignedTo: 'John Doe'
    };

    const mockCreatedOrder = {
      id: 'order-new',
      ...validOrderData,
      status: 'pendiente',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    test('should create new order successfully', async () => {
      req.body = validOrderData;
      
      WorkOrder.create.mockResolvedValue(mockCreatedOrder);
      cacheHelpers.delPattern.mockResolvedValue();

      await workOrderController.createOrder(req, res, next);

      expect(WorkOrder.create).toHaveBeenCalledWith(validOrderData);
      expect(cacheHelpers.delPattern).toHaveBeenCalledWith('work_orders:*');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Orden de trabajo creada exitosamente',
        data: mockCreatedOrder
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle validation errors', async () => {
      req.body = { title: 'Te' }; // Too short title
      
      const validationError = {
        name: 'SequelizeValidationError',
        errors: [
          { path: 'title', message: 'Title must be at least 3 characters' }
        ]
      };
      WorkOrder.create.mockRejectedValue(validationError);

      await workOrderController.createOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Errores de validación',
        details: [
          { field: 'title', message: 'Title must be at least 3 characters' }
        ]
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle database errors', async () => {
      req.body = validOrderData;
      
      WorkOrder.create.mockRejectedValue(new Error('Database error'));

      await workOrderController.createOrder(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('updateOrder', () => {
    const updateData = {
      title: 'Updated Order',
      status: 'en_progreso'
    };

    const mockOrder = {
      id: 'order-123',
      title: 'Original Order',
      status: 'pendiente',
      update: jest.fn(),
      save: jest.fn()
    };

    test('should update order successfully', async () => {
      req.params.id = 'order-123';
      req.body = updateData;
      
      WorkOrder.findByPk.mockResolvedValue(mockOrder);
      mockOrder.update.mockResolvedValue({
        ...mockOrder,
        ...updateData
      });
      cacheHelpers.del.mockResolvedValue();
      cacheHelpers.delPattern.mockResolvedValue();

      await workOrderController.updateOrder(req, res, next);

      expect(WorkOrder.findByPk).toHaveBeenCalledWith('order-123');
      expect(mockOrder.update).toHaveBeenCalledWith(updateData);
      expect(cacheHelpers.del).toHaveBeenCalledWith('work_order:order-123');
      expect(cacheHelpers.delPattern).toHaveBeenCalledWith('work_orders:*');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Orden de trabajo actualizada exitosamente',
        data: expect.objectContaining(updateData)
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 404 for non-existent order', async () => {
      req.params.id = 'non-existent';
      req.body = updateData;
      
      WorkOrder.findByPk.mockResolvedValue(null);

      await workOrderController.updateOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Orden no encontrada',
        message: 'No se encontró una orden con ID: non-existent'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle update errors', async () => {
      req.params.id = 'order-123';
      req.body = updateData;
      
      WorkOrder.findByPk.mockResolvedValue(mockOrder);
      mockOrder.update.mockRejectedValue(new Error('Update error'));

      await workOrderController.updateOrder(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('deleteOrder', () => {
    const mockOrder = {
      id: 'order-123',
      title: 'Order to Delete',
      destroy: jest.fn()
    };

    test('should delete order successfully', async () => {
      req.params.id = 'order-123';
      
      WorkOrder.findByPk.mockResolvedValue(mockOrder);
      mockOrder.destroy.mockResolvedValue();
      cacheHelpers.del.mockResolvedValue();
      cacheHelpers.delPattern.mockResolvedValue();

      await workOrderController.deleteOrder(req, res, next);

      expect(WorkOrder.findByPk).toHaveBeenCalledWith('order-123');
      expect(mockOrder.destroy).toHaveBeenCalled();
      expect(cacheHelpers.del).toHaveBeenCalledWith('work_order:order-123');
      expect(cacheHelpers.delPattern).toHaveBeenCalledWith('work_orders:*');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Orden de trabajo eliminada exitosamente',
        data: mockOrder
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 404 for non-existent order', async () => {
      req.params.id = 'non-existent';
      
      WorkOrder.findByPk.mockResolvedValue(null);

      await workOrderController.deleteOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Orden no encontrada',
        message: 'No se encontró una orden con ID: non-existent'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle delete errors', async () => {
      req.params.id = 'order-123';
      
      WorkOrder.findByPk.mockResolvedValue(mockOrder);
      mockOrder.destroy.mockRejectedValue(new Error('Delete error'));

      await workOrderController.deleteOrder(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
