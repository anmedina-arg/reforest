# Corrección de Bug: Conversión de Unidades en Cálculo de Stock

## Fecha
**2025-11-18**

## Problema Identificado

### Descripción del Bug
En las funciones que calculan el stock actual, el código estaba intentando convertir de la unidad del insumo a la misma unidad del insumo, en lugar de convertir desde la unidad base (gramos, mililitros) a la unidad del insumo.

### Código Problemático

```typescript
// ❌ INCORRECTO
const stockEnBase = 35000  // Stock acumulado en GRAMOS (unidad base)
const unidadInsumo = 'kg'  // Unidad oficial del insumo

// Intenta convertir de kg a kg, pero stockEnBase está en gramos!
const stockActual = convertUnit(stockEnBase, unidadInsumo, unidadInsumo)
// convertUnit(35000, 'kg', 'kg') = 35000 (no convierte, asume que ya está en kg)
```

### Síntomas del Bug

**Escenario:**
- Insumo: "Semilla de Pino"
- Unidad oficial del insumo: **kilogramo (kg)**
- Movimientos en stock:
  - Entrada: 20 kg
  - Entrada: 15 kg
- Stock acumulado en base: **35,000 gramos**

**Visualización Incorrecta:**
```
Stock: 35,000 kg  ❌ (35 mil kilogramos!)
```

**Visualización Correcta:**
```
Stock: 35 kg  ✅
```

### Causa Raíz

El algoritmo de cálculo de stock:
1. ✅ Suma todos los movimientos **correctamente en unidad base** (gramos)
2. ❌ Intenta convertir a la unidad del insumo **incorrectamente**
3. ❌ Retorna el valor en gramos pero etiquetado como kg

```typescript
// Paso 1: Suma en unidad base (CORRECTO)
stockEnBase = 35000  // gramos

// Paso 2: Conversión (INCORRECTO)
convertUnit(stockEnBase, unidadInsumo, unidadInsumo)
convertUnit(35000, 'kg', 'kg')
// Resultado: 35000 (no convierte porque cree que ya está en kg)

// Paso 3: Retorno (INCORRECTO)
stock_actual: 35000
unidad_medida: 'kg'
// El frontend muestra: 35,000 kg (con separador de miles)
```

## Solución Implementada

### Código Corregido

```typescript
// ✅ CORRECTO
const stockEnBase = 35000  // Stock acumulado en GRAMOS (unidad base)
const unidadInsumo = 'kg'  // Unidad oficial del insumo

// Determinar la unidad base según el tipo
const tipo = getTipoUnidad(unidadInsumo)  // 'peso'
const unidadBase = tipo === 'peso' ? 'g' : tipo === 'volumen' ? 'ml' : 'u'  // 'g'

// Convertir desde unidad base a unidad del insumo
const stockActual = convertUnit(stockEnBase, unidadBase, unidadInsumo)
// convertUnit(35000, 'g', 'kg') = 35 ✅
```

### Flujo Corregido

```typescript
// Paso 1: Suma en unidad base (igual que antes)
stockEnBase = 35000  // gramos

// Paso 2: Conversión (CORREGIDO)
const tipo = getTipoUnidad('kg')  // 'peso'
const unidadBase = 'g'
convertUnit(35000, 'g', 'kg')
// Resultado: 35 ✅

// Paso 3: Retorno (CORRECTO)
stock_actual: 35
unidad_medida: 'kg'
// El frontend muestra: 35 kg ✅
```

## Archivos Modificados

### 1. `/app/actions/stock.ts`

**Cambios:**

#### Import (Línea 19)
```typescript
// Antes
import { convertToBaseUnit, convertUnit } from '@/lib/utils/units'

// Después
import { convertToBaseUnit, convertUnit, getTipoUnidad } from '@/lib/utils/units'
```

#### getStockActual() - Líneas 122-134
```typescript
// Antes
let stockActual = 0
try {
  stockActual = convertUnit(stockEnBase, unidadInsumo, unidadInsumo)
} catch {
  stockActual = stockEnBase
}

// Después
let stockActual = 0
try {
  // Determinar la unidad base según el tipo de unidad del insumo
  const tipo = getTipoUnidad(unidadInsumo)
  const unidadBase = tipo === 'peso' ? 'g' : tipo === 'volumen' ? 'ml' : 'u'

  // Convertir de unidad base a unidad del insumo
  stockActual = convertUnit(stockEnBase, unidadBase, unidadInsumo)
} catch {
  stockActual = stockEnBase
}
```

#### getStockByInsumo() - Líneas 260-274
```typescript
// Mismo cambio que en getStockActual()
```

### 2. `/app/actions/produccion.ts`

**Cambios:**

#### Import (Líneas 23-29)
```typescript
// Antes
import { compareStock, formatCantidad, convertToBaseUnit, convertUnit } from '@/lib/utils/units'

// Después
import {
  compareStock,
  formatCantidad,
  convertToBaseUnit,
  convertUnit,
  getTipoUnidad,
} from '@/lib/utils/units'
```

#### createProduccion() - Validación de Stock (Líneas 521-531)
```typescript
// Antes
const stockActual = stockEnBase > 0 ? convertUnit(stockEnBase, unidadInsumo, unidadInsumo) : 0

// Después
let stockActual = 0
if (stockEnBase > 0) {
  try {
    const tipo = getTipoUnidad(unidadInsumo)
    const unidadBase = tipo === 'peso' ? 'g' : tipo === 'volumen' ? 'ml' : 'u'
    stockActual = convertUnit(stockEnBase, unidadBase, unidadInsumo)
  } catch {
    stockActual = stockEnBase
  }
}
```

#### completarProduccion() - Validación de Stock (Líneas 1002-1012)
```typescript
// Mismo cambio que en createProduccion()
```

## Casos de Prueba

### Caso 1: Insumo con Unidad Mayor (kg)

**Setup:**
- Insumo: "Semilla de Pino"
- Unidad oficial: **kg**
- Movimientos:
  - Entrada: 20 kg
  - Entrada: 15 kg

**Cálculo:**
```typescript
// Suma en base
stockEnBase = (20 × 1000) + (15 × 1000) = 35000 g

// Conversión (ANTES - INCORRECTO)
convertUnit(35000, 'kg', 'kg') = 35000
stock_actual: 35000 kg  ❌

// Conversión (DESPUÉS - CORRECTO)
convertUnit(35000, 'g', 'kg') = 35
stock_actual: 35 kg  ✅
```

### Caso 2: Insumo con Unidad Base (g)

**Setup:**
- Insumo: "Semilla pequeña"
- Unidad oficial: **g**
- Movimientos:
  - Entrada: 500 g
  - Entrada: 250 g

**Cálculo:**
```typescript
// Suma en base
stockEnBase = 500 + 250 = 750 g

// Conversión (ANTES)
convertUnit(750, 'g', 'g') = 750
stock_actual: 750 g  ✅ (correcto por casualidad)

// Conversión (DESPUÉS)
convertUnit(750, 'g', 'g') = 750
stock_actual: 750 g  ✅
```

### Caso 3: Insumo con Volumen (l)

**Setup:**
- Insumo: "Agua Destilada"
- Unidad oficial: **l** (litro)
- Movimientos:
  - Entrada: 2 l
  - Entrada: 1.5 l

**Cálculo:**
```typescript
// Suma en base
stockEnBase = (2 × 1000) + (1.5 × 1000) = 3500 ml

// Conversión (ANTES - INCORRECTO)
convertUnit(3500, 'l', 'l') = 3500
stock_actual: 3500 l  ❌

// Conversión (DESPUÉS - CORRECTO)
convertUnit(3500, 'ml', 'l') = 3.5
stock_actual: 3.5 l  ✅
```

### Caso 4: Visualización con formatCantidadConUnidad

Ahora que el bug está corregido, el formateo adaptativo funciona correctamente:

```typescript
// Caso 1: Insumo en kg
stock_actual: 35
unidad_medida: 'kg'
formatCantidadConUnidad(35, 'kg') = '35 kg'  ✅

// Caso 2: Insumo en g con stock alto
stock_actual: 50000  // (correcto ahora)
unidad_medida: 'g'
formatCantidadConUnidad(50000, 'g') = '50 kg'  ✅ (conversión adaptativa)

// Caso 3: Insumo en g con stock bajo
stock_actual: 750
unidad_medida: 'g'
formatCantidadConUnidad(750, 'g') = '750 g'  ✅
```

## Impacto del Bug

### Antes de la Corrección

**Insumos con unidad mayor (kg, l):**
- ❌ Stock mostraba valores inflados (en gramos/ml pero etiquetados como kg/l)
- ❌ Validaciones de stock comparaban valores incorrectos
- ❌ Usuarios veían "35,000 kg" en lugar de "35 kg"

**Insumos con unidad base (g, ml):**
- ✅ Funcionaban correctamente (por casualidad)

### Después de la Corrección

**Todos los insumos:**
- ✅ Stock muestra valores correctos
- ✅ Validaciones de stock funcionan correctamente
- ✅ Usuarios ven cantidades legibles y precisas

## Integración con Formateo Adaptativo

El bug estaba impidiendo que el formateo adaptativo funcionara correctamente para insumos con unidad mayor:

### Flujo Completo Corregido

```typescript
// Backend
1. Suma movimientos en unidad base: 35000 g
2. Convierte a unidad del insumo: 35 kg
3. Retorna: { stock_actual: 35, unidad_medida: 'kg' }

// Frontend
4. Formatea con unidad adaptativa:
   formatCantidadConUnidad(35, 'kg')
5. Como 35 < 1000 y ya está en kg, no convierte
6. Muestra: '35 kg'  ✅
```

### Caso Especial: Insumo en Gramos con Stock Alto

```typescript
// Backend
1. Suma movimientos en unidad base: 50000 g
2. Convierte a unidad del insumo: 50000 g (ya está en g)
3. Retorna: { stock_actual: 50000, unidad_medida: 'g' }

// Frontend
4. Formatea con unidad adaptativa:
   formatCantidadConUnidad(50000, 'g')
5. Como 50000 >= 1000 y está en unidad base, convierte
6. Divide: 50000 / 1000 = 50
7. Cambia unidad: g → kg
8. Muestra: '50 kg'  ✅
```

## Prevención de Regresiones

### Test Manual

1. **Crear insumo con unidad mayor:**
   - Nombre: "Test Semilla"
   - Unidad: **kilogramo**

2. **Registrar entrada:**
   - Cantidad: 25
   - Unidad: kg

3. **Verificar stock:**
   - Debe mostrar: **25 kg** ✅
   - NO debe mostrar: ~~25,000 kg~~ ❌

4. **Verificar en diferentes vistas:**
   - Tabla de stock: "25 kg"
   - Historial de movimientos: "+25 kg"
   - Validación de producción: debe comparar correctamente

### Test Automatizado (Futuro)

```typescript
describe('Stock Unit Conversion', () => {
  it('converts from base unit to insumo unit correctly', () => {
    const stockEnBase = 35000 // gramos
    const unidadInsumo = 'kg'
    const tipo = getTipoUnidad(unidadInsumo)
    const unidadBase = tipo === 'peso' ? 'g' : 'ml'

    const stockActual = convertUnit(stockEnBase, unidadBase, unidadInsumo)
    expect(stockActual).toBe(35)
  })

  it('handles insumos with base unit', () => {
    const stockEnBase = 750 // gramos
    const unidadInsumo = 'g'
    const tipo = getTipoUnidad(unidadInsumo)
    const unidadBase = 'g'

    const stockActual = convertUnit(stockEnBase, unidadBase, unidadInsumo)
    expect(stockActual).toBe(750)
  })
})
```

## Lecciones Aprendidas

1. **Nunca asumir que una variable tiene el tipo que su nombre sugiere**
   - `stockEnBase` está en unidad BASE, no en `unidadInsumo`

2. **Documentar explícitamente las unidades de las variables**
   ```typescript
   const stockEnGramos = 35000  // Mejor nombre
   const stockEnUnidadInsumo = convertUnit(stockEnGramos, 'g', unidadInsumo)
   ```

3. **Validar conversiones de unidades con tests**
   - Este bug pasó desapercibido porque no había tests unitarios

4. **Logs de debug son cruciales**
   - Los logs existentes ayudaron a identificar el problema:
     ```typescript
     console.log(`Stock: ${stockEnBase} (base) = ${stockActual} ${unidadInsumo}`)
     ```

## Estado Final

✅ **Bug corregido en 4 funciones:**
- `getStockActual()` en stock.ts
- `getStockByInsumo()` en stock.ts
- `createProduccion()` en produccion.ts
- `completarProduccion()` en produccion.ts

✅ **Código compila sin errores**

✅ **Stock se visualiza correctamente**

✅ **Formateo adaptativo funciona como esperado**

## Documentación Relacionada

- `/docs/adaptive-unit-display.md` - Formateo adaptativo de unidades
- `/docs/stock-calculation-fix.md` - Corrección original de cálculo de stock
- `/docs/unit-conversion-in-production.md` - Conversión de unidades en producción
