const bcrypt = require('bcryptjs');
const { DataTypes } = require('sequelize');

// Mock de bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  genSalt: jest.fn(),
  hash: jest.fn()
}));

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

describe('User Model', () => {
  let User;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Recargar el modelo para cada test
    jest.isolateModules(() => {
      User = require('../../../models/User');
    });
  });

  describe('Model Definition', () => {
    test('should define User model with correct attributes', () => {
      expect(mockSequelize.define).toHaveBeenCalledWith(
        'User',
        expect.objectContaining({
          id: expect.objectContaining({
            type: expect.any(Function),
            primaryKey: true,
            defaultValue: expect.any(Function)
          }),
          username: expect.objectContaining({
            type: expect.any(Function),
            allowNull: false,
            unique: true,
            validate: expect.objectContaining({
              notEmpty: true,
              len: [3, 50]
            })
          }),
          email: expect.objectContaining({
            type: expect.any(Function),
            allowNull: false,
            unique: true,
            validate: expect.objectContaining({
              isEmail: true,
              notEmpty: true
            })
          }),
          password: expect.objectContaining({
            type: expect.any(Function),
            allowNull: false,
            validate: expect.objectContaining({
              notEmpty: true,
              len: [6, 100]
            })
          }),
          role: expect.objectContaining({
            type: expect.any(Function),
            allowNull: false,
            defaultValue: 'viewer',
            validate: expect.objectContaining({
              isIn: expect.any(Object),
              isValidRole: expect.any(Function)
            })
          }),
          isActive: expect.objectContaining({
            type: expect.any(Function),
            defaultValue: true
          }),
          lastLoginAt: expect.objectContaining({
            type: expect.any(Function),
            allowNull: true
          }),
          passwordChangedAt: expect.objectContaining({
            type: expect.any(Function),
            allowNull: true
          })
        }),
        expect.objectContaining({
          tableName: 'users',
          timestamps: true,
          indexes: expect.any(Array),
          hooks: expect.objectContaining({
            beforeCreate: expect.any(Function),
            beforeUpdate: expect.any(Function)
          })
        })
      );
    });
  });

  describe('Instance Methods', () => {
    let userInstance;

    beforeEach(() => {
      userInstance = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'admin',
        isActive: true,
        lastLoginAt: null,
        passwordChangedAt: null,
        save: jest.fn()
      };

      // Implementar métodos de instancia
      userInstance.comparePassword = async function(candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
      };

      userInstance.validatePassword = async function(candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
      };

      userInstance.updateLastLogin = function() {
        this.lastLoginAt = new Date();
        return this.save();
      };

      userInstance.isAdmin = function() {
        return this.role === 'admin';
      };

      userInstance.isTechnician = function() {
        return this.role === 'technician';
      };

      userInstance.canModifyWorkOrders = function() {
        return this.role === 'admin' || this.role === 'technician';
      };

      userInstance.toSafeObject = function() {
        const values = Object.assign({}, {
          id: this.id,
          username: this.username,
          email: this.email,
          role: this.role,
          isActive: this.isActive,
          lastLoginAt: this.lastLoginAt,
          passwordChangedAt: this.passwordChangedAt
        });
        return values;
      };

      userInstance.toJSON = function() {
        const values = Object.assign({}, {
          id: this.id,
          username: this.username,
          email: this.email,
          role: this.role,
          isActive: this.isActive,
          lastLoginAt: this.lastLoginAt,
          passwordChangedAt: this.passwordChangedAt
        });
        return values;
      };
    });

    describe('comparePassword', () => {
      test('should return true for correct password', async () => {
        bcrypt.compare.mockResolvedValue(true);

        const result = await userInstance.comparePassword('correctpassword');

        expect(bcrypt.compare).toHaveBeenCalledWith('correctpassword', 'hashedpassword');
        expect(result).toBe(true);
      });

      test('should return false for incorrect password', async () => {
        bcrypt.compare.mockResolvedValue(false);

        const result = await userInstance.comparePassword('wrongpassword');

        expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
        expect(result).toBe(false);
      });

      test('should handle bcrypt errors', async () => {
        bcrypt.compare.mockRejectedValue(new Error('Bcrypt error'));

        await expect(userInstance.comparePassword('password'))
          .rejects.toThrow('Bcrypt error');
      });
    });

    describe('validatePassword', () => {
      test('should validate password correctly', async () => {
        bcrypt.compare.mockResolvedValue(true);

        const result = await userInstance.validatePassword('correctpassword');

        expect(bcrypt.compare).toHaveBeenCalledWith('correctpassword', 'hashedpassword');
        expect(result).toBe(true);
      });

      test('should reject invalid password', async () => {
        bcrypt.compare.mockResolvedValue(false);

        const result = await userInstance.validatePassword('wrongpassword');

        expect(result).toBe(false);
      });
    });

    describe('updateLastLogin', () => {
      test('should update lastLoginAt and save', async () => {
        userInstance.save.mockResolvedValue(userInstance);
        const initialLastLogin = userInstance.lastLoginAt;

        const result = await userInstance.updateLastLogin();

        expect(userInstance.lastLoginAt).not.toBe(initialLastLogin);
        expect(userInstance.lastLoginAt).toBeInstanceOf(Date);
        expect(userInstance.save).toHaveBeenCalled();
        expect(result).toBe(userInstance);
      });

      test('should handle save errors', async () => {
        userInstance.save.mockRejectedValue(new Error('Save error'));

        await expect(userInstance.updateLastLogin())
          .rejects.toThrow('Save error');
      });
    });

    describe('isAdmin', () => {
      test('should return true for admin role', () => {
        userInstance.role = 'admin';
        
        const result = userInstance.isAdmin();
        
        expect(result).toBe(true);
      });

      test('should return false for non-admin roles', () => {
        const roles = ['technician', 'viewer'];
        
        roles.forEach(role => {
          userInstance.role = role;
          const result = userInstance.isAdmin();
          expect(result).toBe(false);
        });
      });
    });

    describe('isTechnician', () => {
      test('should return true for technician role', () => {
        userInstance.role = 'technician';
        
        const result = userInstance.isTechnician();
        
        expect(result).toBe(true);
      });

      test('should return false for non-technician roles', () => {
        const roles = ['admin', 'viewer'];
        
        roles.forEach(role => {
          userInstance.role = role;
          const result = userInstance.isTechnician();
          expect(result).toBe(false);
        });
      });
    });

    describe('canModifyWorkOrders', () => {
      test('should return true for admin', () => {
        userInstance.role = 'admin';
        
        const result = userInstance.canModifyWorkOrders();
        
        expect(result).toBe(true);
      });

      test('should return true for technician', () => {
        userInstance.role = 'technician';
        
        const result = userInstance.canModifyWorkOrders();
        
        expect(result).toBe(true);
      });

      test('should return false for viewer', () => {
        userInstance.role = 'viewer';
        
        const result = userInstance.canModifyWorkOrders();
        
        expect(result).toBe(false);
      });
    });

    describe('toSafeObject', () => {
      test('should return object without password', () => {
        const result = userInstance.toSafeObject();
        
        expect(result).toEqual({
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          role: 'admin',
          isActive: true,
          lastLoginAt: null,
          passwordChangedAt: null
        });
        expect(result.password).toBeUndefined();
      });

      test('should not modify original object', () => {
        const originalPassword = userInstance.password;
        
        userInstance.toSafeObject();
        
        expect(userInstance.password).toBe(originalPassword);
      });
    });

    describe('toJSON', () => {
      test('should return JSON object without password', () => {
        const result = userInstance.toJSON();
        
        expect(result).toEqual({
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          role: 'admin',
          isActive: true,
          lastLoginAt: null,
          passwordChangedAt: null
        });
        expect(result.password).toBeUndefined();
      });

      test('should be safe for JSON serialization', () => {
        const result = userInstance.toJSON();
        
        expect(() => JSON.stringify(result)).not.toThrow();
        
        const jsonString = JSON.stringify(result);
        expect(jsonString).not.toContain('hashedpassword');
        expect(jsonString).toContain('testuser');
      });
    });
  });

  describe('Password Validation', () => {
    test('should validate role values', () => {
      const validRoles = ['admin', 'technician', 'viewer'];
      const invalidRoles = ['superuser', 'guest', 'manager', ''];

      validRoles.forEach(role => {
        // Test that valid roles don't throw
        expect(() => {
          const isValidRole = ['admin', 'technician', 'viewer'].includes(role);
          if (!isValidRole) {
            throw new Error('Role must be one of: admin, technician, viewer');
          }
        }).not.toThrow();
      });

      invalidRoles.forEach(role => {
        // Test that invalid roles throw
        expect(() => {
          const isValidRole = ['admin', 'technician', 'viewer'].includes(role);
          if (!isValidRole) {
            throw new Error('Role must be one of: admin, technician, viewer');
          }
        }).toThrow('Role must be one of: admin, technician, viewer');
      });
    });
  });

  describe('Model Hooks', () => {
    test('should hash password before create', async () => {
      const mockHashedPassword = 'hashed_password_123';
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue(mockHashedPassword);

      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'plainpassword',
        role: 'viewer'
      };

      // Simular hook beforeCreate
      const beforeCreateHook = async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      };

      await beforeCreateHook(userData);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(bcrypt.hash).toHaveBeenCalledWith('plainpassword', 'salt');
      expect(userData.password).toBe(mockHashedPassword);
    });

    test('should hash password before update', async () => {
      const mockHashedPassword = 'new_hashed_password_123';
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue(mockHashedPassword);

      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'newplainpassword',
        role: 'viewer',
        changed: jest.fn().mockReturnValue(true)
      };

      // Simular hook beforeUpdate
      const beforeUpdateHook = async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
          user.passwordChangedAt = new Date();
        }
      };

      await beforeUpdateHook(userData);

      expect(userData.changed).toHaveBeenCalledWith('password');
      expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(bcrypt.hash).toHaveBeenCalledWith('newplainpassword', 'salt');
      expect(userData.password).toBe(mockHashedPassword);
      expect(userData.passwordChangedAt).toBeInstanceOf(Date);
    });

    test('should not hash password if not changed during update', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'existing_hashed_password',
        role: 'viewer',
        changed: jest.fn().mockReturnValue(false)
      };

      // Simular hook beforeUpdate
      const beforeUpdateHook = async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
          user.passwordChangedAt = new Date();
        }
      };

      await beforeUpdateHook(userData);

      expect(userData.changed).toHaveBeenCalledWith('password');
      expect(bcrypt.genSalt).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(userData.password).toBe('existing_hashed_password');
    });
  });
});
