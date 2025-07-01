const { 
  workOrderSchema, 
  updateWorkOrderSchema, 
  loginSchema, 
  validateData 
} = require('../../../middlewares/validation');

describe('Validation Middleware', () => {
  describe('workOrderSchema', () => {
    test('should validate a valid work order', () => {
      const validWorkOrder = {
        title: 'Test Work Order',
        description: 'This is a test description',
        priority: 'media',
        status: 'pendiente'
      };

      const { error, value } = workOrderSchema.validate(validWorkOrder);
      
      expect(error).toBeUndefined();
      expect(value.title).toBe('Test Work Order');
      expect(value.description).toBe('This is a test description');
      expect(value.priority).toBe('media');
      expect(value.status).toBe('pendiente');
    });

    test('should set default values for priority and status', () => {
      const workOrder = {
        title: 'Test Work Order',
        description: 'This is a test description'
      };

      const { error, value } = workOrderSchema.validate(workOrder);
      
      expect(error).toBeUndefined();
      expect(value.priority).toBe('media');
      expect(value.status).toBe('pendiente');
    });

    test('should reject work order without title', () => {
      const invalidWorkOrder = {
        description: 'This is a test description'
      };

      const { error } = workOrderSchema.validate(invalidWorkOrder);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('El título es obligatorio');
    });

    test('should reject work order without description', () => {
      const invalidWorkOrder = {
        title: 'Test Work Order'
      };

      const { error } = workOrderSchema.validate(invalidWorkOrder);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('La descripción es obligatoria');
    });

    test('should reject title shorter than 3 characters', () => {
      const invalidWorkOrder = {
        title: 'Te',
        description: 'This is a test description'
      };

      const { error } = workOrderSchema.validate(invalidWorkOrder);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('El título debe tener al menos 3 caracteres');
    });

    test('should reject title longer than 255 characters', () => {
      const longTitle = 'A'.repeat(256);
      const invalidWorkOrder = {
        title: longTitle,
        description: 'This is a test description'
      };

      const { error } = workOrderSchema.validate(invalidWorkOrder);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('El título no puede superar los 255 caracteres');
    });

    test('should reject invalid priority', () => {
      const invalidWorkOrder = {
        title: 'Test Work Order',
        description: 'This is a test description',
        priority: 'invalid_priority'
      };

      const { error } = workOrderSchema.validate(invalidWorkOrder);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('must be one of');
    });

    test('should reject invalid status', () => {
      const invalidWorkOrder = {
        title: 'Test Work Order',
        description: 'This is a test description',
        status: 'invalid_status'
      };

      const { error } = workOrderSchema.validate(invalidWorkOrder);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('must be one of');
    });

    test('should validate optional fields', () => {
      const workOrder = {
        title: 'Test Work Order',
        description: 'This is a test description',
        assignedTo: 'John Doe',
        estimatedHours: 5.5,
        actualHours: 4.2,
        dueDate: '2024-12-31T23:59:59.000Z',
        equipmentId: 'EQ001',
        location: 'Building A',
        cost: 150.75,
        notes: 'Some additional notes'
      };

      const { error, value } = workOrderSchema.validate(workOrder);
      
      expect(error).toBeUndefined();
      expect(value.assignedTo).toBe('John Doe');
      expect(value.estimatedHours).toBe(5.5);
      expect(value.actualHours).toBe(4.2);
      expect(value.cost).toBe(150.75);
    });

    test('should reject negative estimated hours', () => {
      const invalidWorkOrder = {
        title: 'Test Work Order',
        description: 'This is a test description',
        estimatedHours: -1
      };

      const { error } = workOrderSchema.validate(invalidWorkOrder);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('must be greater than or equal to 0');
    });

    test('should reject negative cost', () => {
      const invalidWorkOrder = {
        title: 'Test Work Order',
        description: 'This is a test description',
        cost: -100
      };

      const { error } = workOrderSchema.validate(invalidWorkOrder);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('must be greater than or equal to 0');
    });
  });

  describe('updateWorkOrderSchema', () => {
    test('should validate partial update', () => {
      const partialUpdate = {
        title: 'Updated Title',
        priority: 'alta'
      };

      const { error, value } = updateWorkOrderSchema.validate(partialUpdate);
      
      expect(error).toBeUndefined();
      expect(value.title).toBe('Updated Title');
      expect(value.priority).toBe('alta');
    });

    test('should require at least one field', () => {
      const emptyUpdate = {};

      const { error } = updateWorkOrderSchema.validate(emptyUpdate);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('must have at least 1');
    });

    test('should validate single field update', () => {
      const singleFieldUpdate = {
        status: 'completada'
      };

      const { error, value } = updateWorkOrderSchema.validate(singleFieldUpdate);
      
      expect(error).toBeUndefined();
      expect(value.status).toBe('completada');
    });
  });

  describe('loginSchema', () => {
    test('should validate valid login credentials', () => {
      const validLogin = {
        username: 'testuser',
        password: 'testpassword'
      };

      const { error, value } = loginSchema.validate(validLogin);
      
      expect(error).toBeUndefined();
      expect(value.username).toBe('testuser');
      expect(value.password).toBe('testpassword');
    });

    test('should reject login without username', () => {
      const invalidLogin = {
        password: 'testpassword'
      };

      const { error } = loginSchema.validate(invalidLogin);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('El nombre de usuario es obligatorio');
    });

    test('should reject login without password', () => {
      const invalidLogin = {
        username: 'testuser'
      };

      const { error } = loginSchema.validate(invalidLogin);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('La contraseña es obligatoria');
    });

    test('should reject empty username', () => {
      const invalidLogin = {
        username: '',
        password: 'testpassword'
      };

      const { error } = loginSchema.validate(invalidLogin);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('not allowed to be empty');
    });

    test('should reject empty password', () => {
      const invalidLogin = {
        username: 'testuser',
        password: ''
      };

      const { error } = loginSchema.validate(invalidLogin);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('not allowed to be empty');
    });
  });

  describe('validateData middleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        body: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    test('should call next() with valid data', () => {
      req.body = {
        username: 'testuser',
        password: 'testpassword'
      };

      const middleware = validateData(loginSchema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.body.username).toBe('testuser');
      expect(req.body.password).toBe('testpassword');
    });

    test('should return 400 with validation errors', () => {
      req.body = {
        username: 'testuser'
        // missing password
      };

      const middleware = validateData(loginSchema);
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Errores de validación',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: 'La contraseña es obligatoria'
          })
        ])
      });
    });

    test('should strip unknown fields', () => {
      req.body = {
        username: 'testuser',
        password: 'testpassword',
        unknownField: 'should be removed'
      };

      const middleware = validateData(loginSchema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body).toEqual({
        username: 'testuser',
        password: 'testpassword'
      });
      expect(req.body.unknownField).toBeUndefined();
    });

    test('should handle multiple validation errors', () => {
      req.body = {
        title: 'Te', // too short
        // missing description
        priority: 'invalid', // invalid value
        estimatedHours: -1 // negative value
      };

      const middleware = validateData(workOrderSchema);
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Errores de validación',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'title',
            message: 'El título debe tener al menos 3 caracteres'
          }),
          expect.objectContaining({
            field: 'description',
            message: 'La descripción es obligatoria'
          })
        ])
      });
    });

    test('should preserve validation error context', () => {
      req.body = {
        title: 'Te',
        description: 'Valid description'
      };

      const middleware = validateData(workOrderSchema);
      middleware(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Errores de validación',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'title',
            message: 'El título debe tener al menos 3 caracteres',
            value: 'Te'
          })
        ])
      });
    });
  });
});
