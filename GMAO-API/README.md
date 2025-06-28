# GMAO API - Gestión de Órdenes de Trabajo

API REST desarrollada con Express.js para la gestión de órdenes de trabajo en un sistema GMAO (Gestión de Mantenimiento Asistido por Ordenador).

## 🚀 Características

- ✅ CRUD completo para órdenes de trabajo
- 🔐 Autenticación JWT
- ✨ Validación de datos con Joi
- 📁 Persistencia en archivo JSON local
- 🛡️ Middlewares personalizados
- 📊 Logging de solicitudes HTTP
- 🔍 Filtrado por estado y técnico
- 📈 Estadísticas de órdenes

## 📋 Requisitos

- Node.js v14 o superior
- npm o yarn

## 🛠️ Instalación

1. **Clonar o descargar el proyecto**

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   
   Crear un archivo `.env` en la raíz del proyecto:
   ```env
   PORT=3000
   JWT_SECRET=mi_clave_secreta_super_segura_2024
   USERNAME=admin
   PASSWORD=admin123
   ```

4. **Ejecutar el servidor:**
   
   **Modo desarrollo:**
   ```bash
   npm run dev
   ```
   
   **Modo producción:**
   ```bash
   npm start
   ```

El servidor estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
GMAO-API/
├── controllers/
│   ├── authController.js
│   └── workOrderController.js
├── middlewares/
│   ├── auth.js
│   ├── errorHandler.js
│   ├── logger.js
│   └── validation.js
├── models/
│   └── WorkOrder.js
├── routes/
│   ├── authRoutes.js
│   └── workOrderRoutes.js
├── data/
│   └── ordenes.json
├── server.js
├── package.json
├── .env
└── README.md
```

## 🔐 Autenticación

Para acceder a las rutas protegidas (`POST`, `PUT`, `DELETE`), necesitas obtener un token JWT.

### Obtener Token

**POST** `/api/auth/login`

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Autenticación exitosa",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "type": "Bearer",
    "expiresIn": "24h",
    "user": {
      "username": "admin"
    }
  }
}
```

### Usar Token

Incluir el token en el header `Authorization` de las solicitudes protegidas:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📚 Endpoints de la API

### 🏠 Inicio
- **GET** `/` - Información de la API

### 🔐 Autenticación
- **POST** `/api/auth/login` - Iniciar sesión
- **GET** `/api/auth/verify` - Verificar token (protegida)

### 📋 Órdenes de Trabajo

#### Rutas Públicas (GET)
- **GET** `/api/work-orders` - Obtener todas las órdenes
- **GET** `/api/work-orders/:id` - Obtener orden por ID
- **GET** `/api/work-orders/stats` - Estadísticas de órdenes
- **GET** `/api/work-orders?estado=pendiente` - Filtrar por estado
- **GET** `/api/work-orders?tecnico=juan` - Filtrar por técnico

#### Rutas Protegidas (requieren JWT)
- **POST** `/api/work-orders` - Crear nueva orden
- **PUT** `/api/work-orders/:id` - Actualizar orden
- **DELETE** `/api/work-orders/:id` - Eliminar orden

## 📝 Modelo de Datos

### Orden de Trabajo

```json
{
  "id": "uuid-generado-automaticamente",
  "titulo": "Título de la orden (mínimo 3 caracteres)",
  "descripcion": "Descripción opcional",
  "fecha_programada": "2024-06-15",
  "estado": "pendiente | en_progreso | finalizada",
  "tecnico": "Nombre del técnico (opcional)",
  "fecha_creacion": "2024-06-14T10:30:00.000Z",
  "fecha_actualizacion": "2024-06-14T10:30:00.000Z"
}
```

## 🧪 Ejemplos de Uso

### 1. Obtener Token de Autenticación

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### 2. Crear Nueva Orden de Trabajo

```bash
curl -X POST http://localhost:3000/api/work-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "titulo": "Reparar bomba de agua",
    "descripcion": "La bomba principal tiene una fuga en la conexión",
    "fecha_programada": "2024-06-20",
    "estado": "pendiente",
    "tecnico": "Juan Pérez"
  }'
```

### 3. Obtener Todas las Órdenes

```bash
curl http://localhost:3000/api/work-orders
```

### 4. Actualizar Orden de Trabajo

```bash
curl -X PUT http://localhost:3000/api/work-orders/ID_DE_LA_ORDEN \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "estado": "en_progreso",
    "descripcion": "Trabajo iniciado - reemplazando sellos"
  }'
```

### 5. Obtener Estadísticas

```bash
curl http://localhost:3000/api/work-orders/stats
```

## ✅ Validaciones

### Campos Obligatorios
- `titulo`: mínimo 3 caracteres
- `fecha_programada`: formato YYYY-MM-DD

### Estados Válidos
- `pendiente` (por defecto)
- `en_progreso`
- `finalizada`

### Campos Opcionales
- `descripcion`
- `tecnico`

## 🛡️ Middlewares

1. **Logger**: Registra todas las solicitudes HTTP
2. **Auth**: Verifica tokens JWT en rutas protegidas
3. **Validation**: Valida datos de entrada con Joi
4. **Error Handler**: Manejo centralizado de errores
5. **CORS**: Permite solicitudes desde diferentes orígenes

## 📊 Respuestas de Error

### Errores de Validación (400)
```json
{
  "error": "Error de validación",
  "message": "El título debe tener al menos 3 caracteres",
  "details": [...]
}
```

### Errores de Autenticación (401)
```json
{
  "error": "Token inválido",
  "message": "El token proporcionado no es válido"
}
```

### Recurso No Encontrado (404)
```json
{
  "success": false,
  "error": "Orden no encontrada",
  "message": "No se encontró una orden con ID: abc123"
}
```

## 🚀 Próximos Pasos

- [ ] Migración a base de datos (MongoDB/PostgreSQL)
- [ ] Paginación en listados
- [ ] Filtros avanzados
- [ ] Notificaciones por email
- [ ] API de reportes
- [ ] Interface web (React/Vue)

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

---

**¡API GMAO lista para usar!** 🎉

Para cualquier duda o problema, revisar los logs de la consola o contactar al desarrollador.