-- =====================================================
-- Migration: Add id_produccion to Produccion_insumo table
-- Purpose: Link insumos consumed to specific productions
-- =====================================================

BEGIN;

-- Add id_produccion column to Produccion_insumo
ALTER TABLE Produccion_insumo
ADD COLUMN id_produccion UUID REFERENCES Produccion_iSeeds(id_produccion) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_produccion_insumo_produccion ON Produccion_insumo(id_produccion);

-- Add comment explaining the relationship
COMMENT ON COLUMN Produccion_insumo.id_produccion IS
'FK to Produccion_iSeeds - links this insumo consumption record to a specific production';

COMMIT;

-- Verification message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: id_produccion added to Produccion_insumo';
END $$;
