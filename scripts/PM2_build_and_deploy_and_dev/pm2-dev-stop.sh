#!/bin/bash

# ============================================
# Pet SiKness - DEV: Detener
# ============================================

set -e

echo "🐾 Pet SiKness - Deteniendo servidor de desarrollo..."

# Verificar si está ejecutándose
if ! pm2 describe petsikness-dev > /dev/null 2>&1; then
  echo "⚠️  El proceso petsikness-dev no está ejecutándose"
  exit 0
fi

# Mostrar estado actual
echo "Estado actual:"
pm2 describe petsikness-dev

# Detener y eliminar
pm2 delete petsikness-dev

echo ""
echo "✅ Pet SiKness DEV detenido correctamente"
