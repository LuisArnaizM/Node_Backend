const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 50]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 100]
    }
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'viewer',
    validate: {
      isIn: {
        args: [['admin', 'technician', 'viewer']],
        msg: 'Role must be one of: admin, technician, viewer'
      },
      isValidRole(value) {
        const validRoles = ['admin', 'technician', 'viewer'];
        if (!validRoles.includes(value)) {
          throw new Error('Role must be one of: admin, technician, viewer');
        }
      }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  passwordChangedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    {
      fields: ['username']
    },
    {
      fields: ['email']
    },
    {
      fields: ['isActive']
    }
  ],
  hooks: {
    // Hash password antes de crear usuario
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    // Hash password antes de actualizar usuario
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
        user.passwordChangedAt = new Date();
      }
    }
  }
});

// Métodos de instancia
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.validatePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

User.prototype.isAdmin = function() {
  return this.role === 'admin';
};

User.prototype.isTechnician = function() {
  return this.role === 'technician';
};

User.prototype.canModifyWorkOrders = function() {
  return this.role === 'admin' || this.role === 'technician';
};

User.prototype.toSafeObject = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password; // No incluir password en respuestas JSON
  return values;
};

// Métodos estáticos
User.findByUsername = function(username) {
  return this.findOne({
    where: { 
      username,
      isActive: true
    }
  });
};

User.findByEmail = function(email) {
  return this.findOne({
    where: { 
      email,
      isActive: true
    }
  });
};

module.exports = User;
