#!/bin/bash
# Start Pet SiKness PROD with PM2

cd "$(dirname "$0")/../.."

echo "🚀 Iniciando Pet SiKness PROD..."

pm2 start ecosystem.config.js --only petsikness-prod
pm2 save

echo "✅ Pet SiKness PROD iniciado"
echo "📊 Estado:"
pm2 status petsikness-prod
