#!/bin/bash
# Script para configurar Apache y certificados SSL para PetSiKness
# Ejecutar como: sudo bash setup-apache.sh

set -e

echo "🚀 Configurando Apache para PetSiKness..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Crear directorio de logs
echo -e "${YELLOW}📁 Creando directorio de logs...${NC}"
mkdir -p /opt/petsikness/logs
chown -R kava:kava /opt/petsikness/logs

# 2. Copiar configuraciones de Apache
echo -e "${YELLOW}📋 Copiando configuraciones de Apache...${NC}"
cp config/apache/petsikness-dev.conf /etc/apache2/sites-available/
cp config/apache/petsikness-prod.conf /etc/apache2/sites-available/

# 3. Habilitar sitios HTTP (para certbot)
echo -e "${YELLOW}🔧 Habilitando sitios HTTP...${NC}"
a2ensite petsikness-dev.conf
a2ensite petsikness-prod.conf

# 4. Verificar configuración de Apache
echo -e "${YELLOW}✅ Verificando configuración de Apache...${NC}"
apache2ctl configtest

# 5. Recargar Apache
echo -e "${YELLOW}🔄 Recargando Apache...${NC}"
systemctl reload apache2

echo ""
echo -e "${GREEN}✅ Configuración HTTP completada!${NC}"
echo ""
echo "📝 Ahora ejecuta los siguientes comandos para obtener certificados SSL:"
echo ""
echo "# Para DEV:"
echo "sudo certbot --apache -d petsiknessdev.sikwow.com"
echo ""
echo "# Para PROD:"
echo "sudo certbot --apache -d petsikness.sikwow.com"
echo ""
echo "Certbot creará automáticamente los archivos *-le-ssl.conf con la configuración HTTPS"
echo ""
echo "Después, edita manualmente los archivos SSL generados para añadir los headers X-Forwarded-*:"
echo "sudo nano /etc/apache2/sites-available/petsikness-dev-le-ssl.conf"
echo "sudo nano /etc/apache2/sites-available/petsikness-prod-le-ssl.conf"
echo ""
echo "Añade estas líneas en la sección <VirtualHost *:443>:"
echo "    RequestHeader set X-Forwarded-Proto \"https\""
echo "    RequestHeader set X-Forwarded-SSL \"on\""
echo "    RequestHeader set X-Forwarded-Host \"[tu-dominio]\""
echo ""
echo "Luego recarga Apache:"
echo "sudo systemctl reload apache2"
