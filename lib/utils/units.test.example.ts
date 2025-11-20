/**
 * Ejemplos de uso de la utilidad de conversión de unidades
 * Este archivo muestra cómo usar las funciones de units.ts
 */

import {
  convertToBaseUnit,
  getBaseUnit,
  getTipoUnidad,
  compareStock,
  convertUnit,
  formatCantidad,
} from './units'

// =====================================================
// EJEMPLOS DE USO
// =====================================================

console.log('=== EJEMPLOS DE CONVERSIÓN DE UNIDADES ===\n')

// 1. Convertir a unidad base
console.log('1. convertToBaseUnit():')
console.log('  2 kilogramos =', convertToBaseUnit(2, 'kilogramo'), 'gramos')
console.log('  500 gramos =', convertToBaseUnit(500, 'gramo'), 'gramos')
console.log('  1.5 litros =', convertToBaseUnit(1.5, 'litro'), 'mililitros')
console.log('  750 ml =', convertToBaseUnit(750, 'ml'), 'mililitros')
console.log('  10 unidades =', convertToBaseUnit(10, 'unidad'), 'unidades')
console.log()

// 2. Obtener unidad base por tipo
console.log('2. getBaseUnit():')
console.log('  Tipo "peso" → unidad base:', getBaseUnit('peso'))
console.log('  Tipo "volumen" → unidad base:', getBaseUnit('volumen'))
console.log('  Tipo "unidad" → unidad base:', getBaseUnit('unidad'))
console.log()

// 3. Obtener tipo de unidad
console.log('3. getTipoUnidad():')
console.log('  "kilogramo" es tipo:', getTipoUnidad('kilogramo'))
console.log('  "ml" es tipo:', getTipoUnidad('ml'))
console.log('  "unidad" es tipo:', getTipoUnidad('unidad'))
console.log()

// 4. Comparar stock disponible vs requerido
console.log('4. compareStock():')
console.log('  ¿2 kg >= 1500 g?', compareStock(2, 'kilogramo', 1500, 'gramo'))
console.log('  ¿1 litro >= 1200 ml?', compareStock(1, 'litro', 1200, 'ml'))
console.log('  ¿500 g >= 0.4 kg?', compareStock(500, 'gramo', 0.4, 'kilogramo'))
console.log('  ¿3 unidades >= 5 unidades?', compareStock(3, 'unidad', 5, 'unidad'))
console.log()

// 5. Convertir entre unidades compatibles
console.log('5. convertUnit():')
console.log('  2 kg a gramos =', convertUnit(2, 'kilogramo', 'gramo'), 'g')
console.log('  1500 ml a litros =', convertUnit(1500, 'mililitro', 'litro'), 'l')
console.log('  0.5 kg a gramos =', convertUnit(0.5, 'kg', 'g'), 'g')
console.log()

// 6. Formatear cantidades
console.log('6. formatCantidad():')
console.log('  2500 gramos →', formatCantidad(2500, 'gramo'))
console.log('  1.5 litros →', formatCantidad(1.5, 'litro'))
console.log('  1000 ml →', formatCantidad(1000, 'ml'))
console.log('  10 unidades →', formatCantidad(10, 'unidad'))
console.log()

// =====================================================
// CASOS DE USO EN PRODUCCIÓN
// =====================================================

console.log('=== CASOS DE USO EN PRODUCCIÓN ===\n')

// Caso 1: Verificar si hay suficiente stock antes de producir
console.log('Caso 1: Verificar stock antes de producción')
const stockDisponible = 3 // kilogramos
const stockUnidad = 'kilogramo'
const necesitaProduccion = 2500 // gramos
const necesitaUnidad = 'gramo'

const haySuficiente = compareStock(
  stockDisponible,
  stockUnidad,
  necesitaProduccion,
  necesitaUnidad
)
console.log(`  Stock: ${formatCantidad(stockDisponible, stockUnidad)}`)
console.log(`  Necesario: ${formatCantidad(necesitaProduccion, necesitaUnidad)}`)
console.log(`  ¿Hay suficiente? ${haySuficiente ? '✓ SÍ' : '✗ NO'}`)
console.log()

// Caso 2: Calcular cuánto stock queda después de consumir
console.log('Caso 2: Calcular stock restante')
const stockInicial = 5 // kg
const consumo = 1500 // g

// Convertir todo a misma unidad para calcular
const stockInicialEnGramos = convertToBaseUnit(stockInicial, 'kilogramo')
const consumoEnGramos = convertToBaseUnit(consumo, 'gramo')
const stockRestanteEnGramos = stockInicialEnGramos - consumoEnGramos
const stockRestanteEnKg = convertUnit(stockRestanteEnGramos, 'gramo', 'kilogramo')

console.log(`  Stock inicial: ${formatCantidad(stockInicial, 'kilogramo')}`)
console.log(`  Consumo: ${formatCantidad(consumo, 'gramo')}`)
console.log(`  Stock restante: ${formatCantidad(stockRestanteEnKg, 'kilogramo')}`)
console.log()

// Caso 3: Manejo de errores - unidades incompatibles
console.log('Caso 3: Manejo de errores - unidades incompatibles')
try {
  compareStock(2, 'kilogramo', 1.5, 'litro')
} catch (error) {
  console.log(`  ✗ Error esperado: ${(error as Error).message}`)
}
console.log()

// Caso 4: Manejo de errores - unidad no reconocida
console.log('Caso 4: Manejo de errores - unidad no reconocida')
try {
  convertToBaseUnit(10, 'libras')
} catch (error) {
  console.log(`  ✗ Error esperado: ${(error as Error).message.split('.')[0]}`)
}
console.log()

console.log('=== FIN DE EJEMPLOS ===')
