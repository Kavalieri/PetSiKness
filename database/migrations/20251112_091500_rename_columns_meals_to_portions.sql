-- ============================================
-- Descripción: Renombrar columnas para consistencia meals → portions
-- Fecha: 2025-11-12
-- Autor: Pet SiKness Team
-- Issue: #64 (Schema consistency fix)
-- ============================================

BEGIN;

-- 1. Renombrar en tabla pets
ALTER TABLE pets 
  RENAME COLUMN daily_portions_target TO daily_meals_target;

-- 2. Renombrar en tabla feedings
ALTER TABLE feedings 
  RENAME COLUMN portion_number TO meal_number;

-- 3. Registrar migración
INSERT INTO _migrations (migration_name) 
VALUES ('20251112_091500_rename_columns_meals_to_portions.sql');

COMMIT;
