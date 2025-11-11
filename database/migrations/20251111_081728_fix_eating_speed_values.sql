-- ============================================
-- Descripción: Corregir valores de eating_speed
-- Fecha: 2025-11-11
-- Autor: Pet SiKness Team
-- ============================================
--
-- PROBLEMA:
-- El constraint eating_speed_check solo permite: 'slow', 'normal', 'fast', 'anxious'
-- pero el código usa: 'very_slow', 'slow', 'normal', 'fast', 'very_fast'
--
-- SOLUCIÓN:
-- 1. Eliminar constraint antiguo
-- 2. Crear nuevo constraint con valores correctos
-- 3. Actualizar registros existentes (si los hay)
--
-- ============================================

BEGIN;

-- Conectar como pet_owner para DDL
SET ROLE pet_owner;

-- 1. Eliminar constraint antiguo
ALTER TABLE feedings DROP CONSTRAINT IF EXISTS feedings_eating_speed_check;

-- 2. Actualizar registros existentes con valores legacy (si existen)
-- 'anxious' → 'very_fast' (es el equivalente más cercano)
UPDATE feedings 
SET eating_speed = 'very_fast' 
WHERE eating_speed = 'anxious';

-- 3. Crear nuevo constraint con valores correctos
ALTER TABLE feedings 
ADD CONSTRAINT feedings_eating_speed_check 
CHECK (eating_speed IN ('very_slow', 'slow', 'normal', 'fast', 'very_fast'));

-- 4. Agregar comentario explicativo
COMMENT ON COLUMN feedings.eating_speed IS 'Velocidad al comer: very_slow (muy lento), slow (lento), normal, fast (rápido), very_fast (muy rápido)';

-- Registrar migración
INSERT INTO _migrations (migration_name) 
VALUES ('20251111_081728_fix_eating_speed_values.sql');

COMMIT;
