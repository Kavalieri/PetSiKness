-- ============================================
-- Descripción: Añadir alimentos al hogar SiK desde URLs proporcionadas
-- Fecha: 2025-11-11
-- Autor: Pet SiKness Team
-- Household: SiK (8164ef94-d8b5-4fdb-80ba-0afae2a9c00b)
-- Created by: 8a378ce2-2a28-4c95-a5c1-1f7d6f1fd8c3
-- ============================================

BEGIN;

-- 1. Snack Trocitos de Boquerón (Guau&Cat)
INSERT INTO foods (
  household_id, created_by, name, brand, food_type,
  calories_per_100g, protein_percentage, fat_percentage,
  package_size_grams, price_per_package, ingredients, suitable_for_species
) VALUES (
  '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b',
  '8a378ce2-2a28-4c95-a5c1-1f7d6f1fd8c3',
  'Sprinkles de Boquerón',
  'Guau&Cat',
  'treat',
  350,
  65.0,
  15.0,
  30,
  1.95,
  'Boquerones 100% naturales deshidratados. Sin conservantes, aditivos, aromatizantes ni colorantes.',
  ARRAY['cat', 'dog']
);

-- 2. Snack Liquid Salmón (Vitakraft)
INSERT INTO foods (
  household_id, created_by, name, brand, food_type,
  calories_per_100g, protein_percentage, fat_percentage, moisture_percentage,
  package_size_grams, ingredients, suitable_for_species, age_range
) VALUES (
  '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b',
  '8a378ce2-2a28-4c95-a5c1-1f7d6f1fd8c3',
  'Snack Liquid Salmón',
  'Vitakraft',
  'treat',
  120,
  8.0,
  5.0,
  80.0,
  90,
  'Carne y subproductos animales, pescado y subproductos de pescado (salmón 4%), subproductos vegetales, aceites y grasas, leche y productos lácteos.',
  ARRAY['cat'],
  'adult'
);

-- 3. Bocaditos en Salsa Deligato (Dia) - Pack 12x100g
INSERT INTO foods (
  household_id, created_by, name, brand, food_type,
  calories_per_100g, protein_percentage, fat_percentage, moisture_percentage,
  package_size_grams, price_per_package, ingredients,
  suitable_for_species, age_range
) VALUES (
  '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b',
  '8a378ce2-2a28-4c95-a5c1-1f7d6f1fd8c3',
  'Bocaditos en Salsa (variado)',
  'Deligato (Dia)',
  'wet',
  85,
  8.5,
  4.0,
  82.0,
  1200,
  3.99,
  'Carnes y subproductos animales (aves 5%, hígado 5%), pescado (salmón/trucha 5%), cereales, verduras (zanahorias 2%, guisantes 2%), minerales, inulina 0.1%.',
  ARRAY['cat'],
  'adult'
);

-- 4. Pienso con Pollo y Buey Deligato (Dia)
INSERT INTO foods (
  household_id, created_by, name, brand, food_type,
  calories_per_100g, protein_percentage, fat_percentage,
  carbs_percentage, fiber_percentage, moisture_percentage,
  package_size_grams, price_per_package, ingredients,
  suitable_for_species, age_range
) VALUES (
  '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b',
  '8a378ce2-2a28-4c95-a5c1-1f7d6f1fd8c3',
  'Pienso Pollo y Buey',
  'Deligato (Dia)',
  'dry',
  380,
  30.0,
  12.0,
  35.0,
  3.5,
  8.0,
  1500,
  2.89,
  'Carnes y subproductos animales (pollo 16%, buey 4%), cereales, verduras (guisante 4%), aceites y grasas, minerales, levaduras, frutas (arándanos 100mg/kg).',
  ARRAY['cat'],
  'adult'
);

-- 5. Sticks de Salmón Deligato (Dia)
INSERT INTO foods (
  household_id, created_by, name, brand, food_type,
  calories_per_100g, protein_percentage, fat_percentage,
  package_size_grams, ingredients, suitable_for_species, age_range
) VALUES (
  '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b',
  '8a378ce2-2a28-4c95-a5c1-1f7d6f1fd8c3',
  'Sticks de Salmón',
  'Deligato (Dia)',
  'treat',
  300,
  40.0,
  15.0,
  50,
  'Carnes y subproductos animales (80%), pescado y subproductos de pescado (salmón 15%), levaduras, minerales.',
  ARRAY['cat'],
  'adult'
);

-- 6. Snack Líquido Pollo y Salmón Deligato (Dia)
INSERT INTO foods (
  household_id, created_by, name, brand, food_type,
  calories_per_100g, protein_percentage, fat_percentage, moisture_percentage,
  package_size_grams, price_per_package, ingredients,
  suitable_for_species, age_range
) VALUES (
  '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b',
  '8a378ce2-2a28-4c95-a5c1-1f7d6f1fd8c3',
  'Snack Líquido Pollo y Salmón',
  'Deligato (Dia)',
  'treat',
  110,
  7.0,
  4.5,
  82.0,
  105,
  1.40,
  'Carnes y subproductos animales (pollo 6%), pescado (salmón 6%), subproductos vegetales, aceites y grasas, leche y subproductos lácteos, inulina 0.1%.',
  ARRAY['cat'],
  'adult'
);

-- 7. Pienso Salmón y Atún Deligato (Dia)
INSERT INTO foods (
  household_id, created_by, name, brand, food_type,
  calories_per_100g, protein_percentage, fat_percentage,
  carbs_percentage, fiber_percentage, moisture_percentage,
  package_size_grams, price_per_package, ingredients,
  suitable_for_species, age_range
) VALUES (
  '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b',
  '8a378ce2-2a28-4c95-a5c1-1f7d6f1fd8c3',
  'Pienso Salmón y Atún',
  'Deligato (Dia)',
  'dry',
  385,
  32.0,
  13.0,
  33.0,
  3.0,
  8.0,
  1500,
  2.89,
  'Carnes y subproductos animales, cereales, pescados (salmón 15%, atún 5%), verduras (guisantes 4%), aceites y grasas, minerales, levaduras, frutas (arándanos 100mg/kg).',
  ARRAY['cat'],
  'adult'
);

-- Registrar migración
INSERT INTO _migrations (migration_name) 
VALUES ('20251111_093000_add_sik_foods.sql');

COMMIT;

-- 1. Snack Trocitos de Boquerón (Guau&Cat)
INSERT INTO foods (
  id,
  household_id,
  created_by,
  created_by,
  name,
  brand,
  food_type,
  calories_per_100g,
  protein_percentage,
  fat_percentage,
  package_size_grams,
  price_per_package,
  ingredients,
  suitable_for_species
) VALUES (
  gen_random_uuid(),
  '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b',
  '8a378ce2-2a28-4c95-a5c1-1f7d6f1fd8c3',
  '8a378ce2-2a28-4c95-a5c1-1f7d6f1fd8c3',
  'Sprinkles de Boquerón',
  'Guau&Cat',
  'treats',
  350, -- Estimado para pescado deshidratado
  65.0, -- Alto contenido proteico (pescado)
  15.0, -- Grasa natural del pescado
  30,
  1.95,
  'Boquerones 100% naturales deshidratados. Sin conservantes, aditivos, aromatizantes ni colorantes.',
  ARRAY['cat', 'dog']
);

-- 2. Snack Liquid Salmón (Vitakraft)
INSERT INTO foods (
  id,
  household_id,
  created_by,
  created_by,
  name,
  brand,
  food_type,
  calories_per_100g,
  protein_percentage,
  fat_percentage,
  moisture_percentage,
  package_size_grams,
  price_per_package,
  ingredients,
  suitable_for_species,
  age_range
) VALUES (
  gen_random_uuid(),
  '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b',
  '8a378ce2-2a28-4c95-a5c1-1f7d6f1fd8c3',
  '8a378ce2-2a28-4c95-a5c1-1f7d6f1fd8c3',
  'Snack Liquid Salmón',
  'Vitakraft',
  'treats',
  120, -- Snack cremoso (alto contenido de humedad)
  8.0,
  5.0,
  80.0,
  90,
  NULL, -- Precio no especificado
  'Carne y subproductos animales, pescado y subproductos de pescado (salmón 4%), subproductos vegetales, aceites y grasas, leche y productos lácteos.',
  ARRAY['cat'],
  'adult' -- Mayor de 3 meses
);

-- 3. Bocaditos en Salsa Deligato (Dia) - Pack 12x100g
INSERT INTO foods (
  id,
  household_id,
  created_by,
  name,
  brand,
  food_type,
  calories_per_100g,
  protein_percentage,
  fat_percentage,
  moisture_percentage,
  package_size_grams,
  price_per_package,
  ingredients,
  suitable_for_species,
  age_range
) VALUES (
  gen_random_uuid(),
  '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b',
  '8a378ce2-2a28-4c95-a5c1-1f7d6f1fd8c3',
  'Bocaditos en Salsa (variado)',
  'Deligato (Dia)',
  'wet',
  85, -- Comida húmeda típica
  8.5,
  4.0,
  82.0,
  1200, -- 12 sobres x 100g
  3.99,
  'Carnes y subproductos animales (aves 5%, hígado 5%), pescado (salmón/trucha 5%), cereales, verduras (zanahorias 2%, guisantes 2%), minerales, inulina 0.1%.',
  ARRAY['cat'],
  'adult'
);

-- 4. Pienso con Pollo y Buey Deligato (Dia)
INSERT INTO foods (
  id,
  household_id,
  created_by,
  name,
  brand,
  food_type,
  calories_per_100g,
  protein_percentage,
  fat_percentage,
  carbs_percentage,
  fiber_percentage,
  moisture_percentage,
  package_size_grams,
  price_per_package,
  ingredients,
  suitable_for_species,
  age_range
) VALUES (
  gen_random_uuid(),
  '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b',
  '8a378ce2-2a28-4c95-a5c1-1f7d6f1fd8c3',
  'Pienso Pollo y Buey',
  'Deligato (Dia)',
  'dry',
  380, -- Pienso seco típico
  30.0,
  12.0,
  35.0,
  3.5,
  8.0,
  1500,
  2.89,
  'Carnes y subproductos animales (pollo 16%, buey 4%), cereales, verduras (guisante 4%), aceites y grasas, minerales, levaduras, frutas (arándanos 100mg/kg).',
  ARRAY['cat'],
  'adult'
);

-- 5. Sticks de Salmón Deligato (Dia)
INSERT INTO foods (
  id,
  household_id,
  created_by,
  name,
  brand,
  food_type,
  calories_per_100g,
  protein_percentage,
  fat_percentage,
  package_size_grams,
  price_per_package,
  ingredients,
  suitable_for_species,
  age_range
) VALUES (
  gen_random_uuid(),
  '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b',
  '8a378ce2-2a28-4c95-a5c1-1f7d6f1fd8c3',
  'Sticks de Salmón',
  'Deligato (Dia)',
  'treats',
  300, -- Snack seco/semihúmedo
  40.0,
  15.0,
  50, -- 10 sticks x 5g
  NULL, -- Precio no visible
  'Carnes y subproductos animales (80%), pescado y subproductos de pescado (salmón 15%), levaduras, minerales.',
  ARRAY['cat'],
  'adult'
);

-- 6. Snack Líquido Pollo y Salmón Deligato (Dia)
INSERT INTO foods (
  id,
  household_id,
  created_by,
  name,
  brand,
  food_type,
  calories_per_100g,
  protein_percentage,
  fat_percentage,
  moisture_percentage,
  package_size_grams,
  price_per_package,
  ingredients,
  suitable_for_species,
  age_range
) VALUES (
  gen_random_uuid(),
  '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b',
  '8a378ce2-2a28-4c95-a5c1-1f7d6f1fd8c3',
  'Snack Líquido Pollo y Salmón',
  'Deligato (Dia)',
  'treats',
  110,
  7.0,
  4.5,
  82.0,
  105, -- 7 sobres x 15g
  1.40,
  'Carnes y subproductos animales (pollo 6%), pescado (salmón 6%), subproductos vegetales, aceites y grasas, leche y subproductos lácteos, inulina 0.1%.',
  ARRAY['cat'],
  'adult'
);

-- 7. Pienso Salmón y Atún Deligato (Dia)
INSERT INTO foods (
  id,
  household_id,
  created_by,
  name,
  brand,
  food_type,
  calories_per_100g,
  protein_percentage,
  fat_percentage,
  carbs_percentage,
  fiber_percentage,
  moisture_percentage,
  package_size_grams,
  price_per_package,
  ingredients,
  suitable_for_species,
  age_range
) VALUES (
  gen_random_uuid(),
  '8164ef94-d8b5-4fdb-80ba-0afae2a9c00b',
  '8a378ce2-2a28-4c95-a5c1-1f7d6f1fd8c3',
  'Pienso Salmón y Atún',
  'Deligato (Dia)',
  'dry',
  385,
  32.0,
  13.0,
  33.0,
  3.0, -- 3% lignocelulosa en croqueta especial
  8.0,
  1500,
  2.89,
  'Carnes y subproductos animales, cereales, pescados (salmón 15%, atún 5%), verduras (guisantes 4%), aceites y grasas, minerales, levaduras, frutas (arándanos 100mg/kg).',
  ARRAY['cat'],
  'adult'
);

-- Registrar migración
INSERT INTO _migrations (migration_name) 
VALUES ('20251111_093000_add_sik_foods.sql');

COMMIT;
