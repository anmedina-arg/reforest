-- Agregar estados faltantes para producción
-- Estos estados se necesitan para el flujo de entregas parciales

-- Agregar estado 'Completada'
INSERT INTO Estado_produccion (nombre)
VALUES ('Completada')
ON CONFLICT DO NOTHING;

-- Agregar estado 'Parcialmente Completada'
INSERT INTO Estado_produccion (nombre)
VALUES ('Parcialmente Completada')
ON CONFLICT DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE Estado_produccion IS
'Estados de producción de iSeeds:
- Planificado: Producción creada pero no iniciada
- En produccion: Producción en curso
- Completada: Producción finalizada (cantidad_real >= cantidad_planificada)
- Parcialmente Completada: Entregas parciales (cantidad_real < cantidad_planificada)
- Cancelado: Producción cancelada';
