# Tests Unitarios - GMAO API

Este directorio contiene todas las pruebas unitarias para la API GMAO (Gestión de Órdenes de Trabajo).

## Estructura de Directorios

```
tests/
├── setup/
│   └── unitTestSetup.js       # Configuración global para tests
├── mocks/
│   ├── bcrypt.js              # Mock de bcryptjs
│   ├── jwt.js                 # Mock de jsonwebtoken
│   └── sequelize.js           # Mock de Sequelize
├── unit/
│   ├── controllers/           # Tests de controladores
│   │   ├── authController.test.js
│   │   └── workOrderController.test.js
│   ├── models/                # Tests de modelos
│   │   └── User.test.js
│   └── middlewares/           # Tests de middlewares
│       └── auth.test.js
├── utils/
│   └── testHelpers.js         # Utilidades para testing
└── index.test.js              # Suite principal de tests
```

## Configuración

### Variables de Entorno para Testing

Los tests utilizan las siguientes variables de entorno configuradas automáticamente:

- `NODE_ENV=test`
- `JWT_SECRET=test-jwt-secret-key-for-testing`
- `DB_NAME=test_gmao_db`
- `DB_USER=test_user`
- `DB_PASSWORD=test_password`
- `DB_HOST=localhost`
- `DB_PORT=3306`
- `REDIS_URL=redis://localhost:6379`

### Mocks

#### Sequelize Mock
- Mockea la conexión a la base de datos
- Provee mocks para DataTypes y operadores

#### BCrypt Mock
- Mockea las funciones de hash y comparación de contraseñas
- Configurado para retornar valores predecibles en tests

#### JWT Mock
- Mockea las funciones de firma y verificación de tokens
- Configurado para retornar tokens y payloads de prueba

## Comandos de Testing

### Ejecutar todos los tests
```bash
npm test
```

### Ejecutar tests en modo watch
```bash
npm run test:watch
```

### Ejecutar solo tests unitarios
```bash
npm run test:unit
```

### Generar reporte de cobertura
```bash
npm run test:coverage
```

### Ejecutar tests para CI/CD
```bash
npm run test:ci
```

## Tests Implementados

### Controllers

#### AuthController
- ✅ `register()` - Registro de nuevos usuarios
- ✅ `login()` - Autenticación de usuarios
- ✅ `verifyToken()` - Verificación de tokens JWT
- ✅ `getProfile()` - Obtención de perfil de usuario
- ✅ `changePassword()` - Cambio de contraseña
- ✅ `generateToken()` - Generación de tokens JWT

#### WorkOrderController
- ✅ `getAllOrders()` - Obtención de todas las órdenes (con cache)
- ✅ `getOrderById()` - Obtención de orden por ID (con cache)
- ✅ `createOrder()` - Creación de nuevas órdenes
- ✅ `updateOrder()` - Actualización de órdenes
- ✅ `deleteOrder()` - Eliminación de órdenes

### Models

#### User Model
- ✅ `comparePassword()` - Comparación de contraseñas
- ✅ `validatePassword()` - Validación de contraseñas
- ✅ `updateLastLogin()` - Actualización de último login
- ✅ `isAdmin()` - Verificación de rol admin
- ✅ `isTechnician()` - Verificación de rol técnico
- ✅ `canModifyWorkOrders()` - Verificación de permisos
- ✅ `toSafeObject()` - Serialización segura
- ✅ `toJSON()` - Serialización JSON
- ✅ Password hashing hooks

### Middlewares

#### Auth Middleware
- ✅ `authenticateToken()` - Autenticación por token
- ✅ `requireRole()` - Verificación de roles
- ✅ Manejo de errores JWT
- ✅ Validación de usuarios activos
- ✅ Verificación de cambio de contraseña

## Cobertura de Código

Los tests están configurados para mantener una cobertura mínima del 80% en:
- Branches (ramas)
- Functions (funciones)
- Lines (líneas)
- Statements (declaraciones)

## Utilidades de Testing

### testHelpers.js

Proporciona funciones útiles para crear mocks y aserciones:

```javascript
const {
  createMockRequest,
  createMockResponse,
  createMockNext,
  createMockUser,
  createMockWorkOrder,
  expectResponseStatus
} = require('./utils/testHelpers');

// Ejemplo de uso
const req = createMockRequest({ body: { username: 'test' } });
const res = createMockResponse();
const next = createMockNext();

// Ejecutar test
await controller.someMethod(req, res, next);

// Verificar resultado
expectResponseStatus(res, 200, { success: true });
```

## Convenciones de Testing

### Estructura de Tests
```javascript
describe('ComponentName', () => {
  let req, res, next;
  
  beforeEach(() => {
    jest.clearAllMocks();
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
  });
  
  describe('methodName', () => {
    test('should do something successfully', async () => {
      // Arrange
      // Act
      // Assert
    });
    
    test('should handle errors properly', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Nombres de Tests
- Usar descripciones claras y específicas
- Comenzar con "should" para indicar comportamiento esperado
- Incluir casos de éxito y error
- Testear validaciones y casos límite

### Mocks
- Limpiar mocks entre tests con `jest.clearAllMocks()`
- Configurar mocks específicos para cada test
- Verificar que los mocks sean llamados correctamente

## Extensión de Tests

Para agregar nuevos tests:

1. Crear archivo `.test.js` en la carpeta correspondiente
2. Importar dependencias y mocks necesarios
3. Seguir las convenciones de estructura establecidas
4. Actualizar este README si es necesario

## Troubleshooting

### Problemas Comunes

1. **Alias de módulos no funcionan**: Verificar configuración en `unitTestSetup.js`
2. **Mocks no se limpian**: Asegurar que `jest.clearAllMocks()` esté en `beforeEach`
3. **Tests fallan por timeout**: Ajustar `testTimeout` en `jest.config.js`
4. **Errores de importación**: Verificar que los paths de mocks estén correctos
