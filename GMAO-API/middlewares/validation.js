const Joi = require('joi');

// Esquemas de validación
const workOrderSchema = Joi.object({
  titulo: Joi.string().min(3).required().messages({
    'string.min': 'El título debe tener al menos 3 caracteres',
    'any.required': 'El título es obligatorio'
  }),
  descripcion: Joi.string().allow('').optional(),
  fecha_programada: Joi.date().iso().required().messages({
    'date.format': 'La fecha debe tener formato YYYY-MM-DD',
    'any.required': 'La fecha programada es obligatoria'
  }),
  estado: Joi.string().valid('pendiente', 'en_progreso', 'finalizada').default('pendiente'),
  tecnico: Joi.string().allow('').optional()
});

const updateWorkOrderSchema = Joi.object({
  titulo: Joi.string().min(3).optional(),
  descripcion: Joi.string().allow('').optional(),
  fecha_programada: Joi.date().iso().optional(),
  estado: Joi.string().valid('pendiente', 'en_progreso', 'finalizada').optional(),
  tecnico: Joi.string().allow('').optional()
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
