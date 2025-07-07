const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const User = require('@models/User');

class AuthController {
  // POST /api/auth/register - Registro de nuevo usuario
  async register(req, res, next) {
    try {
      const { username, email, password, role = 'viewer' } = req.body;

      console.log('🔄 Intento de registro para usuario:', username);

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
        console.log('❌ Usuario ya existe:', username);
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

      console.log('✅ Usuario creado:', username);

      // Generar token JWT - CORREGIDO
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
      console.error('❌ Error en register:', error);
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

      console.log('🔐 Intento de login para usuario:', username);

      // Buscar usuario en la base de datos
      const user = await User.findOne({
        where: { username },
        attributes: ['id', 'username', 'email', 'password', 'role', 'lastLoginAt', 'passwordChangedAt', 'isActive']
      });

      if (!user) {
        console.log('❌ Usuario no encontrado:', username);
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas',
          message: 'Usuario o contraseña incorrectos'
        });
      }

      console.log('✅ Usuario encontrado:', user.username);

      // Verificar si el usuario está activo
      if (!user.isActive) {
        console.log('❌ Usuario inactivo:', username);
        return res.status(401).json({
          success: false,
          error: 'Cuenta desactivada',
          message: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
        });
      }

      // Verificar contraseña
      const isPasswordValid = await user.validatePassword(password);
      
      if (!isPasswordValid) {
        console.log('❌ Contraseña incorrecta para usuario:', username);
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas',
          message: 'Usuario o contraseña incorrectos'
        });
      }

      console.log('✅ Contraseña válida para usuario:', username);

      // Actualizar último login
      await user.updateLastLogin();

      // Generar token JWT - CORREGIDO
      const token = this.generateToken(user);

      console.log('✅ Token generado exitosamente para:', username);

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
      console.error('❌ Error en login:', error);
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

      await user.update({ password: newPassword });

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  generateToken(user) {
    try {
      const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000)
      };

      console.log('🔑 Generando token para usuario:', user.username);
      return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
    } catch (error) {
      console.error('❌ Error generando token:', error);
      throw error;
    }
  }
}

// Crear instancia y hacer bind de los métodos
const authController = new AuthController();

// Hacer bind de todos los métodos para preservar el contexto de 'this'
authController.register = authController.register.bind(authController);
authController.login = authController.login.bind(authController);
authController.verifyToken = authController.verifyToken.bind(authController);
authController.getProfile = authController.getProfile.bind(authController);
authController.changePassword = authController.changePassword.bind(authController);
authController.generateToken = authController.generateToken.bind(authController);

module.exports = authController;