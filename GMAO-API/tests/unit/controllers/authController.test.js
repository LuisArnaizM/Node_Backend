const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const authController = require('../../../controllers/authController');

// Mock del modelo User
jest.mock('../../../models/User');
const User = require('../../../models/User');

// Mock de bcryptjs
jest.mock('bcryptjs');
const bcryptMock = bcrypt;

// Mock de jsonwebtoken
jest.mock('jsonwebtoken');
const jwtMock = jwt;

describe('AuthController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    // Mock del JWT_SECRET
    process.env.JWT_SECRET = 'test_secret_key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validRegisterData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'viewer'
    };

    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      role: 'viewer',
      toJSON: jest.fn().mockReturnValue({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'viewer'
      })
    };

    test('should register new user successfully', async () => {
      req.body = validRegisterData;
      
      User.findOne.mockResolvedValue(null); // No existing user
      User.create.mockResolvedValue(mockUser);
      jwtMock.sign.mockReturnValue('mock_jwt_token');

      await authController.register(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({
        where: {
          [Op.or]: [
            { username: 'testuser' },
            { email: 'test@example.com' }
          ]
        }
      });
      expect(User.create).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'viewer'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          token: 'mock_jwt_token',
          type: 'Bearer',
          expiresIn: '24h',
          user: mockUser.toJSON()
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should use default role "viewer" when not provided', async () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
        // role not provided
      };
      
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      jwtMock.sign.mockReturnValue('mock_jwt_token');

      await authController.register(req, res, next);

      expect(User.create).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'viewer'
      });
    });

    test('should reject registration with existing username', async () => {
      req.body = validRegisterData;
      
      const existingUser = {
        username: 'testuser',
        email: 'different@example.com'
      };
      User.findOne.mockResolvedValue(existingUser);

      await authController.register(req, res, next);

      expect(User.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuario ya existe',
        message: 'El nombre de usuario ya está en uso'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject registration with existing email', async () => {
      req.body = validRegisterData;
      
      const existingUser = {
        username: 'differentuser',
        email: 'test@example.com'
      };
      User.findOne.mockResolvedValue(existingUser);

      await authController.register(req, res, next);

      expect(User.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuario ya existe',
        message: 'El email ya está registrado'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle Sequelize validation errors', async () => {
      req.body = validRegisterData;
      
      User.findOne.mockResolvedValue(null);
      
      const validationError = {
        name: 'SequelizeValidationError',
        errors: [
          { path: 'email', message: 'Invalid email format' },
          { path: 'password', message: 'Password too short' }
        ]
      };
      User.create.mockRejectedValue(validationError);

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Errores de validación',
        details: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password too short' }
        ]
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle database errors', async () => {
      req.body = validRegisterData;
      
      User.findOne.mockRejectedValue(new Error('Database connection error'));

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const validLoginData = {
      username: 'testuser',
      password: 'password123'
    };

    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      role: 'viewer',
      isActive: true,
      validatePassword: jest.fn(),
      updateLastLogin: jest.fn(),
      toJSON: jest.fn().mockReturnValue({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'viewer'
      })
    };

    test('should login user successfully', async () => {
      req.body = validLoginData;
      
      User.findOne.mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(true);
      mockUser.updateLastLogin.mockResolvedValue();
      jwtMock.sign.mockReturnValue('mock_jwt_token');

      await authController.login(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        attributes: ['id', 'username', 'email', 'password', 'role', 'lastLoginAt', 'passwordChangedAt', 'isActive']
      });
      expect(mockUser.validatePassword).toHaveBeenCalledWith('password123');
      expect(mockUser.updateLastLogin).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Autenticación exitosa',
        data: {
          token: 'mock_jwt_token',
          type: 'Bearer',
          expiresIn: '24h',
          user: mockUser.toJSON()
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject login with non-existent user', async () => {
      req.body = validLoginData;
      
      User.findOne.mockResolvedValue(null);

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Credenciales inválidas',
        message: 'Usuario o contraseña incorrectos'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject login with inactive user', async () => {
      req.body = validLoginData;
      
      const inactiveUser = {
        ...mockUser,
        isActive: false
      };
      User.findOne.mockResolvedValue(inactiveUser);

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cuenta desactivada',
        message: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject login with invalid password', async () => {
      req.body = validLoginData;
      
      User.findOne.mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(false);

      await authController.login(req, res, next);

      expect(mockUser.validatePassword).toHaveBeenCalledWith('password123');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Credenciales inválidas',
        message: 'Usuario o contraseña incorrectos'
      });
      expect(mockUser.updateLastLogin).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle database errors during login', async () => {
      req.body = validLoginData;
      
      User.findOne.mockRejectedValue(new Error('Database connection error'));

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should handle password validation errors', async () => {
      req.body = validLoginData;
      
      User.findOne.mockResolvedValue(mockUser);
      mockUser.validatePassword.mockRejectedValue(new Error('Password validation error'));

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    test('should generate JWT token with correct payload', () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin'
      };

      jwtMock.sign.mockReturnValue('mock_jwt_token');

      const token = authController.generateToken(mockUser);

      expect(jwtMock.sign).toHaveBeenCalledWith(
        {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          role: 'admin',
          iat: expect.any(Number)
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      expect(token).toBe('mock_jwt_token');
    });

    test('should handle missing user properties', () => {
      const incompleteUser = {
        id: 'user-123'
        // missing username and role
      };

      jwtMock.sign.mockReturnValue('mock_jwt_token');

      const token = authController.generateToken(incompleteUser);

      expect(jwtMock.sign).toHaveBeenCalledWith(
        {
          id: 'user-123',
          username: undefined,
          email: undefined,
          role: undefined,
          iat: expect.any(Number)
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      expect(token).toBe('mock_jwt_token');
    });
  });

  describe('error handling', () => {
    test('should handle JSON parsing errors', async () => {
      req.body = null;
      
      await authController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    test('should handle missing environment variables', () => {
      delete process.env.JWT_SECRET;
      
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        role: 'admin'
      };

      jwtMock.sign.mockImplementation(() => {
        throw new Error('JWT_SECRET is required');
      });

      expect(() => {
        authController.generateToken(mockUser);
      }).toThrow();
    });
  });
});
