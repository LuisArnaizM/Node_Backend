// Mock del modelo WorkOrder
const mockWorkOrderModel = {
  findAndCountAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn()
};

// Mock de Redis cache helpers
const mockCacheHelpers = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  delPattern: jest.fn()
};

// Mock de Sequelize Op
const mockOp = {
  or: Symbol('or'),
  and: Symbol('and')
};

jest.mock('../../../models/WorkOrder', () => mockWorkOrderModel);
jest.mock('../../../config/redis', () => ({
  cacheHelpers: mockCacheHelpers
}));
jest.mock('sequelize', () => ({
  Op: mockOp
}));

const WorkOrderController = require('../../../controllers/workOrderController');

describe('WorkOrderController', () => {
  let req, res, next;
  let workOrderController;
  let mockWorkOrder;

  beforeEach(() => {
    jest.clearAllMocks();
    
    workOrderController = WorkOrderController;
    
    // Mock de request, response y next
    req = {
      query: {},
      params: {},
      body: {},
      user: { id: 'test-user-id', role: 'admin' }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();

    // Mock de work order
    mockWorkOrder = {
      id: 'test-order-id',
      title: 'Test Work Order',
      description: 'Test description',
      status: 'pending',
      priority: 'medium',
      assignedTo: 'test-user-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      update: jest.fn(),
      destroy: jest.fn()
    };

    // Configurar comportamientos por defecto
    mockWorkOrder.update.mockResolvedValue(mockWorkOrder);
    mockWorkOrder.destroy.mockResolvedValue(true);
  });

  describe('getAllOrders', () => {
    test('should return cached data when available', async () => {
      const cachedData = {
        orders: [mockWorkOrder],
        count: 1,
        totalPages: 1
      };
      
      req.query = { page: '1', limit: '10' };
      mockCacheHelpers.get.mockResolvedValue(cachedData);
      
      await workOrderController.getAllOrders(req, res, next);
      
      expect(mockCacheHelpers.get).toHaveBeenCalledWith('work_orders:{"page":"1","limit":"10"}');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: cachedData.orders,
        count: cachedData.count,
        totalPages: cachedData.totalPages,
        currentPage: 1,
        cached: true
      });
      expect(mockWorkOrderModel.findAndCountAll).not.toHaveBeenCalled();
    });

    test('should fetch from database when no cache available', async () => {
      const dbResult = {
        count: 2,
        rows: [mockWorkOrder, { ...mockWorkOrder, id: 'test-order-id-2' }]
      };
      
      req.query = { page: '1', limit: '10' };
      mockCacheHelpers.get.mockResolvedValue(null);
      mockWorkOrderModel.findAndCountAll.mockResolvedValue(dbResult);
      
      await workOrderController.getAllOrders(req, res, next);
      
      expect(mockWorkOrderModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        order: [['createdAt', 'DESC']],
        limit: 10,
        offset: 0
      });
      expect(mockCacheHelpers.set).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: dbResult.rows,
        count: dbResult.count,
        totalPages: 1,
        currentPage: 1,
        cached: false
      });
    });

    test('should apply filters correctly', async () => {
      req.query = {
        status: 'pending',
        assignedTo: 'user-123',
        priority: 'high',
        page: '2',
        limit: '5'
      };
      
      mockCacheHelpers.get.mockResolvedValue(null);
      mockWorkOrderModel.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      
      await workOrderController.getAllOrders(req, res, next);
      
      expect(mockWorkOrderModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          status: 'pending',
          assignedTo: 'user-123',
          priority: 'high'
        },
        order: [['createdAt', 'DESC']],
        limit: 5,
        offset: 5
      });
    });

    test('should handle database errors', async () => {
      const error = new Error('Database error');
      req.query = { page: '1', limit: '10' };
      
      mockCacheHelpers.get.mockResolvedValue(null);
      mockWorkOrderModel.findAndCountAll.mockRejectedValue(error);
      
      await workOrderController.getAllOrders(req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getOrderById', () => {
    test('should return cached order when available', async () => {
      req.params.id = 'test-order-id';
      mockCacheHelpers.get.mockResolvedValue(mockWorkOrder);
      
      await workOrderController.getOrderById(req, res, next);
      
      expect(mockCacheHelpers.get).toHaveBeenCalledWith('work_order:test-order-id');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockWorkOrder,
        cached: true
      });
      expect(mockWorkOrderModel.findByPk).not.toHaveBeenCalled();
    });

    test('should fetch from database when no cache available', async () => {
      req.params.id = 'test-order-id';
      mockCacheHelpers.get.mockResolvedValue(null);
      mockWorkOrderModel.findByPk.mockResolvedValue(mockWorkOrder);
      
      await workOrderController.getOrderById(req, res, next);
      
      expect(mockWorkOrderModel.findByPk).toHaveBeenCalledWith('test-order-id');
      expect(mockCacheHelpers.set).toHaveBeenCalledWith('work_order:test-order-id', mockWorkOrder);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockWorkOrder,
        cached: false
      });
    });

    test('should return 404 when order not found', async () => {
      req.params.id = 'non-existent-id';
      mockCacheHelpers.get.mockResolvedValue(null);
      mockWorkOrderModel.findByPk.mockResolvedValue(null);
      
      await workOrderController.getOrderById(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Orden no encontrada',
        message: 'No se encontró una orden con ID: non-existent-id'
      });
    });

    test('should handle database errors', async () => {
      const error = new Error('Database error');
      req.params.id = 'test-order-id';
      
      mockCacheHelpers.get.mockResolvedValue(null);
      mockWorkOrderModel.findByPk.mockRejectedValue(error);
      
      await workOrderController.getOrderById(req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createOrder', () => {
    test('should create new work order successfully', async () => {
      req.body = {
        title: 'New Work Order',
        description: 'New description',
        priority: 'high'
      };
      
      mockWorkOrderModel.create.mockResolvedValue(mockWorkOrder);
      
      await workOrderController.createOrder(req, res, next);
      
      expect(mockWorkOrderModel.create).toHaveBeenCalledWith(req.body);
      expect(mockCacheHelpers.delPattern).toHaveBeenCalledWith('work_orders:*');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Orden de trabajo creada exitosamente',
        data: mockWorkOrder
      });
    });

    test('should handle validation errors', async () => {
      const validationError = {
        name: 'SequelizeValidationError',
        errors: [
          { path: 'title', message: 'Title is required' },
          { path: 'priority', message: 'Invalid priority value' }
        ]
      };
      
      req.body = { title: '', priority: 'invalid' };
      mockWorkOrderModel.create.mockRejectedValue(validationError);
      
      await workOrderController.createOrder(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Errores de validación',
        details: [
          { field: 'title', message: 'Title is required' },
          { field: 'priority', message: 'Invalid priority value' }
        ]
      });
    });

    test('should handle other database errors', async () => {
      const error = new Error('Database error');
      req.body = { title: 'Test' };
      
      mockWorkOrderModel.create.mockRejectedValue(error);
      
      await workOrderController.createOrder(req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateOrder', () => {
    test('should update work order successfully', async () => {
      req.params.id = 'test-order-id';
      req.body = { title: 'Updated Title', status: 'in-progress' };
      
      mockWorkOrderModel.findByPk.mockResolvedValue(mockWorkOrder);
      
      await workOrderController.updateOrder(req, res, next);
      
      expect(mockWorkOrderModel.findByPk).toHaveBeenCalledWith('test-order-id');
      expect(mockWorkOrder.update).toHaveBeenCalledWith(req.body);
      expect(mockCacheHelpers.del).toHaveBeenCalledWith('work_order:test-order-id');
      expect(mockCacheHelpers.delPattern).toHaveBeenCalledWith('work_orders:*');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Orden de trabajo actualizada exitosamente',
        data: mockWorkOrder
      });
    });

    test('should return 404 when order not found', async () => {
      req.params.id = 'non-existent-id';
      req.body = { title: 'Updated Title' };
      
      mockWorkOrderModel.findByPk.mockResolvedValue(null);
      
      await workOrderController.updateOrder(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Orden no encontrada',
        message: 'No se encontró una orden con ID: non-existent-id'
      });
    });

    test('should handle validation errors', async () => {
      const validationError = {
        name: 'SequelizeValidationError',
        errors: [
          { path: 'status', message: 'Invalid status value' }
        ]
      };
      
      req.params.id = 'test-order-id';
      req.body = { status: 'invalid-status' };
      
      mockWorkOrderModel.findByPk.mockResolvedValue(mockWorkOrder);
      mockWorkOrder.update.mockRejectedValue(validationError);
      
      await workOrderController.updateOrder(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Errores de validación',
        details: [
          { field: 'status', message: 'Invalid status value' }
        ]
      });
    });
  });

  describe('deleteOrder', () => {
    test('should delete work order successfully', async () => {
      req.params.id = 'test-order-id';
      
      mockWorkOrderModel.findByPk.mockResolvedValue(mockWorkOrder);
      
      await workOrderController.deleteOrder(req, res, next);
      
      expect(mockWorkOrderModel.findByPk).toHaveBeenCalledWith('test-order-id');
      expect(mockWorkOrder.destroy).toHaveBeenCalled();
      expect(mockCacheHelpers.del).toHaveBeenCalledWith('work_order:test-order-id');
      expect(mockCacheHelpers.delPattern).toHaveBeenCalledWith('work_orders:*');
    });

    test('should return 404 when order not found', async () => {
      req.params.id = 'non-existent-id';
      
      mockWorkOrderModel.findByPk.mockResolvedValue(null);
      
      await workOrderController.deleteOrder(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Orden no encontrada',
        message: 'No se encontró una orden con ID: non-existent-id'
      });
    });

    test('should handle database errors', async () => {
      const error = new Error('Database error');
      req.params.id = 'test-order-id';
      
      mockWorkOrderModel.findByPk.mockRejectedValue(error);
      
      await workOrderController.deleteOrder(req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
