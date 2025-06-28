# Ejemplos de Peticiones HTTP

Este archivo contiene ejemplos de todas las peticiones que puedes hacer a la API.

## 🏢 SALAS

### Obtener todas las salas
```bash
curl -X GET http://localhost:3000/api/rooms
```

### Obtener una sala específica
```bash
curl -X GET http://localhost:3000/api/rooms/sala-001
```

### Obtener reservas de una sala específica
```bash
curl -X GET http://localhost:3000/api/rooms/sala-001/reservations
```

## 📅 RESERVAS

### Crear una nueva reserva
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

### Crear otra reserva (diferente horario)
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "sala-002",
    "fecha": "2025-06-29",
    "horaInicio": "14:00",
    "horaFin": "16:00",
    "nombreUsuario": "María García",
    "numeroPersonas": 5
  }'
```

### Obtener todas las reservas
```bash
curl -X GET http://localhost:3000/api/reservations
```

### Cancelar una reserva (reemplaza con ID real)
```bash
curl -X DELETE http://localhost:3000/api/reservations/res-1719590400000-abc123def
```

## 🧪 CASOS DE PRUEBA

### Error: Sala inexistente
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "sala-999",
    "fecha": "2025-06-29",
    "horaInicio": "09:00",
    "horaFin": "11:00",
    "nombreUsuario": "Test User",
    "numeroPersonas": 2
  }'
```

### Error: Exceder capacidad
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "sala-004",
    "fecha": "2025-06-29",
    "horaInicio": "09:00",
    "horaFin": "11:00",
    "nombreUsuario": "Test User",
    "numeroPersonas": 5
  }'
```

### Error: Fecha en el pasado
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "sala-001",
    "fecha": "2024-01-01",
    "horaInicio": "09:00",
    "horaFin": "11:00",
    "nombreUsuario": "Test User",
    "numeroPersonas": 2
  }'
```

### Error: Formato de fecha inválido
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "sala-001",
    "fecha": "29/06/2025",
    "horaInicio": "09:00",
    "horaFin": "11:00",
    "nombreUsuario": "Test User",
    "numeroPersonas": 2
  }'
```

### Error: Horario solapado (ejecuta después de crear la primera reserva)
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "sala-001",
    "fecha": "2025-06-29",
    "horaInicio": "10:00",
    "horaFin": "12:00",
    "nombreUsuario": "Otro Usuario",
    "numeroPersonas": 2
  }'
```

## 📋 SECUENCIA DE PRUEBAS COMPLETA

Ejecuta estos comandos en orden para probar todas las funcionalidades:

```bash
# 1. Ver todas las salas
echo "=== SALAS DISPONIBLES ==="
curl -X GET http://localhost:3000/api/rooms
echo -e "\n\n"

# 2. Ver reservas actuales (debería estar vacío)
echo "=== RESERVAS ACTUALES ==="
curl -X GET http://localhost:3000/api/reservations
echo -e "\n\n"

# 3. Crear primera reserva
echo "=== CREANDO PRIMERA RESERVA ==="
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
echo -e "\n\n"

# 4. Crear segunda reserva
echo "=== CREANDO SEGUNDA RESERVA ==="
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "sala-002",
    "fecha": "2025-06-29",
    "horaInicio": "14:00",
    "horaFin": "16:00",
    "nombreUsuario": "María García",
    "numeroPersonas": 4
  }'
echo -e "\n\n"

# 5. Ver todas las reservas
echo "=== RESERVAS DESPUÉS DE CREAR ==="
curl -X GET http://localhost:3000/api/reservations
echo -e "\n\n"

# 6. Ver reservas de sala específica
echo "=== RESERVAS DE SALA-001 ==="
curl -X GET http://localhost:3000/api/rooms/sala-001/reservations
echo -e "\n\n"

# 7. Intentar crear reserva conflictiva (debería fallar)
echo "=== INTENTANDO RESERVA CONFLICTIVA ==="
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "sala-001",
    "fecha": "2025-06-29",
    "horaInicio": "10:00",
    "horaFin": "12:00",
    "nombreUsuario": "Usuario Conflicto",
    "numeroPersonas": 2
  }'
echo -e "\n\n"
```

## 🌐 PRUEBAS CON NAVEGADOR

También puedes probar la API desde el navegador:

1. Ve a `http://localhost:3000` para ver la documentación
2. Ve a `http://localhost:3000/api/rooms` para ver las salas
3. Ve a `http://localhost:3000/api/reservations` para ver las reservas

Para probar POST y DELETE, necesitarás usar herramientas como:
- **Postman**
- **Insomnia** 
- **Thunder Client** (extensión de VS Code)
- **curl** en terminal
