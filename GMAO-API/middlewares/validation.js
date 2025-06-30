const Joi = require('joi');

// Esquemas de validación
const workOrderSchema = Joi.object({
  title: Joi.string().min(3).max(255).required().messages({
    'string.min': 'El título debe tener al menos 3 caracteres',
    'string.max': 'El título no puede superar los 255 caracteres',
    'any.required': 'El título es obligatorio'
  }),
  description: Joi.string().required().messages({
    'any.required': 'La descripción es obligatoria'
  }),
  priority: Joi.string().valid('baja', 'media', 'alta', 'critica').default('media'),
  status: Joi.string().valid('pendiente', 'en_progreso', 'completada', 'cancelada').default('pendiente'),
  assignedTo: Joi.string().max(100).allow('').optional(),
  estimatedHours: Joi.number().min(0).max(999.99).optional(),
  actualHours: Joi.number().min(0).max(999.99).optional(),
  dueDate: Joi.date().iso().optional(),
  equipmentId: Joi.string().max(50).allow('').optional(),
  location: Joi.string().max(100).allow('').optional(),
  cost: Joi.number().min(0).optional(),
  notes: Joi.string().allow('').optional()
});

const updateWorkOrderSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  description: Joi.string().optional(),
  priority: Joi.string().valid('baja', 'media', 'alta', 'critica').optional(),
  status: Joi.string().valid('pendiente', 'en_progreso', 'completada', 'cancelada').optional(),
  assignedTo: Joi.string().max(100).allow('').optional(),
  estimatedHours: Joi.number().min(0).max(999.99).optional(),
  actualHours: Joi.number().min(0).max(999.99).optional(),
  dueDate: Joi.date().iso().optional(),
  equipmentId: Joi.string().max(50).allow('').optional(),
  location: Joi.string().max(100).allow('').optional(),
  cost: Joi.number().min(0).optional(),
  notes: Joi.string().allow('').optional()
}).min(1); // Al menos un campo debe estar presente

const loginSchema = Joi.object({
  username: Joi.string().required().messages({
    'any.required': 'El nombre de usuario es obligatorio'
  }),
  password: Joi.string().required().messages({
    'any.required': 'La contraseña es obligatoria'
  })
});

// Middleware de validación
const validateData = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      return next(error);
    }
    
    req.body = value; // Usar los datos validados y limpios
    next();
  };
};

module.exports = {
  workOrderSchema,
  updateWorkOrderSchema,
  loginSchema,
  validateData
};
