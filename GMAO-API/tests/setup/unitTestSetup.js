const path = require('path');
const moduleAlias = require('module-alias');

// Configurar alias de módulos para las pruebas
moduleAlias.addAliases({
  '@': path.resolve(__dirname, '../..'),
  '@controllers': path.resolve(__dirname, '../../controllers'),
  '@models': path.resolve(__dirname, '../../models'),
  '@middlewares': path.resolve(__dirname, '../../middlewares'),
  '@routes': path.resolve(__dirname, '../../routes'),
  '@config': path.resolve(__dirname, '../../config'),
  '@utils': path.resolve(__dirname, '../../utils')
});

// Configurar variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.DB_NAME = 'test_gmao_db';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.REDIS_URL = 'redis://localhost:6379';

// Mock de console para evitar logs en testing
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Configurar timeout global para tests
jest.setTimeout(10000);

// Limpiar mocks después de cada test
afterEach(() => {
  jest.clearAllMocks();
});
