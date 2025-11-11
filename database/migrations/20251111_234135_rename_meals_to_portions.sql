-- ============================================
-- Descripción: Migración terminológica: "meals/tomas" → "portions/raciones"
-- Fecha: 2025-11-11
-- Autor: Pet SiKness Team
-- Issue: #57
-- ============================================

BEGIN;

-- Cambiar al rol owner para DDL
SET ROLE pet_owner;

-- ============================================
-- 1. RENOMBRAR TABLA: pet_meal_schedules → pet_portion_schedules
-- ============================================

ALTER TABLE pet_meal_schedules RENAME TO pet_portion_schedules;

COMMENT ON TABLE pet_portion_schedules IS 'Horarios y cantidades de raciones diarias por mascota';

-- ============================================
-- 2. RENOMBRAR COLUMNAS
-- ============================================

-- En pet_portion_schedules
ALTER TABLE pet_portion_schedules 
  RENAME COLUMN meal_number TO portion_number;

COMMENT ON COLUMN pet_portion_schedules.portion_number IS 'Número de ración del día (1, 2, 3...)';

-- En pets
ALTER TABLE pets 
  RENAME COLUMN daily_meals_target TO daily_portions_target;

COMMENT ON COLUMN pets.daily_portions_target IS 'Número objetivo de raciones diarias';

-- En feedings
ALTER TABLE feedings 
  RENAME COLUMN meal_number TO portion_number;

COMMENT ON COLUMN feedings.portion_number IS 'Número de ración del día';

-- ============================================
-- 3. RENOMBRAR ÍNDICES
-- ============================================

-- Verificar y renombrar índice de pet_portion_schedules
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_pet_meal_schedules_pet_id'
  ) THEN
    ALTER INDEX idx_pet_meal_schedules_pet_id 
      RENAME TO idx_pet_portion_schedules_pet_id;
  END IF;
END $$;

-- ============================================
-- 4. RENOMBRAR CONSTRAINTS (si existen)
-- ============================================

-- Verificar constraints existentes
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  -- Renombrar constraints que contengan 'meal' en su nombre
  FOR constraint_rec IN 
    SELECT conname, conrelid::regclass::text as table_name
    FROM pg_constraint
    WHERE conname LIKE '%meal%'
      AND connamespace = 'public'::regnamespace
  LOOP
    EXECUTE format(
      'ALTER TABLE %s RENAME CONSTRAINT %s TO %s',
      constraint_rec.table_name,
      constraint_rec.conname,
      replace(constraint_rec.conname, 'meal', 'portion')
    );
  END LOOP;
END $$;

-- ============================================
-- 5. ACTUALIZAR COMENTARIOS DE TABLA Y COLUMNAS
-- ============================================

COMMENT ON COLUMN pets.daily_food_goal_grams IS 'Meta diaria de alimento en gramos (suma de todas las raciones)';
COMMENT ON COLUMN feedings.portion_number IS 'Número de ración del día en que se registró esta alimentación';

-- ============================================
-- 6. REGISTRAR MIGRACIÓN
-- ============================================

INSERT INTO _migrations (migration_name) 
VALUES ('20251111_234135_rename_meals_to_portions.sql')
ON CONFLICT (migration_name) DO NOTHING;

COMMIT;

-- ============================================
-- ROLLBACK (si es necesario)
-- ============================================
-- BEGIN;
-- SET ROLE pet_owner;
-- ALTER TABLE pet_portion_schedules RENAME TO pet_meal_schedules;
-- ALTER TABLE pet_portion_schedules RENAME COLUMN portion_number TO meal_number;
-- ALTER TABLE pets RENAME COLUMN daily_portions_target TO daily_meals_target;
-- ALTER TABLE feedings RENAME COLUMN portion_number TO meal_number;
-- ALTER INDEX idx_pet_portion_schedules_pet_id RENAME TO idx_pet_meal_schedules_pet_id;
-- DELETE FROM _migrations WHERE migration_name = '20251111_234135_rename_meals_to_portions.sql';
-- COMMIT;
