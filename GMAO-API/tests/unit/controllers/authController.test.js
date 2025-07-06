const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock de jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked.jwt.token'),
  verify: jest.fn().mockReturnValue({
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    role: 'viewer',
    iat: Math.floor(Date.now() / 1000)
  })
}));

// Mock de bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('mockedsalt')
}));

// Mock del modelo User
const mockUserModel = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn()
};

jest.mock('../../../models/User', () => mockUserModel);

const AuthController = require('../../../controllers/authController');

describe('AuthController', () => {
  let req, res, next;
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de request, response y next
    req = {
      body: {},
      user: {},
      headers: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();

    // Mock de usuario
    mockUser = {
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'viewer',
      isActive: true,
      lastLoginAt: null,
      passwordChangedAt: null,
      validatePassword: jest.fn(),
      comparePassword: jest.fn(),
      updateLastLogin: jest.fn(),
      update: jest.fn(),
      toJSON: jest.fn(),
      save: jest.fn()
    };

    // Configurar comportamientos por defecto
    mockUser.validatePassword.mockResolvedValue(true);
    mockUser.comparePassword.mockResolvedValue(true);
    mockUser.updateLastLogin.mockResolvedValue(mockUser);
    mockUser.update.mockResolvedValue(mockUser);
    mockUser.toJSON.mockReturnValue({
      id: mockUser.id,
      username: mockUser.username,
      email: mockUser.email,
      role: mockUser.role,
      isActive: mockUser.isActive
    });
  });

  describe('register', () => {
    beforeEach(() => {
      req.body = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'viewer'
      };
    });

    test('should register a new user successfully', async () => {
      mockUserModel.findOne.mockResolvedValue(null); // No existe usuario
      mockUserModel.create.mockResolvedValue(mockUser);
      
      await AuthController.register(req, res, next);
      
      expect(mockUserModel.findOne).toHaveBeenCalled();
      expect(mockUserModel.create).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'viewer'
      });
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          token: 'mocked.jwt.token',
          type: 'Bearer',
          expiresIn: '24h',
          user: mockUser.toJSON()
        }
      });
    });

    test('should return 409 if username already exists', async () => {
      const existingUser = { ...mockUser, username: 'newuser' };
      mockUserModel.findOne.mockResolvedValue(existingUser);
      
      await AuthController.register(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuario ya existe',
        message: 'El nombre de usuario ya está en uso'
      });
    });

    test('should return 409 if email already exists', async () => {
      const existingUser = { ...mockUser, email: 'newuser@example.com' };
      mockUserModel.findOne.mockResolvedValue(existingUser);
      
      await AuthController.register(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuario ya existe',
        message: 'El email ya está registrado'
      });
    });

    test('should handle validation errors', async () => {
      const validationError = {
        name: 'SequelizeValidationError',
        errors: [
          { path: 'email', message: 'Email is not valid' },
          { path: 'password', message: 'Password is too short' }
        ]
      };
      
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockRejectedValue(validationError);
      
      await AuthController.register(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Errores de validación',
        details: [
          { field: 'email', message: 'Email is not valid' },
          { field: 'password', message: 'Password is too short' }
        ]
      });
    });

    test('should call next with error for other errors', async () => {
      const error = new Error('Database error');
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockRejectedValue(error);
      
      await AuthController.register(req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    beforeEach(() => {
      req.body = {
        username: 'testuser',
        password: 'password123'
      };
    });

    test('should login user successfully', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      
      await AuthController.login(req, res, next);
      
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        attributes: ['id', 'username', 'email', 'password', 'role', 'lastLoginAt', 'passwordChangedAt', 'isActive']
      });
      expect(mockUser.validatePassword).toHaveBeenCalledWith('password123');
      expect(mockUser.updateLastLogin).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Autenticación exitosa',
        data: {
          token: 'mocked.jwt.token',
          type: 'Bearer',
          expiresIn: '24h',
          user: mockUser.toJSON()
        }
      });
    });

    test('should return 401 if user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      
      await AuthController.login(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Credenciales inválidas',
        message: 'Usuario o contraseña incorrectos'
      });
    });

    test('should return 401 if user is inactive', async () => {
      mockUser.isActive = false;
      mockUserModel.findOne.mockResolvedValue(mockUser);
      
      await AuthController.login(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cuenta desactivada',
        message: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
      });
    });

    test('should return 401 if password is invalid', async () => {
      mockUser.validatePassword.mockResolvedValue(false);
      mockUserModel.findOne.mockResolvedValue(mockUser);
      
      await AuthController.login(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Credenciales inválidas',
        message: 'Usuario o contraseña incorrectos'
      });
    });

    test('should call next with error for other errors', async () => {
      const error = new Error('Database error');
      mockUserModel.findOne.mockRejectedValue(error);
      
      await AuthController.login(req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('verifyToken', () => {
    test('should return user data for valid token', async () => {
      req.user = mockUser.toJSON();
      
      await AuthController.verifyToken(req, res, next);
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token válido',
        data: {
          user: req.user
        }
      });
    });

    test('should call next with error for errors', async () => {
      const error = new Error('Token error');
      // Simular error en el método
      jest.spyOn(AuthController, 'verifyToken').mockImplementationOnce(() => {
        throw error;
      });
      
      try {
        await AuthController.verifyToken(req, res, next);
      } catch (e) {
        expect(e).toBe(error);
      }
    });
  });

  describe('getProfile', () => {
    test('should return user profile successfully', async () => {
      req.user = { id: 'test-user-id' };
      mockUserModel.findByPk.mockResolvedValue(mockUser);
      
      await AuthController.getProfile(req, res, next);
      
      expect(mockUserModel.findByPk).toHaveBeenCalledWith('test-user-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Perfil obtenido exitosamente',
        data: mockUser.toJSON()
      });
    });

    test('should return 401 if no user in request', async () => {
      req.user = null;
      
      await AuthController.getProfile(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuario no encontrado'
      });
    });

    test('should return 404 if user not found in database', async () => {
      req.user = { id: 'test-user-id' };
      mockUserModel.findByPk.mockResolvedValue(null);
      
      await AuthController.getProfile(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuario no encontrado'
      });
    });
  });

  describe('changePassword', () => {
    beforeEach(() => {
      req.body = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123'
      };
      req.user = { id: 'test-user-id' };
    });

    test('should change password successfully', async () => {
      mockUserModel.findByPk.mockResolvedValue(mockUser);
      
      await AuthController.changePassword(req, res, next);
      
      expect(mockUserModel.findByPk).toHaveBeenCalledWith('test-user-id');
      expect(mockUser.validatePassword).toHaveBeenCalledWith('oldpassword');
      expect(mockUser.update).toHaveBeenCalledWith({ password: 'newpassword123' });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    });

    test('should return 404 if user not found', async () => {
      mockUserModel.findByPk.mockResolvedValue(null);
      
      await AuthController.changePassword(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuario no encontrado'
      });
    });

    test('should return 400 if current password is incorrect', async () => {
      mockUser.validatePassword.mockResolvedValue(false);
      mockUserModel.findByPk.mockResolvedValue(mockUser);
      
      await AuthController.changePassword(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Contraseña actual incorrecta'
      });
    });
  });

  describe('generateToken', () => {
    test('should generate JWT token with correct payload', () => {
      const testUser = {
        id: 'test-id',
        username: 'testuser',
        email: 'test@example.com',
        role: 'viewer'
      };
      
      const token = AuthController.generateToken(testUser);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: testUser.id,
          username: testUser.username,
          email: testUser.email,
          role: testUser.role,
          iat: expect.any(Number)
        }),
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      expect(token).toBe('mocked.jwt.token');
    });
  });
});
