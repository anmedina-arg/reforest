-- =====================
-- TABLAS MAESTRAS / CATÁLOGOS
-- =====================

CREATE TABLE Cliente (
    id_cliente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_cliente VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    picture VARCHAR(255)
);

CREATE TABLE Estado_proyecto (
    id_estado_proyecto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE Estado_produccion (
    id_estado_produccion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE Estado_ensayo (
    id_estado_ensayo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE Tipo_movimiento (
    id_tipo_movimiento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descripcion_movimiento VARCHAR(255) NOT NULL
);

CREATE TABLE Tipo_consumo (
    id_consumo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descripcion_consumo VARCHAR(255) NOT NULL
);

CREATE TABLE Tipo_ensayo_laboratorio (
    id_tipo_ensayo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_ensayo VARCHAR(255) NOT NULL,
    descripcion TEXT
);

CREATE TABLE Unidad_medida (
    id_unidad UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL
);
-- ====================================
-- agrego abreviaturas a unidad_medida
-- ====================================
ALTER TABLE unidad_medida
ADD COLUMN abreviatura VARCHAR(10);


CREATE TABLE Tipo_insumo (
    id_tipo_insumo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descripcion_tipo_insumo VARCHAR(255) NOT NULL
);

-- ====================================
-- 1. TABLAS MAESTRAS / CATÁLOGOS
-- ====================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE Estado_proyecto (
    id_estado_proyecto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE Estado_produccion (
    id_estado_produccion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE Estado_ensayo (
    id_estado_ensayo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE Tipo_consumo (
    id_consumo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descripcion_consumo VARCHAR(255) NOT NULL
);

CREATE TABLE Tipo_ensayo_laboratorio (
    id_tipo_ensayo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_ensayo VARCHAR(255) NOT NULL,
    descripcion TEXT
);

CREATE TABLE Eco_region (
    id_eco_region UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL
);

CREATE TABLE Especie (
    id_especie UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descripcion_especie VARCHAR(255) NOT NULL
);

CREATE TABLE Tipo_insumo (
    id_tipo_insumo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descripcion_tipo_insumo VARCHAR(255) NOT NULL
);

CREATE TABLE Ubicacion_insumo (
    id_ubicacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_ubicacion VARCHAR(50),
    tel_contacto VARCHAR(50),
    direccion_contacto VARCHAR(255),
    observacion TEXT
);

CREATE TABLE Responsables_laboratorio (
    id_responsable_labo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_responsable VARCHAR(255) NOT NULL
);

-- ====================================
-- 2. PROYECTOS Y PRODUCCIÓN
-- ====================================

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
    poligonos_entregados BOOLEAN DEFAULT FALSE
);

CREATE TABLE Produccion_iSeeds (
    id_produccion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_proyecto UUID REFERENCES Proyecto(id_proyecto),
    id_receta UUID,
    fecha_inicio DATE,
    fecha_fin DATE,
    id_estado_produccion UUID REFERENCES Estado_produccion(id_estado_produccion)
);

CREATE TABLE Disponibilidad (
    id_disponibilidad UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_produccion UUID REFERENCES Produccion_iSeeds(id_produccion),
    cantidad INT NOT NULL,
    fecha_produccion DATE
);

CREATE TABLE Consumo_proyecto (
    id_consumo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_proyecto UUID REFERENCES Proyecto(id_proyecto),
    id_disponibilidad UUID REFERENCES Disponibilidad(id_disponibilidad),
    cantidad_consumida INT,
    fecha_consumo DATE
);

-- ====================================
-- 3. INSUMOS Y RECETAS
-- ====================================

CREATE TABLE Insumo (
    id_insumo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    nombre_cientifico VARCHAR(255),
    especie VARCHAR(255),
    id_tipo_insumo UUID REFERENCES Tipo_insumo(id_tipo_insumo),
    unidad_medida UUID REFERENCES Unidad_medida(id_unidad)
);

CREATE TABLE Receta (
    id_receta UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    autor UUID,
    fecha_creacion DATE DEFAULT CURRENT_DATE
);

-- ====================================
-- Agrego nombres y descripciones a recetas
-- ====================================

ALTER TABLE receta ADD COLUMN nombre VARCHAR(250);
ALTER TABLE receta ADD COLUMN descripcion VARCHAR(250);

CREATE TABLE Receta_insumo (
    id_receta UUID REFERENCES Receta(id_receta),
    id_insumo UUID REFERENCES Insumo(id_insumo),
    cantidad_teorica INT,
    unidad_medida UUID REFERENCES Unidad_medida(id_unidad),
    PRIMARY KEY (id_receta, id_insumo)
);

CREATE TABLE Mix_iSeeds (
    id_mix UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_receta UUID REFERENCES Receta(id_receta),
    cantidad INT
);

CREATE TABLE Produccion_insumo (
    id_produccion_insumo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_insumo UUID REFERENCES Insumo(id_insumo),
    lote_insumo VARCHAR(100),
    cantidad_real INT,
    unidad_medida UUID REFERENCES Unidad_medida(id_unidad),
    id_ubicacion UUID REFERENCES Ubicacion_insumo(id_ubicacion)
);

CREATE TABLE Movimiento_laboratorio (
    id_movimiento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_insumo UUID REFERENCES Insumo(id_insumo),
    cantidad INT,
    unidad_medida VARCHAR(50),
    id_tipo_movimiento UUID REFERENCES Tipo_movimiento(id_tipo_movimiento),
    fecha DATE,
    observacion TEXT
);

-- Corrección de modelado:
-- Se quitó la FK id_consumo de Tipo_movimiento.
-- Ahora id_consumo está en Movimiento_laboratorio,
-- ya que un movimiento puede tener distintos consumos
-- (ej: salida por ensayo, salida por proyecto, etc.).

ALTER TABLE Movimiento_laboratorio
ADD COLUMN id_consumo UUID REFERENCES Tipo_consumo(id_consumo);

-- ====================================
-- 4. ENSAYOS DE LABORATORIO
-- ====================================

CREATE TABLE Registro_requerimiento_ensayos (
    id_requerimiento_ensayo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origen_proyecto VARCHAR(255),
    fecha_solicitud_ensayo DATE,
    fecha_inicio DATE,
    fecha_fin_programada DATE,
    estado VARCHAR(50)
);

CREATE TABLE Registro_ensayos_laboratorio (
    id_registro_ensayo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_requerimiento_ensayo UUID REFERENCES Registro_requerimiento_ensayos(id_requerimiento_ensayo),
    fecha_ensayo DATE,
    id_responsable_ensayo UUID REFERENCES Responsables_laboratorio(id_responsable_labo),
    id_tipo_ensayo UUID REFERENCES Tipo_ensayo_laboratorio(id_tipo_ensayo),
    consumo_stock_ensayo INT,
    id_movimiento UUID REFERENCES Movimiento_laboratorio(id_movimiento),
    id_estado_ensayo UUID REFERENCES Estado_ensayo(id_estado_ensayo)
);

CREATE TABLE Parametros_ensayo (
    id_parametro UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_tipo_ensayo UUID REFERENCES Tipo_ensayo_laboratorio(id_tipo_ensayo),
    nombre VARCHAR(255),
    unidad VARCHAR(50),
    tipo_dato VARCHAR(50)
);

CREATE TABLE Resultados_parametros (
    id_resultado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_registro_ensayo UUID REFERENCES Registro_ensayos_laboratorio(id_registro_ensayo),
    id_parametro UUID REFERENCES Parametros_ensayo(id_parametro),
    unidad VARCHAR(50),
    valor VARCHAR(255)
);

CREATE TABLE Receta_Insumo_ensayo (
    id_receta UUID REFERENCES Receta(id_receta),
    id_registro_ensayo UUID REFERENCES Registro_ensayos_laboratorio(id_registro_ensayo),
    PRIMARY KEY (id_receta, id_registro_ensayo)
);

-- ====================================
-- SIEMBRA INICIAL DE CLIENTE
-- ====================================

INSERT INTO Cliente (nombre_cliente, phone, email, picture)
VALUES 
    ('Fundación Bosques Nativos', '+54 9 351 5551234', 'contacto@bosques.org', 'https://example.com/pic1.png'),
    ('Green Solutions S.A.', '+54 9 11 43211234', 'info@greensolutions.com', NULL),
    ('Ministerio de Ambiente', NULL, 'ambiente@gov.ar', NULL),
    ('EcoReforest Ltd.', '+54 9 261 9876543', 'hello@ecoreforest.com', 'https://example.com/pic2.png'),
    ('Universidad Nacional de Córdoba', '+54 351 5353535', NULL, NULL);

-- ====================================
-- SIEMBRA INICIAL DE estado_ensayo
-- ====================================

INSERT INTO estado_ensayo (nombre) 
VALUES 
    ('Planificado'),
    ('En diseño'),
    ('Ejecutado'),
    ('Monitoreo'),
    ('Finalizado'),
    ('Cancelado'),
    ('Pausado');

-- ====================================
-- SIEMBRA INICIAL DE estado_produccion
-- ====================================

INSERT INTO estado_produccion (nombre)
VALUES
('Planificado'),
('En produccion'),
('Cancelado');

-- ====================================
-- SIEMBRA INICIAL DE tipo_movimiento
-- representa categorías de movimientos de stock: ingreso, salida, ajuste, descarte
-- ====================================

INSERT INTO tipo_movimiento (descripcion_movimiento)
VALUES
('ingreso'),
('salida'),
('ajuste'),
('descarte');

-- ====================================
-- SIEMBRA INICIAL DE tipo_consumo
-- representa las formas de consumir iSeeds: ensayo, proyecto, descarte
-- ====================================

INSERT INTO tipo_consumo (descripcion_consumo)
VALUES
('ensayo'),
('proyecto'),
('descarte');

-- ====================================
-- SIEMBRA INICIAL DE tipo_insummo
-- ====================================

INSERT INTO tipo_insumo (descripcion_tipo_insumo)
VALUES
('cápsula'),
('semilla'),
('promotor de crecimiento'),
('sustrato');

-- ======================================================================================
-- SIEMBRA INICIAL DE eco_region --> datos extraidos del excel: tablero de proyectos
-- ======================================================================================

INSERT INTO eco_region (nombre)
VALUES
('Cerrado'),
('Yungas'),
('Mata atlántica');

-- ======================================================================================
-- SIEMBRA INICIAL DE especie --> datos extraidos del excel: Métodos de escarificación
-- ======================================================================================

INSERT INTO especie (descripcion_especie)
VALUES
('Algarrobo blanco'),
('Algarrobo chileno'),
('Algarrobo Dulce'),
('Algarrobo negro'),
('Aliso del cerro'),
('Araucaria'),
('Cancharana'),
('Cebil colorado (Curupay misiones)'),
('Cedro misionero'),
('Cedro orán'),
('Cedro tucumano, coya'),
('Ceibo'),
('Chañar'),
('Guarán Amarillo'),
('Guatambú amarillo'),
('Guatambú blanco'),
('Guayabo colorado / mato'),
('Guayacán'),
('Horco Cebil'),
('Horco Molle'),
('Ibirá Pita'),
('Itín'),
('Jacarandá / Tarco'),
('Lapacho Amarillo NOA'),
('Lapacho Rosado NEA'),
('Lapacho Rosado NOA'),
('Mistol'),
('Nogal'),
('Ñandubay'),
('Pacará'),
('Palmito'),
('Palo Amarillo'),
('Palo Blanco'),
('Palo Borracho Flor blanca'),
('Palo Rosa'),
('Palo Santo'),
('Pata de Vaca'),
('Petiribí'),
('Pino del Cerro'),
('Quebracho blanco'),
('Quebracho colorado Chaqueño'),
('Quebracho colorado santiageño'),
('Queñoa, Tabaquillo'),
('Sauce Criollo'),
('Tatané'),
('Tipa'),
('Tipa colorada/Viraró en NEA'),
('Urunday');

-- ====================================
-- SIEMBRA INICIAL DE unidad_medida
-- ====================================

INSERT INTO unidad_medida (nombre, abreviatura)
VALUES
('unidad', 'u'),
('kilogramo', 'kg'),
('gramo', 'g'),
('mililitro', 'ml'),
('litro', 'l'),
('metro', 'm'),
('centímetro', 'cm');

-- ====================================
-- SIEMBRA INICIAL DE insumos
-- ====================================

-- 🌰 Semillas
INSERT INTO insumo (nombre, nombre_cientifico, id_especie, id_tipo_insumo, unidad_medida)
VALUES
('Semilla de Algarrobo blanco', 'Prosopis alba',
 (SELECT id_especie FROM especie WHERE descripcion_especie = 'Algarrobo blanco'),
 (SELECT id_tipo_insumo FROM tipo_insumo WHERE descripcion_tipo_insumo = 'semilla'),
 (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad')),

('Semilla de Lapacho amarillo', 'Handroanthus albus',
 (SELECT id_especie FROM especie WHERE descripcion_especie = 'Lapacho Amarillo NOA'),
 (SELECT id_tipo_insumo FROM tipo_insumo WHERE descripcion_tipo_insumo = 'semilla'),
 (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad')),

('Semilla de Palo borracho blanco', 'Ceiba chodatii',
 (SELECT id_especie FROM especie WHERE descripcion_especie = 'Palo Borracho Flor blanca'),
 (SELECT id_tipo_insumo FROM tipo_insumo WHERE descripcion_tipo_insumo = 'semilla'),
 (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad')),

('Semilla de Tipa', 'Tipuana tipu',
 (SELECT id_especie FROM especie WHERE descripcion_especie = 'Tipa'),
 (SELECT id_tipo_insumo FROM tipo_insumo WHERE descripcion_tipo_insumo = 'semilla'),
 (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad')),

-- 🧴 Promotores de crecimiento
INSERT INTO insumo (nombre, nombre_cientifico, id_especie, id_tipo_insumo, unidad_medida)
VALUES
('Hormona enraizante AIB', NULL, NULL,
 (SELECT id_tipo_insumo FROM tipo_insumo WHERE descripcion_tipo_insumo = 'promotor de crecimiento'),
 (SELECT id_unidad FROM unidad_medida WHERE nombre = 'mililitro')),

('Fungicida natural Trichoderma', NULL, NULL,
 (SELECT id_tipo_insumo FROM tipo_insumo WHERE descripcion_tipo_insumo = 'promotor de crecimiento'),
 (SELECT id_unidad FROM unidad_medida WHERE nombre = 'mililitro')),

-- 🌱 Sustratos
INSERT INTO insumo (nombre, nombre_cientifico, id_especie, id_tipo_insumo, unidad_medida)
VALUES
('Sustrato orgánico universal', NULL, NULL,
 (SELECT id_tipo_insumo FROM tipo_insumo WHERE descripcion_tipo_insumo = 'sustrato'),
 (SELECT id_unidad FROM unidad_medida WHERE nombre = 'kilogramo')),

('Perlita expandida', NULL, NULL,
 (SELECT id_tipo_insumo FROM tipo_insumo WHERE descripcion_tipo_insumo = 'sustrato'),
 (SELECT id_unidad FROM unidad_medida WHERE nombre = 'kilogramo')),

-- 💊 Cápsulas
INSERT INTO insumo (nombre, nombre_cientifico, id_especie, id_tipo_insumo, unidad_medida)
VALUES
('Cápsula biodegradable tipo A', NULL, NULL,
 (SELECT id_tipo_insumo FROM tipo_insumo WHERE descripcion_tipo_insumo = 'cápsula'),
 (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'));

-- ====================================
-- SIEMBRA INICIAL DE receta
-- ====================================

INSERT INTO receta (autor, fecha_creacion, nombre, descripcion)
VALUES
(NULL, CURRENT_DATE, 'Receta Básica para Algarrobo blanco', 'Receta estándar para la producción de iSeeds de Algarrobo blanco. Incluye semillas, sustrato y promotores de crecimiento.'),
(NULL, CURRENT_DATE, 'Receta Avanzada para Lapacho amarillo', 'Receta optimizada para la producción de iSeeds de Lapacho amarillo. Incluye semillas, sustrato mejorado y promotores de crecimiento adicionales.'),
(NULL, CURRENT_DATE, 'Receta Ecológica para Palo borracho blanco', 'Receta enfocada en prácticas sostenibles para la producción de iSeeds de Palo borracho blanco. Utiliza sustratos orgánicos y promotores de crecimiento naturales.'),
(NULL, CURRENT_DATE, 'Receta Rápida para Tipa', 'Receta diseñada para una producción rápida de iSeeds de Tipa. Incluye semillas, sustrato ligero y promotores de crecimiento de acción rápida.');

UPDATE receta SET autor = (SELECT id_responsable_labo FROM responsables_laboratorio WHERE nombre_responsable = 'Andres Medina')  WHERE autor IS NULL;

UPDATE receta SET autor = (SELECT id_responsable_labo FROM responsables_laboratorio WHERE nombre_responsable = 'Andres Medina')  WHERE nombre = 'Receta Rápida para Tipa';

-- =============================================
-- SIEMBRA INICIAL DE responsables_laboratorio
-- =============================================

INSERT INTO responsables_laboratorio (nombre_responsable)
VALUES
('Andres Medina'),
('Pablo Caram');

-- =============================================
-- CONSULTA DE AUTOR DE "X" RECETA (uso nombre de receta para la busqueda)
-- =============================================

SELECT 
  r.nombre AS nombre_receta,
  resp.nombre_responsable AS autor
FROM receta r
JOIN responsables_laboratorio resp
  ON r.autor = resp.id_responsable_labo
WHERE r.nombre = 'Receta Básica para Algarrobo blanco';

-- =============================================
-- CONSULTA RECETAS PERTENECIENTES A "X" AUTOR
-- =============================================

SELECT 
  r.nombre AS nombre_receta,
  resp.nombre_responsable AS autor
FROM receta r
JOIN responsables_laboratorio resp
  ON r.autor = resp.id_responsable_labo
WHERE resp.nombre_responsable = 'Pablo Caram';

-- =================================================
-- CONSULTA DE TODAS LAS RECETAS, CON O SIN AUTOR
-- =================================================

SELECT 
  r.nombre AS nombre_receta,
  resp.nombre_responsable AS autor
FROM receta r
LEFT JOIN responsables_laboratorio resp
  ON r.autor = resp.id_responsable_labo;

-- =================================================
-- CONSULTA DE TODAS LAS RECETAS SIN AUTOR
-- =================================================

SELECT 
  r.nombre AS nombre_receta,
  resp.nombre_responsable AS autor
FROM receta r
LEFT JOIN responsables_laboratorio resp
  ON r.autor = resp.id_responsable_labo
WHERE r.autor IS NULL;

-- =================================================
-- SIEMBRA INICIAL DE UNA RECETA COMPLETA
-- =================================================

-- id_receta                            |                autor                 | fecha_creacion |                   nombre            |                       descripcion
-- 807729ee-4e0e-4595-b1ca-ac2c96cc2822 | cf02f6da-2a2d-4dc8-97a9-4aa270113ad3 | 2025-10-08     | Receta Básica para Algarrobo blanco | Receta estándar para la producción de iSeeds de Algarrobo blanco. Incluye semillas, sustrato y promotores de crecimiento.

INSERT INTO receta_insumo (id_receta, id_insumo, cantidad_teorica, unidad_medida)
VALUES
('807729ee-4e0e-4595-b1ca-ac2c96cc2822', (SELECT id_insumo FROM insumo WHERE nombre = 'Semilla de Algarrobo blanco'), 1, (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad')),
('807729ee-4e0e-4595-b1ca-ac2c96cc2822', (SELECT id_insumo FROM insumo WHERE nombre = 'Sustrato orgánico universal'), 200, (SELECT id_unidad FROM unidad_medida WHERE nombre = 'gramo')),
('807729ee-4e0e-4595-b1ca-ac2c96cc2822', (SELECT id_insumo FROM insumo WHERE nombre = 'Cápsula biodegradable tipo A'), 1, (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad')),
('807729ee-4e0e-4595-b1ca-ac2c96cc2822', (SELECT id_insumo FROM insumo WHERE nombre = 'Hormona enraizante AIB'), 5, (SELECT id_unidad FROM unidad_medida WHERE nombre = 'mililitro'));

-- id_receta                            |                autor                 | fecha_creacion |                   nombre            |                       descripcion
-- 112e8831-9f37-4244-b8f6-58ffe7f9906e | cf02f6da-2a2d-4dc8-97a9-4aa270113ad3 | 2025-10-08     | Receta Avanzada para Lapacho amarillo      | Receta optimizada para la producción de iSeeds de Lapacho amarillo. Incluye semillas, sustrato mejorado y promotores de crecimiento adicionales.
INSERT INTO receta_insumo (id_receta, id_insumo, cantidad_teorica, unidad_medida)
VALUES
('112e8831-9f37-4244-b8f6-58ffe7f9906e', (SELECT id_insumo FROM insumo WHERE nombre = 'Semilla de Lapacho amarillo'), 1, (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad')),
('112e8831-9f37-4244-b8f6-58ffe7f9906e', (SELECT id_insumo FROM insumo WHERE nombre = 'Sustrato orgánico universal'), 180, (SELECT id_unidad FROM unidad_medida WHERE nombre = 'gramo')),
('112e8831-9f37-4244-b8f6-58ffe7f9906e', (SELECT id_insumo FROM insumo WHERE nombre = 'Cápsula biodegradable tipo A'), 1, (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad')),
('112e8831-9f37-4244-b8f6-58ffe7f9906e', (SELECT id_insumo FROM insumo WHERE nombre = 'Fungicida natural Trichoderma'), 5, (SELECT id_unidad FROM unidad_medida WHERE nombre = 'mililitro'));

-- id_receta                            |                autor                 | fecha_creacion |                   nombre            |                       descripcion
-- 09e3f450-6b69-4014-9b52-fc8117e8fc81 | ef9bd75c-7376-447e-9a78-bc5fd56bf1e1 | 2025-10-08     | Receta Rápida para Tipa                    | Receta diseñada para una producción rápida de iSeeds de Tipa. Incluye semillas, sustrato ligero y promotores de crecimiento de acción rápida.
INSERT INTO receta_insumo (id_receta, id_insumo, cantidad_teorica, unidad_medida)
VALUES
('09e3f450-6b69-4014-9b52-fc8117e8fc81', (SELECT id_insumo FROM insumo WHERE nombre = 'Semilla de Tipa'), 1, (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad')),
('09e3f450-6b69-4014-9b52-fc8117e8fc81', (SELECT id_insumo FROM insumo WHERE nombre = 'Perlita expandida'), 150, (SELECT id_unidad FROM unidad_medida WHERE nombre = 'gramo')),
('09e3f450-6b69-4014-9b52-fc8117e8fc81', (SELECT id_insumo FROM insumo WHERE nombre = 'Cápsula biodegradable tipo A'), 1, (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad')),
('09e3f450-6b69-4014-9b52-fc8117e8fc81', (SELECT id_insumo FROM insumo WHERE nombre = 'Hormona enraizante AIB'), 4, (SELECT id_unidad FROM unidad_medida WHERE nombre = 'mililitro'));

-- =======================================================
-- CONSULTA DE UNA RECETA POR SU ID (por id_receta)
-- =======================================================

SELECT
  r.id_receta,
  r.nombre AS receta,
  i.id_insumo,
  i.nombre AS insumo,
  i.nombre_cientifico,
  ri.cantidad_teorica,
  COALESCE(um.abreviatura, um.nombre) AS unidad
FROM receta r
JOIN receta_insumo ri   ON ri.id_receta = r.id_receta
JOIN insumo i           ON i.id_insumo   = ri.id_insumo
LEFT JOIN unidad_medida um ON um.id_unidad = ri.unidad_medida
WHERE r.id_receta = '807729ee-4e0e-4595-b1ca-ac2c96cc2822'
ORDER BY i.nombre;

-- =======================================================
-- CONSULTA DE UNA RECETA POR SU NOMBRE (util en UI)
-- =======================================================

SELECT
  r.id_receta,
  r.nombre AS receta,
  i.nombre AS insumo,
  ri.cantidad_teorica,
  COALESCE(um.abreviatura, um.nombre) AS unidad
FROM receta r
JOIN receta_insumo ri ON ri.id_receta = r.id_receta
JOIN insumo i         ON i.id_insumo  = ri.id_insumo
LEFT JOIN unidad_medida um ON um.id_unidad = ri.unidad_medida
WHERE r.nombre = 'Receta Básica para Algarrobo blanco';

-- =======================================================
-- CONSULTA DE CANTIDAD DE INGREDIENTES POR RECETA
-- =======================================================

SELECT
  r.id_receta,
  r.nombre,
  COUNT(ri.id_insumo) AS num_insumos
FROM receta r
LEFT JOIN receta_insumo ri ON ri.id_receta = r.id_receta
GROUP BY r.id_receta, r.nombre
ORDER BY num_insumos DESC;
