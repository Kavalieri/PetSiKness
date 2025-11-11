-- ============================================
-- Descripción: Corregir valores de eating_speed y appetite_rating
-- Fecha: 2025-11-11
-- Autor: Pet SiKness Team
-- ============================================
--
-- PROBLEMAS:
-- 1. eating_speed_check solo permite: 'slow', 'normal', 'fast', 'anxious'
--    pero el código usa: 'very_slow', 'slow', 'normal', 'fast', 'very_fast'
--
-- 2. appetite_rating_check solo permite: 'refused', 'poor', 'fair', 'good', 'excellent'
--    pero el código usa: 'refused', 'poor', 'normal', 'good', 'excellent'
--
-- SOLUCIONES:
-- 1. Actualizar constraints con valores correctos del código
-- 2. Migrar datos existentes (si los hay)
--
-- ============================================

BEGIN;

-- Conectar como pet_owner para DDL
SET ROLE pet_owner;

-- ============================================
-- FIX 1: eating_speed
-- ============================================

-- Eliminar constraint antiguo
ALTER TABLE feedings DROP CONSTRAINT IF EXISTS feedings_eating_speed_check;

-- Actualizar registros existentes con valores legacy
-- 'anxious' → 'very_fast' (equivalente más cercano)
UPDATE feedings 
SET eating_speed = 'very_fast' 
WHERE eating_speed = 'anxious';

-- Crear nuevo constraint
ALTER TABLE feedings 
ADD CONSTRAINT feedings_eating_speed_check 
CHECK (eating_speed IN ('very_slow', 'slow', 'normal', 'fast', 'very_fast'));

-- Comentario
COMMENT ON COLUMN feedings.eating_speed IS 'Velocidad al comer: very_slow (muy lento), slow (lento), normal, fast (rápido), very_fast (muy rápido)';

-- ============================================
-- FIX 2: appetite_rating
-- ============================================

-- Eliminar constraint antiguo
ALTER TABLE feedings DROP CONSTRAINT IF EXISTS feedings_appetite_rating_check;

-- Actualizar registros existentes con valores legacy
-- 'fair' → 'normal' (el código usa 'normal' en lugar de 'fair')
UPDATE feedings 
SET appetite_rating = 'normal' 
WHERE appetite_rating = 'fair';

-- Crear nuevo constraint
ALTER TABLE feedings 
ADD CONSTRAINT feedings_appetite_rating_check 
CHECK (appetite_rating IN ('refused', 'poor', 'normal', 'good', 'excellent'));

-- Comentario
COMMENT ON COLUMN feedings.appetite_rating IS 'Calificación del apetito: refused (rechazó), poor (pobre), normal, good (bueno), excellent (excelente)';

-- Registrar migración (solo si no existe)
INSERT INTO _migrations (migration_name, status) 
VALUES ('20251111_081728_fix_eating_speed_values.sql', 'success')
ON CONFLICT (migration_name) 
DO UPDATE SET status = 'success', applied_at = CURRENT_TIMESTAMP, error_log = NULL;

COMMIT;
