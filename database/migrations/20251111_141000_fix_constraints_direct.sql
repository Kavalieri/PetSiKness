-- ============================================
-- Descripción: Fix directo de constraints (sin registro en _migrations)
-- Fecha: 2025-11-11
-- Autor: Pet SiKness Team
-- ============================================

BEGIN;

SET ROLE pet_owner;

-- FIX: eating_speed
ALTER TABLE feedings DROP CONSTRAINT IF EXISTS feedings_eating_speed_check;
UPDATE feedings SET eating_speed = 'very_fast' WHERE eating_speed = 'anxious';
ALTER TABLE feedings ADD CONSTRAINT feedings_eating_speed_check 
CHECK (eating_speed IN ('very_slow', 'slow', 'normal', 'fast', 'very_fast'));

-- FIX: appetite_rating  
ALTER TABLE feedings DROP CONSTRAINT IF EXISTS feedings_appetite_rating_check;
UPDATE feedings SET appetite_rating = 'normal' WHERE appetite_rating = 'fair';
ALTER TABLE feedings ADD CONSTRAINT feedings_appetite_rating_check 
CHECK (appetite_rating IN ('refused', 'poor', 'normal', 'good', 'excellent'));

-- Actualizar el registro de migración existente a 'success'
UPDATE _migrations 
SET status = 'success', error_log = NULL 
WHERE migration_name = '20251111_081728_fix_eating_speed_values.sql';

COMMIT;
