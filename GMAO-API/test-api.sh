#!/bin/bash

# ===========================================
# GMAO API - Comandos de Prueba
# ===========================================

echo "🚀 Iniciando pruebas de la API GMAO..."

# Variables
BASE_URL="http://localhost:3000"
USERNAME="admin"
PASSWORD="admin123"

echo
echo "📋 1. Información de la API"
curl -s $BASE_URL | jq '.'

echo
echo "🔐 2. Obteniendo token de autenticación..."
TOKEN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}")

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.data.token')
echo "Token obtenido: ${TOKEN:0:50}..."

echo
echo "📊 3. Estadísticas iniciales"
curl -s $BASE_URL/api/work-orders/stats | jq '.'

echo
echo "➕ 4. Creando primera orden de trabajo..."
ORDER1=$(curl -s -X POST $BASE_URL/api/work-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "titulo": "Mantenimiento preventivo bomba A1",
    "descripcion": "Revisión mensual de la bomba principal del edificio A",
    "fecha_programada": "2024-07-15",
    "estado": "pendiente",
    "tecnico": "Juan Pérez"
  }')

ORDER1_ID=$(echo $ORDER1 | jq -r '.data.id')
echo "Primera orden creada con ID: $ORDER1_ID"

echo
echo "➕ 5. Creando segunda orden de trabajo..."
ORDER2=$(curl -s -X POST $BASE_URL/api/work-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "titulo": "Reparar filtro de aire acondicionado",
    "descripcion": "El filtro del AC de la sala de servidores necesita reemplazo",
    "fecha_programada": "2024-07-10",
    "estado": "en_progreso",
    "tecnico": "María González"
  }')

ORDER2_ID=$(echo $ORDER2 | jq -r '.data.id')
echo "Segunda orden creada con ID: $ORDER2_ID"

echo
echo "📋 6. Listando todas las órdenes"
curl -s $BASE_URL/api/work-orders | jq '.'

echo
echo "🔍 7. Filtrando por estado 'pendiente'"
curl -s "$BASE_URL/api/work-orders?estado=pendiente" | jq '.'

echo
echo "👨‍🔧 8. Filtrando por técnico 'Juan'"
curl -s "$BASE_URL/api/work-orders?tecnico=Juan" | jq '.'

echo
echo "📈 9. Estadísticas actualizadas"
curl -s $BASE_URL/api/work-orders/stats | jq '.'

echo
echo "✏️ 10. Actualizando primera orden"
curl -s -X PUT $BASE_URL/api/work-orders/$ORDER1_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "estado": "en_progreso",
    "descripcion": "Revisión mensual iniciada - checkeando niveles de aceite"
  }' | jq '.'

echo
echo "🔁 11. Obteniendo orden específica"
curl -s $BASE_URL/api/work-orders/$ORDER1_ID | jq '.'

echo
echo "❌ 12. Prueba de validación (título muy corto)"
curl -s -X POST $BASE_URL/api/work-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "titulo": "AB"
  }' | jq '.'

echo
echo "🚫 13. Prueba sin autenticación"
curl -s -X POST $BASE_URL/api/work-orders \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Orden sin token",
    "fecha_programada": "2024-07-20"
  }' | jq '.'

echo
echo "✅ ¡Pruebas completadas!"
echo "📊 Estadísticas finales:"
curl -s $BASE_URL/api/work-orders/stats | jq '.'
