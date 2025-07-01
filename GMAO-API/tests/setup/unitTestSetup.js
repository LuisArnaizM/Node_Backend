const path = require('path');

// Configurar variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_unit_tests';

// Configurar timeout global para Jest
jest.setTimeout(10000);

// Mock de console para tests más limpios
global.console = {
  ...console,
  // Silenciar logs durante tests unitarios
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Configurar mocks globales
beforeAll(() => {
  // Mock de variables de entorno
  process.env.DB_NAME = 'test_db';
  process.env.DB_USER = 'test_user';
  process.env.DB_PASSWORD = 'test_password';
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '3306';
});

// Limpiar mocks después de cada test
afterEach(() => {
  jest.clearAllMocks();
});

console.log('🧪 Unit Test Setup configurado correctamente');
