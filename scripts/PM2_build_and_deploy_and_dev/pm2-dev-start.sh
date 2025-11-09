#!/bin/bash

# ============================================
# Pet SiKness - DEV: Iniciar con archivado de logs
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$HOME/.pm2/logs"
ARCHIVE_DIR="$LOG_DIR/archive"

echo "🐾 Pet SiKness - Iniciando servidor de desarrollo..."

# Crear directorio de archivo si no existe
mkdir -p "$ARCHIVE_DIR"

# Archivar logs existentes con timestamp
if [ -f "$LOG_DIR/petsikness-dev-out.log" ]; then
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  mv "$LOG_DIR/petsikness-dev-out.log" "$ARCHIVE_DIR/petsikness-dev-out_${TIMESTAMP}.log"
  echo "📦 Logs archivados: petsikness-dev-out_${TIMESTAMP}.log"
fi

if [ -f "$LOG_DIR/petsikness-dev-error.log" ]; then
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  mv "$LOG_DIR/petsikness-dev-error.log" "$ARCHIVE_DIR/petsikness-dev-error_${TIMESTAMP}.log"
  echo "📦 Logs archivados: petsikness-dev-error_${TIMESTAMP}.log"
fi

# Verificar si ya está ejecutándose
if pm2 describe petsikness-dev > /dev/null 2>&1; then
  echo "⚠️  El proceso petsikness-dev ya está ejecutándose"
  pm2 describe petsikness-dev
  exit 1
fi

cd "$PROJECT_ROOT"

# Cargar variables de entorno
if [ -f .env.development.local ]; then
  set -a
  source .env.development.local
  set +a
  echo "✅ Variables de entorno cargadas desde .env.development.local"
fi

# Iniciar con PM2
pm2 start ecosystem.config.js --only petsikness-dev

# Verificar que inició correctamente
sleep 2
if pm2 describe petsikness-dev | grep -q "online"; then
  echo ""
  echo "✅ Pet SiKness DEV iniciado exitosamente"
  echo "🌐 Acceder a: http://localhost:3002"
  echo ""
  pm2 describe petsikness-dev
else
  echo ""
  echo "❌ Error al iniciar Pet SiKness DEV"
  pm2 logs petsikness-dev --lines 50 --nostream
  exit 1
fi
