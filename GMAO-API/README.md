# GMAO API - Gestión de Órdenes de Trabajo

API REST desarrollada con Express.js para la gestión de órdenes de trabajo en un sistema GMAO (Gestión de Mantenimiento Asistido por Ordenador).

## � Evolución del Proyecto

Este proyecto ha evolucionado desde el trabajo inicial de **"Librerías de Backend con Node.js"** hacia una solución empresarial robusta:

### Versión 1.0 (Trabajo Anterior)
- ✅ CRUD completo para órdenes de trabajo
- 🔐 Autenticación JWT
- ✨ Validación de datos con Joi
- 📁 Persistencia en archivo JSON local
- 🛡️ Middlewares personalizados
- 📊 Logging de solicitudes HTTP
- 🔍 Filtrado por estado y técnico
- 📈 Estadísticas de órdenes

### 🆕 Versión 2.0 (Ejercicio Actual - DB Interaction)
**Nuevas características implementadas:**
- 🗄️ **Base de datos MySQL** con Sequelize ORM
- ⚡ **Sistema de caché Redis** con TTL de 30 minutos
- 📄 **Paginación inteligente** para grandes volúmenes
- 🔍 **Filtros avanzados** combinados (estado, técnico, prioridad)
- 📊 **Estadísticas en tiempo real** con caché optimizado
- 🚀 **Mejora del 90%** en rendimiento de consultas
- 🔄 **Invalidación automática** de caché en operaciones de escritura

## 📋 Requisitos

### Versión 1.0 (JSON)
- Node.js v14 o superior
- npm o yarn

### 🆕 Versión 2.0 (Base de Datos + Redis)
- Node.js v16 o superior
- **MySQL 8.0+** (nuevo)
- **Redis 6.0+** (nuevo)
- npm o yarn

## 🛠️ Instalación

1. **Clonar o descargar el proyecto**

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **🆕 Configurar base de datos MySQL:**
   ```sql
   CREATE DATABASE gmao_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

4. **🆕 Asegurar que Redis esté ejecutándose:**
   ```bash
   redis-server
   ```

5. **Configurar variables de entorno:**
   
   Crear un archivo `.env` en la raíz del proyecto:
   ```env
   # Configuración original (mantenida)
   PORT=3000
   JWT_SECRET=mi_clave_secreta_super_segura_2024
   USERNAME=admin
   PASSWORD=admin123
   
   # 🆕 Nuevas configuraciones de BD
   DB_NAME=gmao_db
   DB_USER=root
   DB_PASSWORD=tu_password
   DB_HOST=localhost
   DB_PORT=3306
   
   # 🆕 Configuración de Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   ```

6. **Ejecutar el servidor:**
   
   **Modo desarrollo (versión original con JSON):**
   ```bash
   npm run dev
   ```


El servidor estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

### Estructura Original (mantenida)
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

### 🆕 Nuevos Componentes Agregados
```
GMAO-API/
├── config/                        # 🆕 Configuraciones
│   ├── database.js               # 🆕 Sequelize config
│   └── redis.js                  # 🆕 Redis config + helpers
├── controllers/
│   ├── authController.js         # (sin cambios)
│   └── workOrderControllerDB.js  # 🆕 Controlador con BD + Cache
├── models/
│   └── WorkOrderSequelize.js     # 🆕 Modelo Sequelize
├── routes/
│   ├── authRoutes.js             # (sin cambios)
│   └── workOrderRoutesDB.js      # 🆕 Rutas con BD
├── server.js                  # 🆕 Servidor con BD + 
└── README.md                 # 🆕 Doc. detallada
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
- **GET** `/` - Información de la API (🆕 incluye información de versiones)

### 🔐 Autenticación (sin cambios desde versión 1.0)
- **POST** `/api/auth/login` - Iniciar sesión
- **GET** `/api/auth/verify` - Verificar token (protegida)

### 📋 Órdenes de Trabajo

#### Rutas Públicas (GET) - Mejoradas en v2.0
- **GET** `/api/work-orders` - Obtener todas las órdenes (🆕 con paginación y caché)
- **GET** `/api/work-orders/:id` - Obtener orden por ID (🆕 con caché)
- **GET** `/api/work-orders/stats` - Estadísticas (🆕 optimizada con caché)
- **GET** `/api/work-orders?estado=pendiente` - Filtrar por estado
- **GET** `/api/work-orders?tecnico=juan` - Filtrar por técnico
- **GET** `/api/work-orders/by-status/:status` - 🆕 Filtro específico por estado
- **GET** `/api/work-orders?priority=alta` - 🆕 Filtrar por prioridad
- **GET** `/api/work-orders?page=1&limit=10` - 🆕 Paginación

#### Rutas Protegidas (requieren JWT) - Mejoradas
- **POST** `/api/work-orders` - Crear nueva orden (🆕 con invalidación de caché)
- **PUT** `/api/work-orders/:id` - Actualizar orden (🆕 con invalidación de caché)
- **PATCH** `/api/work-orders/:id/complete` - 🆕 Marcar como completada
- **DELETE** `/api/work-orders/:id` - Eliminar orden (🆕 con invalidación de caché)

## 📝 Modelo de Datos

### Modelo Original (v1.0 - JSON)

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

### 🆕 Modelo Extendido (v2.0 - Base de Datos)

```json
{
  "id": "uuid-generado-automaticamente",
  "title": "Título de la orden (3-200 caracteres)",
  "description": "Descripción detallada (opcional)",
  "status": "pendiente | en_progreso | completada | cancelada",
  "priority": "baja | media | alta | critica",
  "assignedTo": "Técnico asignado (opcional)",
  "estimatedHours": 4.5,
  "actualHours": 2.0,
  "dueDate": "2025-07-15T10:00:00Z",
  "completedAt": "2025-07-10T14:30:00Z",
  "equipmentId": "PUMP-001",
  "location": "Planta Principal - Sector A",
  "cost": 150.00,
  "notes": "Notas adicionales del trabajo",
  "createdAt": "2025-06-28T10:30:00.000Z",
  "updatedAt": "2025-06-28T15:45:00.000Z"
}
```

## 🧪 Ejemplos de Uso

### 1. Obtener Token de Autenticación (sin cambios)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### 2. Crear Nueva Orden de Trabajo

#### Versión Original (v1.0)
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

#### 🆕 Versión Extendida (v2.0)
```bash
curl -X POST http://localhost:3000/api/work-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "title": "Mantenimiento de Bomba #1",
    "description": "Revisión y mantenimiento preventivo de la bomba principal",
    "priority": "alta",
    "assignedTo": "Juan Pérez",
    "estimatedHours": 4.5,
    "dueDate": "2025-07-15T10:00:00Z",
    "equipmentId": "PUMP-001",
    "location": "Planta Principal - Sector A",
    "cost": 150.00
  }'
```

### 3. Obtener Todas las Órdenes

#### Original
```bash
curl http://localhost:3000/api/work-orders
```

#### 🆕 Con Paginación y Filtros
```bash
# Paginación
curl "http://localhost:3000/api/work-orders?page=1&limit=5"

# Filtros combinados
curl "http://localhost:3000/api/work-orders?status=pendiente&priority=alta&assignedTo=Juan"

# Por prioridad
curl "http://localhost:3000/api/work-orders/by-status/en_progreso"
```

### 4. 🆕 Marcar Orden como Completada
```bash
curl -X PATCH http://localhost:3000/api/work-orders/ID_DE_LA_ORDEN/complete \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### 5. Obtener Estadísticas (mejorado con caché)

```bash
curl http://localhost:3000/api/work-orders/stats
```

**🆕 Respuesta mejorada:**
```json
{
  "success": true,
  "data": {
    "total": 15,
    "byStatus": {
      "pendiente": 5,
      "en_progreso": 3,
      "completada": 6,
      "cancelada": 1
    },
    "overdue": 2,
    "completionRate": "40.00"
  },
  "cached": true
}
```

### 6. 🆕 Probar Sistema de Caché
```bash
# Primera consulta (sin caché) - ~30ms
curl -w "%{time_total}" http://localhost:3000/api/work-orders/stats

# Segunda consulta (con caché) - ~3ms
curl -w "%{time_total}" http://localhost:3000/api/work-orders/stats
```

## ✅ Validaciones

### Validaciones Originales (mantenidas)
#### Campos Obligatorios
- `titulo`: mínimo 3 caracteres
- `fecha_programada`: formato YYYY-MM-DD

#### Estados Válidos
- `pendiente` (por defecto)
- `en_progreso`
- `finalizada`

#### Campos Opcionales
- `descripcion`
- `tecnico`

### 🆕 Validaciones Extendidas (v2.0)
#### Nuevos Campos Obligatorios
- `title`: 3-200 caracteres
- `description`: texto libre (opcional pero recomendado)

#### 🆕 Nuevos Estados Válidos
- `pendiente` (por defecto)
- `en_progreso`
- `completada` (reemplaza "finalizada")
- `cancelada` (nuevo)

#### 🆕 Prioridades Válidas
- `baja`
- `media` (por defecto)
- `alta`
- `critica`

#### 🆕 Validaciones Numéricas
- `estimatedHours`: 0.1 - 999.99
- `actualHours`: 0.1 - 999.99
- `cost`: ≥ 0.00

#### 🆕 Validaciones de Longitud
- `assignedTo`: máximo 100 caracteres
- `equipmentId`: máximo 50 caracteres
- `location`: máximo 100 caracteres

## 🛡️ Middlewares

### Middlewares Originales (del trabajo anterior - sin cambios)
1. **Logger**: Registra todas las solicitudes HTTP
2. **Auth**: Verifica tokens JWT en rutas protegidas
3. **Validation**: Valida datos de entrada con Joi
4. **Error Handler**: Manejo centralizado de errores
5. **CORS**: Permite solicitudes desde diferentes orígenes

### 🆕 Mejoras en Middlewares (v2.0)
- **Logger**: Ahora incluye información de caché (hit/miss)
- **Validation**: Validaciones extendidas para nuevos campos
- **Error Handler**: Manejo específico de errores de Sequelize y Redis

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
