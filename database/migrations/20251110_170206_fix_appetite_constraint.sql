-- ============================================
-- Migración: Corregir constraint de appetite
-- Fecha: 2025-11-10
-- Autor: Pet SiKness Team
-- ============================================
--
-- PROBLEMA:
-- El constraint pets_appetite_check permite ('low', 'normal', 'high')
-- pero el código TypeScript usa ('poor', 'normal', 'good', 'excellent')
--
-- SOLUCIÓN:
-- Actualizar constraint para coincidir con los valores del código
--
-- ============================================

BEGIN;

-- Conectarse como pet_owner para DDL
SET ROLE pet_owner;

-- 1. Eliminar constraint viejo
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_appetite_check;

-- 2. Crear nuevo constraint con valores correctos
ALTER TABLE pets ADD CONSTRAINT pets_appetite_check 
  CHECK (appetite IN ('poor', 'normal', 'good', 'excellent'));

-- 3. Registrar migración
INSERT INTO _migrations (migration_name) 
VALUES ('20251110_170206_fix_appetite_constraint.sql');

COMMIT;

-- ============================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================
-- SELECT constraint_name, check_clause 
-- FROM information_schema.check_constraints 
-- WHERE constraint_name = 'pets_appetite_check';
