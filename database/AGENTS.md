# Database - Instrucciones Específicas

> **Contexto**: Parte de Pet SiKness (ver `/AGENTS.md` principal)
> **Área**: PostgreSQL Local + Migraciones

---

## 🗄️ **USUARIOS Y PERMISOS POSTGRESQL - CRÍTICO**

### **⚠️ IMPORTANTE: 3 Usuarios Diferentes con Roles Distintos**

**Este proyecto usa PostgreSQL DIRECTO, NO Supabase Cloud**

#### **1. `postgres` (Superusuario PostgreSQL)**

- **Rol**: Administración del servidor PostgreSQL
- **Permisos**: TODOS (CREATE DATABASE, DROP DATABASE, ALTER, etc.)
- **Uso**:
  - Crear/eliminar bases de datos
  - Aplicar migraciones (cambios de estructura)
  - Configuración global
  - Administración de usuarios
- **Cómo usarlo**:

  ```bash
  # Sin contraseña (autenticación peer de Linux)
  sudo -u postgres psql
  sudo -u postgres psql -d pet_sikness_dev

  # Desde scripts de migración
  sudo -u postgres psql -d pet_sikness_dev -f migration.sql
  ```

#### **2. `pet_user` ⭐ (Usuario de Aplicación - PRINCIPAL)**

- **Rol**: `LOGIN` con mínimos privilegios (NO superuser, NO createdb, NO createrole, NO DDL)
- **Password**: `SiKPets2025Segur0`
- **Permisos**:
  - `SELECT, INSERT, UPDATE, DELETE` en tablas
  - `USAGE, SELECT` en secuencias
- **Uso**:
  - Aplicación Next.js (DATABASE_URL en .env)
  - Queries desde código TypeScript
  - Consultas manuales para debugging
  - **NO para aplicar migraciones** (usar `postgres` + `pet_owner`)
- **Configuración**:

  ```bash
  # .env.development.local
  DATABASE_URL="postgresql://pet_user:SiKPets2025Segur0@localhost:5432/pet_sikness_dev"

  # .env.production.local
  DATABASE_URL="postgresql://pet_user:SiKPets2025Segur0@localhost:5432/pet_sikness_prod"
  ```

- **Cómo usarlo**:

  ```bash
  # Consulta manual con ~/.pgpass configurado (sin password)
  psql -h 127.0.0.1 -U pet_user -d pet_sikness_dev

  # O desde sudo postgres
  sudo -u postgres psql -U pet_user -d pet_sikness_dev
  ```

#### **3. `pet_owner` (Rol NOLOGIN para DDL)**

- **Rol**: Owner de todos los objetos de base de datos
- **Tipo**: `NOLOGIN` (no puede conectar directamente)
- **Permisos**: Owner de todas las tablas, secuencias, vistas, funciones
- **Uso**: Solo para DDL (migraciones, funciones SECURITY DEFINER)
- **Cómo usarlo**:

  ```bash
  # Conectarse como postgres
  sudo -u postgres psql -d pet_sikness_dev

  # Dentro de psql, cambiar a pet_owner
  SET ROLE pet_owner;

  # Ejecutar DDL
  CREATE TABLE nueva_tabla (...);
  ALTER TABLE pets ADD COLUMN ...;

  # Volver a postgres
  RESET ROLE;
  ```

---

## 🗄️ **BASES DE DATOS**

### Entornos

**`pet_sikness_dev`** (Development)

- **Puerto**: 5432
- **Owner**: `pet_owner`
- **Aplicación**: Next.js desarrollo (puerto 3002)
- **Acceso**: `postgresql://pet_user:SiKPets2025Segur0@localhost:5432/pet_sikness_dev`

**`pet_sikness_prod`** (Production)

- **Puerto**: 5432
- **Owner**: `pet_owner`
- **Aplicación**: Next.js producción (puerto 3003)
- **Acceso**: `postgresql://pet_user:SiKPets2025Segur0@localhost:5432/pet_sikness_prod`

---

## 📦 **SCHEMA ACTUAL**

### Tablas (7)

#### **1. profiles**

Usuarios del sistema (OAuth)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### **2. households**

Familias de mascotas

```sql
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### **3. household_members**

Membresía en hogares

```sql
CREATE TABLE household_members (
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (household_id, profile_id)
);
```

#### **4. pets**

Perfiles de mascotas

```sql
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'unknown')),

  -- Información física
  weight_kg DECIMAL(5,2),
  body_condition TEXT CHECK (body_condition IN ('underweight', 'ideal', 'overweight', 'obese')),

  -- Objetivos nutricionales
  daily_food_goal_grams INTEGER NOT NULL,
  daily_meals_target INTEGER DEFAULT 2,

  -- Salud
  health_notes TEXT,
  allergies TEXT[],
  medications TEXT[],

  -- Comportamiento
  appetite TEXT CHECK (appetite IN ('poor', 'normal', 'good', 'excellent')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'low', 'moderate', 'high', 'very_high')),

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### **5. foods**

Catálogo de alimentos

```sql
CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  food_type TEXT NOT NULL CHECK (food_type IN ('dry', 'wet', 'raw', 'homemade', 'treats')),

  -- Información nutricional (por 100g)
  calories_per_100g INTEGER,
  protein_percentage DECIMAL(5,2),
  fat_percentage DECIMAL(5,2),
  carbs_percentage DECIMAL(5,2),
  fiber_percentage DECIMAL(5,2),
  moisture_percentage DECIMAL(5,2),

  -- Información del producto
  ingredients TEXT,
  serving_size_grams INTEGER,
  package_size_grams INTEGER,
  price_per_package DECIMAL(10,2),

  -- Calidad
  palatability TEXT CHECK (palatability IN ('poor', 'fair', 'good', 'excellent')),
  digestibility TEXT CHECK (digestibility IN ('poor', 'fair', 'good', 'excellent')),

  -- Restricciones
  suitable_for_species TEXT[],
  age_range TEXT,

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### **6. feedings**

Registros de alimentación

```sql
CREATE TABLE feedings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE RESTRICT,

  -- Cuándo
  feeding_date DATE NOT NULL,
  feeding_time TIME,
  meal_number INTEGER,

  -- Cantidades
  amount_served_grams INTEGER NOT NULL,
  amount_eaten_grams INTEGER NOT NULL,
  amount_leftover_grams INTEGER GENERATED ALWAYS AS (amount_served_grams - amount_eaten_grams) STORED,

  -- Comportamiento
  appetite_rating TEXT CHECK (appetite_rating IN ('refused', 'poor', 'normal', 'good', 'excellent')),
  eating_speed TEXT CHECK (eating_speed IN ('very_slow', 'slow', 'normal', 'fast', 'very_fast')),

  -- Resultados digestivos
  vomited BOOLEAN DEFAULT FALSE,
  had_diarrhea BOOLEAN DEFAULT FALSE,
  had_stool BOOLEAN,
  stool_quality TEXT CHECK (stool_quality IN ('liquid', 'soft', 'normal', 'hard')),

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### **7. \_migrations**

Control de migraciones

```sql
CREATE TABLE _migrations (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### Vistas (1)

#### **daily_feeding_summary**

Resumen agregado de alimentación diaria

```sql
CREATE VIEW daily_feeding_summary AS
SELECT
  f.pet_id,
  f.feeding_date,
  SUM(f.amount_served_grams) as total_served,
  SUM(f.amount_eaten_grams) as total_eaten,
  SUM(f.amount_leftover_grams) as total_leftover,
  p.daily_food_goal_grams,
  ROUND((SUM(f.amount_eaten_grams)::DECIMAL / p.daily_food_goal_grams) * 100, 2) as goal_achievement_pct,
  CASE
    WHEN SUM(f.amount_eaten_grams) < p.daily_food_goal_grams * 0.9 THEN 'under_target'
    WHEN SUM(f.amount_eaten_grams) > p.daily_food_goal_grams * 1.1 THEN 'over_target'
    ELSE 'met_target'
  END as status
FROM feedings f
JOIN pets p ON p.id = f.pet_id
GROUP BY f.pet_id, f.feeding_date, p.daily_food_goal_grams;
```

### Triggers (5)

**updated_at automation**: Triggers en `profiles`, `households`, `pets`, `foods` para actualizar automáticamente el campo `updated_at`.

---

## 🔄 **SISTEMA DE MIGRACIONES**

### Estructura

```
database/
├── migrations/
│   └── 20251109_000000_baseline_v1.0.0.sql  # Baseline inicial
└── README.md
```

**Sistema Simplificado**: Por ser proyecto nuevo, no tenemos directorios development/tested/applied. Todas las migraciones van directamente en `database/migrations/`.

### Crear Nueva Migración

```bash
# 1. Crear archivo con timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="database/migrations/${TIMESTAMP}_descripcion.sql"
touch "$FILENAME"

# 2. Editar archivo SQL
nano "$FILENAME"
```

**Template de migración**:

```sql
-- ============================================
-- Descripción: [Breve descripción del cambio]
-- Fecha: [YYYY-MM-DD]
-- Autor: [Tu Nombre]
-- ============================================

-- INICIO TRANSACCIÓN
BEGIN;

-- CAMBIOS DE SCHEMA
-- Ejemplo: Añadir columna
ALTER TABLE pets ADD COLUMN IF NOT EXISTS microchip_number TEXT;

-- OWNERSHIP (Obligatorio para nuevas tablas/objetos)
-- ALTER TABLE nueva_tabla OWNER TO pet_owner;

-- PERMISOS (Obligatorio para nuevas tablas)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON nueva_tabla TO pet_user;

-- REGISTRAR MIGRACIÓN
INSERT INTO _migrations (migration_name) VALUES ('20251109_120000_descripcion.sql');

-- FIN TRANSACCIÓN
COMMIT;
```

### Aplicar Migración

**⚠️ IMPORTANTE: SIEMPRE usa el script `scripts/apply-migration.sh`**

Este script:

- ✅ Aplica la migración de forma segura
- ✅ Verifica estado previo
- ✅ Auto-regenera types TypeScript si hay cambios de schema
- ✅ Requiere confirmación para PROD
- ✅ Registra en tabla `_migrations`

**Desarrollo (DEV)**:

```bash
# Aplicar migración a DEV (auto-regenera types)
./scripts/apply-migration.sh database/migrations/20251109_120000_descripcion.sql

# O explícitamente especificar DEV
./scripts/apply-migration.sh database/migrations/20251109_120000_descripcion.sql dev
```

**Producción (PROD)**:

```bash
# ⚠️ Requiere confirmación explícita + backup automático
./scripts/apply-migration.sh database/migrations/20251109_120000_descripcion.sql prod
```

**❌ NO ejecutar manualmente**:

```bash
# ❌ NUNCA HACER ESTO:
sudo -u postgres psql -d pet_sikness_dev -f migration.sql

# ✅ SIEMPRE USAR:
./scripts/apply-migration.sh migration.sql
```

### Regenerar Types Después de Migración

**CRÍTICO**: Siempre regenerar types TypeScript tras cambios de schema

```bash
# Regenerar desde DEV
npm run types:generate:dev

# O desde PROD
npm run types:generate:prod

# Verificar compilación
npm run typecheck
```

---

## 🔐 **PERMISOS Y SEGURIDAD**

### Default Privileges

Los objetos nuevos creados por `pet_owner` automáticamente otorgan permisos a `pet_user`:

```sql
-- Configurado en baseline
ALTER DEFAULT PRIVILEGES FOR ROLE pet_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO pet_user;

ALTER DEFAULT PRIVILEGES FOR ROLE pet_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO pet_user;
```

### Verificar Permisos

```sql
-- Permisos de tabla
SELECT table_name, grantee, privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'pet_user' AND table_schema = 'public'
ORDER BY table_name;

-- Ownership de objetos
SELECT tablename, tableowner
FROM pg_tables
WHERE schemaname = 'public';
-- Todos deben ser: pet_owner
```

### Agregar Permisos Manualmente (si es necesario)

```sql
-- Conectar como postgres
sudo -u postgres psql -d pet_sikness_dev

-- Otorgar permisos a nueva tabla
GRANT SELECT, INSERT, UPDATE, DELETE ON nueva_tabla TO pet_user;
GRANT USAGE, SELECT ON SEQUENCE nueva_tabla_id_seq TO pet_user;
```

---

## 🔍 **QUERIES ÚTILES**

### Ver Estado de Tablas

```sql
-- Contar registros por tabla
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_live_tup AS rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Ver Migraciones Aplicadas

```sql
SELECT id, migration_name, applied_at
FROM _migrations
ORDER BY applied_at DESC;
```

### Ver Relaciones de Tablas

```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

---

## 🆘 **TROUBLESHOOTING**

### Error: "permission denied for table X"

```sql
-- 1. Verificar ownership
SELECT tablename, tableowner FROM pg_tables WHERE tablename = 'X';
-- Debe ser: pet_owner

-- 2. Verificar permisos de pet_user
SELECT privilege_type FROM information_schema.table_privileges
WHERE table_name = 'X' AND grantee = 'pet_user';
-- Debe incluir: SELECT, INSERT, UPDATE, DELETE

-- 3. Si falta, aplicar manualmente:
GRANT SELECT, INSERT, UPDATE, DELETE ON X TO pet_user;
```

### Error: "relation does not exist"

```bash
# Verificar que estás conectado a la base de datos correcta
psql -h 127.0.0.1 -U pet_user -d pet_sikness_dev -c "\dt"

# Verificar que la tabla existe
sudo -u postgres psql -d pet_sikness_dev -c "\d+ nombre_tabla"
```

### Backup y Restore

```bash
# Backup completo
sudo -u postgres pg_dump pet_sikness_dev > ~/backups/dev_$(date +%Y%m%d_%H%M%S).sql

# Backup solo schema
sudo -u postgres pg_dump -s pet_sikness_dev > ~/backups/dev_schema_$(date +%Y%m%d_%H%M%S).sql

# Backup solo datos
sudo -u postgres pg_dump -a pet_sikness_dev > ~/backups/dev_data_$(date +%Y%m%d_%H%M%S).sql

# Restore
sudo -u postgres psql -d pet_sikness_dev < ~/backups/dev_backup.sql
```

---

## ⚠️ **REGLAS CRÍTICAS**

### ✅ HACER:

- Siempre backup antes de aplicar migraciones en PROD
- Probar migraciones en DEV primero
- Usar nombres descriptivos: `20251109_120000_add_microchip_column.sql`
- Documentar cambios en el archivo SQL (comentarios)
- Solo DDL en migraciones (CREATE, ALTER, DROP)
- Regenerar types tras cada migración
- Usar transacciones (BEGIN...COMMIT)
- Registrar en `_migrations`

### ❌ NO HACER:

- NUNCA aplicar migraciones sin backup en PROD
- NUNCA modificar datos de usuarios en migraciones (usar scripts aparte)
- NUNCA aplicar migraciones sin probar en DEV
- NUNCA mezclar cambios de estructura con cambios de datos
- NUNCA usar `pet_user` para DDL (usar `postgres` + `pet_owner`)
- NUNCA olvidar regenerar types

---

**🔥 ESTAS SON LAS REGLAS PARA TODO CAMBIO EN BASE DE DATOS 🔥**
