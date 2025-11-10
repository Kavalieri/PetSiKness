-- ============================================
-- Descripción: Añadir campos purchase_url y photo_url a foods
-- Fecha: 2025-11-10
-- Autor: Pet SiKness Team
-- ============================================

BEGIN;

-- Cambiar al rol owner para DDL
SET ROLE pet_owner;

-- Añadir campo para URL de compra online
ALTER TABLE foods 
ADD COLUMN IF NOT EXISTS purchase_url TEXT;

-- Añadir campo para foto del producto (emoji, base64 o URL)
ALTER TABLE foods 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Comentarios descriptivos
COMMENT ON COLUMN foods.purchase_url IS 'URL de compra online del producto (e.g., Amazon, Tiendanimal)';
COMMENT ON COLUMN foods.photo_url IS 'Foto del producto: emoji, imagen base64 o URL externa';

-- Registrar migración
INSERT INTO _migrations (migration_name) 
VALUES ('20251110_214738_add_purchase_url_and_photo_to_foods.sql');

COMMIT;
