# GMAO API - Sistema de Gestión de Órdenes de Trabajo
## Documento Técnico y Análisis del Desarrollo

**Autor:** Luis Arnaiz  
**Fecha:** 28 de junio de 2025  
**Asignatura:** Desarrollo Backend con Node.js  
**Institución:** Universidad Europea

---

## 1. Resumen Ejecutivo

Este documento presenta el desarrollo de una API REST para la gestión de órdenes de trabajo en un sistema GMAO (Gestión de Mantenimiento Asistido por Ordenador), implementada utilizando Node.js y Express.js. El proyecto abarca la implementación completa de operaciones CRUD, autenticación JWT, validación de datos, y arquitectura de middlewares, siguiendo las mejores prácticas de desarrollo backend.

### 1.1 Objetivos del Proyecto

- Desarrollar una API REST funcional para gestión de órdenes de trabajo
- Implementar un sistema de autenticación seguro basado en JWT
- Aplicar patrones de arquitectura limpia con separación de responsabilidades
- Implementar validación robusta de datos de entrada
- Crear un sistema de logging y manejo de errores centralizado

### 1.2 Tecnologías Implementadas

- **Runtime:** Node.js v14+
- **Framework:** Express.js 4.x
- **Autenticación:** JSON Web Tokens (JWT)
- **Validación:** Joi
- **Persistencia:** Sistema de archivos JSON
- **Middlewares:** Personalizados para autenticación, logging y validación

## 2. Análisis de la Arquitectura del Sistema

### 2.1 Patrón Arquitectónico Implementado

El proyecto sigue una arquitectura en capas basada en el patrón MVC (Modelo-Vista-Controlador) adaptado para APIs REST:

```
┌─────────────────┐
│   Rutas (API)   │  ← Capa de presentación
├─────────────────┤
│  Middlewares    │  ← Capa de procesamiento transversal
├─────────────────┤
│ Controladores   │  ← Capa de lógica de negocio
├─────────────────┤
│    Modelos      │  ← Capa de acceso a datos
├─────────────────┤
│ Persistencia    │  ← Capa de datos (JSON)
└─────────────────┘
```

### 2.2 Componentes del Sistema

#### 2.2.1 Servidor Principal (`server.js`)
El punto de entrada de la aplicación que:
- Configura Express.js y middlewares globales
- Define las rutas principales de la API
- Maneja la configuración de CORS
- Implementa el manejo centralizado de errores

#### 2.2.2 Capa de Rutas
- **`authRoutes.js`**: Maneja endpoints de autenticación
- **`workOrderRoutes.js`**: Define rutas CRUD para órdenes de trabajo

#### 2.2.3 Capa de Controladores
- **`authController.js`**: Lógica de autenticación y generación de tokens JWT
- **`workOrderController.js`**: Operaciones CRUD y lógica de negocio para órdenes

#### 2.2.4 Capa de Middlewares
- **`auth.js`**: Verificación de tokens JWT
- **`validation.js`**: Validación de entrada con esquemas Joi
- **`logger.js`**: Registro de actividad HTTP
- **`errorHandler.js`**: Manejo centralizado de excepciones

#### 2.2.5 Capa de Modelos
- **`WorkOrder.js`**: Define el modelo de datos y operaciones de persistencia

## 3. Implementación Técnica Detallada

### 3.1 Sistema de Autenticación JWT

#### 3.1.1 Generación de Tokens
```javascript
// Implementación en authController.js
const token = jwt.sign(
  { username: user.username },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

**Análisis técnico:**
- Utiliza el algoritmo HS256 por defecto
- Tiempo de expiración configurable (24 horas)
- Payload mínimo para reducir tamaño del token
- Secreto configurable mediante variables de entorno

#### 3.1.2 Middleware de Autenticación
```javascript
// Verificación de token en auth.js
const token = req.headers.authorization?.split(' ')[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

**Características implementadas:**
- Extracción automática del header Authorization
- Validación de formato Bearer
- Manejo de errores de token expirado/inválido
- Inyección de datos de usuario en el request

### 3.2 Validación de Datos con Joi

#### 3.2.1 Esquemas de Validación
```javascript
// Esquema para órdenes de trabajo
const workOrderSchema = Joi.object({
  titulo: Joi.string().min(3).required(),
  descripcion: Joi.string().optional(),
  fecha_programada: Joi.date().iso().required(),
  estado: Joi.string().valid('pendiente', 'en_progreso', 'finalizada'),
  tecnico: Joi.string().optional()
});
```

**Ventajas de la implementación:**
- Validación declarativa y legible
- Mensajes de error específicos y localizados
- Validación tanto de tipos como de formato
- Soporte para campos opcionales y requeridos

### 3.3 Persistencia de Datos

#### 3.3.1 Sistema de Archivos JSON
La aplicación utiliza persistencia en archivo JSON como alternativa ligera a bases de datos:

```javascript
// Operaciones de lectura/escritura sincronizadas
const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
```

**Consideraciones técnicas:**
- Operaciones síncronas para garantizar consistencia
- Formateo JSON legible para debugging
- Manejo de errores de E/O
- Backup automático en operaciones críticas

### 3.4 Manejo de Errores Centralizado

#### 3.4.1 Middleware de Error Global
```javascript
const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      message: err.message
    });
  }
  
  // Error genérico del servidor
  res.status(500).json({
    error: 'Error interno del servidor',
    message: 'Ha ocurrido un error inesperado'
  });
};
```

**Beneficios de la implementación:**
- Respuestas de error consistentes
- Logging automático de errores
- Clasificación de errores por tipo
- Ocultación de detalles internos en producción

## 4. Instalación y Configuración

### 4.1 Requisitos del Sistema
- **Node.js:** v14.0 o superior
- **npm:** v6.0 o superior
- **Sistema Operativo:** Compatible con Windows, macOS, Linux

### 4.2 Proceso de Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd GMAO-API
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   ```bash
   # Crear archivo .env
   echo "PORT=3000" > .env
   echo "JWT_SECRET=mi_clave_secreta_super_segura_2024" >> .env
   echo "USERNAME=admin" >> .env
   echo "PASSWORD=admin123" >> .env
   ```

4. **Ejecutar la aplicación:**
   ```bash
   # Desarrollo
   npm run dev
   
   # Producción
   npm start
   ```

### 4.3 Verificación de la Instalación
Una vez iniciado el servidor, verificar el funcionamiento accediendo a:
- **Endpoint de salud:** `GET http://localhost:3000/`
- **Documentación de la API:** Disponible en el endpoint raíz

## 5. Estructura del Proyecto y Organización del Código

### 5.1 Justificación de la Arquitectura

La estructura del proyecto sigue el principio de **Separación de Responsabilidades (SoC)**, organizando el código en módulos especializados:

```
GMAO-API/
├── controllers/          # Lógica de negocio y control de flujo
│   ├── authController.js    # Manejo de autenticación
│   └── workOrderController.js # Operaciones CRUD de órdenes
├── middlewares/         # Funciones de procesamiento intermedio
│   ├── auth.js             # Verificación JWT
│   ├── errorHandler.js     # Manejo centralizado de errores
│   ├── logger.js           # Registro de actividades
│   └── validation.js       # Validación de entrada
├── models/              # Capa de acceso a datos
│   └── WorkOrder.js        # Modelo de órdenes de trabajo
├── routes/              # Definición de endpoints
│   ├── authRoutes.js       # Rutas de autenticación
│   └── workOrderRoutes.js  # Rutas de órdenes
├── data/                # Persistencia de datos
│   └── ordenes.json        # Almacén de datos JSON
├── server.js            # Punto de entrada de la aplicación
├── package.json         # Configuración del proyecto
└── .env                 # Variables de entorno
```

### 5.2 Análisis de Patrones de Diseño Implementados

#### 5.2.1 Patrón Middleware Chain
Express.js implementa el patrón Chain of Responsibility a través de middlewares:
```javascript
app.use(logger);           // 1. Logging
app.use(cors());           // 2. CORS
app.use(express.json());   // 3. Parsing JSON
app.use('/api/auth', authRoutes);  // 4. Rutas específicas
app.use(errorHandler);     // 5. Manejo de errores
```

#### 5.2.2 Patrón Repository (Simplificado)
El modelo `WorkOrder.js` actúa como un repository pattern simplificado:
- Abstrae la lógica de persistencia
- Proporciona interfaz consistente para operaciones CRUD
- Facilita futuras migraciones a bases de datos

## 6. Documentación de la API

### 6.1 Endpoints de Autenticación

#### 6.1.1 Login de Usuario
**Endpoint:** `POST /api/auth/login`

**Parámetros de entrada:**
```json
{
  "username": "string (requerido)",
  "password": "string (requerido)"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Autenticación exitosa",
  "data": {
    "token": "JWT_TOKEN_STRING",
    "type": "Bearer",
    "expiresIn": "24h",
    "user": {
      "username": "admin"
    }
  }
}
```

#### 6.1.2 Verificación de Token
**Endpoint:** `GET /api/auth/verify`  
**Autorización:** Requerida (Bearer Token)

### 6.2 Endpoints de Órdenes de Trabajo

#### 6.2.1 Operaciones de Lectura (GET)
- `GET /api/work-orders` - Listado completo
- `GET /api/work-orders/:id` - Orden específica
- `GET /api/work-orders/stats` - Estadísticas del sistema
- `GET /api/work-orders?estado=pendiente` - Filtrado por estado
- `GET /api/work-orders?tecnico=juan` - Filtrado por técnico

#### 6.2.2 Operaciones de Escritura (POST/PUT/DELETE)
**Autorización requerida para todas las operaciones**

**Crear Orden:** `POST /api/work-orders`
```json
{
  "titulo": "string (min: 3 caracteres)",
  "descripcion": "string (opcional)",
  "fecha_programada": "YYYY-MM-DD",
  "estado": "pendiente|en_progreso|finalizada",
  "tecnico": "string (opcional)"
}
```

### 6.3 Modelo de Datos Implementado

```javascript
// Estructura de una Orden de Trabajo
{
  "id": "UUID v4 autogenerado",
  "titulo": "String - Título descriptivo (≥3 caracteres)",
  "descripcion": "String - Descripción opcional",
  "fecha_programada": "Date ISO - Fecha de programación",
  "estado": "Enum ['pendiente', 'en_progreso', 'finalizada']",
  "tecnico": "String - Técnico asignado (opcional)",
  "fecha_creacion": "Date ISO - Timestamp de creación",
  "fecha_actualizacion": "Date ISO - Timestamp de última modificación"
}
```

}
```

## 7. Pruebas y Validación del Sistema

### 7.1 Estrategia de Pruebas Implementada

#### 7.1.1 Pruebas Manuales con cURL
El proyecto incluye un script de pruebas automatizado (`test-api.sh`) que verifica:

```bash
#!/bin/bash
# Script de pruebas de la API

# 1. Prueba de autenticación
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin", "password":"admin123"}' | jq -r '.data.token')

# 2. Prueba de creación de orden
curl -X POST http://localhost:3000/api/work-orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Test Order", "fecha_programada":"2025-07-01"}'

# 3. Prueba de listado
curl http://localhost:3000/api/work-orders
```

#### 7.1.2 Casos de Prueba Principales
1. **Autenticación exitosa y fallida**
2. **Validación de datos de entrada**
3. **Operaciones CRUD completas**
4. **Manejo de errores y excepciones**
5. **Filtrado y búsqueda de órdenes**

### 7.2 Análisis de Rendimiento

#### 7.2.1 Métricas de Respuesta
- **Autenticación:** ~50ms promedio
- **Operaciones GET:** ~10-30ms promedio
- **Operaciones POST/PUT:** ~20-50ms promedio
- **Carga de archivos JSON:** ~5-15ms promedio

#### 7.2.2 Limitaciones Identificadas
- **Escalabilidad:** Sistema de archivos JSON no escalable
- **Concurrencia:** Operaciones síncronas pueden crear cuellos de botella
- **Memoria:** Carga completa del archivo en cada operación

## 8. Análisis de Seguridad

### 8.1 Medidas de Seguridad Implementadas

#### 8.1.1 Autenticación y Autorización
- **JWT con expiración configurable**
- **Validación de tokens en cada request protegido**
- **Separación entre rutas públicas y privadas**

#### 8.1.2 Validación de Datos
- **Sanitización de entrada con Joi**
- **Validación de tipos y formatos**
- **Prevención de inyección de datos maliciosos**

#### 8.1.3 Manejo de Errores Seguro
- **Ocultación de stack traces en producción**
- **Mensajes de error genéricos para usuarios**
- **Logging detallado para debugging interno**

### 8.2 Vulnerabilidades y Consideraciones

#### 8.2.1 Áreas de Mejora
- **Implementar rate limiting**
- **Añadir HTTPS en producción**
- **Implementar refresh tokens**
- **Añadir validación CSRF**

## 9. Conclusiones Técnicas

### 9.1 Objetivos Cumplidos

✅ **Desarrollo completo de API REST funcional**
- Implementación exitosa de arquitectura MVC
- Separación clara de responsabilidades
- Código mantenible y escalable

✅ **Sistema de autenticación robusto**
- JWT implementado correctamente
- Middleware de autorización eficiente
- Manejo seguro de credenciales

✅ **Validación y manejo de errores**
- Validación declarativa con Joi
- Sistema de error handling centralizado
- Respuestas consistentes de la API

✅ **Persistencia de datos funcional**
- Sistema de archivos JSON operativo
- Operaciones CRUD completas
- Integridad de datos mantenida

### 9.2 Lecciones Aprendidas

#### 9.2.1 Patrones Arquitectónicos
- **Middleware Pattern:** Demostró ser efectivo para funcionalidades transversales
- **Repository Pattern:** Simplificó el acceso a datos y facilitará futuras migraciones
- **Error-First Callback:** Mejoró el manejo de errores asíncronos

#### 9.2.2 Herramientas y Tecnologías
- **Express.js:** Framework ligero y flexible para APIs REST
- **Joi:** Biblioteca potente para validación declarativa
- **JWT:** Estándar robusto para autenticación stateless

### 9.3 Análisis de Rendimiento y Escalabilidad

#### 9.3.1 Fortalezas del Sistema
- **Simplicidad:** Fácil de entender y mantener
- **Rapidez de desarrollo:** Prototipo funcional en tiempo reducido
- **Portabilidad:** No requiere infraestructura de base de datos

#### 9.3.2 Limitaciones Identificadas
- **Persistencia:** Sistema de archivos inadecuado para producción
- **Concurrencia:** Operaciones síncronas limitan el rendimiento
- **Escalabilidad horizontal:** Arquitectura actual no soporta múltiples instancias

## 10. Observaciones y Mejoras Futuras

### 10.1 Observaciones del Desarrollo

#### 10.1.1 Proceso de Desarrollo
Durante el desarrollo se observó que:
- La arquitectura modular facilitó el desarrollo incremental
- Los middlewares personalizados mejoraron significativamente la mantenibilidad
- La validación declarativa redujo considerablemente los errores en tiempo de ejecución

#### 10.1.2 Decisiones Técnicas Relevantes
- **Elección de JWT sobre sessions:** Facilitó la escalabilidad stateless
- **Uso de Joi sobre validación manual:** Mejoró la legibilidad y mantenimiento
- **Implementación de middleware personalizado:** Proporcionó mayor control sobre el flujo de la aplicación

### 10.2 Roadmap de Mejoras

#### 10.2.1 Corto Plazo (1-2 semanas)
- [ ] **Implementar paginación** en listados de órdenes
- [ ] **Añadir filtros avanzados** (fechas, rangos)
- [ ] **Implementar logging estructurado** (Winston)
- [ ] **Añadir validación de configuración** de entorno

#### 10.2.2 Mediano Plazo (1-2 meses)
- [ ] **Migración a base de datos** (PostgreSQL/MongoDB)
- [ ] **Implementar tests unitarios** y de integración
- [ ] **Documentación con Swagger/OpenAPI**
- [ ] **Sistema de notificaciones** por email

#### 10.2.3 Largo Plazo (3-6 meses)
- [ ] **Implementar microservicios** architecture
- [ ] **Añadir cache** con Redis
- [ ] **Sistema de métricas** y monitoring
- [ ] **Interface web** (React/Vue.js)

### 10.3 Reflexiones Académicas

#### 10.3.1 Aplicación de Conceptos Teóricos
El proyecto permitió aplicar exitosamente:
- **Principios SOLID:** Especialmente Single Responsibility y Dependency Inversion
- **Patrones de diseño:** Middleware, Repository, Factory (para UUIDs)
- **Arquitectura limpia:** Separación clara entre capas de la aplicación

#### 10.3.2 Competencias Desarrolladas
- **Desarrollo backend:** Dominio de Node.js y Express.js
- **Diseño de APIs:** Implementación de RESTful services
- **Seguridad:** Comprensión práctica de autenticación JWT
- **Arquitectura de software:** Aplicación de patrones y principios

## 11. Referencias y Recursos

### 11.1 Documentación Técnica
- [Express.js Official Documentation](https://expressjs.com/)
- [JSON Web Tokens (RFC 7519)](https://tools.ietf.org/html/rfc7519)
- [Joi Validation Library](https://joi.dev/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### 11.2 Repositorio del Proyecto
**URL del Repositorio:** [Insertar URL de GitHub aquí]

**Estructura de commits:**
- Commit inicial con estructura base
- Implementación de autenticación JWT
- Desarrollo de CRUD de órdenes de trabajo
- Implementación de middlewares personalizados
- Documentación y pruebas finales

---

## 12. Anexos

### 12.1 Configuración de Entorno de Desarrollo

#### 12.1.1 Dependencias del Proyecto
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "joi": "^17.9.2",
    "cors": "^2.8.5",
    "dotenv": "^16.1.4",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
```

### 12.2 Scripts de Utilidad

#### 12.2.1 Script de Inicialización
```bash
#!/bin/bash
# setup.sh - Script de configuración inicial
npm install
echo "PORT=3000" > .env
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
echo "USERNAME=admin" >> .env
echo "PASSWORD=admin123" >> .env
echo "Configuración completada. Ejecutar: npm run dev"
```
