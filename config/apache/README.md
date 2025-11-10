# Configuración de Apache y SSL para Pet SiKness

Este documento explica cómo configurar Apache con SSL para los dominios de Pet SiKness.

## 🌐 Dominios

- **PROD**: `petsikness.sikwow.com` → Puerto 3003
- **DEV**: `petsiknessdev.sikwow.com` → Puerto 3002

## 📋 Pre-requisitos

- Apache 2.4+ instalado y funcionando
- Certbot instalado (Let's Encrypt)
- Dominios apuntando al servidor

## 🚀 Instalación Paso a Paso

### 1. Crear Directorio de Logs

```bash
sudo mkdir -p /opt/petsikness/logs
sudo chown -R kava:kava /opt/petsikness/logs
```

### 2. Copiar Configuraciones de Apache

```bash
cd /home/kava/workspace/proyectos/PetSiKness/repo

# Copiar configuraciones HTTP
sudo cp config/apache/petsikness-dev.conf /etc/apache2/sites-available/
sudo cp config/apache/petsikness-prod.conf /etc/apache2/sites-available/
```

### 3. Habilitar Sitios HTTP

```bash
sudo a2ensite petsikness-dev.conf
sudo a2ensite petsikness-prod.conf
```

### 4. Verificar y Recargar Apache

```bash
# Verificar configuración
sudo apache2ctl configtest

# Recargar Apache
sudo systemctl reload apache2
```

### 5. Obtener Certificados SSL con Certbot

**Para DEV:**

```bash
sudo certbot --apache -d petsiknessdev.sikwow.com
```

**Para PROD:**

```bash
sudo certbot --apache -d petsikness.sikwow.com
```

Certbot creará automáticamente:

- `/etc/apache2/sites-available/petsikness-dev-le-ssl.conf`
- `/etc/apache2/sites-available/petsikness-prod-le-ssl.conf`

### 6. Añadir Headers para OAuth (CRÍTICO)

Después de que Certbot cree los archivos SSL, edítalos para añadir los headers necesarios para OAuth:

**DEV:**

```bash
sudo nano /etc/apache2/sites-available/petsikness-dev-le-ssl.conf
```

**PROD:**

```bash
sudo nano /etc/apache2/sites-available/petsikness-prod-le-ssl.conf
```

Añade estas líneas **dentro de** `<VirtualHost *:443>`, justo después de los comentarios de logs:

```apache
# Headers críticos para OAuth dinámico (unset primero para evitar duplicados)
RequestHeader unset X-Forwarded-Proto
RequestHeader unset X-Forwarded-SSL
RequestHeader unset X-Forwarded-Host
RequestHeader set X-Forwarded-Proto "https"
RequestHeader set X-Forwarded-SSL "on"
RequestHeader set X-Forwarded-Host "petsiknessdev.sikwow.com"  # o petsikness.sikwow.com para PROD
```

**⚠️ Importante**: El `unset` previo es crítico para evitar headers duplicados cuando Apache está configurado con `ProxyPreserveHost On`.

### 7. Verificar y Recargar Apache (Final)

```bash
# Verificar configuración
sudo apache2ctl configtest

# Recargar Apache
sudo systemctl reload apache2
```

## ✅ Verificación

### 1. Verificar Certificados SSL

```bash
# DEV
curl -I https://petsiknessdev.sikwow.com

# PROD
curl -I https://petsikness.sikwow.com
```

Deberías ver `HTTP/2 200` y sin errores de certificado.

### 2. Verificar Headers

```bash
# DEV
curl -I https://petsiknessdev.sikwow.com | grep -i forwarded

# PROD
curl -I https://petsikness.sikwow.com | grep -i forwarded
```

### 3. Probar OAuth

1. Acceder a https://petsiknessdev.sikwow.com
2. Click en "Comenzar ahora"
3. Click en "Continuar con Google"
4. El flujo OAuth debería funcionar correctamente

## 🔧 Troubleshooting

### Error: "redirect_uri_mismatch" en Google OAuth

**Causa**: Los headers X-Forwarded-\* no están configurados correctamente.

**Solución**: Verifica que los archivos `*-le-ssl.conf` tengan los headers configurados (paso 6).

### Error: Certificado SSL inválido

**Causa**: Certbot no pudo obtener el certificado o el dominio no apunta al servidor.

**Solución**:

```bash
# Verificar que el dominio resuelve correctamente
nslookup petsiknessdev.sikwow.com

# Intentar renovar certificado
sudo certbot renew --dry-run
```

### Error: "Connection refused" al acceder

**Causa**: El servidor Next.js no está corriendo o está en el puerto incorrecto.

**Solución**:

```bash
# Verificar estado de PM2
pm2 status

# Iniciar DEV si no está corriendo
cd /home/kava/workspace/proyectos/PetSiKness/repo
./scripts/PM2_build_and_deploy_and_dev/pm2-dev-start.sh
```

## 📝 Configuración de Google OAuth Console

Asegúrate de que estos URIs estén autorizados en Google Cloud Console:

**Authorized redirect URIs:**

- `https://petsiknessdev.sikwow.com/api/auth/callback/google`
- `https://petsikness.sikwow.com/api/auth/callback/google`

**Authorized JavaScript origins:**

- `https://petsiknessdev.sikwow.com`
- `https://petsikness.sikwow.com`

## 🔄 Renovación Automática de Certificados

Los certificados se renuevan automáticamente vía cron de Certbot:

```bash
# Verificar timer de renovación
sudo systemctl status certbot.timer

# Probar renovación (dry-run)
sudo certbot renew --dry-run
```

## 📚 Referencias

- [Let's Encrypt](https://letsencrypt.org/)
- [Certbot Documentation](https://certbot.eff.org/)
- [Apache mod_proxy](https://httpd.apache.org/docs/2.4/mod/mod_proxy.html)
- [NextAuth.js](https://next-auth.js.org/)
