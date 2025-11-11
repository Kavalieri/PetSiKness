-- ============================================
-- Descripción: Agregar columna expected_grams a pet_meal_schedules
-- Fecha: 2025-11-11
-- Autor: Pet SiKness Team
-- ============================================
--
-- CONTEXTO:
-- Permite definir cantidad esperada de gramos por toma individual.
-- Esto habilita:
-- 1. Distribución desigual de cantidades entre tomas del día
-- 2. Cálculo de expected_grams por toma en vez de dividir daily_goal
-- 3. Mayor flexibilidad en planes alimenticios (ej: cena más ligera)
--
-- EJEMPLO:
-- Mascota con daily_food_goal_grams = 300
-- - Toma 1 (08:00): expected_grams = 120
-- - Toma 2 (14:00): expected_grams = 100
-- - Toma 3 (20:00): expected_grams = 80
-- Total: 300g distribuidos según necesidad
--
-- ============================================

BEGIN;

-- ============================================
-- 1. AGREGAR COLUMNA expected_grams
-- ============================================

ALTER TABLE pet_meal_schedules 
  ADD COLUMN IF NOT EXISTS expected_grams INTEGER;

-- Comentario de documentación
COMMENT ON COLUMN pet_meal_schedules.expected_grams IS 
  'Cantidad esperada de gramos para esta toma específica. Opcional: si NULL, se calcula como daily_food_goal_grams / daily_meals_target.';

-- ============================================
-- 2. CONSTRAINT: expected_grams debe ser positivo si se define
-- ============================================

ALTER TABLE pet_meal_schedules 
  ADD CONSTRAINT check_expected_grams_positive 
  CHECK (expected_grams IS NULL OR expected_grams > 0);

-- ============================================
-- 3. REGISTRAR MIGRACIÓN
-- ============================================

INSERT INTO _migrations (migration_name) 
VALUES ('20251111_171851_add_expected_grams_to_meal_schedules.sql')
ON CONFLICT (migration_name) DO NOTHING;

COMMIT;
