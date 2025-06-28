const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class AuthController {
  // POST /api/auth/login - Autenticación de usuario
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      // Verificar credenciales con variables de entorno
      const validUsername = process.env.USERNAME;
      const validPassword = process.env.PASSWORD;

      if (username !== validUsername || password !== validPassword) {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas',
          message: 'Usuario o contraseña incorrectos'
        });
      }

      // Generar token JWT
      const token = jwt.sign(
        { 
          username: username,
          iat: Math.floor(Date.now() / 1000)
        },
        process.env.JWT_SECRET,
        { 
          expiresIn: '24h' // Token válido por 24 horas
        }
      );

      res.json({
        success: true,
        message: 'Autenticación exitosa',
        data: {
          token: token,
          type: 'Bearer',
          expiresIn: '24h',
          user: {
            username: username
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/verify - Verificar token (opcional)
  async verifyToken(req, res, next) {
    try {
      res.json({
        success: true,
        message: 'Token válido',
        data: {
          user: req.user
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
