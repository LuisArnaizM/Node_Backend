const { sequelize } = require('../config/database');
const User = require('./User');
const WorkOrder = require('./WorkOrder');

// Definir asociaciones
WorkOrder.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });
WorkOrder.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(WorkOrder, { foreignKey: 'assignedTo', as: 'assignedWorkOrders' });
User.hasMany(WorkOrder, { foreignKey: 'createdBy', as: 'createdWorkOrders' });

module.exports = {
  sequelize,
  User,
  WorkOrder
};
