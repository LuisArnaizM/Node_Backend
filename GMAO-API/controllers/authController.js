const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const User = require('../models/User');

class AuthController {
  // POST /api/auth/register - Registro de nuevo usuario
  async register(req, res, next) {
    try {
      const { username, email, password, role = 'viewer' } = req.body;

      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username },
            { email }
          ]
        }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Usuario ya existe',
          message: existingUser.username === username 
            ? 'El nombre de usuario ya está en uso'
            : 'El email ya está registrado'
        });
      }

      // Crear nuevo usuario (el password se hashea automáticamente en el hook)
      const newUser = await User.create({
        username,
        email,
        password,
        role
      });

      // Generar token JWT
      const token = this.generateToken(newUser);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          token: token,
          type: 'Bearer',
          expiresIn: '24h',
          user: newUser.toJSON()
        }
      });
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          error: 'Errores de validación',
          details: validationErrors
        });
      }
      next(error);
    }
  }

  // POST /api/auth/login - Autenticación de usuario
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      // Buscar usuario en la base de datos
      const user = await User.findOne({
        where: { username },
        attributes: ['id', 'username', 'email', 'password', 'role', 'lastLoginAt', 'passwordChangedAt', 'isActive']
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas',
          message: 'Usuario o contraseña incorrectos'
        });
      }

      // Verificar si el usuario está activo
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Cuenta desactivada',
          message: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
        });
      }

      // Verificar contraseña
      const isPasswordValid = await user.validatePassword(password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas',
          message: 'Usuario o contraseña incorrectos'
        });
      }

      // Actualizar último login
      await user.updateLastLogin();

      // Generar token JWT
      const token = this.generateToken(user);

      res.json({
        success: true,
        message: 'Autenticación exitosa',
        data: {
          token: token,
          type: 'Bearer',
          expiresIn: '24h',
          user: user.toJSON()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/verify - Verificar token
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

  // POST /api/auth/change-password - Cambiar contraseña
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Buscar usuario con password
      const user = await User.findOne({
        where: { id: userId },
        attributes: ['id', 'username', 'password']
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      // Verificar contraseña actual
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Contraseña actual incorrecta'
        });
      }

      // Actualizar contraseña (se hashea automáticamente en el hook)
      await user.update({ password: newPassword });

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  // Método auxiliar para generar tokens JWT
  static generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
  }

  // GET /api/auth/profile - Obtener perfil del usuario
  async getProfile(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      const user = await User.findByPk(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Perfil obtenido exitosamente',
        data: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/change-password - Cambiar contraseña
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Buscar usuario con password
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      // Verificar contraseña actual
      const isCurrentPasswordValid = await user.validatePassword(currentPassword);
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: 'Contraseña actual incorrecta'
        });
      }

      // Actualizar contraseña (se hashea automáticamente en el hook)
      await user.update({ password: newPassword });

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  // Método auxiliar para generar tokens JWT
  generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
  }
}

// Exportar tanto la clase como la instancia
const authController = new AuthController();
authController.AuthController = AuthController;

module.exports = authController;
