-- =====================================================
-- REFOREST - CONSULTAS DE EJEMPLO
-- Queries útiles para operaciones comunes
-- =====================================================

-- =====================================================
-- 1. CONSULTAS DE RECETAS
-- =====================================================

-- Consultar autor de una receta específica por nombre
SELECT
  r.nombre AS nombre_receta,
  resp.nombre_responsable AS autor
FROM Receta r
JOIN Responsables_laboratorio resp
  ON r.autor = resp.id_responsable_labo
WHERE r.nombre = 'Receta Básica para Algarrobo blanco';

-- Consultar todas las recetas de un autor específico
SELECT
  r.nombre AS nombre_receta,
  resp.nombre_responsable AS autor
FROM Receta r
JOIN Responsables_laboratorio resp
  ON r.autor = resp.id_responsable_labo
WHERE resp.nombre_responsable = 'Pablo Caram';

-- Consultar todas las recetas con o sin autor
SELECT
  r.nombre AS nombre_receta,
  resp.nombre_responsable AS autor
FROM Receta r
LEFT JOIN Responsables_laboratorio resp
  ON r.autor = resp.id_responsable_labo;

-- Consultar todas las recetas sin autor
SELECT
  r.nombre AS nombre_receta,
  resp.nombre_responsable AS autor
FROM Receta r
LEFT JOIN Responsables_laboratorio resp
  ON r.autor = resp.id_responsable_labo
WHERE r.autor IS NULL;

-- =====================================================
-- 2. CONSULTAS DE COMPOSICIÓN DE RECETAS
-- =====================================================

-- Consultar receta completa por ID
SELECT
  r.id_receta,
  r.nombre AS receta,
  i.id_insumo,
  i.nombre AS insumo,
  i.nombre_cientifico,
  ri.cantidad_teorica,
  COALESCE(um.abreviatura, um.nombre) AS unidad
FROM Receta r
JOIN Receta_insumo ri ON ri.id_receta = r.id_receta
JOIN Insumo i ON i.id_insumo = ri.id_insumo
LEFT JOIN Unidad_medida um ON um.id_unidad = ri.unidad_medida
WHERE r.id_receta = 'ID_DE_RECETA_AQUI'
ORDER BY i.nombre;

-- Consultar receta completa por nombre (más útil en UI)
SELECT
  r.id_receta,
  r.nombre AS receta,
  i.nombre AS insumo,
  ri.cantidad_teorica,
  COALESCE(um.abreviatura, um.nombre) AS unidad
FROM Receta r
JOIN Receta_insumo ri ON ri.id_receta = r.id_receta
JOIN Insumo i ON i.id_insumo = ri.id_insumo
LEFT JOIN Unidad_medida um ON um.id_unidad = ri.unidad_medida
WHERE r.nombre = 'Receta Básica para Algarrobo blanco';

-- Consultar cantidad de ingredientes por receta
SELECT
  r.id_receta,
  r.nombre,
  COUNT(ri.id_insumo) AS num_insumos
FROM Receta r
LEFT JOIN Receta_insumo ri ON ri.id_receta = r.id_receta
GROUP BY r.id_receta, r.nombre
ORDER BY num_insumos DESC;

-- =====================================================
-- 3. CONSULTAS DE PROYECTOS
-- =====================================================

-- Consultar proyectos por cliente
SELECT
  p.id_proyecto,
  p.nombre_del_proyecto,
  p.codigo_proyecto,
  c.nombre_cliente,
  ep.nombre AS estado,
  p.fecha_inicio,
  p.fecha_fin
FROM Proyecto p
JOIN Cliente c ON p.id_cliente = c.id_cliente
JOIN Estado_proyecto ep ON p.id_estado_proyecto = ep.id_estado_proyecto
WHERE c.nombre_cliente = 'Fundación Bosques Nativos';

-- Consultar proyectos activos
SELECT
  p.id_proyecto,
  p.nombre_del_proyecto,
  p.codigo_proyecto,
  c.nombre_cliente,
  ep.nombre AS estado,
  p.hectareas,
  p.cantidad_iSeeds
FROM Proyecto p
JOIN Cliente c ON p.id_cliente = c.id_cliente
JOIN Estado_proyecto ep ON p.id_estado_proyecto = ep.id_estado_proyecto
WHERE ep.nombre = 'En curso'
  AND p.deleted_at IS NULL;

-- Consultar proyectos por eco-región
SELECT
  p.id_proyecto,
  p.nombre_del_proyecto,
  er.nombre AS eco_region,
  p.hectareas,
  p.cantidad_iSeeds
FROM Proyecto p
JOIN Eco_region er ON p.id_eco_region = er.id_eco_region
WHERE er.nombre = 'Yungas';

-- =====================================================
-- 4. CONSULTAS DE PRODUCCIÓN
-- =====================================================

-- Consultar producción por proyecto
SELECT
  prod.id_produccion,
  p.nombre_del_proyecto,
  r.nombre AS receta,
  prod.fecha_inicio,
  prod.fecha_fin,
  ep.nombre AS estado
FROM Produccion_iSeeds prod
JOIN Proyecto p ON prod.id_proyecto = p.id_proyecto
JOIN Receta r ON prod.id_receta = r.id_receta
JOIN Estado_produccion ep ON prod.id_estado_produccion = ep.id_estado_produccion
WHERE p.codigo_proyecto = 'CODIGO_PROYECTO';

-- Consultar disponibilidad de producción
SELECT
  d.id_disponibilidad,
  p.nombre_del_proyecto,
  r.nombre AS receta,
  d.cantidad,
  d.fecha_produccion
FROM Disponibilidad d
JOIN Produccion_iSeeds prod ON d.id_produccion = prod.id_produccion
JOIN Proyecto p ON prod.id_proyecto = p.id_proyecto
JOIN Receta r ON prod.id_receta = r.id_receta
ORDER BY d.fecha_produccion DESC;

-- =====================================================
-- 5. CONSULTAS DE INSUMOS
-- =====================================================

-- Consultar insumos por tipo
SELECT
  i.id_insumo,
  i.nombre,
  i.nombre_cientifico,
  i.especie,
  ti.descripcion_tipo_insumo,
  um.nombre AS unidad_medida
FROM Insumo i
JOIN Tipo_insumo ti ON i.id_tipo_insumo = ti.id_tipo_insumo
LEFT JOIN Unidad_medida um ON i.unidad_medida = um.id_unidad
WHERE ti.descripcion_tipo_insumo = 'semilla'
ORDER BY i.nombre;

-- Consultar stock de insumos (movimientos)
SELECT
  i.nombre AS insumo,
  tm.descripcion_movimiento AS tipo_movimiento,
  ml.cantidad,
  ml.unidad_medida,
  ml.fecha,
  ml.observacion
FROM Movimiento_laboratorio ml
JOIN Insumo i ON ml.id_insumo = i.id_insumo
JOIN Tipo_movimiento tm ON ml.id_tipo_movimiento = tm.id_tipo_movimiento
WHERE i.nombre = 'Semilla de Algarrobo blanco'
ORDER BY ml.fecha DESC;

-- =====================================================
-- 6. CONSULTAS DE ENSAYOS
-- =====================================================

-- Consultar ensayos por estado
SELECT
  rel.id_registro_ensayo,
  req.origen_proyecto,
  tel.nombre_ensayo,
  resp.nombre_responsable,
  rel.fecha_ensayo,
  ee.nombre AS estado
FROM Registro_ensayos_laboratorio rel
JOIN Registro_requerimiento_ensayos req ON rel.id_requerimiento_ensayo = req.id_requerimiento_ensayo
JOIN Tipo_ensayo_laboratorio tel ON rel.id_tipo_ensayo = tel.id_tipo_ensayo
JOIN Responsables_laboratorio resp ON rel.id_responsable_ensayo = resp.id_responsable_labo
JOIN Estado_ensayo ee ON rel.id_estado_ensayo = ee.id_estado_ensayo
WHERE ee.nombre = 'En diseño';

-- Consultar resultados de un ensayo específico
SELECT
  rel.id_registro_ensayo,
  tel.nombre_ensayo,
  pe.nombre AS parametro,
  rp.valor,
  rp.unidad
FROM Resultados_parametros rp
JOIN Registro_ensayos_laboratorio rel ON rp.id_registro_ensayo = rel.id_registro_ensayo
JOIN Parametros_ensayo pe ON rp.id_parametro = pe.id_parametro
JOIN Tipo_ensayo_laboratorio tel ON rel.id_tipo_ensayo = tel.id_tipo_ensayo
WHERE rel.id_registro_ensayo = 'ID_ENSAYO_AQUI';

-- =====================================================
-- 7. SOFT DELETES - CONSULTAS CON REGISTROS ACTIVOS
-- =====================================================

-- Ejemplo: Obtener solo proyectos activos (no eliminados)
SELECT
  p.id_proyecto,
  p.nombre_del_proyecto,
  c.nombre_cliente
FROM Proyecto p
JOIN Cliente c ON p.id_cliente = c.id_cliente
WHERE p.deleted_at IS NULL
  AND c.deleted_at IS NULL;

-- Ejemplo: Obtener solo recetas activas
SELECT
  r.id_receta,
  r.nombre,
  r.descripcion,
  resp.nombre_responsable AS autor
FROM Receta r
LEFT JOIN Responsables_laboratorio resp ON r.autor = resp.id_responsable_labo
WHERE r.deleted_at IS NULL;

-- =====================================================
-- 8. REPORTES ÚTILES
-- =====================================================

-- Reporte de consumo por proyecto
SELECT
  p.nombre_del_proyecto,
  SUM(cp.cantidad_consumida) AS total_consumido,
  p.cantidad_iSeeds AS cantidad_planificada,
  p.cantidad_iSeeds - COALESCE(SUM(cp.cantidad_consumida), 0) AS pendiente
FROM Proyecto p
LEFT JOIN Consumo_proyecto cp ON p.id_proyecto = cp.id_proyecto
GROUP BY p.id_proyecto, p.nombre_del_proyecto, p.cantidad_iSeeds;

-- Reporte de especies más utilizadas en recetas
SELECT
  e.descripcion_especie,
  COUNT(DISTINCT r.id_receta) AS num_recetas,
  SUM(ri.cantidad_teorica) AS cantidad_total
FROM Especie e
JOIN Insumo i ON i.especie = e.descripcion_especie
JOIN Receta_insumo ri ON ri.id_insumo = i.id_insumo
JOIN Receta r ON r.id_receta = ri.id_receta
GROUP BY e.descripcion_especie
ORDER BY num_recetas DESC;
