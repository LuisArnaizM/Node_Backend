const errorHandler = require('../../../middlewares/errorHandler');

describe('Error Handler Middleware', () => {
  let req, res, next, consoleSpy;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    
    // Spy on console.error to verify logging
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockRestore();
  });

  test('should handle Joi validation errors', () => {
    const joiError = {
      isJoi: true,
      details: [
        {
          message: 'Test validation error',
          path: ['field'],
          type: 'any.required'
        }
      ]
    };

    errorHandler(joiError, req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith('❌ Error:', joiError);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error de validación',
      message: 'Test validation error',
      details: joiError.details
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should handle multiple Joi validation errors', () => {
    const joiError = {
      isJoi: true,
      details: [
        {
          message: 'First validation error',
          path: ['field1'],
          type: 'any.required'
        },
        {
          message: 'Second validation error',
          path: ['field2'],
          type: 'string.min'
        }
      ]
    };

    errorHandler(joiError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error de validación',
      message: 'First validation error', // Should use first error message
      details: joiError.details
    });
  });

  test('should handle JsonWebTokenError', () => {
    const jwtError = {
      name: 'JsonWebTokenError',
      message: 'invalid token'
    };

    errorHandler(jwtError, req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith('❌ Error:', jwtError);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token inválido',
      message: 'El token proporcionado no es válido'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should handle TokenExpiredError', () => {
    const tokenExpiredError = {
      name: 'TokenExpiredError',
      message: 'jwt expired'
    };

    errorHandler(tokenExpiredError, req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith('❌ Error:', tokenExpiredError);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token expirado',
      message: 'El token ha expirado'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should handle custom errors with status', () => {
    const customError = {
      name: 'CustomError',
      message: 'Custom error message',
      status: 403
    };

    errorHandler(customError, req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith('❌ Error:', customError);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'CustomError',
      message: 'Custom error message'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should handle custom errors with status but no name', () => {
    const customError = {
      message: 'Custom error without name',
      status: 404
    };

    errorHandler(customError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error',
      message: 'Custom error without name'
    });
  });

  test('should handle generic server errors', () => {
    const genericError = {
      name: 'Error',
      message: 'Something went wrong'
    };

    errorHandler(genericError, req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith('❌ Error:', genericError);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error interno del servidor',
      message: 'Ha ocurrido un error inesperado'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should handle Error objects', () => {
    const error = new Error('Test error message');

    errorHandler(error, req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith('❌ Error:', error);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error interno del servidor',
      message: 'Ha ocurrido un error inesperado'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should handle null or undefined errors', () => {
    errorHandler(null, req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith('❌ Error:', null);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error interno del servidor',
      message: 'Ha ocurrido un error inesperado'
    });
  });

  test('should handle errors with zero status', () => {
    const errorWithZeroStatus = {
      name: 'TestError',
      message: 'Test message',
      status: 0
    };

    errorHandler(errorWithZeroStatus, req, res, next);

    // Since status is 0 (falsy), should fall through to generic error
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error interno del servidor',
      message: 'Ha ocurrido un error inesperado'
    });
  });

  test('should handle errors with valid status codes', () => {
    const statusCodes = [400, 401, 403, 404, 422, 429, 500, 502, 503];
    
    statusCodes.forEach(statusCode => {
      const customError = {
        name: `Error${statusCode}`,
        message: `Error with status ${statusCode}`,
        status: statusCode
      };

      // Reset mocks for each iteration
      res.status.mockClear();
      res.json.mockClear();

      errorHandler(customError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(statusCode);
      expect(res.json).toHaveBeenCalledWith({
        error: `Error${statusCode}`,
        message: `Error with status ${statusCode}`
      });
    });
  });

  test('should log all errors to console', () => {
    const errors = [
      { isJoi: true, details: [{ message: 'Joi error' }] },
      { name: 'JsonWebTokenError', message: 'JWT error' },
      { name: 'TokenExpiredError', message: 'Token expired' },
      { name: 'CustomError', message: 'Custom error', status: 400 },
      new Error('Generic error')
    ];

    errors.forEach(error => {
      consoleSpy.mockClear();
      errorHandler(error, req, res, next);
      expect(consoleSpy).toHaveBeenCalledWith('❌ Error:', error);
    });
  });

  test('should not call next() middleware', () => {
    const error = new Error('Test error');
    
    errorHandler(error, req, res, next);
    
    expect(next).not.toHaveBeenCalled();
  });
});
