-- ============================================
-- Descripción: Crear tabla foods con información nutricional completa
-- Fecha: 2025-11-10
-- Autor: Pet SiKness Team
-- ============================================

BEGIN;

-- Cambiar al rol owner para DDL
SET ROLE pet_owner;

-- Crear tabla foods
CREATE TABLE IF NOT EXISTS foods (
  -- Identificación
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  food_type TEXT NOT NULL CHECK (food_type IN ('dry', 'wet', 'raw', 'homemade', 'treats')),
  
  -- Información nutricional (por 100g)
  calories_per_100g INTEGER,
  protein_percentage DECIMAL(5,2) CHECK (protein_percentage >= 0 AND protein_percentage <= 100),
  fat_percentage DECIMAL(5,2) CHECK (fat_percentage >= 0 AND fat_percentage <= 100),
  carbs_percentage DECIMAL(5,2) CHECK (carbs_percentage >= 0 AND carbs_percentage <= 100),
  fiber_percentage DECIMAL(5,2) CHECK (fiber_percentage >= 0 AND fiber_percentage <= 100),
  moisture_percentage DECIMAL(5,2) CHECK (moisture_percentage >= 0 AND moisture_percentage <= 100),
  
  -- Producto
  ingredients TEXT,
  serving_size_grams INTEGER,
  package_size_grams INTEGER,
  price_per_package DECIMAL(10,2),
  
  -- Calidad
  palatability TEXT CHECK (palatability IN ('poor', 'fair', 'good', 'excellent')),
  digestibility TEXT CHECK (digestibility IN ('poor', 'fair', 'good', 'excellent')),
  
  -- Restricciones
  suitable_for_species TEXT[], -- Array de especies compatibles
  age_range TEXT, -- 'kitten', 'puppy', 'adult', 'senior', 'all'
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_foods_household_id ON foods(household_id);
CREATE INDEX IF NOT EXISTS idx_foods_food_type ON foods(food_type);
CREATE INDEX IF NOT EXISTS idx_foods_is_active ON foods(is_active);
CREATE INDEX IF NOT EXISTS idx_foods_suitable_species ON foods USING GIN(suitable_for_species);

-- Crear trigger para updated_at (usar función existente)
DROP TRIGGER IF EXISTS update_foods_updated_at ON foods;
CREATE TRIGGER update_foods_updated_at
  BEFORE UPDATE ON foods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grants a pet_user
GRANT SELECT, INSERT, UPDATE, DELETE ON foods TO pet_user;

-- Comentarios descriptivos
COMMENT ON TABLE foods IS 'Catálogo de alimentos con información nutricional completa';
COMMENT ON COLUMN foods.calories_per_100g IS 'Calorías por cada 100 gramos de alimento';
COMMENT ON COLUMN foods.protein_percentage IS 'Porcentaje de proteína sobre materia seca';
COMMENT ON COLUMN foods.suitable_for_species IS 'Array de especies para las que es apto el alimento';

-- Registrar migración
INSERT INTO _migrations (migration_name) 
VALUES ('20251110_180511_create_foods_table.sql');

COMMIT;
