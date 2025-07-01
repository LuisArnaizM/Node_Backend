const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token no proporcionado',
        message: 'Se requiere un token de autorización para acceder a este recurso'
      });
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuario en la base de datos
    const user = await User.findOne({
      where: { 
        id: decoded.id,
        isActive: true 
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        message: 'El usuario asociado al token no existe o está desactivado'
      });
    }

    // Verificar si la contraseña fue cambiada después de la emisión del token
    if (user.passwordChangedAt) {
      const passwordChangedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < passwordChangedTimestamp) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
          message: 'Token inválido debido a cambio de contraseña. Inicia sesión nuevamente.'
        });
      }
    }

    // Adjuntar información del usuario a la petición
    req.user = user.toJSON();
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        message: 'El token proporcionado no es válido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado',
        message: 'El token ha expirado. Inicia sesión nuevamente.'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al verificar el token'
    });
  }
};

// Middleware para verificar roles específicos
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado',
        message: 'Se requiere autenticación'
      });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado',
        message: `Se requiere uno de los siguientes roles: ${userRoles.join(', ')}`
      });
    }

    next();
  };
};

// Middleware para verificar si es admin
const requireAdmin = requireRole('admin');

// Middleware para verificar si es admin o técnico
const requireAdminOrTechnician = requireRole(['admin', 'technician']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireAdminOrTechnician
};
