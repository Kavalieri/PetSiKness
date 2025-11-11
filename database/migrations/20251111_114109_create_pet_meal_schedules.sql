-- ============================================
-- Descripción: Crear tabla pet_meal_schedules para horarios de tomas programadas
-- Fecha: 2025-11-11
-- Autor: Pet SiKness Team
-- ============================================
--
-- CONTEXTO:
-- Esta migración implementa el sistema de tomas programadas con horarios específicos.
-- Cada mascota puede tener múltiples tomas diarias (definidas en daily_meals_target),
-- y cada toma tiene un horario programado que permite:
-- 
-- 1. Balance por toma (no solo global al final del día)
-- 2. Alertas de cumplimiento en tiempo real
-- 3. Análisis de puntualidad y adherencia al plan alimenticio
--
-- ESTRUCTURA:
-- - pet_id: FK a pets
-- - meal_number: Número de toma (1, 2, 3, ...)
-- - scheduled_time: Hora programada (ej: 08:00, 14:00, 20:00)
-- 
-- CONSTRAINTS:
-- - Combinación (pet_id, meal_number) única
-- - meal_number > 0
-- - scheduled_time en formato TIME válido
--
-- ============================================

BEGIN;

-- ============================================
-- 1. CREAR TABLA pet_meal_schedules
-- ============================================

CREATE TABLE IF NOT EXISTS pet_meal_schedules (
  -- Identificación
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id            UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  
  -- Definición de toma
  meal_number       INTEGER NOT NULL CHECK (meal_number > 0),
  scheduled_time    TIME NOT NULL,
  
  -- Restricciones adicionales
  notes             TEXT,
  
  -- Auditoría
  created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_pet_meal UNIQUE (pet_id, meal_number)
);

-- Comentarios de documentación
COMMENT ON TABLE pet_meal_schedules IS 
  'Horarios programados de tomas de comida para cada mascota. Permite balance por toma y alertas de cumplimiento.';

COMMENT ON COLUMN pet_meal_schedules.meal_number IS 
  'Número secuencial de la toma (1, 2, 3...). Debe coincidir con daily_meals_target de la mascota.';

COMMENT ON COLUMN pet_meal_schedules.scheduled_time IS 
  'Hora programada para esta toma (ej: 08:00, 14:00, 20:00). Usado para calcular puntualidad y alertas.';

-- ============================================
-- 2. ÍNDICES
-- ============================================

-- Índice para consultas por mascota (muy frecuente)
CREATE INDEX IF NOT EXISTS idx_pet_meal_schedules_pet_id 
  ON pet_meal_schedules(pet_id);

-- Índice para ordenamiento por horario
CREATE INDEX IF NOT EXISTS idx_pet_meal_schedules_scheduled_time 
  ON pet_meal_schedules(scheduled_time);

-- Índice compuesto para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_pet_meal_schedules_pet_meal 
  ON pet_meal_schedules(pet_id, meal_number);

-- ============================================
-- 3. TRIGGER para updated_at
-- ============================================

-- Reutilizar función existente update_updated_at_column()
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON pet_meal_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. OWNERSHIP y PERMISOS
-- ============================================

-- Cambiar ownership a pet_owner (owner de todos los objetos)
ALTER TABLE pet_meal_schedules OWNER TO pet_owner;

-- Permisos para pet_user (aplicación)
GRANT SELECT, INSERT, UPDATE, DELETE ON pet_meal_schedules TO pet_user;

-- ============================================
-- 5. DATOS INICIALES (opcional)
-- ============================================

-- Para mascotas existentes que tienen daily_meals_target definido,
-- crear horarios por defecto basados en el número de tomas:
-- 
-- 1 toma  → 12:00
-- 2 tomas → 08:00, 20:00
-- 3 tomas → 08:00, 14:00, 20:00
-- 4 tomas → 07:00, 12:00, 17:00, 21:00

INSERT INTO pet_meal_schedules (pet_id, meal_number, scheduled_time)
SELECT 
  p.id as pet_id,
  series.meal_num as meal_number,
  CASE 
    -- 1 toma: mediodía
    WHEN p.daily_meals_target = 1 AND series.meal_num = 1 THEN '12:00:00'::time
    
    -- 2 tomas: mañana y noche
    WHEN p.daily_meals_target = 2 AND series.meal_num = 1 THEN '08:00:00'::time
    WHEN p.daily_meals_target = 2 AND series.meal_num = 2 THEN '20:00:00'::time
    
    -- 3 tomas: mañana, tarde, noche
    WHEN p.daily_meals_target = 3 AND series.meal_num = 1 THEN '08:00:00'::time
    WHEN p.daily_meals_target = 3 AND series.meal_num = 2 THEN '14:00:00'::time
    WHEN p.daily_meals_target = 3 AND series.meal_num = 3 THEN '20:00:00'::time
    
    -- 4 tomas: mañana, mediodía, tarde, noche
    WHEN p.daily_meals_target = 4 AND series.meal_num = 1 THEN '07:00:00'::time
    WHEN p.daily_meals_target = 4 AND series.meal_num = 2 THEN '12:00:00'::time
    WHEN p.daily_meals_target = 4 AND series.meal_num = 3 THEN '17:00:00'::time
    WHEN p.daily_meals_target = 4 AND series.meal_num = 4 THEN '21:00:00'::time
    
    -- 5+ tomas: distribuir uniformemente en 12 horas (7:00 - 19:00)
    ELSE ('07:00:00'::time + (series.meal_num - 1) * interval '12 hours' / p.daily_meals_target)
  END as scheduled_time
FROM pets p
CROSS JOIN LATERAL generate_series(1, COALESCE(p.daily_meals_target, 2)) AS series(meal_num)
WHERE p.is_active = true
  AND p.daily_meals_target IS NOT NULL
  AND p.daily_meals_target > 0
ON CONFLICT (pet_id, meal_number) DO NOTHING;

-- Log de cuántos registros se crearon
DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inserted_count FROM pet_meal_schedules;
  RAISE NOTICE 'Horarios de tomas creados: % registros', inserted_count;
END $$;

-- ============================================
-- 6. REGISTRAR MIGRACIÓN
-- ============================================

INSERT INTO _migrations (migration_name) 
VALUES ('20251111_114109_create_pet_meal_schedules.sql');

COMMIT;

-- ============================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================

-- Descomentar para verificar:
-- SELECT p.name, p.daily_meals_target, pms.meal_number, pms.scheduled_time
-- FROM pets p
-- LEFT JOIN pet_meal_schedules pms ON pms.pet_id = p.id
-- WHERE p.is_active = true
-- ORDER BY p.name, pms.meal_number;
