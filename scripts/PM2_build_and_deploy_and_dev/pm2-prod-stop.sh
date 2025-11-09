#!/bin/bash
# Stop Pet SiKness PROD

cd "$(dirname "$0")/../.."

echo "🛑 Deteniendo Pet SiKness PROD..."

pm2 stop petsikness-prod
pm2 save

echo "✅ Pet SiKness PROD detenido"
