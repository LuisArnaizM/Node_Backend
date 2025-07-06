const jwt = require('jsonwebtoken');

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

// Mock del modelo User
const mockUserModel = {
  findOne: jest.fn()
};

jest.mock('../../../models/User', () => mockUserModel);

const authMiddleware = require('../../../middlewares/auth');
const { authenticateToken, requireRole } = authMiddleware;

describe('Auth Middleware', () => {
  let req, res, next;
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de request, response y next
    req = {
      headers: {},
      user: null
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
      role: 'viewer',
      isActive: true,
      passwordChangedAt: null,
      toJSON: jest.fn().mockReturnValue({
        id: 'test-user-id',
        username: 'testuser',
        email: 'test@example.com',
        role: 'viewer',
        isActive: true
      })
    };
  });

  describe('authenticateToken', () => {
    test('should authenticate valid token successfully', async () => {
      req.headers.authorization = 'Bearer valid.jwt.token';
      mockUserModel.findOne.mockResolvedValue(mockUser);
      
      await authenticateToken(req, res, next);
      
      expect(jwt.verify).toHaveBeenCalledWith('valid.jwt.token', process.env.JWT_SECRET);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: {
          id: 'test-user-id',
          isActive: true
        }
      });
      expect(req.user).toEqual(mockUser.toJSON());
      expect(next).toHaveBeenCalled();
    });

    test('should return 401 if no token provided', async () => {
      req.headers.authorization = undefined;
      
      await authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token no proporcionado',
        message: 'Se requiere un token de autorización para acceder a este recurso'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 if token format is invalid', async () => {
      req.headers.authorization = 'InvalidFormat';
      
      await authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token no proporcionado',
        message: 'Se requiere un token de autorización para acceder a este recurso'
      });
    });

    test('should return 401 if user not found', async () => {
      req.headers.authorization = 'Bearer valid.jwt.token';
      mockUserModel.findOne.mockResolvedValue(null);
      
      await authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token inválido',
        message: 'El usuario asociado al token no existe o está desactivado'
      });
    });

    test('should return 401 if user is inactive', async () => {
      req.headers.authorization = 'Bearer valid.jwt.token';
      
      // Mock para usuario inactivo - retorna null como si no existiera un usuario activo
      mockUserModel.findOne.mockResolvedValue(null);
      
      await authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token inválido',
        message: 'El usuario asociado al token no existe o está desactivado'
      });
    });

    test('should return 401 if password changed after token issuance', async () => {
      req.headers.authorization = 'Bearer valid.jwt.token';
      
      // Token emitido hace 1 hora (en segundos)
      const tokenIat = Math.floor(Date.now() / 1000) - 3600;
      jwt.verify.mockReturnValueOnce({
        id: 'test-user-id',
        username: 'testuser',
        iat: tokenIat
      });
      
      // Password cambió hace 30 minutos
      mockUser.passwordChangedAt = new Date(Date.now() - 1800000);
      mockUserModel.findOne.mockResolvedValue(mockUser);
      
      await authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token inválido',
        message: 'Token inválido debido a cambio de contraseña. Inicia sesión nuevamente.'
      });
    });

    test('should handle JsonWebTokenError', async () => {
      req.headers.authorization = 'Bearer invalid.token';
      jwt.verify.mockImplementationOnce(() => {
        const error = new Error('invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });
      
      await authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token inválido',
        message: 'El token proporcionado no es válido'
      });
    });

    test('should handle TokenExpiredError', async () => {
      req.headers.authorization = 'Bearer expired.token';
      jwt.verify.mockImplementationOnce(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });
      
      await authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token expirado',
        message: 'El token ha expirado. Inicia sesión nuevamente.'
      });
    });

    test('should handle other errors', async () => {
      req.headers.authorization = 'Bearer valid.jwt.token';
      mockUserModel.findOne.mockRejectedValue(new Error('Database error'));
      
      await authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error interno del servidor',
        message: 'Error al verificar el token'
      });
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      req.user = {
        id: 'test-user-id',
        username: 'testuser',
        role: 'viewer'
      };
    });

    test('should allow access for user with required role', () => {
      const middleware = requireRole('viewer');
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow access for user with one of multiple required roles', () => {
      req.user.role = 'technician';
      const middleware = requireRole(['admin', 'technician']);
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should deny access for user without required role', () => {
      req.user.role = 'viewer';
      const middleware = requireRole('admin');
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Acceso denegado',
        message: 'Se requiere uno de los siguientes roles: admin'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should deny access for user without any of the required roles', () => {
      req.user.role = 'viewer';
      const middleware = requireRole(['admin', 'technician']);
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Acceso denegado',
        message: 'Se requiere uno de los siguientes roles: admin, technician'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 if no user in request', () => {
      req.user = null;
      const middleware = requireRole('admin');
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No autorizado',
        message: 'Se requiere autenticación'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle single role as string', () => {
      req.user.role = 'admin';
      const middleware = requireRole('admin');
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    test('should handle multiple roles as array', () => {
      req.user.role = 'technician';
      const middleware = requireRole(['admin', 'technician', 'viewer']);
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });
});
