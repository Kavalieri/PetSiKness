-- ============================================
-- Migración: Unificar pet_portion_schedules + feedings → portions
-- Fecha: 2025-11-12
-- Issue: #70
-- Descripción: Modelo unificado donde date=NULL son plantillas
--              y date!=NULL son registros específicos de día
-- ============================================

BEGIN;

-- ============================================
-- PASO 1: Crear tabla unificada `portions`
-- ============================================

CREATE TABLE portions (
  -- Identidad
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  
  -- Configuración (siempre presente)
  portion_number INTEGER NOT NULL CHECK (portion_number > 0),
  scheduled_time TIME NOT NULL,
  expected_grams INTEGER CHECK (expected_grams IS NULL OR expected_grams > 0),
  
  -- Fecha específica (NULL = plantilla, DATE = día concreto)
  date DATE NULL,
  
  -- Ejecución (NULL hasta que se registre)
  food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
  actual_time TIME,
  served_grams INTEGER CHECK (served_grams IS NULL OR served_grams > 0),
  leftover_grams INTEGER CHECK (leftover_grams IS NULL OR leftover_grams >= 0),
  eaten_grams INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN served_grams IS NOT NULL AND leftover_grams IS NOT NULL 
      THEN served_grams - leftover_grams 
      ELSE NULL 
    END
  ) STORED,
  
  -- Comportamiento alimentario
  appetite_rating TEXT CHECK (appetite_rating IN ('refused', 'poor', 'normal', 'good', 'excellent')),
  eating_speed TEXT CHECK (eating_speed IN ('very_slow', 'slow', 'normal', 'fast', 'very_fast')),
  
  -- Resultados digestivos
  vomited BOOLEAN DEFAULT FALSE,
  had_diarrhea BOOLEAN DEFAULT FALSE,
  had_stool BOOLEAN,
  stool_quality TEXT CHECK (stool_quality IN ('liquid', 'soft', 'normal', 'hard')),
  
  -- Observaciones
  notes TEXT,
  
  -- Metadata
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints críticos
  UNIQUE (pet_id, portion_number, date), -- ✅ Previene duplicados automáticamente
  CHECK (
    -- Si tiene fecha, debe tener al menos served_grams registrado
    date IS NULL OR served_grams IS NOT NULL
  ),
  CHECK (
    -- Si tiene served/leftover, deben ser consistentes
    served_grams IS NULL OR leftover_grams IS NULL OR leftover_grams <= served_grams
  )
);

-- Ownership y permisos
ALTER TABLE portions OWNER TO pet_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON portions TO pet_user;

-- Comentarios
COMMENT ON TABLE portions IS 'Modelo unificado: date=NULL son plantillas, date!=NULL son registros específicos';
COMMENT ON COLUMN portions.date IS 'NULL = plantilla de configuración, NOT NULL = ración de día específico';
COMMENT ON COLUMN portions.served_grams IS 'Cantidad servida (NULL si aún no registrada)';
COMMENT ON COLUMN portions.leftover_grams IS 'Cantidad sobrante (NULL si aún no registrada)';
COMMENT ON COLUMN portions.eaten_grams IS 'Calculado: served_grams - leftover_grams';

-- Índices para performance
CREATE INDEX idx_portions_pet_date ON portions(pet_id, date);
CREATE INDEX idx_portions_pet_pending ON portions(pet_id, date) WHERE date IS NOT NULL AND served_grams IS NULL;
CREATE INDEX idx_portions_scheduled ON portions(scheduled_time) WHERE date IS NULL;
CREATE INDEX idx_portions_household ON portions(household_id);
CREATE INDEX idx_portions_food ON portions(food_id) WHERE food_id IS NOT NULL;

-- Trigger para updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON portions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PASO 2: Migrar datos de pet_portion_schedules (plantillas)
-- ============================================

INSERT INTO portions (
  id,
  household_id,
  pet_id,
  portion_number,
  scheduled_time,
  expected_grams,
  date,  -- NULL para plantillas
  notes,
  created_at,
  updated_at
)
SELECT 
  ps.id,
  p.household_id,
  ps.pet_id,
  ps.portion_number,
  ps.scheduled_time,
  ps.expected_grams,
  NULL as date,  -- ✅ Marca como plantilla
  ps.notes,
  ps.created_at,
  ps.updated_at
FROM pet_portion_schedules ps
JOIN pets p ON p.id = ps.pet_id;

-- Verificar que se migraron todas las plantillas
DO $$
DECLARE
  old_count INTEGER;
  new_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_count FROM pet_portion_schedules;
  SELECT COUNT(*) INTO new_count FROM portions WHERE date IS NULL;
  
  IF old_count != new_count THEN
    RAISE EXCEPTION 'Migración de plantillas falló: esperados %, encontrados %', old_count, new_count;
  END IF;
  
  RAISE NOTICE 'Plantillas migradas correctamente: %', new_count;
END $$;

-- ============================================
-- PASO 3: Migrar datos de feedings (registros históricos)
-- ============================================

INSERT INTO portions (
  household_id,
  pet_id,
  portion_number,
  scheduled_time,
  expected_grams,
  date,  -- NOT NULL para registros históricos
  food_id,
  actual_time,
  served_grams,
  leftover_grams,
  appetite_rating,
  eating_speed,
  vomited,
  had_diarrhea,
  had_stool,
  stool_quality,
  notes,
  recorded_by,
  created_at,
  updated_at
)
SELECT 
  f.household_id,
  f.pet_id,
  f.portion_number,
  COALESCE(ps.scheduled_time, f.feeding_time, '12:00:00'::TIME) as scheduled_time,
  ps.expected_grams,
  f.feeding_date as date,  -- ✅ Marca como registro de día
  f.food_id,
  f.feeding_time as actual_time,
  f.amount_served_grams as served_grams,
  f.amount_leftover_grams as leftover_grams,
  f.appetite_rating,
  f.eating_speed,
  f.vomited,
  f.had_diarrhea,
  f.had_stool,
  f.stool_quality,
  f.notes,
  f.recorded_by,
  f.created_at,
  f.updated_at
FROM feedings f
LEFT JOIN pet_portion_schedules ps 
  ON ps.pet_id = f.pet_id 
  AND ps.portion_number = f.portion_number;

-- Verificar que se migraron todos los feedings
DO $$
DECLARE
  old_count INTEGER;
  new_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_count FROM feedings;
  SELECT COUNT(*) INTO new_count FROM portions WHERE date IS NOT NULL;
  
  IF old_count != new_count THEN
    RAISE EXCEPTION 'Migración de feedings falló: esperados %, encontrados %', old_count, new_count;
  END IF;
  
  RAISE NOTICE 'Feedings migrados correctamente: %', new_count;
END $$;

-- ============================================
-- PASO 4: Backup y deprecar tablas antiguas
-- ============================================

-- Renombrar tablas antiguas (mantener como backup temporal)
ALTER TABLE pet_portion_schedules RENAME TO _deprecated_pet_portion_schedules;
ALTER TABLE feedings RENAME TO _deprecated_feedings;

-- Quitar permisos para prevenir uso accidental
REVOKE ALL ON _deprecated_pet_portion_schedules FROM pet_user;
REVOKE ALL ON _deprecated_feedings FROM pet_user;

COMMENT ON TABLE _deprecated_pet_portion_schedules IS 'DEPRECATED: Migrado a portions. Mantener 30 días para rollback.';
COMMENT ON TABLE _deprecated_feedings IS 'DEPRECATED: Migrado a portions. Mantener 30 días para rollback.';

-- ============================================
-- PASO 5: Recrear vista daily_feeding_summary
-- ============================================

DROP VIEW IF EXISTS daily_feeding_summary;

CREATE VIEW daily_feeding_summary AS
SELECT 
  p.pet_id,
  p.date as feeding_date,
  pet.name as pet_name,
  pet.daily_food_goal_grams,
  COUNT(*) as total_portions,
  SUM(p.served_grams) as total_served,
  SUM(p.eaten_grams) as total_eaten,
  SUM(p.leftover_grams) as total_leftover,
  ROUND(
    (SUM(p.served_grams)::NUMERIC / NULLIF(pet.daily_food_goal_grams, 0)) * 100,
    1
  ) as goal_achievement_percentage,
  CASE 
    WHEN SUM(p.served_grams) < pet.daily_food_goal_grams * 0.9 THEN 'under'
    WHEN SUM(p.served_grams) > pet.daily_food_goal_grams * 1.1 THEN 'over'
    ELSE 'met'
  END as goal_status
FROM portions p
JOIN pets pet ON pet.id = p.pet_id
WHERE p.date IS NOT NULL  -- Solo registros de días específicos
GROUP BY p.pet_id, p.date, pet.name, pet.daily_food_goal_grams;

ALTER VIEW daily_feeding_summary OWNER TO pet_owner;
GRANT SELECT ON daily_feeding_summary TO pet_user;

COMMENT ON VIEW daily_feeding_summary IS 'Resumen diario calculado desde tabla unificada portions';

-- ============================================
-- PASO 6: Registrar migración
-- ============================================

INSERT INTO _migrations (migration_name) 
VALUES ('20251112_145700_unify_portions_tables.sql');

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

DO $$
DECLARE
  template_count INTEGER;
  records_count INTEGER;
  pets_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO template_count FROM portions WHERE date IS NULL;
  SELECT COUNT(*) INTO records_count FROM portions WHERE date IS NOT NULL;
  SELECT COUNT(*) INTO pets_count FROM pets WHERE is_active = true;
  
  RAISE NOTICE '================================';
  RAISE NOTICE 'MIGRACIÓN COMPLETADA';
  RAISE NOTICE '================================';
  RAISE NOTICE 'Plantillas migradas: %', template_count;
  RAISE NOTICE 'Registros históricos migrados: %', records_count;
  RAISE NOTICE 'Mascotas activas: %', pets_count;
  RAISE NOTICE '================================';
END $$;

COMMIT;
