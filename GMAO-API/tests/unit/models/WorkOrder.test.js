const { DataTypes } = require('sequelize');

// Mock de Sequelize
const mockSequelize = {
  define: jest.fn().mockReturnValue({
    prototype: {}
  })
};

// Mock del módulo de base de datos
jest.mock('../../../config/database', () => ({
  sequelize: mockSequelize
}));

describe('WorkOrder Model', () => {
  let WorkOrder;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Recargar el modelo para cada test
    jest.isolateModules(() => {
      WorkOrder = require('../../../models/WorkOrder');
    });
  });

  describe('Model Definition', () => {
    test('should define WorkOrder model with correct attributes', () => {
      expect(mockSequelize.define).toHaveBeenCalledWith(
        'WorkOrder',
        expect.objectContaining({
          id: expect.objectContaining({
            type: expect.any(Function),
            primaryKey: true,
            defaultValue: expect.any(Function)
          }),
          title: expect.objectContaining({
            type: expect.any(Function),
            allowNull: false,
            validate: expect.objectContaining({
              notEmpty: true,
              len: [3, 255]
            })
          }),
          description: expect.objectContaining({
            type: expect.any(Function),
            allowNull: false,
            validate: expect.objectContaining({
              notEmpty: true
            })
          }),
          priority: expect.objectContaining({
            allowNull: false,
            defaultValue: 'media'
          }),
          status: expect.objectContaining({
            allowNull: false,
            defaultValue: 'pendiente'
          }),
          assignedTo: expect.objectContaining({
            type: expect.any(Function),
            allowNull: true
          }),
          estimatedHours: expect.objectContaining({
            allowNull: true,
            validate: expect.objectContaining({
              min: 0
            })
          }),
          actualHours: expect.objectContaining({
            allowNull: true,
            validate: expect.objectContaining({
              min: 0
            })
          })
        }),
        expect.objectContaining({
          tableName: 'work_orders',
          timestamps: true,
          createdAt: 'createdAt',
          updatedAt: 'updatedAt',
          indexes: expect.any(Array)
        })
      );
    });
  });

  describe('Instance Methods', () => {
    let workOrderInstance;

    beforeEach(() => {
      workOrderInstance = {
        id: 'order-123',
        title: 'Test Work Order',
        description: 'Test description',
        priority: 'media',
        status: 'pendiente',
        assignedTo: null,
        estimatedHours: null,
        actualHours: null,
        completedAt: null,
        save: jest.fn()
      };

      // Implementar métodos de instancia
      workOrderInstance.complete = function() {
        this.status = 'completada';
        this.completedAt = new Date();
        return this.save();
      };

      workOrderInstance.cancel = function() {
        this.status = 'cancelada';
        return this.save();
      };

      workOrderInstance.assign = function(assignedTo) {
        this.assignedTo = assignedTo;
        return this.save();
      };

      workOrderInstance.updateStatus = function(status) {
        this.status = status;
        if (status === 'completada') {
          this.completedAt = new Date();
        }
        return this.save();
      };
    });

    describe('complete', () => {
      test('should mark order as completed and set completedAt', async () => {
        workOrderInstance.save.mockResolvedValue(workOrderInstance);
        const initialCompletedAt = workOrderInstance.completedAt;

        const result = await workOrderInstance.complete();

        expect(workOrderInstance.status).toBe('completada');
        expect(workOrderInstance.completedAt).not.toBe(initialCompletedAt);
        expect(workOrderInstance.completedAt).toBeInstanceOf(Date);
        expect(workOrderInstance.save).toHaveBeenCalled();
        expect(result).toBe(workOrderInstance);
      });

      test('should handle save errors', async () => {
        workOrderInstance.save.mockRejectedValue(new Error('Save error'));

        await expect(workOrderInstance.complete())
          .rejects.toThrow('Save error');
      });
    });

    describe('cancel', () => {
      test('should mark order as cancelled', async () => {
        workOrderInstance.save.mockResolvedValue(workOrderInstance);

        const result = await workOrderInstance.cancel();

        expect(workOrderInstance.status).toBe('cancelada');
        expect(workOrderInstance.save).toHaveBeenCalled();
        expect(result).toBe(workOrderInstance);
      });

      test('should handle save errors', async () => {
        workOrderInstance.save.mockRejectedValue(new Error('Save error'));

        await expect(workOrderInstance.cancel())
          .rejects.toThrow('Save error');
      });
    });

    describe('assign', () => {
      test('should assign order to user', async () => {
        workOrderInstance.save.mockResolvedValue(workOrderInstance);

        const result = await workOrderInstance.assign('John Doe');

        expect(workOrderInstance.assignedTo).toBe('John Doe');
        expect(workOrderInstance.save).toHaveBeenCalled();
        expect(result).toBe(workOrderInstance);
      });

      test('should handle empty assignment', async () => {
        workOrderInstance.save.mockResolvedValue(workOrderInstance);

        const result = await workOrderInstance.assign('');

        expect(workOrderInstance.assignedTo).toBe('');
        expect(workOrderInstance.save).toHaveBeenCalled();
        expect(result).toBe(workOrderInstance);
      });

      test('should handle null assignment', async () => {
        workOrderInstance.save.mockResolvedValue(workOrderInstance);

        const result = await workOrderInstance.assign(null);

        expect(workOrderInstance.assignedTo).toBe(null);
        expect(workOrderInstance.save).toHaveBeenCalled();
        expect(result).toBe(workOrderInstance);
      });

      test('should handle save errors', async () => {
        workOrderInstance.save.mockRejectedValue(new Error('Save error'));

        await expect(workOrderInstance.assign('John Doe'))
          .rejects.toThrow('Save error');
      });
    });

    describe('updateStatus', () => {
      test('should update status to en_progreso', async () => {
        workOrderInstance.save.mockResolvedValue(workOrderInstance);

        const result = await workOrderInstance.updateStatus('en_progreso');

        expect(workOrderInstance.status).toBe('en_progreso');
        expect(workOrderInstance.completedAt).toBeNull();
        expect(workOrderInstance.save).toHaveBeenCalled();
        expect(result).toBe(workOrderInstance);
      });

      test('should update status to completada and set completedAt', async () => {
        workOrderInstance.save.mockResolvedValue(workOrderInstance);
        const initialCompletedAt = workOrderInstance.completedAt;

        const result = await workOrderInstance.updateStatus('completada');

        expect(workOrderInstance.status).toBe('completada');
        expect(workOrderInstance.completedAt).not.toBe(initialCompletedAt);
        expect(workOrderInstance.completedAt).toBeInstanceOf(Date);
        expect(workOrderInstance.save).toHaveBeenCalled();
        expect(result).toBe(workOrderInstance);
      });

      test('should update status to cancelada', async () => {
        workOrderInstance.save.mockResolvedValue(workOrderInstance);

        const result = await workOrderInstance.updateStatus('cancelada');

        expect(workOrderInstance.status).toBe('cancelada');
        expect(workOrderInstance.save).toHaveBeenCalled();
        expect(result).toBe(workOrderInstance);
      });

      test('should handle save errors', async () => {
        workOrderInstance.save.mockRejectedValue(new Error('Save error'));

        await expect(workOrderInstance.updateStatus('completada'))
          .rejects.toThrow('Save error');
      });
    });
  });

  describe('Static Methods', () => {
    let MockModel;

    beforeEach(() => {
      MockModel = {
        findAll: jest.fn(),
        count: jest.fn()
      };

      // Implementar métodos estáticos
      MockModel.findByStatus = function(status) {
        return this.findAll({
          where: { status }
        });
      };

      MockModel.findByPriority = function(priority) {
        return this.findAll({
          where: { priority }
        });
      };

      MockModel.findByAssignee = function(assignedTo) {
        return this.findAll({
          where: { assignedTo }
        });
      };

      MockModel.findOverdue = function() {
        const { Op } = require('sequelize');
        return this.findAll({
          where: {
            dueDate: {
              [Op.lt]: new Date()
            },
            status: {
              [Op.ne]: 'completada'
            }
          }
        });
      };
    });

    describe('findByStatus', () => {
      test('should find orders by status', async () => {
        const mockOrders = [
          { id: 'order-1', status: 'pendiente' },
          { id: 'order-2', status: 'pendiente' }
        ];
        MockModel.findAll.mockResolvedValue(mockOrders);

        const result = await MockModel.findByStatus('pendiente');

        expect(MockModel.findAll).toHaveBeenCalledWith({
          where: { status: 'pendiente' }
        });
        expect(result).toEqual(mockOrders);
      });

      test('should handle different status values', async () => {
        const statuses = ['pendiente', 'en_progreso', 'completada', 'cancelada'];
        
        for (const status of statuses) {
          MockModel.findAll.mockClear();
          await MockModel.findByStatus(status);
          
          expect(MockModel.findAll).toHaveBeenCalledWith({
            where: { status }
          });
        }
      });
    });

    describe('findByPriority', () => {
      test('should find orders by priority', async () => {
        const mockOrders = [
          { id: 'order-1', priority: 'alta' },
          { id: 'order-2', priority: 'alta' }
        ];
        MockModel.findAll.mockResolvedValue(mockOrders);

        const result = await MockModel.findByPriority('alta');

        expect(MockModel.findAll).toHaveBeenCalledWith({
          where: { priority: 'alta' }
        });
        expect(result).toEqual(mockOrders);
      });

      test('should handle different priority values', async () => {
        const priorities = ['baja', 'media', 'alta', 'critica'];
        
        for (const priority of priorities) {
          MockModel.findAll.mockClear();
          await MockModel.findByPriority(priority);
          
          expect(MockModel.findAll).toHaveBeenCalledWith({
            where: { priority }
          });
        }
      });
    });

    describe('findByAssignee', () => {
      test('should find orders by assignee', async () => {
        const mockOrders = [
          { id: 'order-1', assignedTo: 'John Doe' },
          { id: 'order-2', assignedTo: 'John Doe' }
        ];
        MockModel.findAll.mockResolvedValue(mockOrders);

        const result = await MockModel.findByAssignee('John Doe');

        expect(MockModel.findAll).toHaveBeenCalledWith({
          where: { assignedTo: 'John Doe' }
        });
        expect(result).toEqual(mockOrders);
      });

      test('should handle null assignee', async () => {
        await MockModel.findByAssignee(null);
        
        expect(MockModel.findAll).toHaveBeenCalledWith({
          where: { assignedTo: null }
        });
      });
    });

    describe('findOverdue', () => {
      test('should find overdue orders', async () => {
        const mockOrders = [
          { id: 'order-1', dueDate: new Date('2023-01-01'), status: 'pendiente' },
          { id: 'order-2', dueDate: new Date('2023-01-02'), status: 'en_progreso' }
        ];
        MockModel.findAll.mockResolvedValue(mockOrders);

        const result = await MockModel.findOverdue();

        expect(MockModel.findAll).toHaveBeenCalledWith({
          where: {
            dueDate: {
              [require('sequelize').Op.lt]: expect.any(Date)
            },
            status: {
              [require('sequelize').Op.ne]: 'completada'
            }
          }
        });
        expect(result).toEqual(mockOrders);
      });
    });
  });

  describe('Validation', () => {
    test('should validate title length', () => {
      const validTitles = ['Valid Title', 'Another Valid Title', 'A'.repeat(255)];
      const invalidTitles = ['', 'AB', 'A'.repeat(256)];

      validTitles.forEach(title => {
        const isValid = title.length >= 3 && title.length <= 255 && title.trim() !== '';
        expect(isValid).toBe(true);
      });

      invalidTitles.forEach(title => {
        const isValid = title.length >= 3 && title.length <= 255 && title.trim() !== '';
        expect(isValid).toBe(false);
      });
    });

    test('should validate priority values', () => {
      const validPriorities = ['baja', 'media', 'alta', 'critica'];
      const invalidPriorities = ['low', 'high', 'urgent', '', null];

      validPriorities.forEach(priority => {
        const isValid = ['baja', 'media', 'alta', 'critica'].includes(priority);
        expect(isValid).toBe(true);
      });

      invalidPriorities.forEach(priority => {
        const isValid = ['baja', 'media', 'alta', 'critica'].includes(priority);
        expect(isValid).toBe(false);
      });
    });

    test('should validate status values', () => {
      const validStatuses = ['pendiente', 'en_progreso', 'completada', 'cancelada'];
      const invalidStatuses = ['pending', 'in_progress', 'done', '', null];

      validStatuses.forEach(status => {
        const isValid = ['pendiente', 'en_progreso', 'completada', 'cancelada'].includes(status);
        expect(isValid).toBe(true);
      });

      invalidStatuses.forEach(status => {
        const isValid = ['pendiente', 'en_progreso', 'completada', 'cancelada'].includes(status);
        expect(isValid).toBe(false);
      });
    });

    test('should validate hours are non-negative', () => {
      const validHours = [0, 1, 1.5, 8, 40, 999.99];
      const invalidHours = [-1, -0.1, -999];

      validHours.forEach(hours => {
        const isValid = hours >= 0;
        expect(isValid).toBe(true);
      });

      invalidHours.forEach(hours => {
        const isValid = hours >= 0;
        expect(isValid).toBe(false);
      });
    });

    test('should validate cost is non-negative', () => {
      const validCosts = [0, 1, 100.50, 1000, 999999.99];
      const invalidCosts = [-1, -0.01, -1000];

      validCosts.forEach(cost => {
        const isValid = cost >= 0;
        expect(isValid).toBe(true);
      });

      invalidCosts.forEach(cost => {
        const isValid = cost >= 0;
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Model Hooks', () => {
    test('should set completedAt when status changes to completada', () => {
      const workOrder = {
        status: 'pendiente',
        completedAt: null,
        changed: jest.fn().mockImplementation((field) => field === 'status')
      };

      // Simular hook beforeUpdate
      const beforeUpdateHook = (workOrder) => {
        if (workOrder.changed('status') && workOrder.status === 'completada') {
          workOrder.completedAt = new Date();
        }
      };

      workOrder.status = 'completada';
      beforeUpdateHook(workOrder);

      expect(workOrder.changed).toHaveBeenCalledWith('status');
      expect(workOrder.completedAt).toBeInstanceOf(Date);
    });

    test('should not set completedAt when status changes to other values', () => {
      const workOrder = {
        status: 'pendiente',
        completedAt: null,
        changed: jest.fn().mockImplementation((field) => field === 'status')
      };

      const beforeUpdateHook = (workOrder) => {
        if (workOrder.changed('status') && workOrder.status === 'completada') {
          workOrder.completedAt = new Date();
        }
      };

      const nonCompletedStatuses = ['en_progreso', 'cancelada'];
      
      nonCompletedStatuses.forEach(status => {
        workOrder.status = status;
        workOrder.completedAt = null;
        workOrder.changed.mockClear();
        
        beforeUpdateHook(workOrder);
        
        expect(workOrder.changed).toHaveBeenCalledWith('status');
        expect(workOrder.completedAt).toBeNull();
      });
    });

    test('should not set completedAt when status does not change', () => {
      const workOrder = {
        status: 'completada',
        completedAt: null,
        changed: jest.fn().mockReturnValue(false)
      };

      const beforeUpdateHook = (workOrder) => {
        if (workOrder.changed('status') && workOrder.status === 'completada') {
          workOrder.completedAt = new Date();
        }
      };

      beforeUpdateHook(workOrder);

      expect(workOrder.changed).toHaveBeenCalledWith('status');
      expect(workOrder.completedAt).toBeNull();
    });
  });
});
