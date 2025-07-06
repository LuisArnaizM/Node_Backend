const { DataTypes } = require('sequelize');
const { sequelize } = require('@config/database');

const WorkOrder = sequelize.define('WorkOrder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  priority: {
    type: DataTypes.ENUM('baja', 'media', 'alta', 'critica'),
    allowNull: false,
    defaultValue: 'media'
  },
  status: {
    type: DataTypes.ENUM('pendiente', 'en_progreso', 'completada', 'cancelada'),
    allowNull: false,
    defaultValue: 'pendiente'
  },
  assignedTo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  estimatedHours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  actualHours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  equipmentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'work_orders',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['assignedTo']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Métodos de instancia
WorkOrder.prototype.markAsCompleted = function() {
  this.status = 'completada';
  this.completedAt = new Date();
  return this.save();
};

WorkOrder.prototype.updateProgress = function(actualHours, notes) {
  this.actualHours = actualHours;
  if (notes) this.notes = notes;
  this.status = 'en_progreso';
  return this.save();
};

// Métodos estáticos
WorkOrder.findByStatus = function(status) {
  return this.findAll({
    where: { status },
    order: [['createdAt', 'DESC']]
  });
};

WorkOrder.findByPriority = function(priority) {
  return this.findAll({
    where: { priority },
    order: [['createdAt', 'DESC']]
  });
};

WorkOrder.findOverdue = function() {
  return this.findAll({
    where: {
      dueDate: {
        [sequelize.Op.lt]: new Date()
      },
      status: {
        [sequelize.Op.notIn]: ['completada', 'cancelada']
      }
    },
    order: [['dueDate', 'ASC']]
  });
};

module.exports = WorkOrder;
