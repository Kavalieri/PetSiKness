-- ============================================
-- Migración: Corregir constraints de activity_level y species
-- Fecha: 2025-11-10
-- Autor: Pet SiKness Team
-- ============================================
--
-- PROBLEMA:
-- Los constraints no coinciden con los valores del código TypeScript
--
-- activity_level:
--   DB:        ('sedentary', 'moderate', 'active', 'very_active')
--   TypeScript: ('sedentary', 'low', 'moderate', 'high', 'very_high')
--
-- species:
--   DB:        ('cat', 'dog', 'other')
--   TypeScript: ('cat', 'dog', 'bird', 'rabbit', 'hamster', 'guinea_pig', 'ferret', 'other')
--
-- SOLUCIÓN:
-- Actualizar constraints para coincidir con los valores del código
--
-- ============================================

BEGIN;

-- Conectarse como pet_owner para DDL
SET ROLE pet_owner;

-- 1. Corregir constraint de activity_level
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_activity_level_check;
ALTER TABLE pets ADD CONSTRAINT pets_activity_level_check 
  CHECK (activity_level IN ('sedentary', 'low', 'moderate', 'high', 'very_high'));

-- 2. Ampliar constraint de species para incluir más tipos
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_species_check;
ALTER TABLE pets ADD CONSTRAINT pets_species_check 
  CHECK (species IN ('cat', 'dog', 'bird', 'rabbit', 'hamster', 'guinea_pig', 'ferret', 'other'));

-- 3. Registrar migración
INSERT INTO _migrations (migration_name) 
VALUES ('20251110_170734_fix_activity_level_and_species_constraints.sql');

COMMIT;

-- ============================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================
-- SELECT constraint_name, check_clause 
-- FROM information_schema.check_constraints 
-- WHERE constraint_name IN ('pets_activity_level_check', 'pets_species_check');
