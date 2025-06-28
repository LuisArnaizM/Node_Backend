const jwt = require('jsonwebtoken');

// Middleware para verificar autenticación JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Token de acceso requerido',
      message: 'Debes incluir un token de autenticación en el header Authorization'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return next(err); // Pasa el error al middleware de manejo de errores
    }
    
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
