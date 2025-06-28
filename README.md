# API de Reservas de Salas de Estudio

API REST desarrollada con Node.js y el módulo HTTP nativo para gestionar reservas de salas de estudio en una biblioteca o centro de coworking.

## 🚀 Características

- ✅ Consultar salas disponibles
- ✅ Realizar reservas de salas
- ✅ Cancelar reservas existentes
- ✅ Consultar reservas activas
- ✅ Validación de capacidad de salas
- ✅ Validación de disponibilidad horaria
- ✅ Persistencia de datos en archivos JSON
- ✅ Manejo de CORS
- ✅ Validación de datos completa

## 📁 Estructura del Proyecto

```
Node_Backend/
├── server.js              # Servidor principal
├── controllers.js         # Controladores de endpoints
├── dataManager.js         # Gestor de datos JSON
├── utils.js              # Utilidades y helpers
├── package.json          # Configuración del proyecto
├── data/
│   ├── rooms.json        # Datos de salas
│   └── reservations.json # Datos de reservas
└── README.md            # Este archivo
```

## 🛠️ Instalación y Uso

### Requisitos
- Node.js 16.0 o superior

### Instalación
```bash
# Clonar o descargar el proyecto
cd Node_Backend

# Instalar dependencias (ninguna externa requerida)
npm install

# Iniciar el servidor
npm start

# O para desarrollo con auto-restart
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## 📡 Endpoints de la API

### 🏢 Salas

#### `GET /api/rooms`
Obtiene todas las salas disponibles.

**Respuesta:**
```json
{
  "success": true,
  "message": "Salas obtenidas exitosamente",
  "data": [
    {
      "id": "sala-001",
      "nombre": "Sala de Estudio A",
      "capacidad": 4
    }
  ]
}
```

#### `GET /api/rooms/:id`
Obtiene información de una sala específica.

**Parámetros:**
- `id`: ID de la sala

#### `GET /api/rooms/:id/reservations`
Obtiene todas las reservas de una sala específica.

### 📅 Reservas

#### `POST /api/reservations`
Crea una nueva reserva.

**Body:**
```json
{
  "roomId": "sala-001",
  "fecha": "2025-06-29",
  "horaInicio": "09:00",
  "horaFin": "11:00",
  "nombreUsuario": "Juan Pérez",
  "numeroPersonas": 3
}
```

**Validaciones:**
- La sala debe existir
- La fecha no puede ser en el pasado
- El número de personas no puede exceder la capacidad
- La sala debe estar disponible en esa franja horaria
- Formato de fecha: `YYYY-MM-DD`
- Formato de hora: `HH:MM`

#### `GET /api/reservations`
Obtiene todas las reservas activas.

#### `DELETE /api/reservations/:id`
Cancela una reserva específica.

**Parámetros:**
- `id`: ID de la reserva a cancelar

## 🗄️ Estructura de Datos

### Salas (rooms.json)
```json
{
  "id": "sala-001",
  "nombre": "Sala de Estudio A", 
  "capacidad": 4
}
```

### Reservas (reservations.json)
```json
{
  "id": "res-1719590400000-abc123def",
  "roomId": "sala-001",
  "nombreSala": "Sala de Estudio A",
  "fecha": "2025-06-29",
  "horaInicio": "09:00",
  "horaFin": "11:00",
  "nombreUsuario": "Juan Pérez",
  "numeroPersonas": 3,
  "fechaCreacion": "2025-06-28T15:00:00.000Z"
}
```

## 🧪 Ejemplos de Uso

### Obtener todas las salas
```bash
curl http://localhost:3000/api/rooms
```

### Crear una reserva
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "sala-001",
    "fecha": "2025-06-29",
    "horaInicio": "09:00",
    "horaFin": "11:00",
    "nombreUsuario": "Juan Pérez",
    "numeroPersonas": 3
  }'
```

### Cancelar una reserva
```bash
curl -X DELETE http://localhost:3000/api/reservations/res-1719590400000-abc123def
```

## ⚠️ Validaciones Implementadas

1. **Capacidad de sala**: No se permite reservar más personas que la capacidad máxima
2. **Disponibilidad horaria**: Una sala no puede tener reservas solapadas
3. **Fechas pasadas**: No se permiten reservas en fechas anteriores a hoy
4. **Formatos**: Validación de formato de fecha (YYYY-MM-DD) y hora (HH:MM)
5. **Campos requeridos**: Todos los campos necesarios deben estar presentes
6. **Horarios lógicos**: La hora de fin debe ser posterior a la de inicio

## 🔧 Tecnologías Utilizadas

- **Node.js**: Entorno de ejecución
- **HTTP módulo nativo**: Servidor web
- **File System (fs)**: Persistencia de datos
- **JSON**: Formato de datos

## 📊 Códigos de Estado HTTP

- `200`: Operación exitosa
- `400`: Datos inválidos o solicitud malformada
- `404`: Recurso no encontrado
- `409`: Conflicto (sala no disponible)
- `500`: Error interno del servidor

## 🎯 Características Adicionales

- **CORS habilitado**: Permite peticiones desde cualquier origen
- **Logging**: Registro de todas las peticiones
- **Documentación integrada**: Disponible en la ruta raíz `/`
- **Cierre graceful**: Manejo correcto de señales del sistema
- **IDs únicos**: Generación automática de IDs para reservas

## 👥 Datos de Ejemplo

El sistema viene con 5 salas predefinidas:
- Sala de Estudio A (4 personas)
- Sala de Estudio B (6 personas)  
- Sala de Conferencias (12 personas)
- Sala Silenciosa (2 personas)
- Sala de Trabajo Grupal (8 personas)