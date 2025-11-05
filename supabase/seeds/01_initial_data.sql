-- =====================================================
-- REFOREST - SEED DATA
-- Datos iniciales para el sistema
-- =====================================================

-- =====================================================
-- 1. RESPONSABLES DE LABORATORIO
-- =====================================================
-- IMPORTANTE: Insertar primero porque las recetas los referencian

INSERT INTO Responsables_laboratorio (nombre_responsable)
VALUES
('Andres Medina'),
('Pablo Caram');

-- =====================================================
-- 2. CLIENTES
-- =====================================================

INSERT INTO Cliente (nombre_cliente, phone, email, picture)
VALUES
('Fundación Bosques Nativos', '+54 9 351 5551234', 'contacto@bosques.org', 'https://example.com/pic1.png'),
('Green Solutions S.A.', '+54 9 11 43211234', 'info@greensolutions.com', NULL),
('Ministerio de Ambiente', NULL, 'ambiente@gov.ar', NULL),
('EcoReforest Ltd.', '+54 9 261 9876543', 'hello@ecoreforest.com', 'https://example.com/pic2.png'),
('Universidad Nacional de Córdoba', '+54 351 5353535', NULL, NULL);

-- =====================================================
-- 3. ESTADOS
-- =====================================================

-- Estados de ensayos
INSERT INTO Estado_ensayo (nombre)
VALUES
('Planificado'),
('En diseño'),
('Ejecutado'),
('Monitoreo'),
('Finalizado'),
('Cancelado'),
('Pausado');

-- Estados de producción
INSERT INTO Estado_produccion (nombre)
VALUES
('Planificado'),
('En produccion'),
('Cancelado');

-- Estados de proyectos
INSERT INTO Estado_proyecto (nombre)
VALUES
('Planificado'),
('En curso'),
('Completado'),
('Cancelado'),
('En espera');

-- =====================================================
-- 4. TIPOS DE MOVIMIENTO Y CONSUMO
-- =====================================================

-- Tipos de movimiento de stock
INSERT INTO Tipo_movimiento (descripcion_movimiento)
VALUES
('ingreso'),
('salida'),
('ajuste'),
('descarte');

-- Tipos de consumo
INSERT INTO Tipo_consumo (descripcion_consumo)
VALUES
('ensayo'),
('proyecto'),
('descarte');

-- =====================================================
-- 5. TIPOS DE INSUMO
-- =====================================================

INSERT INTO Tipo_insumo (descripcion_tipo_insumo)
VALUES
('cápsula'),
('semilla'),
('promotor de crecimiento'),
('sustrato');

-- =====================================================
-- 6. ECO-REGIONES
-- =====================================================

INSERT INTO Eco_region (nombre)
VALUES
('Cerrado'),
('Yungas'),
('Mata atlántica');

-- =====================================================
-- 7. ESPECIES FORESTALES
-- =====================================================

INSERT INTO Especie (descripcion_especie)
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

-- =====================================================
-- 8. UNIDADES DE MEDIDA
-- =====================================================

INSERT INTO Unidad_medida (nombre, abreviatura)
VALUES
('unidad', 'u'),
('kilogramo', 'kg'),
('gramo', 'g'),
('mililitro', 'ml'),
('litro', 'l'),
('metro', 'm'),
('centímetro', 'cm');

-- =====================================================
-- 9. INSUMOS
-- =====================================================

-- Semillas
INSERT INTO Insumo (nombre, nombre_cientifico, especie, id_tipo_insumo, unidad_medida)
VALUES
('Semilla de Algarrobo blanco', 'Prosopis alba', 'Algarrobo blanco',
 (SELECT id_tipo_insumo FROM Tipo_insumo WHERE descripcion_tipo_insumo = 'semilla'),
 (SELECT id_unidad FROM Unidad_medida WHERE nombre = 'unidad')),

('Semilla de Lapacho amarillo', 'Handroanthus albus', 'Lapacho Amarillo NOA',
 (SELECT id_tipo_insumo FROM Tipo_insumo WHERE descripcion_tipo_insumo = 'semilla'),
 (SELECT id_unidad FROM Unidad_medida WHERE nombre = 'unidad')),

('Semilla de Palo borracho blanco', 'Ceiba chodatii', 'Palo Borracho Flor blanca',
 (SELECT id_tipo_insumo FROM Tipo_insumo WHERE descripcion_tipo_insumo = 'semilla'),
 (SELECT id_unidad FROM Unidad_medida WHERE nombre = 'unidad')),

('Semilla de Tipa', 'Tipuana tipu', 'Tipa',
 (SELECT id_tipo_insumo FROM Tipo_insumo WHERE descripcion_tipo_insumo = 'semilla'),
 (SELECT id_unidad FROM Unidad_medida WHERE nombre = 'unidad'));

-- Promotores de crecimiento
INSERT INTO Insumo (nombre, nombre_cientifico, especie, id_tipo_insumo, unidad_medida)
VALUES
('Hormona enraizante AIB', NULL, NULL,
 (SELECT id_tipo_insumo FROM Tipo_insumo WHERE descripcion_tipo_insumo = 'promotor de crecimiento'),
 (SELECT id_unidad FROM Unidad_medida WHERE nombre = 'mililitro')),

('Fungicida natural Trichoderma', NULL, NULL,
 (SELECT id_tipo_insumo FROM Tipo_insumo WHERE descripcion_tipo_insumo = 'promotor de crecimiento'),
 (SELECT id_unidad FROM Unidad_medida WHERE nombre = 'mililitro'));

-- Sustratos
INSERT INTO Insumo (nombre, nombre_cientifico, especie, id_tipo_insumo, unidad_medida)
VALUES
('Sustrato orgánico universal', NULL, NULL,
 (SELECT id_tipo_insumo FROM Tipo_insumo WHERE descripcion_tipo_insumo = 'sustrato'),
 (SELECT id_unidad FROM Unidad_medida WHERE nombre = 'kilogramo')),

('Perlita expandida', NULL, NULL,
 (SELECT id_tipo_insumo FROM Tipo_insumo WHERE descripcion_tipo_insumo = 'sustrato'),
 (SELECT id_unidad FROM Unidad_medida WHERE nombre = 'kilogramo'));

-- Cápsulas
INSERT INTO Insumo (nombre, nombre_cientifico, especie, id_tipo_insumo, unidad_medida)
VALUES
('Cápsula biodegradable tipo A', NULL, NULL,
 (SELECT id_tipo_insumo FROM Tipo_insumo WHERE descripcion_tipo_insumo = 'cápsula'),
 (SELECT id_unidad FROM Unidad_medida WHERE nombre = 'unidad'));

-- =====================================================
-- 10. RECETAS
-- =====================================================

INSERT INTO Receta (autor, fecha_creacion, nombre, descripcion)
VALUES
((SELECT id_responsable_labo FROM Responsables_laboratorio WHERE nombre_responsable = 'Andres Medina'),
 CURRENT_DATE,
 'Receta Básica para Algarrobo blanco',
 'Receta estándar para la producción de iSeeds de Algarrobo blanco. Incluye semillas, sustrato y promotores de crecimiento.'),

((SELECT id_responsable_labo FROM Responsables_laboratorio WHERE nombre_responsable = 'Andres Medina'),
 CURRENT_DATE,
 'Receta Avanzada para Lapacho amarillo',
 'Receta optimizada para la producción de iSeeds de Lapacho amarillo. Incluye semillas, sustrato mejorado y promotores de crecimiento adicionales.'),

((SELECT id_responsable_labo FROM Responsables_laboratorio WHERE nombre_responsable = 'Andres Medina'),
 CURRENT_DATE,
 'Receta Ecológica para Palo borracho blanco',
 'Receta enfocada en prácticas sostenibles para la producción de iSeeds de Palo borracho blanco. Utiliza sustratos orgánicos y promotores de crecimiento naturales.'),

((SELECT id_responsable_labo FROM Responsables_laboratorio WHERE nombre_responsable = 'Pablo Caram'),
 CURRENT_DATE,
 'Receta Rápida para Tipa',
 'Receta diseñada para una producción rápida de iSeeds de Tipa. Incluye semillas, sustrato ligero y promotores de crecimiento de acción rápida.');

-- =====================================================
-- 11. RECETA_INSUMO (Composición de recetas)
-- =====================================================

-- Receta Básica para Algarrobo blanco
INSERT INTO Receta_insumo (id_receta, id_insumo, cantidad_teorica, unidad_medida)
VALUES
((SELECT id_receta FROM Receta WHERE nombre = 'Receta Básica para Algarrobo blanco'),
 (SELECT id_insumo FROM Insumo WHERE nombre = 'Semilla de Algarrobo blanco'),
 1,
 (SELECT id_unidad FROM Unidad_medida WHERE nombre = 'unidad')),

((SELECT id_receta FROM Receta WHERE nombre = 'Receta Básica para Algarrobo blanco'),
 (SELECT id_insumo FROM Insumo WHERE nombre = 'Sustrato orgánico universal'),
 200,
 (SELECT id_unidad FROM Unidad_medida WHERE nombre = 'gramo')),

((SELECT id_receta FROM Receta WHERE nombre = 'Receta Básica para Algarrobo blanco'),
 (SELECT id_insumo FROM Insumo WHERE nombre = 'Cápsula biodegradable tipo A'),
 1,
 (SELECT id_unidad FROM Unidad_medida WHERE nombre = 'unidad')),

((SELECT id_receta FROM Receta WHERE nombre = 'Receta Básica para Algarrobo blanco'),
 (SELECT id_insumo FROM Insumo WHERE nombre = 'Hormona enraizante AIB'),
 5,
 (SELECT id_unidad FROM Unidad_medida WHERE nombre = 'mililitro'));

-- Receta Avanzada para Lapacho amarillo
INSERT INTO Receta_insumo (id_receta, id_insumo, cantidad_teorica, unidad_medida)
VALUES
((SELECT id_receta FROM Receta WHERE nombre = 'Receta Avanzada para Lapacho amarillo'),
 (SELECT id_insumo FROM Insumo WHERE nombre = 'Semilla de Lapacho amarillo'),
 1,
 (SELECT id_unidad FROM Unidad_medida WHERE nombre = 'unidad')),

((SELECT id_receta FROM Receta WHERE nombre = 'Receta Avanzada para Lapacho amarillo'),
 (SELECT id_insumo FROM Insumo WHERE nombre = 'Sustrato orgánico universal'),
 180,
 (SELECT id_unidad FROM Unidad_medida WHERE nombre = 'gramo')),

((SELECT id_receta FROM Receta WHERE nombre = 'Receta Avanzada para Lapacho amarillo'),
 (SELECT id_insumo FROM Insumo WHERE nombre = 'Cápsula biodegradable tipo A'),
 1,
 (SELECT id_unidad FROM Unidad_medida WHERE nombre = 'unidad')),

((SELECT id_receta FROM Receta WHERE nombre = 'Receta Avanzada para Lapacho amarillo'),
 (SELECT id_insumo FROM Insumo WHERE nombre = 'Fungicida natural Trichoderma'),
 5,
 (SELECT id_unidad FROM Unidad_medida WHERE nombre = 'mililitro'));

-- Receta Rápida para Tipa
INSERT INTO Receta_insumo (id_receta, id_insumo, cantidad_teorica, unidad_medida)
VALUES
((SELECT id_receta FROM Receta WHERE nombre = 'Receta Rápida para Tipa'),
 (SELECT id_insumo FROM Insumo WHERE nombre = 'Semilla de Tipa'),
 1,
 (SELECT id_unidad FROM Unidad_medida WHERE nombre = 'unidad')),

((SELECT id_receta FROM Receta WHERE nombre = 'Receta Rápida para Tipa'),
 (SELECT id_insumo FROM Insumo WHERE nombre = 'Perlita expandida'),
 150,
 (SELECT id_unidad FROM Unidad_medida WHERE nombre = 'gramo')),

((SELECT id_receta FROM Receta WHERE nombre = 'Receta Rápida para Tipa'),
 (SELECT id_insumo FROM Insumo WHERE nombre = 'Cápsula biodegradable tipo A'),
 1,
 (SELECT id_unidad FROM Unidad_medida WHERE nombre = 'unidad')),

((SELECT id_receta FROM Receta WHERE nombre = 'Receta Rápida para Tipa'),
 (SELECT id_insumo FROM Insumo WHERE nombre = 'Hormona enraizante AIB'),
 4,
 (SELECT id_unidad FROM Unidad_medida WHERE nombre = 'mililitro'));
