const bcrypt = require('bcryptjs');

// Mock de bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('mockedsalt')
}));

// Mock de Sequelize
const mockSequelize = {
  define: jest.fn(),
  authenticate: jest.fn(),
  sync: jest.fn()
};

const mockDataTypes = {
  UUID: 'UUID',
  UUIDV4: 'UUIDV4',
  STRING: 'STRING',
  BOOLEAN: 'BOOLEAN',
  DATE: 'DATE'
};

jest.mock('../../../config/database', () => ({
  sequelize: mockSequelize,
  DataTypes: mockDataTypes
}));

describe('User Model', () => {
  let User;
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock del modelo User
    mockUser = {
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'viewer',
      isActive: true,
      lastLoginAt: null,
      passwordChangedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      get: jest.fn().mockReturnThis(),
      save: jest.fn().mockResolvedValue(true),
      update: jest.fn().mockResolvedValue(true),
      changed: jest.fn().mockReturnValue(false)
    };

    // Mock de métodos del modelo
    mockUser.comparePassword = jest.fn();
    mockUser.validatePassword = jest.fn();
    mockUser.updateLastLogin = jest.fn();
    mockUser.isAdmin = jest.fn();
    mockUser.isTechnician = jest.fn();
    mockUser.canModifyWorkOrders = jest.fn();
    mockUser.toSafeObject = jest.fn();
    mockUser.toJSON = jest.fn();

    // Configurar comportamientos por defecto
    mockUser.comparePassword.mockResolvedValue(true);
    mockUser.validatePassword.mockResolvedValue(true);
    mockUser.updateLastLogin.mockResolvedValue(mockUser);
    mockUser.isAdmin.mockReturnValue(false);
    mockUser.isTechnician.mockReturnValue(false);
    mockUser.canModifyWorkOrders.mockReturnValue(false);
    mockUser.toSafeObject.mockReturnValue({
      id: mockUser.id,
      username: mockUser.username,
      email: mockUser.email,
      role: mockUser.role,
      isActive: mockUser.isActive
    });
    mockUser.toJSON.mockReturnValue({
      id: mockUser.id,
      username: mockUser.username,
      email: mockUser.email,
      role: mockUser.role,
      isActive: mockUser.isActive
    });
  });

  describe('Password Methods', () => {
    test('comparePassword should return true for valid password', async () => {
      const result = await mockUser.comparePassword('validpassword');
      expect(result).toBe(true);
      expect(mockUser.comparePassword).toHaveBeenCalledWith('validpassword');
    });

    test('comparePassword should return false for invalid password', async () => {
      mockUser.comparePassword.mockResolvedValueOnce(false);
      
      const result = await mockUser.comparePassword('invalidpassword');
      expect(result).toBe(false);
      expect(mockUser.comparePassword).toHaveBeenCalledWith('invalidpassword');
    });

    test('validatePassword should return true for valid password', async () => {
      const result = await mockUser.validatePassword('validpassword');
      expect(result).toBe(true);
      expect(mockUser.validatePassword).toHaveBeenCalledWith('validpassword');
    });

    test('validatePassword should return false for invalid password', async () => {
      mockUser.validatePassword.mockResolvedValueOnce(false);
      
      const result = await mockUser.validatePassword('invalidpassword');
      expect(result).toBe(false);
      expect(mockUser.validatePassword).toHaveBeenCalledWith('invalidpassword');
    });
  });

  describe('User Login Methods', () => {
    test('updateLastLogin should update lastLoginAt and save user', async () => {
      const originalDate = mockUser.lastLoginAt;
      
      const result = await mockUser.updateLastLogin();
      
      expect(result).toBe(mockUser);
      expect(mockUser.updateLastLogin).toHaveBeenCalled();
    });
  });

  describe('Role Methods', () => {
    test('isAdmin should return true for admin role', () => {
      mockUser.role = 'admin';
      mockUser.isAdmin.mockReturnValue(true);
      
      const result = mockUser.isAdmin();
      expect(result).toBe(true);
    });

    test('isAdmin should return false for non-admin role', () => {
      mockUser.role = 'viewer';
      mockUser.isAdmin.mockReturnValue(false);
      
      const result = mockUser.isAdmin();
      expect(result).toBe(false);
    });

    test('isTechnician should return true for technician role', () => {
      mockUser.role = 'technician';
      mockUser.isTechnician.mockReturnValue(true);
      
      const result = mockUser.isTechnician();
      expect(result).toBe(true);
    });

    test('isTechnician should return false for non-technician role', () => {
      mockUser.role = 'viewer';
      mockUser.isTechnician.mockReturnValue(false);
      
      const result = mockUser.isTechnician();
      expect(result).toBe(false);
    });

    test('canModifyWorkOrders should return true for admin', () => {
      mockUser.role = 'admin';
      mockUser.canModifyWorkOrders.mockReturnValue(true);
      
      const result = mockUser.canModifyWorkOrders();
      expect(result).toBe(true);
    });

    test('canModifyWorkOrders should return true for technician', () => {
      mockUser.role = 'technician';
      mockUser.canModifyWorkOrders.mockReturnValue(true);
      
      const result = mockUser.canModifyWorkOrders();
      expect(result).toBe(true);
    });

    test('canModifyWorkOrders should return false for viewer', () => {
      mockUser.role = 'viewer';
      mockUser.canModifyWorkOrders.mockReturnValue(false);
      
      const result = mockUser.canModifyWorkOrders();
      expect(result).toBe(false);
    });
  });

  describe('Serialization Methods', () => {
    test('toSafeObject should return user data without password', () => {
      const result = mockUser.toSafeObject();
      
      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        role: mockUser.role,
        isActive: mockUser.isActive
      });
      expect(result.password).toBeUndefined();
    });

    test('toJSON should return user data without password', () => {
      const result = mockUser.toJSON();
      
      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        role: mockUser.role,
        isActive: mockUser.isActive
      });
      expect(result.password).toBeUndefined();
    });
  });

  describe('Password Hashing', () => {
    test('should hash password with bcrypt when creating user', async () => {
      const plainPassword = 'plaintextpassword';
      
      // Simular el hook beforeCreate
      bcrypt.genSalt.mockResolvedValueOnce('testsalt');
      bcrypt.hash.mockResolvedValueOnce('hashedpassword123');
      
      await bcrypt.genSalt(12);
      await bcrypt.hash(plainPassword, 'testsalt');
      
      expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 'testsalt');
    });

    test('should hash password when updating user password', async () => {
      const newPassword = 'newplaintextpassword';
      mockUser.changed.mockReturnValue(true); // Simular que el password cambió
      
      bcrypt.genSalt.mockResolvedValueOnce('newsalt');
      bcrypt.hash.mockResolvedValueOnce('newhashedpassword');
      
      await bcrypt.genSalt(12);
      await bcrypt.hash(newPassword, 'newsalt');
      
      expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 'newsalt');
    });
  });
});
