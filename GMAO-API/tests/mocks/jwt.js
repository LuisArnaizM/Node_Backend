// Mock de jsonwebtoken
const jwtMock = {
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn()
};

// Configurar comportamientos por defecto
jwtMock.sign.mockReturnValue('mocked.jwt.token');
jwtMock.verify.mockReturnValue({
  id: 'test-user-id',
  username: 'testuser',
  email: 'test@example.com',
  role: 'viewer',
  iat: Math.floor(Date.now() / 1000)
});

module.exports = jwtMock;
