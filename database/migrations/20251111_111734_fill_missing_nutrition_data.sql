-- ============================================
-- Descripción: Rellenar datos nutricionales faltantes con valores lógicos
-- Fecha: 2025-11-11
-- Autor: Pet SiKness Team
-- ============================================

BEGIN;

-- Lógica de estimación por tipo de alimento:
-- 
-- DRY (pienso seco):
--   - moisture_percentage: 8-10%
--   - carbs_percentage: 30-40% (balance con proteína y grasa)
--   - fiber_percentage: 2-4%
--
-- WET (comida húmeda):
--   - moisture_percentage: 75-85%
--   - carbs_percentage: 5-10%
--   - fiber_percentage: 0.5-1.5%
--
-- TREAT (snacks):
--   - Secos (pescado deshidratado): moisture 10-15%, carbs 5-10%, fiber 0-2%
--   - Líquidos/cremosos: moisture 75-85%, carbs 2-5%, fiber 0-1%
--   - Semi-húmedos (sticks): moisture 20-30%, carbs 10-20%, fiber 1-2%

-- 1. Sprinkles de Boquerón (treat seco - pescado deshidratado)
UPDATE foods
SET 
  moisture_percentage = 12.0,
  carbs_percentage = 5.0,
  fiber_percentage = 0.5
WHERE household_id = '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b'
  AND name = 'Sprinkles de Boquerón'
  AND brand = 'Guau&Cat';

-- 2. Snack Liquid Salmón (treat líquido/cremoso)
UPDATE foods
SET 
  carbs_percentage = 3.0,
  fiber_percentage = 0.5
WHERE household_id = '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b'
  AND name = 'Snack Liquid Salmón'
  AND brand = 'Vitakraft';

-- 3. Bocaditos en Salsa (wet)
UPDATE foods
SET 
  carbs_percentage = 6.0,
  fiber_percentage = 1.0
WHERE household_id = '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b'
  AND name = 'Bocaditos en Salsa (variado)'
  AND brand = 'Deligato (Dia)';

-- 4. Sticks de Salmón (treat semi-húmedo)
UPDATE foods
SET 
  moisture_percentage = 25.0,
  carbs_percentage = 15.0,
  fiber_percentage = 1.5
WHERE household_id = '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b'
  AND name = 'Sticks de Salmón'
  AND brand = 'Deligato (Dia)';

-- 5. Snack Líquido Pollo y Salmón (treat líquido/cremoso)
UPDATE foods
SET 
  carbs_percentage = 3.5,
  fiber_percentage = 0.5
WHERE household_id = '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b'
  AND name = 'Snack Líquido Pollo y Salmón'
  AND brand = 'Deligato (Dia)';

-- Registrar migración
INSERT INTO _migrations (migration_name) 
VALUES ('20251111_111734_fill_missing_nutrition_data.sql');

COMMIT;
