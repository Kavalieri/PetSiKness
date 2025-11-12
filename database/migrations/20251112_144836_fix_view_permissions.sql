-- ============================================
-- Descripción: Corregir permisos de vista daily_feeding_summary
-- Fecha: 2025-11-12
-- Autor: Pet SiKness Team
-- Contexto: La migración anterior recreó la vista pero no otorgó permisos a pet_user
-- ============================================

BEGIN;

-- Otorgar permisos SELECT en la vista al usuario de aplicación
GRANT SELECT ON daily_feeding_summary TO pet_user;

-- Registrar migración
INSERT INTO _migrations (migration_name) 
VALUES ('20251112_144836_fix_view_permissions.sql')
ON CONFLICT (migration_name) DO NOTHING;

COMMIT;
