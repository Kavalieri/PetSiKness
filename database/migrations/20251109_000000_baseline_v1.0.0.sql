-- ============================================
-- Pet SiKness - Baseline v1.0.0
-- Fecha: 2025-11-09
-- Descripción: Schema base completo del sistema
-- Autor: Kavalieri
-- ============================================

-- ============================================
-- AUTENTICACIÓN Y USUARIOS
-- ============================================

-- profiles (usuarios del sistema)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id TEXT UNIQUE NOT NULL,           -- Google OAuth ID
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE profiles OWNER TO pet_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO pet_user;

COMMENT ON TABLE profiles IS 'Usuarios del sistema (autenticación Google OAuth)';
COMMENT ON COLUMN profiles.auth_id IS 'ID de proveedor OAuth (Google)';

-- ============================================
-- HOUSEHOLDS (Hogares/Familias con Mascotas)
-- ============================================

CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE households OWNER TO pet_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON households TO pet_user;

COMMENT ON TABLE households IS 'Hogares/familias que comparten el cuidado de mascotas';

-- household_members (miembros del hogar)
CREATE TABLE household_members (
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (household_id, profile_id)
);

ALTER TABLE household_members OWNER TO pet_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON household_members TO pet_user;

COMMENT ON TABLE household_members IS 'Miembros de cada hogar con roles';
COMMENT ON COLUMN household_members.role IS 'Rol: owner (administrador) o member (miembro)';

-- ============================================
-- MASCOTAS (Entidad Principal)
-- ============================================

CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  
  -- Datos básicos
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('cat', 'dog', 'other')),
  breed TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'unknown')),
  
  -- Datos físicos
  weight_kg NUMERIC(5,2),                -- Peso actual en kg
  body_condition TEXT CHECK (body_condition IN (
    'underweight',      -- Bajo peso
    'ideal',            -- Peso ideal
    'overweight',       -- Sobrepeso
    'obese'             -- Obesidad
  )),
  
  -- Objetivos alimentarios
  daily_food_goal_grams INTEGER NOT NULL DEFAULT 0,  -- Objetivo diario en gramos
  daily_meals_target INTEGER DEFAULT 2,              -- Número de tomas objetivo
  
  -- Salud
  health_notes TEXT,
  allergies TEXT[],
  medications TEXT[],
  
  -- Comportamiento
  appetite TEXT CHECK (appetite IN ('low', 'normal', 'high')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'moderate', 'active', 'very_active')),
  
  -- Estado
  is_active BOOLEAN DEFAULT true NOT NULL,
  
  -- Metadata
  photo_url TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE pets OWNER TO pet_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON pets TO pet_user;

COMMENT ON TABLE pets IS 'Mascotas del hogar';
COMMENT ON COLUMN pets.daily_food_goal_grams IS 'Cantidad objetivo de comida diaria en gramos';
COMMENT ON COLUMN pets.body_condition IS 'Condición corporal: underweight, ideal, overweight, obese';
COMMENT ON COLUMN pets.is_active IS 'false = mascota fallecida o dada en adopción';

-- Índices
CREATE INDEX idx_pets_household ON pets(household_id);
CREATE INDEX idx_pets_active ON pets(household_id, is_active) WHERE is_active = true;

-- ============================================
-- ALIMENTOS (Fichas de Comida)
-- ============================================

CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  
  -- Datos básicos
  name TEXT NOT NULL,
  brand TEXT,
  food_type TEXT NOT NULL CHECK (food_type IN (
    'dry',              -- Pienso seco
    'wet',              -- Húmeda (lata/sobre)
    'raw',              -- Dieta BARF/cruda
    'homemade',         -- Casera
    'treat',            -- Premio/snack
    'supplement'        -- Suplemento
  )),
  
  -- Composición nutricional (por 100g)
  calories_per_100g NUMERIC(6,2),
  protein_percentage NUMERIC(5,2),
  fat_percentage NUMERIC(5,2),
  carbs_percentage NUMERIC(5,2),
  fiber_percentage NUMERIC(5,2),
  moisture_percentage NUMERIC(5,2),
  
  -- Información del producto
  ingredients TEXT,
  serving_size_grams INTEGER,
  package_size_grams INTEGER,
  price_per_package NUMERIC(8,2),
  
  -- Preferencias
  palatability TEXT CHECK (palatability IN ('low', 'medium', 'high')),
  digestibility TEXT CHECK (digestibility IN ('poor', 'fair', 'good', 'excellent')),
  
  -- Restricciones
  suitable_for_species TEXT[] DEFAULT ARRAY['cat', 'dog'],
  age_range TEXT CHECK (age_range IN ('kitten/puppy', 'adult', 'senior', 'all_ages')),
  
  -- Notas
  notes TEXT,
  photo_url TEXT,
  
  -- Estado
  is_active BOOLEAN DEFAULT true NOT NULL,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE foods OWNER TO pet_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON foods TO pet_user;

COMMENT ON TABLE foods IS 'Catálogo de alimentos para mascotas';
COMMENT ON COLUMN foods.food_type IS 'Tipo: dry (pienso), wet (húmeda), raw (BARF), homemade, treat, supplement';
COMMENT ON COLUMN foods.suitable_for_species IS 'Array de especies compatibles (cat, dog, other)';

-- Índices
CREATE INDEX idx_foods_household ON foods(household_id);
CREATE INDEX idx_foods_type ON foods(household_id, food_type);
CREATE INDEX idx_foods_active ON foods(household_id, is_active) WHERE is_active = true;

-- ============================================
-- INGESTAS (Registro Diario de Alimentación)
-- ============================================

CREATE TABLE feedings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE RESTRICT,
  
  -- Cuándo
  feeding_date DATE NOT NULL DEFAULT CURRENT_DATE,
  feeding_time TIME,
  meal_number INTEGER CHECK (meal_number > 0),  -- 1ra, 2da, 3ra toma del día
  
  -- Cantidades
  amount_served_grams INTEGER NOT NULL,         -- Cantidad servida
  amount_eaten_grams INTEGER NOT NULL,          -- Cantidad consumida
  amount_leftover_grams INTEGER GENERATED ALWAYS AS (amount_served_grams - amount_eaten_grams) STORED,
  
  -- Comportamiento alimentario
  appetite_rating TEXT CHECK (appetite_rating IN (
    'refused',          -- Rechazó comida
    'poor',             -- Comió muy poco
    'fair',             -- Comió algo
    'good',             -- Comió normal
    'excellent'         -- Comió todo con ganas
  )),
  eating_speed TEXT CHECK (eating_speed IN ('slow', 'normal', 'fast', 'anxious')),
  
  -- Resultados
  vomited BOOLEAN DEFAULT false NOT NULL,
  had_diarrhea BOOLEAN DEFAULT false NOT NULL,
  had_stool BOOLEAN DEFAULT false NOT NULL,      -- ¿Defecó después?
  stool_quality TEXT CHECK (stool_quality IN ('soft', 'normal', 'hard', 'not_observed')),
  
  -- Observaciones
  notes TEXT,
  
  -- Metadata
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_amounts CHECK (amount_eaten_grams >= 0 AND amount_eaten_grams <= amount_served_grams)
);

ALTER TABLE feedings OWNER TO pet_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON feedings TO pet_user;

COMMENT ON TABLE feedings IS 'Registro diario de alimentación por mascota';
COMMENT ON COLUMN feedings.amount_leftover_grams IS 'Calculado automáticamente: servido - comido';
COMMENT ON COLUMN feedings.had_stool IS 'Registro de si defecó tras esta toma (ayuda a detectar problemas digestivos)';

-- Índices críticos para performance
CREATE INDEX idx_feedings_household ON feedings(household_id);
CREATE INDEX idx_feedings_pet_date ON feedings(pet_id, feeding_date DESC);
CREATE INDEX idx_feedings_date ON feedings(household_id, feeding_date DESC);
CREATE INDEX idx_feedings_food ON feedings(food_id);

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Balance diario por mascota
CREATE VIEW daily_feeding_summary AS
SELECT 
  f.pet_id,
  f.feeding_date,
  p.name as pet_name,
  p.daily_food_goal_grams,
  COUNT(*) as total_meals,
  SUM(f.amount_served_grams) as total_served,
  SUM(f.amount_eaten_grams) as total_eaten,
  SUM(f.amount_leftover_grams) as total_leftover,
  ROUND(
    (SUM(f.amount_eaten_grams)::NUMERIC / NULLIF(p.daily_food_goal_grams, 0)) * 100,
    1
  ) as goal_achievement_percentage,
  CASE 
    WHEN SUM(f.amount_eaten_grams) < p.daily_food_goal_grams THEN 'under'
    WHEN SUM(f.amount_eaten_grams) > p.daily_food_goal_grams THEN 'over'
    ELSE 'met'
  END as goal_status
FROM feedings f
JOIN pets p ON p.id = f.pet_id
GROUP BY f.pet_id, f.feeding_date, p.name, p.daily_food_goal_grams;

ALTER VIEW daily_feeding_summary OWNER TO pet_owner;
GRANT SELECT ON daily_feeding_summary TO pet_user;

COMMENT ON VIEW daily_feeding_summary IS 'Resumen diario: total comido vs objetivo por mascota';

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función: Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION update_updated_at_column() OWNER TO pet_owner;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO pet_user;

COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function: actualiza columna updated_at automáticamente';

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_foods_updated_at BEFORE UPDATE ON foods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedings_updated_at BEFORE UPDATE ON feedings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA DE CONTROL DE MIGRACIONES
-- ============================================

CREATE TABLE _migrations (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  applied_by VARCHAR(100) DEFAULT CURRENT_USER NOT NULL,
  execution_time_ms INTEGER,
  status VARCHAR(20) CHECK (status IN ('success', 'failed', 'rolled_back')),
  output_log TEXT,
  error_log TEXT,
  checksum VARCHAR(64),
  description TEXT
);

ALTER TABLE _migrations OWNER TO pet_owner;
GRANT SELECT, INSERT, UPDATE ON _migrations TO pet_user;
GRANT USAGE, SELECT ON SEQUENCE _migrations_id_seq TO pet_user;

COMMENT ON TABLE _migrations IS 'Control de migraciones aplicadas al schema';

-- ============================================
-- REGISTRO DE ESTA MIGRACIÓN
-- ============================================

INSERT INTO _migrations (
  migration_name,
  applied_at,
  status,
  description
) VALUES (
  '20251109_000000_baseline_v1.0.0.sql',
  CURRENT_TIMESTAMP,
  'success',
  'Baseline inicial Pet SiKness v1.0.0 - Schema completo'
);

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'households', COUNT(*) FROM households
UNION ALL
SELECT 'household_members', COUNT(*) FROM household_members
UNION ALL
SELECT 'pets', COUNT(*) FROM pets
UNION ALL
SELECT 'foods', COUNT(*) FROM foods
UNION ALL
SELECT 'feedings', COUNT(*) FROM feedings
UNION ALL
SELECT '_migrations', COUNT(*) FROM _migrations;

-- ✅ Baseline v1.0.0 aplicado exitosamente
