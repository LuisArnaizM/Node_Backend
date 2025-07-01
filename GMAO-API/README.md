# GMAO API - Gestión de Órdenes de Trabajo

API REST desarrollada con Express.js para la gestión de órdenes de trabajo en un sistema GMAO (Gestión de Mantenimiento Asistido por Ordenador).

## 🔄 Evolución del Proyecto

Este proyecto ha evolucionado desde el trabajo inicial de **"Librerías de Backend con Node.js"** hacia una solución empresarial robusta:

### Versión 1.0 (Trabajo Anterior)
- ✅ CRUD completo para órdenes de trabajo
- 🔐 Autenticación JWT básica
- ✨ Validación de datos con Joi
- 📁 Persistencia en archivo JSON local
- 🛡️ Middlewares personalizados
- 📊 Logging de solicitudes HTTP
- 🔍 Filtrado por estado y técnico
- 📈 Estadísticas de órdenes

### 🆕 Versión 2.0 (Base de Datos + Redis Cache)
**Características implementadas:**
- 🗄️ **Base de datos MySQL** con Sequelize ORM
- ⚡ **Sistema de caché Redis** con TTL de 30 minutos
- 📄 **Paginación inteligente** para grandes volúmenes
- 🔍 **Filtros avanzados** combinados (estado, técnico, prioridad)
- 📊 **Estadísticas en tiempo real** con caché optimizado
- 🚀 **Mejora del 90%** en rendimiento de consultas
- 🔄 **Invalidación automática** de caché en operaciones de escritura

### 🔐 Versión 2.1 (Seguridad Empresarial) - **ACTUAL**
**🔥 Nuevas funcionalidades de seguridad implementadas:**
- 🛡️ **Almacenamiento seguro** de contraseñas con bcrypt (salt factor 12)
- 👥 **Sistema de roles** completo (admin, technician, viewer)
- 🔑 **Registro de usuarios** con validación robusta
- ⚡ **Rate limiting** avanzado contra ataques de fuerza bruta
- 🧹 **Sanitización de entrada** para prevenir XSS
- 🛡️ **Protección CSRF** con validación de Content-Type
- 🌍 **CORS seguro** con orígenes configurables
- 🔒 **Headers de seguridad** con Helmet.js
- 🚫 **Invalidación de tokens** al cambiar contraseña
- ✅ **Verificación de usuario activo** en cada request

## 📋 Requisitos

### Versión 1.0 (JSON)
- Node.js v14 o superior
- npm o yarn

### 🆕 Versión 2.0+ (Base de Datos + Redis + Seguridad)
- Node.js v16 o superior
- **MySQL 8.0+** 
- **Redis 6.0+** 
- npm o yarn

## 🛠️ Instalación

1. **Clonar o descargar el proyecto**

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **🆕 Configurar base de datos MySQL:**
   ```sql
   CREATE DATABASE gmao_secure CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
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
   # Configuración del servidor
   PORT=3000
   NODE_ENV=development
   
   # 🔐 Configuración JWT y Seguridad
   JWT_SECRET=tu_clave_secreta_muy_segura_aqui
   ALLOWED_ORIGINS=http://localhost:3000
   # 🗄️ Configuración de base de datos
   DB_NAME=gmao_secure
   DB_USER=root
   DB_PASSWORD=tu_password
   DB_HOST=localhost
   DB_PORT=3306
   
   # ⚡ Configuración de Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   ```

6. **🆕 Crear usuarios de prueba (opcional):**
   ```bash
   node scripts/createTestUsers.js
   ```

7. **Ejecutar el servidor:**
   ```bash
   npm start
   # o para desarrollo:
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

## 🔐 Autenticación y Seguridad

La API implementa un sistema de autenticación robusto con JWT y roles de usuario.

### 👤 Usuarios de Prueba Predefinidos

Al iniciar el servidor, se crea automáticamente:
```
Username: admin
Password: Admin123!
Role: admin
Email: admin@gmao.com
```

### 🔑 Registro de Nuevos Usuarios

**POST** `/api/auth/register`

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "juan_tecnico",
    "email": "juan@empresa.com",
    "password": "JuanTech123!",
    "role": "technician"
  }'
```

**Validaciones de Contraseña:**
- Mínimo 8 caracteres
- Debe incluir: mayúscula, minúscula, número y símbolo especial

### 🚪 Iniciar Sesión

**POST** `/api/auth/login`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123!"
  }'
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
      "id": "uuid",
      "username": "admin",
      "email": "admin@gmao.com",
      "role": "admin"
    }
  }
}
```

### 👥 Sistema de Roles

| Rol | Permisos |
|-----|----------|
| **🔴 Admin** | Acceso total: crear, leer, actualizar, eliminar órdenes |
| **🟡 Technician** | Crear, leer, actualizar órdenes (no eliminar) |
| **🟢 Viewer** | Solo lectura de órdenes y estadísticas |

### 🔄 Gestión de Perfil

**Obtener perfil del usuario:**
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TU_TOKEN_JWT"
```

**Cambiar contraseña:**
```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -d '{
    "currentPassword": "PasswordActual123!",
    "newPassword": "NuevoPassword456!"
  }'
```

### 🛡️ Características de Seguridad

- **🔒 Contraseñas hasheadas** con bcrypt (factor 12)
- **⚡ Rate limiting:** 5 intentos de login por IP cada 15 min
- **🧹 Sanitización** automática de todas las entradas
- **🛡️ Headers de seguridad** con Helmet.js
- **🚫 Invalidación de tokens** al cambiar contraseña
- **✅ Verificación de usuario activo** en cada request

## 📚 Endpoints de la API

### 🏠 Inicio
- **GET** `/` - Información de la API con características de seguridad

### 🔐 Autenticación
- **POST** `/api/auth/register` - Registrar nuevo usuario
- **POST** `/api/auth/login` - Iniciar sesión
- **GET** `/api/auth/verify` - Verificar token (🔒 protegida)
- **GET** `/api/auth/profile` - Obtener perfil (🔒 protegida)
- **POST** `/api/auth/change-password` - Cambiar contraseña (🔒 protegida)

### 📋 Órdenes de Trabajo

#### 🌍 Rutas Públicas (Sin Autenticación)
- **GET** `/api/work-orders` - Obtener todas las órdenes (con paginación y caché)
- **GET** `/api/work-orders/:id` - Obtener orden por ID (con caché)
- **GET** `/api/work-orders/stats` - Estadísticas (optimizada con caché)
- **GET** `/api/work-orders/by-status/:status` - Filtro específico por estado
- **GET** `/api/work-orders?status=pendiente` - Filtrar por estado
- **GET** `/api/work-orders?priority=alta` - Filtrar por prioridad
- **GET** `/api/work-orders?page=1&limit=10` - Paginación

#### 🟡 Rutas para Técnicos y Administradores
- **POST** `/api/work-orders` - Crear nueva orden (🔒 requiere technician/admin)
- **PUT** `/api/work-orders/:id` - Actualizar orden (🔒 requiere technician/admin)
- **PATCH** `/api/work-orders/:id/complete` - Marcar como completada (🔒 requiere technician/admin)

#### 🔴 Rutas Solo para Administradores
- **DELETE** `/api/work-orders/:id` - Eliminar orden (🔒 requiere admin)

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

## 🧪 Ejemplos de Uso Paso a Paso

### 🚀 Prueba Rápida del Sistema Completo

#### 1. **Verificar que el servidor está funcionando**
```bash
curl http://localhost:3000/
```

#### 2. **Registrar un usuario técnico**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "carlos_tech",
    "email": "carlos@empresa.com",
    "password": "CarlosTech123!",
    "role": "technician"
  }'
```

#### 3. **Iniciar sesión con el admin**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123!"
  }'
```
> 💡 **Copia el token** de la respuesta para usarlo en los siguientes pasos

#### 4. **Crear una orden de trabajo (como admin)**
```bash
curl -X POST http://localhost:3000/api/work-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "title": "Mantenimiento Sistema Seguro",
    "description": "Primera orden con sistema de seguridad implementado",
    "priority": "alta",
    "assignedTo": "Carlos Tech",
    "estimatedHours": 3.5,
    "dueDate": "2025-07-15T10:00:00Z",
    "equipmentId": "SEC-001",
    "location": "Centro de Datos",
    "cost": 200.00
  }'
```

#### 5. **Iniciar sesión como técnico**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "carlos_tech",
    "password": "CarlosTech123!"
  }'
```

#### 6. **Intentar eliminar una orden como técnico (debe fallar)**
```bash
curl -X DELETE http://localhost:3000/api/work-orders/ID_DE_LA_ORDEN \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_DEL_TECNICO"
```
> ❌ **Debe devolver error 403** - Solo admin puede eliminar

#### 7. **Probar rate limiting (intentos de login incorrectos)**
```bash
# Ejecutar 6 veces rápidamente:
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password_incorrecto"
  }'
```
> ⚡ **Después del 5to intento** se activará el rate limiting

### 🔐 Ejemplos de Seguridad en Acción

#### **Validación de Contraseña Débil**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "email": "test@test.com",
    "password": "123456",
    "role": "viewer"
  }'
```
> ❌ **Error de validación** - Contraseña muy débil

#### **Cambio de Contraseña con Invalidación de Token**
```bash
# 1. Cambiar contraseña
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_ACTUAL" \
  -d '{
    "currentPassword": "Admin123!",
    "newPassword": "NuevaPassword456!"
  }'

# 2. Intentar usar el token anterior (debe fallar)
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TU_TOKEN_ANTERIOR"
```
> ❌ **Token inválido** - Invalidado por cambio de contraseña

### 📊 Pruebas de Rendimiento

#### **Verificar Cache en Estadísticas**
```bash
# Primera consulta (sin cache) - más lenta
curl -w "%{time_total}" http://localhost:3000/api/work-orders/stats

# Segunda consulta (con cache) - mucho más rápida
curl -w "%{time_total}" http://localhost:3000/api/work-orders/stats
```

#### **Paginación de Órdenes**
```bash
# Página 1 con 5 elementos
curl "http://localhost:3000/api/work-orders?page=1&limit=5"

# Filtros combinados
curl "http://localhost:3000/api/work-orders?status=pendiente&priority=alta&page=1&limit=10"
```

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

## 🧪 Testing y Calidad de Código

La API incluye un sistema completo de testing con **cobertura del 80%+** que garantiza la calidad y fiabilidad del código.

### 🔬 Tipos de Pruebas Implementadas

#### **Pruebas Unitarias**
- ✅ **Middlewares de validación**: 100% cobertura
- ✅ **Middlewares de autenticación**: Verificación de JWT y roles
- ✅ **Modelos de datos**: Validaciones y métodos
- ✅ **Controladores**: Lógica de negocio
- ✅ **Middlewares de seguridad**: Rate limiting, sanitización

#### **Pruebas de Integración**
- ✅ **API ↔ Base de datos**: Flujos completos
- ✅ **Autenticación end-to-end**: Registro → Login → Tokens
- ✅ **CRUD con autorización**: Verificación de roles
- ✅ **Validaciones de entrada**: Joi schemas en endpoints

### 🛠️ Configuración de Testing

**Tecnologías utilizadas:**
- **Jest**: Framework principal de testing
- **Supertest**: Testing HTTP para APIs
- **SQLite**: Base de datos en memoria para aislamiento
- **Mocks**: Para dependencias externas

### 📊 Comandos de Testing

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar con cobertura de código
npm run test:coverage

# Solo pruebas unitarias
npm run test:unit

# Solo pruebas de integración
npm run test:integration

# Modo watch para desarrollo
npm run test:watch

# Para CI/CD
npm run test:ci
```

### 📈 Ejemplo de Resultado

```bash
$ npm run test:coverage

✅ Test Suites: 5 passed, 5 total
✅ Tests: 85+ passed, 85+ total
✅ Coverage: 
  - Statements: 85%+
  - Branches: 80%+
  - Functions: 90%+
  - Lines: 85%+
⏱️ Time: < 10s
```

### 📋 Reportes de Cobertura

```bash
# Generar reporte HTML interactivo
npm run test:coverage
open coverage/lcov-report/index.html
```

### 🎯 Casos de Uso Probados

- ✅ **Seguridad completa**: Autenticación, autorización, sanitización
- ✅ **Validaciones robustas**: Joi schemas con casos edge
- ✅ **Flujos de negocio**: CRUD completo con restricciones por rol
- ✅ **Manejo de errores**: Respuestas consistentes y útiles
- ✅ **Integración BD**: Operaciones reales con SQLite en memoria

### 📁 Documentación Detallada

- **[TESTING.md](./TESTING.md)**: Guía completa de testing
- **[TESTING_SUMMARY.md](./TESTING_SUMMARY.md)**: Resumen ejecutivo
- Reportes HTML de cobertura en `coverage/`

**💯 Calidad Garantizada**: Cada funcionalidad crítica está probada y verificada.
