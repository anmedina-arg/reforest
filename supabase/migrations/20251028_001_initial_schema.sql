-- =====================================================
-- REFOREST - DATABASE SCHEMA
-- Base de datos para gestión de proyectos forestales
-- =====================================================

-- =====================================================
-- 1. EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 2. FUNCTIONS
-- =====================================================

-- Función para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. TABLAS CATÁLOGO / MAESTRAS
-- =====================================================

-- Clientes del sistema
CREATE TABLE Cliente (
    id_cliente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_cliente VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    picture VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Estados de proyectos
CREATE TABLE Estado_proyecto (
    id_estado_proyecto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Estados de producción
CREATE TABLE Estado_produccion (
    id_estado_produccion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Estados de ensayos
CREATE TABLE Estado_ensayo (
    id_estado_ensayo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Tipos de movimiento de stock
CREATE TABLE Tipo_movimiento (
    id_tipo_movimiento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descripcion_movimiento VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Tipos de consumo
CREATE TABLE Tipo_consumo (
    id_consumo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descripcion_consumo VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Tipos de ensayo de laboratorio
CREATE TABLE Tipo_ensayo_laboratorio (
    id_tipo_ensayo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_ensayo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Unidades de medida
CREATE TABLE Unidad_medida (
    id_unidad UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL,
    abreviatura VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Tipos de insumo
CREATE TABLE Tipo_insumo (
    id_tipo_insumo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descripcion_tipo_insumo VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Eco-regiones
CREATE TABLE Eco_region (
    id_eco_region UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Especies forestales
CREATE TABLE Especie (
    id_especie UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descripcion_especie VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Ubicaciones de insumos
CREATE TABLE Ubicacion_insumo (
    id_ubicacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_ubicacion VARCHAR(50),
    tel_contacto VARCHAR(50),
    direccion_contacto VARCHAR(255),
    observacion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Responsables de laboratorio
CREATE TABLE Responsables_laboratorio (
    id_responsable_labo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_responsable VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- =====================================================
-- 4. TABLAS PRINCIPALES - PROYECTOS Y PRODUCCIÓN
-- =====================================================

-- Proyectos
CREATE TABLE Proyecto (
    id_proyecto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_del_proyecto VARCHAR(255) NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    nombre_fantasia VARCHAR(255),
    codigo_proyecto VARCHAR(50),
    id_cliente UUID REFERENCES Cliente(id_cliente),
    id_mix UUID,
    hectareas INT,
    id_eco_region UUID REFERENCES Eco_region(id_eco_region),
    cantidad_iSeeds INT,
    id_estado_proyecto UUID REFERENCES Estado_proyecto(id_estado_proyecto),
    poligonos_entregados BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Producción de iSeeds
CREATE TABLE Produccion_iSeeds (
    id_produccion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_proyecto UUID REFERENCES Proyecto(id_proyecto),
    id_receta UUID,
    fecha_inicio DATE,
    fecha_fin DATE,
    id_estado_produccion UUID REFERENCES Estado_produccion(id_estado_produccion),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Disponibilidad de producción
CREATE TABLE Disponibilidad (
    id_disponibilidad UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_produccion UUID REFERENCES Produccion_iSeeds(id_produccion),
    cantidad INT NOT NULL,
    fecha_produccion DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Consumo por proyecto
CREATE TABLE Consumo_proyecto (
    id_consumo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_proyecto UUID REFERENCES Proyecto(id_proyecto),
    id_disponibilidad UUID REFERENCES Disponibilidad(id_disponibilidad),
    cantidad_consumida INT,
    fecha_consumo DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- =====================================================
-- 5. TABLAS PRINCIPALES - INSUMOS Y RECETAS
-- =====================================================

-- Insumos
CREATE TABLE Insumo (
    id_insumo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    nombre_cientifico VARCHAR(255),
    especie VARCHAR(255),
    id_tipo_insumo UUID REFERENCES Tipo_insumo(id_tipo_insumo),
    unidad_medida UUID REFERENCES Unidad_medida(id_unidad),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Recetas
CREATE TABLE Receta (
    id_receta UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(250),
    descripcion VARCHAR(250),
    autor UUID,
    fecha_creacion DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Mix de iSeeds
CREATE TABLE Mix_iSeeds (
    id_mix UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_receta UUID REFERENCES Receta(id_receta),
    cantidad INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Producción de insumos
CREATE TABLE Produccion_insumo (
    id_produccion_insumo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_insumo UUID REFERENCES Insumo(id_insumo),
    lote_insumo VARCHAR(100),
    cantidad_real INT,
    unidad_medida UUID REFERENCES Unidad_medida(id_unidad),
    id_ubicacion UUID REFERENCES Ubicacion_insumo(id_ubicacion),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Movimientos de laboratorio
CREATE TABLE Movimiento_laboratorio (
    id_movimiento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_insumo UUID REFERENCES Insumo(id_insumo),
    cantidad INT,
    unidad_medida VARCHAR(50),
    id_tipo_movimiento UUID REFERENCES Tipo_movimiento(id_tipo_movimiento),
    id_consumo UUID REFERENCES Tipo_consumo(id_consumo),
    fecha DATE,
    observacion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- =====================================================
-- 6. TABLAS PRINCIPALES - ENSAYOS DE LABORATORIO
-- =====================================================

-- Registro de requerimientos de ensayos
CREATE TABLE Registro_requerimiento_ensayos (
    id_requerimiento_ensayo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origen_proyecto VARCHAR(255),
    fecha_solicitud_ensayo DATE,
    fecha_inicio DATE,
    fecha_fin_programada DATE,
    estado VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Registro de ensayos de laboratorio
CREATE TABLE Registro_ensayos_laboratorio (
    id_registro_ensayo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_requerimiento_ensayo UUID REFERENCES Registro_requerimiento_ensayos(id_requerimiento_ensayo),
    fecha_ensayo DATE,
    id_responsable_ensayo UUID REFERENCES Responsables_laboratorio(id_responsable_labo),
    id_tipo_ensayo UUID REFERENCES Tipo_ensayo_laboratorio(id_tipo_ensayo),
    consumo_stock_ensayo INT,
    id_movimiento UUID REFERENCES Movimiento_laboratorio(id_movimiento),
    id_estado_ensayo UUID REFERENCES Estado_ensayo(id_estado_ensayo),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Parámetros de ensayos
CREATE TABLE Parametros_ensayo (
    id_parametro UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_tipo_ensayo UUID REFERENCES Tipo_ensayo_laboratorio(id_tipo_ensayo),
    nombre VARCHAR(255),
    unidad VARCHAR(50),
    tipo_dato VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Resultados de parámetros
CREATE TABLE Resultados_parametros (
    id_resultado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_registro_ensayo UUID REFERENCES Registro_ensayos_laboratorio(id_registro_ensayo),
    id_parametro UUID REFERENCES Parametros_ensayo(id_parametro),
    unidad VARCHAR(50),
    valor VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- =====================================================
-- 7. TABLAS DE RELACIÓN (Many-to-Many)
-- =====================================================

-- Relación Receta-Insumo
CREATE TABLE Receta_insumo (
    id_receta UUID REFERENCES Receta(id_receta),
    id_insumo UUID REFERENCES Insumo(id_insumo),
    cantidad_teorica INT,
    unidad_medida UUID REFERENCES Unidad_medida(id_unidad),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    PRIMARY KEY (id_receta, id_insumo)
);

-- Relación Receta-Ensayo
CREATE TABLE Receta_Insumo_ensayo (
    id_receta UUID REFERENCES Receta(id_receta),
    id_registro_ensayo UUID REFERENCES Registro_ensayos_laboratorio(id_registro_ensayo),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    PRIMARY KEY (id_receta, id_registro_ensayo)
);

-- =====================================================
-- 8. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Trigger para Cliente
CREATE TRIGGER trigger_update_cliente
    BEFORE UPDATE ON Cliente
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Estado_proyecto
CREATE TRIGGER trigger_update_estado_proyecto
    BEFORE UPDATE ON Estado_proyecto
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Estado_produccion
CREATE TRIGGER trigger_update_estado_produccion
    BEFORE UPDATE ON Estado_produccion
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Estado_ensayo
CREATE TRIGGER trigger_update_estado_ensayo
    BEFORE UPDATE ON Estado_ensayo
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Tipo_movimiento
CREATE TRIGGER trigger_update_tipo_movimiento
    BEFORE UPDATE ON Tipo_movimiento
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Tipo_consumo
CREATE TRIGGER trigger_update_tipo_consumo
    BEFORE UPDATE ON Tipo_consumo
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Tipo_ensayo_laboratorio
CREATE TRIGGER trigger_update_tipo_ensayo_laboratorio
    BEFORE UPDATE ON Tipo_ensayo_laboratorio
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Unidad_medida
CREATE TRIGGER trigger_update_unidad_medida
    BEFORE UPDATE ON Unidad_medida
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Tipo_insumo
CREATE TRIGGER trigger_update_tipo_insumo
    BEFORE UPDATE ON Tipo_insumo
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Eco_region
CREATE TRIGGER trigger_update_eco_region
    BEFORE UPDATE ON Eco_region
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Especie
CREATE TRIGGER trigger_update_especie
    BEFORE UPDATE ON Especie
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Ubicacion_insumo
CREATE TRIGGER trigger_update_ubicacion_insumo
    BEFORE UPDATE ON Ubicacion_insumo
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Responsables_laboratorio
CREATE TRIGGER trigger_update_responsables_laboratorio
    BEFORE UPDATE ON Responsables_laboratorio
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Proyecto
CREATE TRIGGER trigger_update_proyecto
    BEFORE UPDATE ON Proyecto
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Produccion_iSeeds
CREATE TRIGGER trigger_update_produccion_iseeds
    BEFORE UPDATE ON Produccion_iSeeds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Disponibilidad
CREATE TRIGGER trigger_update_disponibilidad
    BEFORE UPDATE ON Disponibilidad
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Consumo_proyecto
CREATE TRIGGER trigger_update_consumo_proyecto
    BEFORE UPDATE ON Consumo_proyecto
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Insumo
CREATE TRIGGER trigger_update_insumo
    BEFORE UPDATE ON Insumo
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Receta
CREATE TRIGGER trigger_update_receta
    BEFORE UPDATE ON Receta
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Mix_iSeeds
CREATE TRIGGER trigger_update_mix_iseeds
    BEFORE UPDATE ON Mix_iSeeds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Produccion_insumo
CREATE TRIGGER trigger_update_produccion_insumo
    BEFORE UPDATE ON Produccion_insumo
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Movimiento_laboratorio
CREATE TRIGGER trigger_update_movimiento_laboratorio
    BEFORE UPDATE ON Movimiento_laboratorio
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Registro_requerimiento_ensayos
CREATE TRIGGER trigger_update_registro_requerimiento_ensayos
    BEFORE UPDATE ON Registro_requerimiento_ensayos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Registro_ensayos_laboratorio
CREATE TRIGGER trigger_update_registro_ensayos_laboratorio
    BEFORE UPDATE ON Registro_ensayos_laboratorio
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Parametros_ensayo
CREATE TRIGGER trigger_update_parametros_ensayo
    BEFORE UPDATE ON Parametros_ensayo
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Resultados_parametros
CREATE TRIGGER trigger_update_resultados_parametros
    BEFORE UPDATE ON Resultados_parametros
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Receta_insumo
CREATE TRIGGER trigger_update_receta_insumo
    BEFORE UPDATE ON Receta_insumo
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para Receta_Insumo_ensayo
CREATE TRIGGER trigger_update_receta_insumo_ensayo
    BEFORE UPDATE ON Receta_Insumo_ensayo
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
