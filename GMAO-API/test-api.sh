#!/bin/bash

# Script para probar todas las rutas de la API GMAO
# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Variables globales
API_URL="http://localhost:3000"
ADMIN_TOKEN=""
USER_TOKEN=""
WORK_ORDER_ID=""

# Función para mostrar encabezados
print_header() {
    echo -e "\n${BLUE}============================================${NC}"
    echo -e "${BLUE} $1 ${NC}"
    echo -e "${BLUE}============================================${NC}\n"
}

# Función para mostrar resultados
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Función para hacer requests con logs
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers=$4
    local description=$5
    
    echo -e "${YELLOW}🔍 Probando: $description${NC}"
    echo -e "${PURPLE}$method $API_URL$endpoint${NC}"
    
    if [ -n "$data" ]; then
        echo -e "${PURPLE}Data: $data${NC}"
    fi
    
    if [ -n "$headers" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "$headers" \
                -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
                -H "$headers")
        fi
    else
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint")
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    echo -e "${PURPLE}HTTP Code: $http_code${NC}"
    echo -e "${PURPLE}Response:${NC}"
    echo "$body" | jq . 2>/dev/null || echo "$body"
    
    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
        print_result 0 "$description"
        return 0
    else
        print_result 1 "$description"
        return 1
    fi
}

# Función para extraer token de respuesta
extract_token() {
    echo "$1" | jq -r '.data.token' 2>/dev/null || echo ""
}

# Función para extraer ID de respuesta
extract_id() {
    echo "$1" | jq -r '.data.id' 2>/dev/null || echo ""
}

print_header "🚀 INICIANDO PRUEBAS DE LA API GMAO"

echo -e "${BLUE}Verificando que jq esté instalado...${NC}"
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq no está instalado. Instalando...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install jq
    else
        sudo apt-get install jq -y
    fi
fi

# 1. PROBAR ENDPOINT PRINCIPAL
print_header "🏠 1. ENDPOINT PRINCIPAL"
make_request "GET" "/" "" "" "Endpoint principal de la API"

# 2. PRUEBAS DE AUTENTICACIÓN
print_header "🔐 2. PRUEBAS DE AUTENTICACIÓN"

# 2.1 Registro de usuario administrador
admin_data='{"username":"test_admin_api","email":"admin.api@test.com","password":"AdminAPI123!","role":"admin"}'
response=$(make_request "POST" "/api/auth/register" "$admin_data" "" "Registro de usuario administrador")
if [ $? -eq 0 ]; then
    ADMIN_TOKEN=$(extract_token "$(curl -s -X POST "$API_URL/api/auth/register" -H "Content-Type: application/json" -d "$admin_data")")
fi

# 2.2 Registro de usuario normal
user_data='{"username":"test_user_api","email":"user.api@test.com","password":"UserAPI123!","role":"technician"}'
response=$(make_request "POST" "/api/auth/register" "$user_data" "" "Registro de usuario técnico")
if [ $? -eq 0 ]; then
    USER_TOKEN=$(extract_token "$(curl -s -X POST "$API_URL/api/auth/register" -H "Content-Type: application/json" -d "$user_data")")
fi

# 2.3 Login con usuario administrador
admin_login='{"username":"test_admin_api","password":"AdminAPI123!"}'
response=$(curl -s -X POST "$API_URL/api/auth/login" -H "Content-Type: application/json" -d "$admin_login")
make_request "POST" "/api/auth/login" "$admin_login" "" "Login de usuario administrador"
if [ $? -eq 0 ]; then
    ADMIN_TOKEN=$(extract_token "$response")
    echo -e "${GREEN}🔑 Token de admin obtenido: ${ADMIN_TOKEN:0:50}...${NC}"
fi

# 2.4 Login con usuario técnico
user_login='{"username":"test_user_api","password":"UserAPI123!"}'
response=$(curl -s -X POST "$API_URL/api/auth/login" -H "Content-Type: application/json" -d "$user_login")
make_request "POST" "/api/auth/login" "$user_login" "" "Login de usuario técnico"
if [ $? -eq 0 ]; then
    USER_TOKEN=$(extract_token "$response")
    echo -e "${GREEN}🔑 Token de usuario obtenido: ${USER_TOKEN:0:50}...${NC}"
fi

# 2.5 Verificar token
if [ -n "$ADMIN_TOKEN" ]; then
    make_request "GET" "/api/auth/verify" "" "Authorization: Bearer $ADMIN_TOKEN" "Verificación de token"
fi

# 2.6 Obtener perfil
if [ -n "$ADMIN_TOKEN" ]; then
    make_request "GET" "/api/auth/profile" "" "Authorization: Bearer $ADMIN_TOKEN" "Obtener perfil de usuario"
fi

# 2.7 Cambiar contraseña
if [ -n "$USER_TOKEN" ]; then
    change_pass_data='{"currentPassword":"UserAPI123!","newPassword":"NewUserAPI123!"}'
    make_request "POST" "/api/auth/change-password" "$change_pass_data" "Authorization: Bearer $USER_TOKEN" "Cambiar contraseña"
fi

# 2.8 Probar login con nueva contraseña
new_user_login='{"username":"test_user_api","password":"NewUserAPI123!"}'
make_request "POST" "/api/auth/login" "$new_user_login" "" "Login con nueva contraseña"

# 3. PRUEBAS SIN AUTENTICACIÓN (deben fallar)
print_header "🚫 3. PRUEBAS SIN AUTENTICACIÓN"
make_request "GET" "/api/auth/profile" "" "" "Acceso a perfil sin token (debe fallar)"
make_request "GET" "/api/work-orders" "" "" "Acceso a órdenes sin token (debe fallar)"

# 4. PRUEBAS DE ÓRDENES DE TRABAJO
print_header "📋 4. PRUEBAS DE ÓRDENES DE TRABAJO"

if [ -n "$ADMIN_TOKEN" ]; then
    # 4.1 Crear orden de trabajo
    work_order_data='{
        "title": "Test - Mantenimiento API",
        "description": "Orden de trabajo creada por script de prueba automática",
        "priority": "alta",
        "assignedTo": "test_user_api",
        "estimatedHours": 3.5,
        "dueDate": "2025-07-15T10:00:00Z",
        "equipmentId": "TEST-001",
        "location": "Laboratorio de Pruebas",
        "cost": 150.00
    }'
    
    response=$(curl -s -X POST "$API_URL/api/work-orders" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "$work_order_data")
    
    make_request "POST" "/api/work-orders" "$work_order_data" "Authorization: Bearer $ADMIN_TOKEN" "Crear orden de trabajo"
    
    if [ $? -eq 0 ]; then
        WORK_ORDER_ID=$(extract_id "$response")
        echo -e "${GREEN}📝 ID de orden creada: $WORK_ORDER_ID${NC}"
    fi
    
    # 4.2 Obtener todas las órdenes
    make_request "GET" "/api/work-orders" "" "Authorization: Bearer $ADMIN_TOKEN" "Obtener todas las órdenes de trabajo"
    
    # 4.3 Obtener orden específica
    if [ -n "$WORK_ORDER_ID" ]; then
        make_request "GET" "/api/work-orders/$WORK_ORDER_ID" "" "Authorization: Bearer $ADMIN_TOKEN" "Obtener orden específica"
    fi
    
    # 4.4 Actualizar orden de trabajo
    if [ -n "$WORK_ORDER_ID" ]; then
        update_data='{"status":"in_progress","notes":"Iniciando mantenimiento programado"}'
        make_request "PUT" "/api/work-orders/$WORK_ORDER_ID" "$update_data" "Authorization: Bearer $ADMIN_TOKEN" "Actualizar orden de trabajo"
    fi
    
    # 4.5 Obtener estadísticas
    make_request "GET" "/api/work-orders/stats" "" "Authorization: Bearer $ADMIN_TOKEN" "Obtener estadísticas de órdenes"
    
    # 4.6 Buscar órdenes por filtros
    make_request "GET" "/api/work-orders?status=in_progress" "" "Authorization: Bearer $ADMIN_TOKEN" "Buscar órdenes por estado"
    make_request "GET" "/api/work-orders?priority=alta" "" "Authorization: Bearer $ADMIN_TOKEN" "Buscar órdenes por prioridad"
    
    # 4.7 Completar orden de trabajo
    if [ -n "$WORK_ORDER_ID" ]; then
        complete_data='{"status":"completed","completedAt":"2025-07-07T19:00:00Z","actualHours":3.0,"completionNotes":"Mantenimiento completado exitosamente"}'
        make_request "PUT" "/api/work-orders/$WORK_ORDER_ID" "$complete_data" "Authorization: Bearer $ADMIN_TOKEN" "Completar orden de trabajo"
    fi
    
    # 4.8 Eliminar orden de trabajo
    if [ -n "$WORK_ORDER_ID" ]; then
        make_request "DELETE" "/api/work-orders/$WORK_ORDER_ID" "" "Authorization: Bearer $ADMIN_TOKEN" "Eliminar orden de trabajo"
    fi
fi

# 5. PRUEBAS DE PERMISOS
print_header "🔒 5. PRUEBAS DE PERMISOS"

if [ -n "$USER_TOKEN" ]; then
    # Usuario técnico intentando crear orden (puede o no estar permitido según tu configuración)
    work_order_data_user='{
        "title": "Test - Orden por Técnico",
        "description": "Intento de crear orden como técnico",
        "priority": "media",
        "estimatedHours": 2.0
    }'
    make_request "POST" "/api/work-orders" "$work_order_data_user" "Authorization: Bearer $USER_TOKEN" "Técnico intentando crear orden"
fi

# 6. PRUEBAS DE RATE LIMITING
print_header "⚡ 6. PRUEBAS DE RATE LIMITING"

echo -e "${YELLOW}🔄 Probando rate limiting con múltiples requests...${NC}"
for i in {1..6}; do
    echo -e "${PURPLE}Intento $i/6${NC}"
    invalid_login='{"username":"invalid_user","password":"invalid_pass"}'
    make_request "POST" "/api/auth/login" "$invalid_login" "" "Rate limiting test $i"
    sleep 1
done

# 7. PRUEBAS DE VALIDACIÓN
print_header "✅ 7. PRUEBAS DE VALIDACIÓN"

# 7.1 Registro con datos inválidos
invalid_user='{"username":"","email":"invalid-email","password":"123"}'
make_request "POST" "/api/auth/register" "$invalid_user" "" "Registro con datos inválidos (debe fallar)"

# 7.2 Orden con datos inválidos
if [ -n "$ADMIN_TOKEN" ]; then
    invalid_order='{"title":"","priority":"invalid_priority"}'
    make_request "POST" "/api/work-orders" "$invalid_order" "Authorization: Bearer $ADMIN_TOKEN" "Orden con datos inválidos (debe fallar)"
fi

# 8. PRUEBAS DE ENDPOINTS NO EXISTENTES
print_header "🚫 8. PRUEBAS DE ENDPOINTS NO EXISTENTES"
make_request "GET" "/api/nonexistent" "" "" "Endpoint no existente (debe fallar)"
make_request "GET" "/api/work-orders/999999" "" "Authorization: Bearer $ADMIN_TOKEN" "Orden no existente (debe fallar)"

# 9. RESUMEN FINAL
print_header "📊 9. RESUMEN DE PRUEBAS"

echo -e "${BLUE}🎯 Pruebas completadas para:${NC}"
echo -e "   • Endpoint principal"
echo -e "   • Autenticación (registro, login, perfil)"
echo -e "   • Órdenes de trabajo (CRUD completo)"
echo -e "   • Permisos y autorización"
echo -e "   • Rate limiting"
echo -e "   • Validación de datos"
echo -e "   • Manejo de errores"

echo -e "\n${GREEN}✅ Script de pruebas completado${NC}"
echo -e "${BLUE}📝 Revisa los resultados arriba para identificar cualquier problema${NC}"

# 10. INFORMACIÓN ÚTIL
print_header "📋 10. INFORMACIÓN PARA DEBUGGING"

echo -e "${YELLOW}🔧 Para debugging adicional:${NC}"
echo -e "   • Ver logs: docker-compose logs -f gmao-api"
echo -e "   • Estado contenedores: docker-compose ps"
echo -e "   • Reiniciar API: docker-compose restart gmao-api"
echo -e "   • Admin Token: ${ADMIN_TOKEN:0:50}..."
echo -e "   • User Token: ${USER_TOKEN:0:50}..."

echo -e "\n${PURPLE}🚀 ¡API GMAO probada exitosamente!${NC}"
