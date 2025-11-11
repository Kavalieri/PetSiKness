-- ============================================
-- Descripción: Mejorar sistema de migraciones con estados
-- Fecha: 2025-11-11
-- Autor: Pet SiKness Team
-- ============================================
--
-- Mejoras al sistema de migraciones:
-- 1. Añadir columna 'status' (pending/applied/failed)
-- 2. Añadir columna 'error_message' para debug
-- 3. Permitir re-intentos de migraciones fallidas
--
-- ============================================

BEGIN;

-- Conectar como pet_owner para DDL
SET ROLE pet_owner;

-- Añadir columnas de estado a _migrations
ALTER TABLE _migrations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'applied' CHECK (status IN ('pending', 'applied', 'failed'));

ALTER TABLE _migrations 
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Comentarios
COMMENT ON COLUMN _migrations.status IS 'Estado: pending (pendiente), applied (aplicada), failed (fallida)';
COMMENT ON COLUMN _migrations.error_message IS 'Mensaje de error si status=failed';

-- Todas las migraciones existentes están aplicadas correctamente
UPDATE _migrations SET status = 'applied' WHERE status IS NULL;

-- Registrar esta migración
INSERT INTO _migrations (migration_name, status) 
VALUES ('20251111_140500_improve_migrations_system.sql', 'applied')
ON CONFLICT (migration_name) DO NOTHING;

COMMIT;
