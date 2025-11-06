-- =====================================================
-- MIGRACIÓN 004: Corregir modelo de Mix de iSeeds
-- =====================================================
--
-- PROBLEMA:
-- La tabla mix_iseeds solo soporta UNA receta por mix.
-- Necesita soportar MÚLTIPLES recetas para crear mezclas complejas.
--
-- SOLUCIÓN:
-- 1. Convertir mix_iseeds en entidad independiente con nombre/descripción
-- 2. Crear tabla intermedia mix_recetas para relación N:M
-- 3. Permitir que un mix contenga múltiples recetas con cantidades
--
-- CAMBIOS:
-- - Mix_iSeeds: Agregar nombre y descripción, quitar id_receta y cantidad
-- - Mix_recetas: Nueva tabla intermedia (mix_iseeds ←→ receta)
-- =====================================================

-- =====================================================
-- 1. PRESERVAR DATOS EXISTENTES (si los hay)
-- =====================================================

-- Crear tabla temporal para datos existentes
CREATE TEMP TABLE temp_mix_data AS
SELECT
    id_mix,
    id_receta,
    cantidad,
    created_at,
    updated_at
FROM Mix_iSeeds
WHERE id_receta IS NOT NULL
  AND deleted_at IS NULL;

-- =====================================================
-- 2. MODIFICAR TABLA MIX_ISEEDS
-- =====================================================

-- Drop constraint FK existente si existe
ALTER TABLE Mix_iSeeds
DROP CONSTRAINT IF EXISTS mix_iseeds_id_receta_fkey;

-- Quitar columnas obsoletas
ALTER TABLE Mix_iSeeds
DROP COLUMN IF EXISTS id_receta,
DROP COLUMN IF EXISTS cantidad;

-- Agregar nuevas columnas
ALTER TABLE Mix_iSeeds
ADD COLUMN IF NOT EXISTS nombre VARCHAR(255),
ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- =====================================================
-- 3. CREAR TABLA INTERMEDIA MIX_RECETAS
-- =====================================================

-- Tabla intermedia para relación N:M entre Mix_iSeeds y Receta
CREATE TABLE IF NOT EXISTS Mix_recetas (
    id_mix UUID NOT NULL REFERENCES Mix_iSeeds(id_mix) ON DELETE CASCADE,
    id_receta UUID NOT NULL REFERENCES Receta(id_receta) ON DELETE CASCADE,
    cantidad_iseeds INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    PRIMARY KEY (id_mix, id_receta)
);

-- Índices para mejorar performance en queries
CREATE INDEX IF NOT EXISTS idx_mix_recetas_id_mix
    ON Mix_recetas(id_mix)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_mix_recetas_id_receta
    ON Mix_recetas(id_receta)
    WHERE deleted_at IS NULL;

-- =====================================================
-- 4. MIGRAR DATOS EXISTENTES
-- =====================================================

-- Actualizar mix_iseeds existentes con nombre descriptivo
UPDATE Mix_iSeeds m
SET
    nombre = COALESCE(
        (SELECT r.nombre
         FROM temp_mix_data tmd
         JOIN Receta r ON r.id_receta = tmd.id_receta
         WHERE tmd.id_mix = m.id_mix
         LIMIT 1),
        'Mix ' || LEFT(m.id_mix::text, 8)
    ),
    descripcion = 'Migrado automáticamente desde modelo anterior'
WHERE nombre IS NULL;

-- Migrar relaciones a mix_recetas
INSERT INTO Mix_recetas (id_mix, id_receta, cantidad_iseeds, created_at, updated_at)
SELECT
    id_mix,
    id_receta,
    COALESCE(cantidad, 0) as cantidad_iseeds,
    created_at,
    updated_at
FROM temp_mix_data
ON CONFLICT (id_mix, id_receta) DO NOTHING;

-- Limpiar tabla temporal
DROP TABLE IF EXISTS temp_mix_data;

-- =====================================================
-- 5. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Trigger para Mix_recetas
CREATE TRIGGER trigger_update_mix_recetas
    BEFORE UPDATE ON Mix_recetas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 6. COMENTARIOS EN TABLAS
-- =====================================================

COMMENT ON TABLE Mix_iSeeds IS
'Mezclas de semillas (iSeeds). Un mix puede contener múltiples recetas con cantidades específicas.';

COMMENT ON COLUMN Mix_iSeeds.nombre IS
'Nombre descriptivo del mix de semillas';

COMMENT ON COLUMN Mix_iSeeds.descripcion IS
'Descripción detallada del mix y su propósito';

COMMENT ON TABLE Mix_recetas IS
'Tabla intermedia que relaciona mixes con recetas. Permite que un mix contenga múltiples recetas.';

COMMENT ON COLUMN Mix_recetas.cantidad_iseeds IS
'Cantidad de iSeeds de esta receta en el mix';

-- =====================================================
-- 7. VALIDACIONES
-- =====================================================

-- Agregar constraint para cantidad positiva
ALTER TABLE Mix_recetas
ADD CONSTRAINT mix_recetas_cantidad_positive
CHECK (cantidad_iseeds >= 0);

-- =====================================================
-- FIN DE MIGRACIÓN 004
-- =====================================================

-- Verificación: Contar registros migrados
DO $$
DECLARE
    mix_count INTEGER;
    relaciones_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO mix_count FROM Mix_iSeeds WHERE deleted_at IS NULL;
    SELECT COUNT(*) INTO relaciones_count FROM Mix_recetas WHERE deleted_at IS NULL;

    RAISE NOTICE 'Migración completada:';
    RAISE NOTICE '  - Mixes activos: %', mix_count;
    RAISE NOTICE '  - Relaciones mix-receta: %', relaciones_count;
END $$;
