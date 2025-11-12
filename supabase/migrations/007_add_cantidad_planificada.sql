-- =====================================================
-- Migration: Add cantidad_planificada and cantidad_real to Produccion_iSeeds
-- Purpose: Track planned vs actual production quantities
-- =====================================================

BEGIN;

-- Add cantidad_planificada column
-- This represents the planned/target quantity for the production
ALTER TABLE Produccion_iSeeds
ADD COLUMN cantidad_planificada INT NOT NULL DEFAULT 0;

-- Add cantidad_real column
-- This will be filled when the production is completed
-- Nullable to differentiate between not-yet-completed and completed with 0
ALTER TABLE Produccion_iSeeds
ADD COLUMN cantidad_real INT;

-- Add comments explaining the columns
COMMENT ON COLUMN Produccion_iSeeds.cantidad_planificada IS
'Planned/target quantity of iSeeds to produce. Set during planning phase.';

COMMENT ON COLUMN Produccion_iSeeds.cantidad_real IS
'Actual quantity of iSeeds produced. Filled when production is completed. NULL = not yet completed.';

COMMIT;

-- Verification message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: cantidad_planificada and cantidad_real columns added to Produccion_iSeeds';
END $$;
