// Mock de bcryptjs
const bcryptMock = {
  hash: jest.fn(),
  compare: jest.fn(),
  genSalt: jest.fn()
};

// Configurar comportamientos por defecto
bcryptMock.genSalt.mockResolvedValue('mockedsalt');
bcryptMock.hash.mockResolvedValue('hashedpassword');
bcryptMock.compare.mockResolvedValue(true);

module.exports = bcryptMock;
