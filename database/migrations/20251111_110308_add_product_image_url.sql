-- ============================================
-- Descripción: Añadir columna product_image_url a tabla foods
-- Fecha: 2025-11-11
-- Autor: Pet SiKness Team
-- ============================================

BEGIN;

-- Agregar columna para URL de imagen del producto
ALTER TABLE foods 
ADD COLUMN IF NOT EXISTS product_image_url TEXT;

-- Actualizar productos existentes con URLs proporcionadas por el usuario

-- 1. Sprinkles de Boquerón (Guau&Cat)
UPDATE foods
SET product_image_url = 'https://www.guauandcat.com/wp-content/uploads/2023/05/GuauCat-Snacks-Semih%C3%BAmedo-para-Gatos-Sprinkles-de-Boquer%C3%B3n-30-Gr.png'
WHERE household_id = '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b'
  AND name = 'Sprinkles de Boquerón'
  AND brand = 'Guau&Cat';

-- 2. Snack Liquid Salmón (Vitakraft)
UPDATE foods
SET product_image_url = 'https://www.vitakraft.es/wp-content/uploads/2023/09/liquid-snack-salmon-trucha.png'
WHERE household_id = '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b'
  AND name = 'Snack Liquid Salmón'
  AND brand = 'Vitakraft';

-- 3. Bocaditos en Salsa (Deligato Dia)
UPDATE foods
SET product_image_url = 'https://www.dia.es/diaonline/images/hd/p_4084500625457_A_c_g_s_v_o.jpg'
WHERE household_id = '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b'
  AND name = 'Bocaditos en Salsa (variado)'
  AND brand = 'Deligato (Dia)';

-- 4. Pienso Pollo y Buey (Deligato Dia)
UPDATE foods
SET product_image_url = 'https://www.dia.es/diaonline/images/hd/p_4084500625419_A_c_g_s_v_o.jpg'
WHERE household_id = '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b'
  AND name = 'Pienso Pollo y Buey'
  AND brand = 'Deligato (Dia)';

-- 5. Sticks de Salmón (Deligato Dia)
UPDATE foods
SET product_image_url = 'https://www.dia.es/diaonline/images/hd/p_4084500627239_A_c_g_s_v_o.jpg'
WHERE household_id = '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b'
  AND name = 'Sticks de Salmón'
  AND brand = 'Deligato (Dia)';

-- 6. Snack Líquido Pollo y Salmón (Deligato Dia)
UPDATE foods
SET product_image_url = 'https://www.dia.es/diaonline/images/hd/p_4084500627208_A_c_g_s_v_o.jpg'
WHERE household_id = '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b'
  AND name = 'Snack Líquido Pollo y Salmón'
  AND brand = 'Deligato (Dia)';

-- 7. Pienso Salmón y Atún (Deligato Dia)
UPDATE foods
SET product_image_url = 'https://www.dia.es/diaonline/images/hd/p_4084500625396_A_c_g_s_v_o.jpg'
WHERE household_id = '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b'
  AND name = 'Pienso Salmón y Atún'
  AND brand = 'Deligato (Dia)';

-- Registrar migración
INSERT INTO _migrations (migration_name) 
VALUES ('20251111_110308_add_product_image_url.sql');

COMMIT;
