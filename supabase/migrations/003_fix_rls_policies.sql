-- =====================================================
-- REFOREST - FIX RLS POLICIES
-- Corrección de políticas RLS con path correcto para role
-- =====================================================

-- =====================================================
-- PROBLEMA:
-- =====================================================
-- Las políticas RLS originales usaban:
--   auth.jwt()->>'role'
--
-- Pero el role está almacenado en user_metadata:
--   auth.jwt() -> 'user_metadata' ->> 'role'
--
-- Este fix corrige todas las políticas de escritura para usar
-- el path correcto hacia el rol del usuario.
-- =====================================================

-- =====================================================
-- 1. ELIMINAR POLÍTICAS INCORRECTAS
-- =====================================================

-- Insumo
DROP POLICY IF EXISTS "modify_insumos_for_operators" ON insumo;

-- Proyecto
DROP POLICY IF EXISTS "modify_proyectos_for_operators" ON proyecto;

-- Receta
DROP POLICY IF EXISTS "modify_recetas_for_operators" ON receta;

-- Producción de iSeeds
DROP POLICY IF EXISTS "modify_produccion_iseeds_for_operators" ON produccion_iseeds;

-- Registro de ensayos de laboratorio
DROP POLICY IF EXISTS "modify_registro_ensayos_for_operators" ON registro_ensayos_laboratorio;

-- Cliente
DROP POLICY IF EXISTS "modify_clientes_for_operators" ON cliente;

-- Disponibilidad
DROP POLICY IF EXISTS "modify_disponibilidad_for_operators" ON disponibilidad;

-- Consumo por proyecto
DROP POLICY IF EXISTS "modify_consumo_proyecto_for_operators" ON consumo_proyecto;

-- Receta_insumo
DROP POLICY IF EXISTS "modify_receta_insumo_for_operators" ON receta_insumo;

-- Producción de insumo
DROP POLICY IF EXISTS "modify_produccion_insumo_for_operators" ON produccion_insumo;

-- Mix de iSeeds
DROP POLICY IF EXISTS "modify_mix_iseeds_for_operators" ON mix_iseeds;

-- Movimiento de laboratorio
DROP POLICY IF EXISTS "modify_movimiento_laboratorio_for_operators" ON movimiento_laboratorio;

-- Registro de requerimiento de ensayos
DROP POLICY IF EXISTS "modify_requerimiento_ensayos_for_operators" ON registro_requerimiento_ensayos;

-- Resultados de parámetros
DROP POLICY IF EXISTS "modify_resultados_parametros_for_operators" ON resultados_parametros;

-- Receta_Insumo_ensayo
DROP POLICY IF EXISTS "modify_receta_insumo_ensayo_for_operators" ON receta_insumo_ensayo;

-- =====================================================
-- 2. RECREAR POLÍTICAS CON PATH CORRECTO
-- =====================================================
-- Ahora usamos: auth.jwt() -> 'user_metadata' ->> 'role'
-- Esto permite acceder correctamente al rol almacenado en user_metadata
--
-- Roles permitidos para escritura:
-- - 'admin': Superusuario (acceso completo)
-- - 'operador_lab': Operador de laboratorio
-- - 'operador_campo': Operador de campo
--
-- El rol 'viewer' solo tiene permisos de lectura (cubierto por políticas SELECT)
-- =====================================================

-- =====================================================
-- INSUMO
-- =====================================================
-- Permite INSERT, UPDATE, DELETE de insumos a usuarios con rol autorizado
CREATE POLICY "modify_insumos_for_operators" ON insumo
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- =====================================================
-- PROYECTO
-- =====================================================
-- Permite gestión de proyectos forestales a usuarios autorizados
CREATE POLICY "modify_proyectos_for_operators" ON proyecto
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- =====================================================
-- RECETA
-- =====================================================
-- Permite gestión de recetas de iSeeds a usuarios autorizados
CREATE POLICY "modify_recetas_for_operators" ON receta
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- =====================================================
-- PRODUCCIÓN DE ISEEDS
-- =====================================================
-- Permite gestión de producción de iSeeds a usuarios autorizados
CREATE POLICY "modify_produccion_iseeds_for_operators" ON produccion_iseeds
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- =====================================================
-- REGISTRO DE ENSAYOS DE LABORATORIO
-- =====================================================
-- Permite gestión de ensayos de laboratorio a usuarios autorizados
CREATE POLICY "modify_registro_ensayos_for_operators" ON registro_ensayos_laboratorio
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- =====================================================
-- CLIENTE
-- =====================================================
-- Permite gestión de clientes a usuarios autorizados
CREATE POLICY "modify_clientes_for_operators" ON cliente
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- =====================================================
-- DISPONIBILIDAD
-- =====================================================
-- Permite gestión de disponibilidad de iSeeds a usuarios autorizados
CREATE POLICY "modify_disponibilidad_for_operators" ON disponibilidad
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- =====================================================
-- CONSUMO POR PROYECTO
-- =====================================================
-- Permite gestión de consumo de iSeeds por proyecto a usuarios autorizados
CREATE POLICY "modify_consumo_proyecto_for_operators" ON consumo_proyecto
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- =====================================================
-- RECETA_INSUMO (Composición de recetas)
-- =====================================================
-- Permite gestión de composición de recetas a usuarios autorizados
CREATE POLICY "modify_receta_insumo_for_operators" ON receta_insumo
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- =====================================================
-- PRODUCCIÓN DE INSUMO
-- =====================================================
-- Permite gestión de producción de insumos a usuarios autorizados
CREATE POLICY "modify_produccion_insumo_for_operators" ON produccion_insumo
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- =====================================================
-- MIX DE ISEEDS
-- =====================================================
-- Permite gestión de mix de iSeeds a usuarios autorizados
CREATE POLICY "modify_mix_iseeds_for_operators" ON mix_iseeds
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- =====================================================
-- MOVIMIENTO DE LABORATORIO
-- =====================================================
-- Permite gestión de movimientos de laboratorio a usuarios autorizados
CREATE POLICY "modify_movimiento_laboratorio_for_operators" ON movimiento_laboratorio
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- =====================================================
-- REGISTRO DE REQUERIMIENTO DE ENSAYOS
-- =====================================================
-- Permite gestión de requerimientos de ensayos a usuarios autorizados
CREATE POLICY "modify_requerimiento_ensayos_for_operators" ON registro_requerimiento_ensayos
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- =====================================================
-- RESULTADOS DE PARÁMETROS
-- =====================================================
-- Permite gestión de resultados de parámetros de ensayos a usuarios autorizados
CREATE POLICY "modify_resultados_parametros_for_operators" ON resultados_parametros
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- =====================================================
-- RECETA_INSUMO_ENSAYO (Relación recetas-ensayos)
-- =====================================================
-- Permite gestión de relación recetas-ensayos a usuarios autorizados
CREATE POLICY "modify_receta_insumo_ensayo_for_operators" ON receta_insumo_ensayo
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================
-- Esta migración corrige el acceso al rol del usuario en las políticas RLS.
--
-- ANTES: auth.jwt()->>'role'
-- AHORA: auth.jwt() -> 'user_metadata' ->> 'role'
--
-- Las políticas SELECT (lectura) no necesitan cambios porque ya permiten
-- acceso a todos los usuarios autenticados.
--
-- Las políticas modificadas controlan:
-- - INSERT: Crear nuevos registros
-- - UPDATE: Modificar registros existentes
-- - DELETE: Eliminar registros (soft delete con deleted_at)
--
-- Solo usuarios con roles autorizados pueden realizar estas operaciones:
-- ✅ admin (acceso completo)
-- ✅ operador_lab (gestión de laboratorio)
-- ✅ operador_campo (gestión de campo)
-- ❌ viewer (solo lectura)
-- =====================================================
