-- ============================================
-- Descripción: Invertir lógica eaten/leftover en feedings
--              - amount_eaten_grams: INPUT → CALCULATED
--              - amount_leftover_grams: CALCULATED → INPUT
-- Fecha: 12 Noviembre 2025
-- Autor: Pet SiKness Team
-- Razón: amount_leftover_grams es más fácil de estimar visualmente
--        que amount_eaten_grams. El usuario registra lo que sobró,
--        el sistema calcula lo que comió.
-- ============================================

BEGIN;

-- 1. Drop vista que depende de amount_leftover_grams
DROP VIEW IF EXISTS daily_feeding_summary CASCADE;

-- 2. Drop columna generada actual (leftover) - ahora sin dependencias
ALTER TABLE feedings DROP COLUMN IF EXISTS amount_leftover_grams;

-- 3. Renombrar eaten → leftover (ahora será input)
ALTER TABLE feedings RENAME COLUMN amount_eaten_grams TO amount_leftover_grams;

-- 4. Crear nueva columna eaten como GENERATED (calculada)
ALTER TABLE feedings 
  ADD COLUMN amount_eaten_grams INTEGER 
  GENERATED ALWAYS AS (amount_served_grams - amount_leftover_grams) STORED;

-- 5. Agregar constraints: leftover no puede ser negativo ni exceder served
ALTER TABLE feedings 
  ADD CONSTRAINT feedings_leftover_non_negative 
  CHECK (amount_leftover_grams >= 0),
  ADD CONSTRAINT feedings_leftover_not_exceed_served 
  CHECK (amount_leftover_grams <= amount_served_grams);

-- 6. Comentarios descriptivos
COMMENT ON COLUMN feedings.amount_leftover_grams IS 
  'Cantidad de comida que sobró (INPUT del usuario). Fácil de estimar visualmente.';

COMMENT ON COLUMN feedings.amount_eaten_grams IS 
  'Cantidad de comida consumida (CALCULADA = servido - sobrante). Auto-generada.';

-- 7. Recrear vista daily_feeding_summary con lógica actualizada
CREATE OR REPLACE VIEW daily_feeding_summary AS
SELECT 
  f.pet_id,
  p.name as pet_name,
  f.feeding_date,
  
  -- Totales del día (calculados desde feedings)
  SUM(f.amount_served_grams) as total_served_grams,
  SUM(f.amount_eaten_grams) as total_eaten_grams,
  SUM(f.amount_leftover_grams) as total_leftover_grams,
  
  -- Meta y logro (basado en SERVIDO, no comido)
  p.daily_food_goal_grams,
  ROUND((SUM(f.amount_served_grams)::DECIMAL / p.daily_food_goal_grams) * 100, 2) 
    as goal_achievement_pct,
  
  -- Indicadores de cumplimiento (basados en SERVIDO)
  CASE
    WHEN SUM(f.amount_served_grams) < p.daily_food_goal_grams * 0.9 
      THEN TRUE ELSE FALSE
  END as under_target,
  
  CASE
    WHEN SUM(f.amount_served_grams) BETWEEN p.daily_food_goal_grams * 0.9 
      AND p.daily_food_goal_grams * 1.1 
      THEN TRUE ELSE FALSE
  END as met_target,
  
  CASE
    WHEN SUM(f.amount_served_grams) > p.daily_food_goal_grams * 1.1 
      THEN TRUE ELSE FALSE
  END as over_target
  
FROM feedings f
JOIN pets p ON p.id = f.pet_id
GROUP BY f.pet_id, p.name, f.feeding_date, p.daily_food_goal_grams;

COMMENT ON VIEW daily_feeding_summary IS 
  'Resumen diario de alimentación por mascota. Meta basada en amount_served_grams (control de porciones).';

-- 8. Registrar migración
INSERT INTO _migrations (migration_name) 
VALUES ('20251112_143512_invert_eaten_leftover_logic.sql');

COMMIT;
