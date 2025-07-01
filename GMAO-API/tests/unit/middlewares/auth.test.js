const jwt = require('jsonwebtoken');
const { 
  authenticateToken, 
  requireRole, 
  requireAdmin, 
  requireAdminOrTechnician 
} = require('../../../middlewares/auth');

// Mock del modelo User
jest.mock('../../../models/User');
const User = require('../../../models/User');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
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

  describe('authenticateToken', () => {
    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      role: 'admin',
      isActive: true,
      passwordChangedAt: null,
      toJSON: jest.fn().mockReturnValue({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin'
      })
    };

    test('should authenticate valid token successfully', async () => {
      const token = jwt.sign(
        { id: 'user-123', username: 'testuser', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      req.headers.authorization = `Bearer ${token}`;
      User.findOne.mockResolvedValue(mockUser);

      await authenticateToken(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { 
          id: 'user-123',
          isActive: true 
        }
      });
      expect(req.user).toEqual({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin'
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject request without authorization header', async () => {
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token no proporcionado',
        message: 'Se requiere un token de autorización para acceder a este recurso'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with malformed authorization header', async () => {
      req.headers.authorization = 'InvalidFormat';

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token no proporcionado',
        message: 'Se requiere un token de autorización para acceder a este recurso'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject invalid JWT token', async () => {
      req.headers.authorization = 'Bearer invalid_token';

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token inválido',
        message: 'El token proporcionado no es válido'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject expired JWT token', async () => {
      const expiredToken = jwt.sign(
        { id: 'user-123', username: 'testuser', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Token expirado
      );

      req.headers.authorization = `Bearer ${expiredToken}`;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token expirado',
        message: 'El token ha expirado. Inicia sesión nuevamente.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject token for non-existent user', async () => {
      const token = jwt.sign(
        { id: 'non-existent-user', username: 'nonexistent', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      req.headers.authorization = `Bearer ${token}`;
      User.findOne.mockResolvedValue(null);

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token inválido',
        message: 'El usuario asociado al token no existe o está desactivado'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject token for inactive user', async () => {
      const token = jwt.sign(
        { id: 'user-123', username: 'testuser', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      req.headers.authorization = `Bearer ${token}`;
      User.findOne.mockResolvedValue(null); // Simula usuario inactivo

      await authenticateToken(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { 
          id: 'user-123',
          isActive: true 
        }
      });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token inválido',
        message: 'El usuario asociado al token no existe o está desactivado'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject token if password was changed after token issuance', async () => {
      const tokenIssuedTime = Math.floor(Date.now() / 1000);
      const token = jwt.sign(
        { 
          id: 'user-123', 
          username: 'testuser', 
          role: 'admin',
          iat: tokenIssuedTime
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const passwordChangedTime = new Date((tokenIssuedTime + 100) * 1000); // Cambio después del token
      const userWithPasswordChange = {
        ...mockUser,
        passwordChangedAt: passwordChangedTime
      };

      req.headers.authorization = `Bearer ${token}`;
      User.findOne.mockResolvedValue(userWithPasswordChange);

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token inválido',
        message: 'Token inválido debido a cambio de contraseña. Inicia sesión nuevamente.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should accept token if password was changed before token issuance', async () => {
      const tokenIssuedTime = Math.floor(Date.now() / 1000);
      const token = jwt.sign(
        { 
          id: 'user-123', 
          username: 'testuser', 
          role: 'admin',
          iat: tokenIssuedTime
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const passwordChangedTime = new Date((tokenIssuedTime - 100) * 1000); // Cambio antes del token
      const userWithPasswordChange = {
        ...mockUser,
        passwordChangedAt: passwordChangedTime
      };

      req.headers.authorization = `Bearer ${token}`;
      User.findOne.mockResolvedValue(userWithPasswordChange);

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should handle database errors gracefully', async () => {
      const token = jwt.sign(
        { id: 'user-123', username: 'testuser', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      req.headers.authorization = `Bearer ${token}`;
      User.findOne.mockRejectedValue(new Error('Database connection error'));

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error interno del servidor',
        message: 'Error al verificar el token'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    test('should allow access for user with correct role', () => {
      req.user = { role: 'admin' };
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow access for user with one of multiple correct roles', () => {
      req.user = { role: 'technician' };
      const middleware = requireRole(['admin', 'technician']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should deny access for user with incorrect role', () => {
      req.user = { role: 'viewer' };
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Acceso denegado',
        message: 'Se requiere uno de los siguientes roles: admin'
      });
    });

    test('should deny access for user without required roles from array', () => {
      req.user = { role: 'viewer' };
      const middleware = requireRole(['admin', 'technician']);

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Acceso denegado',
        message: 'Se requiere uno de los siguientes roles: admin, technician'
      });
    });

    test('should deny access for unauthenticated user', () => {
      req.user = null;
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No autorizado',
        message: 'Se requiere autenticación'
      });
    });

    test('should deny access for undefined user', () => {
      // req.user is undefined
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No autorizado',
        message: 'Se requiere autenticación'
      });
    });
  });

  describe('requireAdmin', () => {
    test('should allow access for admin user', () => {
      req.user = { role: 'admin' };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should deny access for non-admin user', () => {
      req.user = { role: 'technician' };

      requireAdmin(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Acceso denegado',
        message: 'Se requiere uno de los siguientes roles: admin'
      });
    });
  });

  describe('requireAdminOrTechnician', () => {
    test('should allow access for admin user', () => {
      req.user = { role: 'admin' };

      requireAdminOrTechnician(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow access for technician user', () => {
      req.user = { role: 'technician' };

      requireAdminOrTechnician(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should deny access for viewer user', () => {
      req.user = { role: 'viewer' };

      requireAdminOrTechnician(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Acceso denegado',
        message: 'Se requiere uno de los siguientes roles: admin, technician'
      });
    });
  });
});
