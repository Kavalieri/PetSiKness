#!/bin/bash

# ============================================
# Script: Aplicar Migración SQL a Pet SiKness
# ============================================
#
# USO:
#   ./scripts/apply-migration.sh <archivo_migracion> [dev|prod]
#
# EJEMPLO:
#   ./scripts/apply-migration.sh database/migrations/20251111_114109_create_pet_meal_schedules.sql
#   ./scripts/apply-migration.sh database/migrations/20251111_114109_create_pet_meal_schedules.sql prod
#
# Por defecto aplica a DEV si no se especifica entorno
#
# ============================================

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# Validar argumentos
# ============================================

if [ -z "$1" ]; then
    echo -e "${RED}Error: Debes especificar el archivo de migración${NC}"
    echo "Uso: $0 <archivo_migracion> [dev|prod]"
    echo "Ejemplo: $0 database/migrations/20251111_114109_create_pet_meal_schedules.sql"
    exit 1
fi

MIGRATION_FILE="$1"
ENVIRONMENT="${2:-dev}"  # Default: dev

# Convertir a path absoluto si es relativo
if [[ "$MIGRATION_FILE" != /* ]]; then
    MIGRATION_FILE="$(pwd)/$MIGRATION_FILE"
fi

# Validar que el archivo existe
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}Error: El archivo '$MIGRATION_FILE' no existe${NC}"
    exit 1
fi

# Determinar base de datos según entorno
case "$ENVIRONMENT" in
    dev|development)
        DATABASE="pet_sikness_dev"
        echo -e "${YELLOW}📦 Entorno: DESARROLLO${NC}"
        ;;
    prod|production)
        DATABASE="pet_sikness_prod"
        echo -e "${RED}📦 Entorno: PRODUCCIÓN${NC}"
        echo -e "${RED}⚠️  ¡CUIDADO! Aplicando a PRODUCCIÓN${NC}"
        read -p "¿Continuar? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            echo "Operación cancelada"
            exit 0
        fi
        ;;
    *)
        echo -e "${RED}Error: Entorno inválido '$ENVIRONMENT'${NC}"
        echo "Usa 'dev' o 'prod'"
        exit 1
        ;;
esac

# ============================================
# Extraer nombre de migración del archivo
# ============================================

MIGRATION_NAME=$(basename "$MIGRATION_FILE")
echo -e "${GREEN}📄 Migración: $MIGRATION_NAME${NC}"
echo -e "${GREEN}🗄️  Base de datos: $DATABASE${NC}"
echo ""

# ============================================
# Aplicar migración
# ============================================

echo -e "${YELLOW}Aplicando migración...${NC}"

# Copiar archivo a /tmp para que postgres pueda leerlo
TMP_FILE="/tmp/$MIGRATION_NAME"
cp "$MIGRATION_FILE" "$TMP_FILE"
chmod 644 "$TMP_FILE"

# Conectar como usuario postgres y aplicar migración
sudo -u postgres psql -d "$DATABASE" -f "$TMP_FILE"

RESULT=$?

# Limpiar archivo temporal
rm -f "$TMP_FILE"

# ============================================
# Verificar resultado
# ============================================

if [ $RESULT -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migración aplicada exitosamente${NC}"
    echo ""
    
    # Verificar que se registró en _migrations
    echo -e "${YELLOW}Verificando registro en _migrations...${NC}"
    sudo -u postgres psql -d "$DATABASE" -c "SELECT migration_name, applied_at FROM _migrations WHERE migration_name = '$MIGRATION_NAME' ORDER BY applied_at DESC LIMIT 1;"
    
    echo ""
    echo -e "${GREEN}✅ Migración aplicada correctamente${NC}"
    
    # Detectar si hay cambios de schema que requieren regenerar types
    if grep -qE "(CREATE TABLE|ALTER TABLE|ADD COLUMN|DROP COLUMN)" "$MIGRATION_FILE"; then
        echo ""
        echo -e "${YELLOW}🔄 Detectados cambios de schema, regenerando types TypeScript...${NC}"
        
        # Regenerar types
        if [ "$ENVIRONMENT" = "prod" ] || [ "$ENVIRONMENT" = "production" ]; then
            npm run types:generate:prod
        else
            npm run types:generate:dev
        fi
        
        TYPES_RESULT=$?
        
        if [ $TYPES_RESULT -eq 0 ]; then
            echo -e "${GREEN}✅ Types TypeScript regenerados exitosamente${NC}"
        else
            echo -e "${RED}⚠️  Error al regenerar types (código: $TYPES_RESULT)${NC}"
            echo -e "${YELLOW}Ejecuta manualmente: npm run types:generate:$ENVIRONMENT${NC}"
        fi
    fi
    
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ ¡Todo listo!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Sugerencias de próximos pasos
    echo ""
    echo -e "${YELLOW}📋 Próximos pasos sugeridos:${NC}"
    echo ""
    echo "  1️⃣  Verificar compilación TypeScript:"
    echo "      npm run typecheck"
    echo ""
    echo "  2️⃣  Reiniciar servidor DEV si está corriendo:"
    echo "      Ctrl+Shift+P → 'Tasks: Run Task' → '🔴 DEV: Detener'"
    echo "      Ctrl+Shift+P → 'Tasks: Run Task' → '🟢 DEV: Iniciar'"
    echo ""
    echo "  3️⃣  Verificar cambios en la aplicación:"
    echo "      https://petsiknessdev.sikwow.com"
    echo ""
    echo "  4️⃣  Commit de cambios:"
    echo "      git add ."
    echo "      git commit -m \"feat: add migration - $(basename "$MIGRATION_FILE" .sql)\""
    echo "      git push"
    echo ""
    
    # Si es producción, avisos adicionales
    if [ "$ENVIRONMENT" = "prod" ] || [ "$ENVIRONMENT" = "production" ]; then
        echo -e "${RED}⚠️  PRODUCCIÓN - Acciones adicionales:${NC}"
        echo ""
        echo "  5️⃣  Verificar que PROD funciona correctamente:"
        echo "      https://petsikness.sikwow.com"
        echo ""
        echo "  6️⃣  Monitorear logs de PM2:"
        echo "      pm2 logs petsikness-prod --lines 50"
        echo ""
    fi
else
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ Error al aplicar migración${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${RED}Código de salida: $RESULT${NC}"
    echo ""
    echo -e "${YELLOW}Posibles soluciones:${NC}"
    echo ""
    echo "  • Revisa errores SQL en la salida anterior"
    echo "  • Verifica que la sintaxis SQL sea correcta"
    echo "  • Comprueba que no haya duplicados (migración ya aplicada)"
    echo "  • Consulta: SELECT * FROM _migrations ORDER BY applied_at DESC LIMIT 5;"
    echo ""
    exit 1
fi
