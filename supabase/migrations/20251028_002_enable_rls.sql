-- =====================================================
-- REFOREST - ROW LEVEL SECURITY (RLS)
-- Configuración de políticas de seguridad a nivel de fila
-- =====================================================

-- =====================================================
-- DESCRIPCIÓN DE ROLES DEL SISTEMA
-- =====================================================
-- Los roles se almacenan en el JWT del usuario: auth.jwt()->>'role'
--
-- Roles disponibles:
-- - 'admin': Superusuario (desarrollo y mantenimiento)
-- - 'operador_lab': Gestiona ensayos y producción en laboratorio
-- - 'operador_campo': Gestiona proyectos en campo
-- - 'viewer': Solo lectura (sin permisos de modificación)
--
-- Permisos:
-- - LECTURA (SELECT): Todos los usuarios autenticados
-- - ESCRITURA (INSERT/UPDATE/DELETE): Solo admin, operador_lab, operador_campo
-- =====================================================

-- =====================================================
-- 1. HABILITAR RLS EN TABLAS PRINCIPALES
-- =====================================================
-- Las tablas principales requieren control de acceso basado en roles

ALTER TABLE Cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE Proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE Produccion_iSeeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE Disponibilidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE Consumo_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE Insumo ENABLE ROW LEVEL SECURITY;
ALTER TABLE Receta ENABLE ROW LEVEL SECURITY;
ALTER TABLE Receta_insumo ENABLE ROW LEVEL SECURITY;
ALTER TABLE Produccion_insumo ENABLE ROW LEVEL SECURITY;
ALTER TABLE Mix_iSeeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE Movimiento_laboratorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE Registro_ensayos_laboratorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE Registro_requerimiento_ensayos ENABLE ROW LEVEL SECURITY;
ALTER TABLE Resultados_parametros ENABLE ROW LEVEL SECURITY;
ALTER TABLE Receta_Insumo_ensayo ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. POLÍTICAS DE LECTURA (SELECT)
-- Todos los usuarios autenticados pueden leer todos los datos
-- =====================================================

-- Cliente
CREATE POLICY 'select_all_clientes' ON Cliente
FOR SELECT
TO authenticated
USING (true);

-- Proyecto
CREATE POLICY 'select_all_proyectos' ON Proyecto
FOR SELECT
TO authenticated
USING (true);

-- Producción de iSeeds
CREATE POLICY 'select_all_produccion_iseeds' ON Produccion_iSeeds
FOR SELECT
TO authenticated
USING (true);

-- Disponibilidad
CREATE POLICY 'select_all_disponibilidad' ON Disponibilidad
FOR SELECT
TO authenticated
USING (true);

-- Consumo por proyecto
CREATE POLICY 'select_all_consumo_proyecto' ON Consumo_proyecto
FOR SELECT
TO authenticated
USING (true);

-- Insumo
CREATE POLICY 'select_all_insumos' ON Insumo
FOR SELECT
TO authenticated
USING (true);

-- Receta
CREATE POLICY 'select_all_recetas' ON Receta
FOR SELECT
TO authenticated
USING (true);

-- Receta_insumo (composición de recetas)
CREATE POLICY 'select_all_receta_insumo' ON Receta_insumo
FOR SELECT
TO authenticated
USING (true);

-- Producción de insumo
CREATE POLICY 'select_all_produccion_insumo' ON Produccion_insumo
FOR SELECT
TO authenticated
USING (true);

-- Mix de iSeeds
CREATE POLICY 'select_all_mix_iseeds' ON Mix_iSeeds
FOR SELECT
TO authenticated
USING (true);

-- Movimiento de laboratorio
CREATE POLICY 'select_all_movimiento_laboratorio' ON Movimiento_laboratorio
FOR SELECT
TO authenticated
USING (true);

-- Registro de ensayos de laboratorio
CREATE POLICY 'select_all_registro_ensayos' ON Registro_ensayos_laboratorio
FOR SELECT
TO authenticated
USING (true);

-- Registro de requerimiento de ensayos
CREATE POLICY 'select_all_requerimiento_ensayos' ON Registro_requerimiento_ensayos
FOR SELECT
TO authenticated
USING (true);

-- Resultados de parámetros
CREATE POLICY 'select_all_resultados_parametros' ON Resultados_parametros
FOR SELECT
TO authenticated
USING (true);

-- Receta_Insumo_ensayo (relación recetas-ensayos)
CREATE POLICY 'select_all_receta_insumo_ensayo' ON Receta_Insumo_ensayo
FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- 3. POLÍTICAS DE ESCRITURA (INSERT, UPDATE, DELETE)
-- Solo usuarios con roles: admin, operador_lab, operador_campo
-- =====================================================

-- Cliente
CREATE POLICY 'modify_clientes_for_operators' ON Cliente
FOR ALL
TO authenticated
USING (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- Proyecto
CREATE POLICY 'modify_proyectos_for_operators' ON Proyecto
FOR ALL
TO authenticated
USING (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- Producción de iSeeds
CREATE POLICY 'modify_produccion_iseeds_for_operators' ON Produccion_iSeeds
FOR ALL
TO authenticated
USING (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- Disponibilidad
CREATE POLICY 'modify_disponibilidad_for_operators' ON Disponibilidad
FOR ALL
TO authenticated
USING (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- Consumo por proyecto
CREATE POLICY 'modify_consumo_proyecto_for_operators' ON Consumo_proyecto
FOR ALL
TO authenticated
USING (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- Insumo
CREATE POLICY 'modify_insumos_for_operators' ON Insumo
FOR ALL
TO authenticated
USING (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- Receta
CREATE POLICY 'modify_recetas_for_operators' ON Receta
FOR ALL
TO authenticated
USING (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- Receta_insumo (composición de recetas)
CREATE POLICY 'modify_receta_insumo_for_operators' ON Receta_insumo
FOR ALL
TO authenticated
USING (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- Producción de insumo
CREATE POLICY 'modify_produccion_insumo_for_operators' ON Produccion_insumo
FOR ALL
TO authenticated
USING (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- Mix de iSeeds
CREATE POLICY 'modify_mix_iseeds_for_operators' ON Mix_iSeeds
FOR ALL
TO authenticated
USING (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- Movimiento de laboratorio
CREATE POLICY 'modify_movimiento_laboratorio_for_operators' ON Movimiento_laboratorio
FOR ALL
TO authenticated
USING (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- Registro de ensayos de laboratorio
CREATE POLICY 'modify_registro_ensayos_for_operators' ON Registro_ensayos_laboratorio
FOR ALL
TO authenticated
USING (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- Registro de requerimiento de ensayos
CREATE POLICY 'modify_requerimiento_ensayos_for_operators' ON Registro_requerimiento_ensayos
FOR ALL
TO authenticated
USING (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- Resultados de parámetros
CREATE POLICY 'modify_resultados_parametros_for_operators' ON Resultados_parametros
FOR ALL
TO authenticated
USING (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- Receta_Insumo_ensayo (relación recetas-ensayos)
CREATE POLICY 'modify_receta_insumo_ensayo_for_operators' ON Receta_Insumo_ensayo
FOR ALL
TO authenticated
USING (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
)
WITH CHECK (
  (auth.jwt()->>'role')::text IN ('admin', 'operador_lab', 'operador_campo')
);

-- =====================================================
-- 4. TABLAS CATÁLOGO (SIN RLS)
-- =====================================================
-- Las siguientes tablas NO tienen RLS habilitado.
-- Son catálogos de solo lectura accesibles para todos los usuarios autenticados.
-- La seguridad se maneja a nivel de aplicación (no permiten INSERT/UPDATE/DELETE desde el cliente).
--
-- Tablas sin RLS:
-- - Estado_proyecto
-- - Estado_produccion
-- - Estado_ensayo
-- - Tipo_movimiento
-- - Tipo_consumo
-- - Tipo_ensayo_laboratorio
-- - Unidad_medida
-- - Tipo_insumo
-- - Eco_region
-- - Especie
-- - Ubicacion_insumo
-- - Responsables_laboratorio
-- - Parametros_ensayo
--
-- Estas tablas son de solo lectura desde la aplicación.
-- Las modificaciones solo se realizan mediante migraciones o por el administrador de BD.
-- =====================================================

-- =====================================================
-- NOTAS DE IMPLEMENTACIÓN
-- =====================================================
-- 1. Asegúrate de que los usuarios tengan el campo 'role' en su JWT
--    Configurar en Supabase Dashboard > Authentication > Custom Claims
--
-- 2. Para asignar roles a usuarios, puedes usar:
--    UPDATE auth.users SET raw_user_meta_data =
--      raw_user_meta_data || '{"role": "operador_lab"}'::jsonb
--    WHERE email = 'usuario@example.com';
--
-- 3. Para verificar el rol actual del usuario autenticado:
--    SELECT auth.jwt()->>'role';
--
-- 4. Los usuarios sin rol asignado no podrán modificar datos (solo leer)
--
-- 5. Para deshabilitar RLS temporalmente (solo desarrollo):
--    ALTER TABLE nombre_tabla DISABLE ROW LEVEL SECURITY;
-- =====================================================
