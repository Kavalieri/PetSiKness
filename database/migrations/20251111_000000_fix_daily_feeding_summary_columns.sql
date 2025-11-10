-- ============================================
-- Fix daily_feeding_summary View Columns
-- Fecha: 2025-11-11
-- Descripción: Recrear vista con nombres de columnas correctos
-- Autor: GitHub Copilot
-- ============================================

SET ROLE pet_owner;

-- Drop la vista existente
DROP VIEW IF EXISTS daily_feeding_summary;

-- Recrear con nombres correctos y columnas booleanas
CREATE VIEW daily_feeding_summary AS
SELECT 
  f.pet_id,
  f.feeding_date,
  p.name as pet_name,
  p.daily_food_goal_grams,
  COUNT(*) as total_meals,
  
  -- Columnas con sufijo _grams (como espera el código)
  SUM(f.amount_served_grams) as total_served_grams,
  SUM(f.amount_eaten_grams) as total_eaten_grams,
  SUM(f.amount_leftover_grams) as total_leftover_grams,
  
  -- Porcentaje de cumplimiento (nombre correcto)
  ROUND(
    (SUM(f.amount_eaten_grams)::NUMERIC / NULLIF(p.daily_food_goal_grams, 0)) * 100,
    2
  ) as goal_achievement_pct,
  
  -- Columnas booleanas para facilitar filtros
  (SUM(f.amount_eaten_grams) < p.daily_food_goal_grams * 0.9) as under_target,
  (SUM(f.amount_eaten_grams) BETWEEN p.daily_food_goal_grams * 0.9 AND p.daily_food_goal_grams * 1.1) as met_target,
  (SUM(f.amount_eaten_grams) > p.daily_food_goal_grams * 1.1) as over_target,
  
  -- Status como enum (mantener compatibilidad)
  CASE 
    WHEN SUM(f.amount_eaten_grams) < p.daily_food_goal_grams * 0.9 THEN 'under'
    WHEN SUM(f.amount_eaten_grams) BETWEEN p.daily_food_goal_grams * 0.9 AND p.daily_food_goal_grams * 1.1 THEN 'met'
    ELSE 'over'
  END as goal_status
FROM feedings f
JOIN pets p ON p.id = f.pet_id
GROUP BY f.pet_id, f.feeding_date, p.name, p.daily_food_goal_grams;

ALTER VIEW daily_feeding_summary OWNER TO pet_owner;
GRANT SELECT ON daily_feeding_summary TO pet_user;

COMMENT ON VIEW daily_feeding_summary IS 'Resumen diario: total comido vs objetivo por mascota (columnas corregidas)';

-- Verificar que funciona
SELECT COUNT(*) as total_records FROM daily_feeding_summary;
