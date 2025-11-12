-- =====================================================
-- Migration: Add foreign key for id_receta in Produccion_iSeeds
-- Purpose: Properly link productions to recetas with FK constraint
-- =====================================================

BEGIN;

-- Add foreign key constraint for id_receta
ALTER TABLE Produccion_iSeeds
ADD CONSTRAINT produccion_iseeds_id_receta_fkey
FOREIGN KEY (id_receta) REFERENCES Receta(id_receta) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_produccion_iseeds_receta ON Produccion_iSeeds(id_receta);

-- Add comment explaining the relationship
COMMENT ON COLUMN Produccion_iSeeds.id_receta IS
'FK to Receta - links this production to a specific recipe formula';

COMMIT;

-- Verification message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: FK constraint added for id_receta in Produccion_iSeeds';
END $$;
