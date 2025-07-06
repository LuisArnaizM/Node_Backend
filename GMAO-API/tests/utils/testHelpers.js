// Utilidades para testing

/**
 * Crear mock de request
 */
const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  ...overrides
});

/**
 * Crear mock de response
 */
const createMockResponse = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
    send: jest.fn(),
    cookie: jest.fn(),
    clearCookie: jest.fn()
  };
  
  // Hacer que los métodos retornen el objeto response para encadenamiento
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  res.send.mockReturnValue(res);
  res.cookie.mockReturnValue(res);
  res.clearCookie.mockReturnValue(res);
  
  return res;
};

/**
 * Crear mock de next function
 */
const createMockNext = () => jest.fn();

/**
 * Crear mock de usuario
 */
const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  username: 'testuser',
  email: 'test@example.com',
  role: 'viewer',
  isActive: true,
  lastLoginAt: null,
  passwordChangedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  validatePassword: jest.fn().mockResolvedValue(true),
  comparePassword: jest.fn().mockResolvedValue(true),
  updateLastLogin: jest.fn(),
  update: jest.fn(),
  save: jest.fn(),
  destroy: jest.fn(),
  toJSON: jest.fn(),
  toSafeObject: jest.fn(),
  isAdmin: jest.fn().mockReturnValue(false),
  isTechnician: jest.fn().mockReturnValue(false),
  canModifyWorkOrders: jest.fn().mockReturnValue(false),
  ...overrides
});

/**
 * Crear mock de work order
 */
const createMockWorkOrder = (overrides = {}) => ({
  id: 'test-order-id',
  title: 'Test Work Order',
  description: 'Test description',
  status: 'pending',
  priority: 'medium',
  assignedTo: 'test-user-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  update: jest.fn(),
  destroy: jest.fn(),
  toJSON: jest.fn(),
  ...overrides
});

/**
 * Crear mock de error de validación de Sequelize
 */
const createSequelizeValidationError = (fields = []) => ({
  name: 'SequelizeValidationError',
  errors: fields.map(field => ({
    path: field.name,
    message: field.message || `${field.name} is invalid`
  }))
});

/**
 * Crear mock de error JWT
 */
const createJWTError = (type = 'JsonWebTokenError', message = 'invalid token') => {
  const error = new Error(message);
  error.name = type;
  return error;
};

/**
 * Esperar que res.status y res.json hayan sido llamados con valores específicos
 */
const expectResponseStatus = (res, status, jsonData = null) => {
  expect(res.status).toHaveBeenCalledWith(status);
  if (jsonData) {
    expect(res.json).toHaveBeenCalledWith(jsonData);
  }
};

/**
 * Esperar que una función mock haya sido llamada con argumentos específicos
 */
const expectMockCalledWith = (mockFn, ...args) => {
  expect(mockFn).toHaveBeenCalledWith(...args);
};

/**
 * Limpiar todos los mocks entre tests
 */
const clearAllMocks = () => {
  jest.clearAllMocks();
};

/**
 * Configurar mocks por defecto para bcrypt
 */
const setupBcryptMocks = () => {
  const bcrypt = require('./mocks/bcrypt');
  bcrypt.genSalt.mockResolvedValue('mockedsalt');
  bcrypt.hash.mockResolvedValue('hashedpassword');
  bcrypt.compare.mockResolvedValue(true);
  return bcrypt;
};

/**
 * Configurar mocks por defecto para JWT
 */
const setupJWTMocks = () => {
  const jwt = require('./mocks/jwt');
  jwt.sign.mockReturnValue('mocked.jwt.token');
  jwt.verify.mockReturnValue({
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    role: 'viewer',
    iat: Math.floor(Date.now() / 1000)
  });
  return jwt;
};

module.exports = {
  createMockRequest,
  createMockResponse,
  createMockNext,
  createMockUser,
  createMockWorkOrder,
  createSequelizeValidationError,
  createJWTError,
  expectResponseStatus,
  expectMockCalledWith,
  clearAllMocks,
  setupBcryptMocks,
  setupJWTMocks
};
