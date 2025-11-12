-- ============================================
-- Descripción: Revertir nomenclatura a "portions" (decisión original 11/11/2025)
-- Fecha: 2025-11-12
-- Autor: Pet SiKness Team
-- Issue: #64
-- ============================================

BEGIN;

SET ROLE pet_owner;

-- ============================================
-- 1. REVERTIR feedings.meal_number → portion_number
-- ============================================

ALTER TABLE feedings 
  RENAME COLUMN meal_number TO portion_number;

COMMENT ON COLUMN feedings.portion_number IS 
  'Número de ración del día (1=desayuno, 2=almuerzo, 3=cena). 
   Relacionado con pet_portion_schedules.portion_number';

-- ============================================
-- 2. REVERTIR pets.daily_meals_target → daily_portions_target
-- ============================================

ALTER TABLE pets 
  RENAME COLUMN daily_meals_target TO daily_portions_target;

COMMENT ON COLUMN pets.daily_portions_target IS 
  'Número objetivo de raciones diarias para la mascota';

-- ============================================
-- 3. REGISTRAR MIGRACIÓN
-- ============================================

INSERT INTO _migrations (migration_name) 
VALUES ('20251112_141056_revert_to_portions_nomenclature.sql');

COMMIT;

-- ============================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================
-- SELECT column_name, table_name 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND column_name LIKE '%portion%'
-- ORDER BY table_name, column_name;
