#!/bin/bash

# ============================================
# Script: Reiniciar DEV con limpieza de logs
# ============================================
#
# Reinicia el servidor DEV de Pet SiKness limpiando logs de PM2
#
# USO:
#   ./scripts/PM2_build_and_deploy_and_dev/pm2-dev-restart-clean.sh
#
# ============================================

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROCESS_NAME="petsikness-dev"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🔄 Reinicio Limpio - Pet SiKness DEV${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ============================================
# 1. Detener proceso
# ============================================

echo -e "${YELLOW}1️⃣  Deteniendo proceso '$PROCESS_NAME'...${NC}"

if pm2 describe "$PROCESS_NAME" > /dev/null 2>&1; then
    pm2 stop "$PROCESS_NAME" --silent
    echo -e "${GREEN}   ✓ Proceso detenido${NC}"
else
    echo -e "${YELLOW}   ⚠ Proceso no está corriendo${NC}"
fi

echo ""

# ============================================
# 2. Limpiar logs
# ============================================

echo -e "${YELLOW}2️⃣  Limpiando logs de PM2...${NC}"

pm2 flush "$PROCESS_NAME" 2>/dev/null || pm2 flush

echo -e "${GREEN}   ✓ Logs limpiados${NC}"
echo ""

# ============================================
# 3. Iniciar proceso
# ============================================

echo -e "${YELLOW}3️⃣  Iniciando proceso '$PROCESS_NAME'...${NC}"

pm2 start "$PROCESS_NAME" --silent

echo -e "${GREEN}   ✓ Proceso iniciado${NC}"
echo ""

# ============================================
# 4. Verificar estado
# ============================================

echo -e "${YELLOW}4️⃣  Verificando estado...${NC}"
echo ""

pm2 describe "$PROCESS_NAME" | grep -E "status|uptime|restarts|memory|cpu"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Reinicio completado exitosamente${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📋 Comandos útiles:${NC}"
echo -e "   ${GREEN}pm2 logs $PROCESS_NAME${NC}         - Ver logs en tiempo real"
echo -e "   ${GREEN}pm2 monit${NC}                    - Monitor interactivo"
echo -e "   ${GREEN}pm2 describe $PROCESS_NAME${NC}     - Ver detalles del proceso"
echo ""
