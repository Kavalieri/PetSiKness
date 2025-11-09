# 🗄️ Database - Pet SiKness

**PostgreSQL 15+ nativo** con sistema de roles simplificado para proyecto nuevo.

---

## 📚 Quick Reference

- **Sistema completo**: Ver `AGENTS.md` en este directorio
- **Instrucciones principales**: `../AGENTS.md`
- **Baseline actual**: `migrations/20251109_000000_baseline_v1.0.0.sql`

---

## 🎯 Arquitectura de Roles

### Roles del Sistema

**`postgres`** (Superusuario PostgreSQL)
- **Tipo**: Sistema PostgreSQL
- **Propósito**: Administración global del servidor
- **Uso**: Crear/eliminar bases de datos, aplicar migraciones
- **Acceso**: `sudo -u postgres psql` (autenticación peer)

**`pet_user`** ⭐ (Rol de Aplicación)
- **Tipo**: `LOGIN`
- **Password**: `SiKPets2025Segur0`
- **Privilegios**: Mínimos necesarios (NO superuser, NO createdb, NO createrole)
- **Función**: Ejecutar consultas desde Next.js
- **Permisos**: `SELECT, INSERT, UPDATE, DELETE` en tablas, `USAGE, SELECT` en secuencias

**`pet_owner`** (Rol NOLOGIN - Owner de Objetos)
- **Tipo**: `NOLOGIN` (no puede conectar directamente)
- **Propósito**: Propietario único de TODOS los objetos de BD
- **Privilegios**: Owner de todas las tablas, secuencias, vistas
- **Uso**: Solo para DDL (migraciones)

---

## 🚀 Setup Inicial

### 1. Requisitos Previos

```bash
# PostgreSQL 15+ instalado
sudo apt install postgresql postgresql-contrib

# Node.js 18+ para scripts
node --version
```

### 2. Crear Roles Base (una sola vez)

```bash
# Conectar como postgres
sudo -u postgres psql

-- Crear rol owner (NOLOGIN)
CREATE ROLE pet_owner NOLOGIN;

-- Crear rol de aplicación (LOGIN)
CREATE ROLE pet_user LOGIN PASSWORD 'SiKPets2025Segur0';

-- Salir
\q
```

### 3. Crear Bases de Datos

```bash
# DEV
sudo -u postgres createdb --owner=pet_owner pet_sikness_dev

# PROD
sudo -u postgres createdb --owner=pet_owner pet_sikness_prod
```

### 4. Aplicar Baseline

```bash
# DEV
sudo -u postgres psql -d pet_sikness_dev -f database/migrations/20251109_000000_baseline_v1.0.0.sql

# PROD (con backup previo)
sudo -u postgres pg_dump pet_sikness_prod > ~/backups/prod_$(date +%Y%m%d_%H%M%S).sql
sudo -u postgres psql -d pet_sikness_prod -f database/migrations/20251109_000000_baseline_v1.0.0.sql
```

### 5. Configurar Variables de Entorno

```bash
# .env.development.local
DATABASE_URL="postgresql://pet_user:SiKPets2025Segur0@localhost:5432/pet_sikness_dev"

# .env.production.local
DATABASE_URL="postgresql://pet_user:SiKPets2025Segur0@localhost:5432/pet_sikness_prod"
```

### 6. Verificar Instalación

```bash
# Conectar a DEV
psql -h 127.0.0.1 -U pet_user -d pet_sikness_dev

# Ver tablas
\dt

# Verificar ownership
SELECT tablename, tableowner FROM pg_tables WHERE schemaname='public' LIMIT 5;
-- Todas deben ser: pet_owner

# Salir
\q
```

---

## 📦 Schema Actual (v1.0.0)

### Tablas (7)

| Tabla | Descripción | Columnas Principales |
|-------|-------------|---------------------|
| **profiles** | Usuarios del sistema (OAuth) | id, auth_id, email, display_name, avatar_url |
| **households** | Familias de mascotas | id, name, created_by |
| **household_members** | Membresía en hogares | household_id, profile_id, role |
| **pets** | Perfiles de mascotas | id, name, species, breed, daily_food_goal_grams |
| **foods** | Catálogo de alimentos | id, name, brand, calories_per_100g, protein_pct |
| **feedings** | Registros de alimentación | id, pet_id, food_id, amount_eaten_grams, feeding_date |
| **_migrations** | Control de migraciones | id, migration_name, applied_at |

### Vistas (1)

| Vista | Descripción | Campos Calculados |
|-------|-------------|-------------------|
| **daily_feeding_summary** | Resumen diario por mascota | total_served, total_eaten, goal_achievement_pct, status |

---

## 📊 Modelo de Datos

### Diagrama de Relaciones

```
profiles
  └─┬─ created_by → households
    └─┬─ household_id → household_members ─┬─ profile_id → profiles
      └─┬─ household_id → pets             |
        │  └─┬─ pet_id → feedings          |
        └─┬─ household_id → foods           |
          └── food_id → feedings ───────────┘
```

### Entidades Principales

#### **1. profiles** (Usuarios)

```sql
id              UUID PRIMARY KEY
auth_id         TEXT UNIQUE NOT NULL        -- NextAuth ID
email           TEXT UNIQUE NOT NULL
display_name    TEXT
avatar_url      TEXT
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ (trigger auto-update)
```

**Relaciones**:
- 1:N con `households` (puede crear múltiples hogares)
- N:M con `households` vía `household_members` (puede ser miembro de múltiples hogares)

#### **2. households** (Hogares/Familias)

```sql
id              UUID PRIMARY KEY
name            TEXT NOT NULL               -- "Familia García", "Casa Martínez"
created_by      UUID → profiles(id)
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ (trigger auto-update)
```

**Relaciones**:
- N:1 con `profiles` (creado por un usuario)
- N:M con `profiles` vía `household_members` (varios miembros)
- 1:N con `pets` (múltiples mascotas)
- 1:N con `foods` (catálogo propio)

#### **3. household_members** (Membresía)

```sql
household_id    UUID → households(id)
profile_id      UUID → profiles(id)
role            TEXT ('owner' | 'member')
joined_at       TIMESTAMPTZ

PRIMARY KEY (household_id, profile_id)
```

**Roles**:
- `owner`: Puede invitar, eliminar miembros, borrar hogar
- `member`: Solo puede ver y editar datos

#### **4. pets** (Mascotas)

```sql
-- Identificación
id              UUID PRIMARY KEY
household_id    UUID → households(id)
name            TEXT NOT NULL
species         TEXT NOT NULL               -- "cat", "dog", "bird"
breed           TEXT
birth_date      DATE
gender          TEXT ('male' | 'female' | 'unknown')

-- Físico
weight_kg       DECIMAL(5,2)
body_condition  TEXT ('underweight' | 'ideal' | 'overweight' | 'obese')

-- Objetivos nutricionales ⭐
daily_food_goal_grams    INTEGER NOT NULL  -- Meta diaria en gramos
daily_meals_target       INTEGER DEFAULT 2  -- Comidas recomendadas/día

-- Salud
health_notes    TEXT
allergies       TEXT[]                      -- Array de alergias
medications     TEXT[]                      -- Array de medicamentos

-- Comportamiento
appetite        TEXT ('poor' | 'normal' | 'good' | 'excellent')
activity_level  TEXT ('sedentary' | 'low' | 'moderate' | 'high' | 'very_high')

created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ (trigger auto-update)
```

**Relaciones**:
- N:1 con `households`
- 1:N con `feedings` (múltiples registros de alimentación)

#### **5. foods** (Alimentos)

```sql
-- Identificación
id              UUID PRIMARY KEY
household_id    UUID → households(id)
name            TEXT NOT NULL               -- "Royal Canin Kitten"
brand           TEXT                        -- "Royal Canin"
food_type       TEXT ('dry' | 'wet' | 'raw' | 'homemade' | 'treats')

-- Información nutricional (por 100g) ⭐
calories_per_100g       INTEGER
protein_percentage      DECIMAL(5,2)        -- % proteína
fat_percentage          DECIMAL(5,2)        -- % grasa
carbs_percentage        DECIMAL(5,2)        -- % carbohidratos
fiber_percentage        DECIMAL(5,2)        -- % fibra
moisture_percentage     DECIMAL(5,2)        -- % humedad

-- Producto
ingredients     TEXT
serving_size_grams      INTEGER             -- Tamaño porción recomendada
package_size_grams      INTEGER             -- Tamaño del paquete
price_per_package       DECIMAL(10,2)

-- Calidad
palatability    TEXT ('poor' | 'fair' | 'good' | 'excellent')
digestibility   TEXT ('poor' | 'fair' | 'good' | 'excellent')

-- Restricciones
suitable_for_species    TEXT[]              -- ["cat", "dog"]
age_range       TEXT                        -- "kitten", "adult", "senior"

created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ (trigger auto-update)
```

**Relaciones**:
- N:1 con `households` (catálogo por hogar)
- 1:N con `feedings` (usado en múltiples comidas)

#### **6. feedings** (Registros de Alimentación)

```sql
-- Identificación
id              UUID PRIMARY KEY
household_id    UUID → households(id)
pet_id          UUID → pets(id)
food_id         UUID → foods(id)

-- Cuándo ⏰
feeding_date    DATE NOT NULL
feeding_time    TIME
meal_number     INTEGER                     -- 1, 2, 3... (comida del día)

-- Cantidades (gramos) ⭐
amount_served_grams     INTEGER NOT NULL    -- Lo que se sirvió
amount_eaten_grams      INTEGER NOT NULL    -- Lo que comió
amount_leftover_grams   INTEGER GENERATED   -- Calculado: served - eaten

-- Comportamiento
appetite_rating TEXT ('refused' | 'poor' | 'normal' | 'good' | 'excellent')
eating_speed    TEXT ('very_slow' | 'slow' | 'normal' | 'fast' | 'very_fast')

-- Resultados digestivos
vomited         BOOLEAN DEFAULT FALSE
had_diarrhea    BOOLEAN DEFAULT FALSE
had_stool       BOOLEAN
stool_quality   TEXT ('liquid' | 'soft' | 'normal' | 'hard')

notes           TEXT
created_at      TIMESTAMPTZ
```

**Relaciones**:
- N:1 con `households`
- N:1 con `pets` (múltiples registros por mascota)
- N:1 con `foods` (múltiples usos del mismo alimento)

**Columna Calculada**:
```sql
amount_leftover_grams INTEGER GENERATED ALWAYS AS 
  (amount_served_grams - amount_eaten_grams) STORED
```

#### **7. _migrations** (Control de Migraciones)

```sql
id              SERIAL PRIMARY KEY
migration_name  VARCHAR(255) UNIQUE NOT NULL
applied_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
```

---

### Vista: daily_feeding_summary

Agrega todos los registros de alimentación por mascota y fecha.

```sql
CREATE VIEW daily_feeding_summary AS
SELECT 
  f.pet_id,
  p.name as pet_name,
  f.feeding_date,
  
  -- Totales del día
  SUM(f.amount_served_grams) as total_served_grams,
  SUM(f.amount_eaten_grams) as total_eaten_grams,
  SUM(f.amount_leftover_grams) as total_leftover_grams,
  
  -- Meta y logro
  p.daily_food_goal_grams,
  ROUND((SUM(f.amount_eaten_grams)::DECIMAL / p.daily_food_goal_grams) * 100, 2) 
    as goal_achievement_pct,
  
  -- Indicadores booleanos
  CASE
    WHEN SUM(f.amount_eaten_grams) < p.daily_food_goal_grams * 0.9 
      THEN TRUE ELSE FALSE
  END as under_target,
  
  CASE
    WHEN SUM(f.amount_eaten_grams) BETWEEN p.daily_food_goal_grams * 0.9 
      AND p.daily_food_goal_grams * 1.1 
      THEN TRUE ELSE FALSE
  END as met_target,
  
  CASE
    WHEN SUM(f.amount_eaten_grams) > p.daily_food_goal_grams * 1.1 
      THEN TRUE ELSE FALSE
  END as over_target
  
FROM feedings f
JOIN pets p ON p.id = f.pet_id
GROUP BY f.pet_id, p.name, f.feeding_date, p.daily_food_goal_grams;
```

**Uso**:

```sql
-- Balance del día de hoy para todas las mascotas del hogar
SELECT * FROM daily_feeding_summary 
WHERE feeding_date = CURRENT_DATE
  AND pet_id IN (SELECT id FROM pets WHERE household_id = $1);

-- Historial de últimos 7 días para una mascota
SELECT * FROM daily_feeding_summary
WHERE pet_id = $1
  AND feeding_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY feeding_date DESC;

-- Días donde no se cumplió la meta
SELECT * FROM daily_feeding_summary
WHERE pet_id = $1 AND under_target = TRUE
ORDER BY feeding_date DESC;
```

---

## 🔄 Sistema de Migraciones

### Crear Nueva Migración

```bash
# 1. Crear archivo con timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "database/migrations/${TIMESTAMP}_descripcion.sql"

# 2. Editar con template
cat > "database/migrations/${TIMESTAMP}_add_microchip_column.sql" << 'EOF'
-- ============================================
-- Descripción: Añadir columna microchip_number a pets
-- Fecha: 2025-11-09
-- Autor: Pet SiKness Team
-- ============================================

BEGIN;

-- Cambios de schema
ALTER TABLE pets ADD COLUMN IF NOT EXISTS microchip_number TEXT;

-- Registrar migración
INSERT INTO _migrations (migration_name) 
VALUES ('20251109_143000_add_microchip_column.sql');

COMMIT;
EOF
```

### Aplicar Migración

**DEV**:

```bash
# Aplicar
sudo -u postgres psql -d pet_sikness_dev \
  -f database/migrations/20251109_143000_add_microchip_column.sql

# Regenerar types
npm run types:generate:dev

# Verificar compilación
npm run typecheck
```

**PROD** (con backup obligatorio):

```bash
# Backup
sudo -u postgres pg_dump pet_sikness_prod > ~/backups/prod_$(date +%Y%m%d_%H%M%S).sql

# Aplicar
sudo -u postgres psql -d pet_sikness_prod \
  -f database/migrations/20251109_143000_add_microchip_column.sql

# Regenerar types
npm run types:generate:prod

# Verificar
npm run typecheck
```

### Ver Estado de Migraciones

```sql
-- Ver migraciones aplicadas
SELECT id, migration_name, applied_at 
FROM _migrations 
ORDER BY applied_at DESC;

-- Contar migraciones
SELECT COUNT(*) as total_migrations FROM _migrations;
```

---

## 🔐 Seguridad y Permisos

### Default Privileges Configurados

Los objetos nuevos creados por `pet_owner` automáticamente otorgan permisos a `pet_user`:

```sql
ALTER DEFAULT PRIVILEGES FOR ROLE pet_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO pet_user;

ALTER DEFAULT PRIVILEGES FOR ROLE pet_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO pet_user;
```

### Verificar Permisos

```sql
-- Permisos de tablas
SELECT table_name, grantee, privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'pet_user' AND table_schema = 'public'
ORDER BY table_name;

-- Ownership
SELECT tablename, tableowner
FROM pg_tables
WHERE schemaname = 'public';
-- Todas deben ser: pet_owner
```

---

## 🔧 Comandos Útiles

### Conectarse a Bases de Datos

```bash
# DEV
psql -h 127.0.0.1 -U pet_user -d pet_sikness_dev

# PROD
psql -h 127.0.0.1 -U pet_user -d pet_sikness_prod

# Admin (como postgres)
sudo -u postgres psql
```

### Queries de Diagnóstico

```sql
-- Tamaño de tablas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_live_tup AS rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Relaciones (Foreign Keys)
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
```

### Backup y Restore

```bash
# Backup completo
sudo -u postgres pg_dump pet_sikness_dev > backup.sql

# Backup solo schema
sudo -u postgres pg_dump -s pet_sikness_dev > schema_only.sql

# Backup solo datos
sudo -u postgres pg_dump -a pet_sikness_dev > data_only.sql

# Restore
sudo -u postgres psql -d pet_sikness_dev < backup.sql
```

---

## ⚠️ Troubleshooting

### Error: "permission denied for table X"

```sql
-- Verificar ownership
SELECT tablename, tableowner FROM pg_tables WHERE tablename = 'X';

-- Verificar permisos
SELECT privilege_type FROM information_schema.table_privileges
WHERE table_name = 'X' AND grantee = 'pet_user';

-- Aplicar si falta
GRANT SELECT, INSERT, UPDATE, DELETE ON X TO pet_user;
```

### Error: "relation does not exist"

```bash
# Verificar conexión a BD correcta
psql -h 127.0.0.1 -U pet_user -d pet_sikness_dev -c "\dt"

# Ver definición de tabla
sudo -u postgres psql -d pet_sikness_dev -c "\d+ nombre_tabla"
```

---

## 📊 Estado Actual del Sistema

**Versión Baseline**: v1.0.0 (9 Noviembre 2025)
**Ownership**: Unificado bajo `pet_owner`
**PostgreSQL**: 15.14
**Tablas**: 7
**Vistas**: 1
**Triggers**: 5 (updated_at automation)

---

**Última actualización:** 9 Noviembre 2025 - Setup inicial
**Versión:** 1.0.0
