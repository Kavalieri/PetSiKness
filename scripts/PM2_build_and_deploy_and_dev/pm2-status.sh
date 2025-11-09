#!/bin/bash

# ============================================
# Pet SiKness - Estado PM2
# ============================================

echo "🐾 Pet SiKness - Estado de Procesos PM2"
echo "========================================"
echo ""

# Estado general PM2
pm2 status | grep -E "(id|petsikness)" || pm2 status

echo ""
echo "📋 Logs Activos:"
echo "----------------"
ls -lh ~/.pm2/logs/ | grep petsikness | grep -v "^d"

echo ""
echo "📦 Logs Archivados:"
echo "-------------------"
if [ -d ~/.pm2/logs/archive ]; then
  ls -lh ~/.pm2/logs/archive/ | grep petsikness | wc -l | xargs echo "Total archivos:"
else
  echo "No hay logs archivados aún"
fi

echo ""
echo "🌐 URLs Disponibles:"
echo "--------------------"
echo "DEV:  http://localhost:3002"
echo "PROD: http://localhost:3003"
