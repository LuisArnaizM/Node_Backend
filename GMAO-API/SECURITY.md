# 🔐 GMAO API - Versión 2.0 con Seguridad Avanzada

## 🛡️ Implementaciones de Seguridad

### 1. **Almacenamiento Seguro de Contraseñas**
- ✅ **bcrypt** con salt único por usuario (factor de costo: 12)
- ✅ Hash automático en hooks de Sequelize
- ✅ Validación de fortaleza de contraseña
- ✅ Cambio seguro de contraseñas

### 2. **Middlewares de Seguridad**
- ✅ **Helmet.js** - Protección HTTP headers
- ✅ **Rate Limiting** - Protección contra ataques de fuerza bruta
- ✅ **Sanitización de entrada** - Prevención XSS básico
- ✅ **Protección CSRF** - Validación de Content-Type y Origin
- ✅ **CORS seguro** - Configuración de orígenes permitidos

### 3. **Autenticación JWT Avanzada**
- ✅ **Registro de usuarios** con validación robusta
- ✅ **Roles de usuario** (admin, technician, viewer)
- ✅ **Invalidación de tokens** al cambiar contraseña
- ✅ **Verificación de usuario activo** en cada request

## 🔑 **Endpoints de Autenticación**

### **POST** `/api/auth/register` - Registro de Usuario
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "nuevo_usuario",
    "email": "usuario@example.com",
    "password": "MiPassword123!",
    "role": "viewer"
  }'
```

**Validaciones:**
- Username: 3-50 caracteres, solo letras, números, guiones
- Email: formato válido
- Password: mínimo 8 caracteres, debe incluir mayúscula, minúscula, número y símbolo
- Role: admin, technician, viewer (opcional, por defecto: viewer)

### **POST** `/api/auth/login` - Iniciar Sesión
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123!"
  }'
```

### **GET** `/api/auth/profile` - Obtener Perfil (🔒 Requiere Auth)
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TU_TOKEN_JWT"
```

### **POST** `/api/auth/change-password` - Cambiar Contraseña (🔒 Requiere Auth)
```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -d '{
    "currentPassword": "PasswordActual123!",
    "newPassword": "NuevoPassword456!"
  }'
```

## 👥 **Sistema de Roles**

### **🔴 Admin** - Acceso Total
- ✅ Crear, leer, actualizar órdenes de trabajo
- ✅ Eliminar órdenes de trabajo
- ✅ Gestionar usuarios
- ✅ Acceso a todas las estadísticas

### **🟡 Technician** - Operaciones de Trabajo
- ✅ Crear, leer, actualizar órdenes de trabajo
- ❌ No puede eliminar órdenes
- ✅ Marcar órdenes como completadas
- ✅ Ver estadísticas básicas

### **🟢 Viewer** - Solo Lectura
- ✅ Solo lectura de órdenes de trabajo
- ❌ No puede crear, modificar o eliminar
- ✅ Ver estadísticas básicas

## 🔒 **Endpoints Protegidos de Órdenes de Trabajo**

### Rutas Públicas (Sin Autenticación)
- **GET** `/api/work-orders` - Listar órdenes
- **GET** `/api/work-orders/:id` - Ver orden específica
- **GET** `/api/work-orders/stats` - Estadísticas
- **GET** `/api/work-orders/by-status/:status` - Filtrar por estado

### Rutas que Requieren Rol de Técnico o Admin
- **POST** `/api/work-orders` - Crear orden
- **PUT** `/api/work-orders/:id` - Actualizar orden
- **PATCH** `/api/work-orders/:id/complete` - Completar orden

### Rutas que Requieren Rol de Admin
- **DELETE** `/api/work-orders/:id` - Eliminar orden

## 🛡️ **Rate Limiting**

### **Autenticación** (15 min)
- Login/Register: máximo 5 intentos por IP
- Ventana: 15 minutos

### **General** (15 min)
- Requests generales: máximo 100 por IP
- Ventana: 15 minutos

### **Creación** (5 min)
- Crear recursos: máximo 10 por IP
- Ventana: 5 minutos

## 🧪 **Ejemplos de Uso Completo**

### 1️⃣ **Registrar un nuevo técnico**
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

### 2️⃣ **Iniciar sesión y obtener token**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "juan_tecnico",
    "password": "JuanTech123!"
  }'
```

### 3️⃣ **Crear orden de trabajo (como técnico)**
```bash
curl -X POST http://localhost:3000/api/work-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -d '{
    "title": "Mantenimiento Bomba Principal",
    "description": "Revisión y mantenimiento preventivo de la bomba de agua principal",
    "priority": "alta",
    "assignedTo": "Juan Técnico",
    "estimatedHours": 4.5,
    "dueDate": "2025-07-15T10:00:00Z",
    "equipmentId": "PUMP-001",
    "location": "Planta Principal - Sector A",
    "cost": 250.00
  }'
```

### 4️⃣ **Intentar eliminar orden (como técnico - debe fallar)**
```bash
curl -X DELETE http://localhost:3000/api/work-orders/ID_ORDEN \
  -H "Authorization: Bearer TOKEN_TECNICO"
# Respuesta: 403 Forbidden - Se requiere rol admin
```

## 👤 **Usuarios de Prueba Predefinidos**

Al iniciar el servidor, se crean automáticamente estos usuarios:

```
Username: admin
Password: Admin123!
Role: admin
Email: admin@gmao.com

Username: tecnico1
Password: Tecnico123!
Role: technician
Email: tecnico1@gmao.com

Username: viewer
Password: Viewer123!
Role: viewer
Email: viewer@gmao.com
```

## 🔧 **Configuración de Seguridad**

### Variables de Entorno Requeridas
```env
# Configuración JWT
JWT_SECRET=tu_clave_secreta_muy_segura_aqui

# Orígenes permitidos para CORS (separados por coma)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://tudominio.com

# Configuración base de datos
DB_NAME=gmao_db
DB_USER=root
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=3306

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 📊 **Respuestas de Error de Seguridad**

### **401 - No Autorizado**
```json
{
  "success": false,
  "error": "Token inválido",
  "message": "El token proporcionado no es válido"
}
```

### **403 - Acceso Denegado**
```json
{
  "success": false,
  "error": "Acceso denegado",
  "message": "Se requiere uno de los siguientes roles: admin"
}
```

### **429 - Demasiadas Solicitudes**
```json
{
  "success": false,
  "error": "Demasiadas solicitudes",
  "message": "Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.",
  "retryAfter": 900
}
```

### **400 - Error de Validación**
```json
{
  "success": false,
  "error": "Errores de validación",
  "details": [
    {
      "field": "password",
      "message": "La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 símbolo",
      "value": "debilpassword"
    }
  ]
}
```

## 🚀 **Iniciar el Servidor Seguro**

```bash
# Instalar dependencias
npm install

# Crear usuarios de prueba (opcional)
node scripts/createTestUsers.js

# Iniciar servidor
npm start
```

¡Tu API GMAO ahora cuenta con seguridad empresarial completa! 🎉
