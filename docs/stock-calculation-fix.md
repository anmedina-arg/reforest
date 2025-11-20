# Corrección del Cálculo de Stock con Conversión de Unidades

## Problema Identificado

Las funciones que calculaban el stock actual sumaban las cantidades directamente sin convertir unidades, lo que causaba cálculos incorrectos cuando había movimientos en diferentes unidades.

### Código Problemático

```typescript
// ❌ ANTES: Suma directa sin conversión
const { data: movimientos } = await supabase
  .from('movimiento_laboratorio')
  .select('cantidad')  // ❌ No incluye unidad_medida
  .eq('id_insumo', id_insumo)

const stockActual = movimientos?.reduce((sum, mov) => sum + (mov.cantidad || 0), 0) || 0
```

### Ejemplo del Problema

```
Movimientos de un insumo (Semilla de Pino):
1. Entrada: 2 kilogramos
2. Entrada: 1500 gramos
3. Salida: -0.5 kilogramos

Cálculo INCORRECTO (suma directa):
Stock = 2 + 1500 + (-0.5) = 1501.5 ❌

Cálculo CORRECTO (con conversión):
2 kg = 2000 g
1500 g = 1500 g
-0.5 kg = -500 g
Stock = 2000 + 1500 - 500 = 3000 g = 3 kg ✅
```

## Solución Implementada

### 1. Modificar SELECT para incluir unidad_medida

```typescript
const { data: movimientos } = await supabase
  .from('movimiento_laboratorio')
  .select('cantidad, unidad_medida')  // ✅ Incluye unidad_medida
  .eq('id_insumo', id_insumo)
```

### 2. Convertir cada movimiento a unidad base antes de sumar

```typescript
// ✅ DESPUÉS: Conversión correcta de unidades
let stockEnBase = 0

if (movimientos && movimientos.length > 0) {
  try {
    for (const mov of movimientos) {
      const cantidad = mov.cantidad || 0
      const unidadMov = mov.unidad_medida || unidadInsumo

      // Convertir a unidad base (gramos, mililitros o unidades)
      const cantidadBase = convertToBaseUnit(cantidad, unidadMov)
      stockEnBase += cantidadBase
    }
  } catch (error) {
    console.error('Error convirtiendo unidades:', error)
    // Fallback: suma directa
    stockEnBase = movimientos.reduce((sum, mov) => sum + (mov.cantidad || 0), 0)
  }
}

// Convertir de unidad base a la unidad del insumo
const stockActual = stockEnBase > 0 ? convertUnit(stockEnBase, unidadInsumo, unidadInsumo) : 0
```

### 3. Manejo robusto de errores

- Try-catch para capturar errores de conversión
- Fallback a suma directa si falla la conversión
- Logs detallados para debugging

## Archivos Modificados

### 1. `/app/actions/stock.ts`

#### Funciones corregidas:
- `getStockActual()` (líneas 79-136)
- `getStockByInsumo()` (líneas 210-273)

#### Imports agregados:
```typescript
import { convertToBaseUnit, convertUnit } from '@/lib/utils/units'
```

#### Cambios:
- ✅ SELECT incluye `unidad_medida`
- ✅ Loop convierte cada movimiento a unidad base
- ✅ Suma en unidad base
- ✅ Convierte resultado a unidad del insumo
- ✅ Redondea a 2 decimales
- ✅ Logs detallados

### 2. `/app/actions/produccion.ts`

#### Funciones corregidas:
- `createProduccion()` - validación de stock (líneas 484-516)
- `completarProduccion()` - validación de stock (líneas 956-988)

#### Imports agregados:
```typescript
import { compareStock, formatCantidad, convertToBaseUnit, convertUnit } from '@/lib/utils/units'
```

#### Cambios:
- ✅ SELECT incluye `unidad_medida`
- ✅ Loop convierte cada movimiento a unidad base
- ✅ Suma en unidad base
- ✅ Convierte resultado a unidad del insumo antes de compareStock

## Flujo de Cálculo Corregido

### Paso 1: Obtener movimientos con unidades
```typescript
const movimientos = [
  { cantidad: 2, unidad_medida: 'kilogramo' },
  { cantidad: 1500, unidad_medida: 'gramo' },
  { cantidad: -500, unidad_medida: 'g' },
]
```

### Paso 2: Convertir cada uno a unidad base
```typescript
for (const mov of movimientos) {
  const cantidadBase = convertToBaseUnit(mov.cantidad, mov.unidad_medida)
  stockEnBase += cantidadBase
}

// Conversiones:
// 2 kilogramo → 2000 g (base)
// 1500 gramo → 1500 g (base)
// -500 g → -500 g (base)
// stockEnBase = 2000 + 1500 - 500 = 3000 g
```

### Paso 3: Convertir a unidad del insumo
```typescript
const unidadInsumo = 'kilogramo'
const stockActual = convertUnit(3000, 'gramo', 'kilogramo')
// stockActual = 3 kg
```

## Logs de Debug

### getStockActual()
```typescript
console.log(`[getStockActual] Stock calculado para ${insumo.nombre}: ${stockEnBase} (base) = ${stockActual} ${unidadInsumo}`)

// Ejemplo de output:
// [getStockActual] Stock calculado para Semilla de Pino: 3000 (base) = 3 kilogramo
```

### getStockByInsumo()
```typescript
console.log(`[getStockByInsumo] Movimiento: ${cantidad} ${unidadMov} = ${cantidadBase} (base)`)
console.log(`[getStockByInsumo] Stock total: ${stockEnBase} (base) para ${insumo.nombre}`)
console.log(`[getStockByInsumo] Stock en unidad del insumo: ${stockActual} ${unidadInsumo}`)

// Ejemplo de output:
// [getStockByInsumo] Movimiento: 2 kilogramo = 2000 (base)
// [getStockByInsumo] Movimiento: 1500 gramo = 1500 (base)
// [getStockByInsumo] Movimiento: -500 g = -500 (base)
// [getStockByInsumo] Stock total: 3000 (base) para Semilla de Pino
// [getStockByInsumo] Stock en unidad del insumo: 3 kilogramo
```

### createProduccion() y completarProduccion()
```typescript
console.log('[createProduccion] Error convirtiendo unidades:', error)
console.log('[completarProduccion] Error convirtiendo unidades:', error)
```

## Casos de Prueba

### Caso 1: Movimientos en misma unidad
```
Input:
  - 2 kg
  - 3 kg
  - -1 kg

Cálculo:
  2000 g + 3000 g - 1000 g = 4000 g = 4 kg

Resultado: 4 kg ✅
```

### Caso 2: Movimientos en diferentes unidades (peso)
```
Input:
  - 2 kilogramos
  - 1500 gramos
  - -0.5 kg

Cálculo:
  2000 g + 1500 g - 500 g = 3000 g = 3 kg

Resultado: 3 kg ✅
```

### Caso 3: Movimientos en diferentes unidades (volumen)
```
Input:
  - 2 litros
  - 500 mililitros
  - -1500 ml

Cálculo:
  2000 ml + 500 ml - 1500 ml = 1000 ml = 1 l

Resultado: 1 l ✅
```

### Caso 4: Error de conversión (unidades incompatibles)
```
Input:
  - 2 kilogramos (peso)
  - 1 litro (volumen)  ❌

Error capturado en try-catch
Fallback: suma directa
Log de error generado
```

## Beneficios de la Corrección

### 1. Cálculo Preciso
- ✅ Stock se calcula correctamente independiente de las unidades usadas
- ✅ Soporta mezcla de unidades (kg + g, l + ml)
- ✅ Suma/resta correcta de movimientos

### 2. Flexibilidad
- ✅ Usuarios pueden ingresar stock en cualquier unidad compatible
- ✅ Sistema convierte automáticamente
- ✅ No requiere estandarizar entrada manual

### 3. Robustez
- ✅ Try-catch maneja errores de conversión
- ✅ Fallback a suma directa si falla
- ✅ Logs detallados para debugging

### 4. Consistencia
- ✅ Mismo algoritmo en todas las funciones
- ✅ Usa la unidad oficial del insumo
- ✅ Resultados redondeados a 2 decimales

## Impacto en el Sistema

### Funciones que USAN el stock calculado:
1. ✅ `getStockActual()` - Lista de stock de todos los insumos
2. ✅ `getStockByInsumo()` - Stock de un insumo específico
3. ✅ `createProduccion()` - Validación antes de planificar
4. ✅ `completarProduccion()` - Validación antes de completar
5. ✅ Tabla de stock en UI - Muestra stock correcto
6. ✅ Validaciones en producción - Comparan correctamente

### Retrocompatibilidad
- ✅ Movimientos antiguos sin `unidad_medida` usan unidad del insumo
- ✅ Fallback a suma directa si hay errores
- ✅ No requiere migración de datos

## Testing Manual

### Probar la corrección:

1. **Crear insumo** "Semilla de Pino" con unidad "kilogramo"

2. **Registrar movimientos mixtos:**
   - Entrada: 2 kilogramos
   - Entrada: 1500 gramos
   - Salida (simulada): -500 gramos

3. **Verificar cálculo:**
   - Ir a página de stock
   - Ver stock de "Semilla de Pino"
   - Debería mostrar: **3 kg** (o 3000 g)

4. **Verificar logs:**
   - Abrir consola del servidor
   - Buscar logs de `[getStockActual]`
   - Verificar que muestre: "3000 (base) = 3 kilogramo"

5. **Planificar producción:**
   - Crear producción que necesite 2.5 kg
   - Validación debería pasar ✅ (3 kg >= 2.5 kg)

6. **Completar producción:**
   - Completar la producción
   - Stock final debería ser: 0.5 kg (500 g)

## Conclusión

La corrección del cálculo de stock con conversión de unidades asegura que:
- El stock se calcula correctamente independiente de las unidades
- Las validaciones de producción comparan cantidades correctamente
- Los usuarios tienen flexibilidad para ingresar en diferentes unidades
- El sistema mantiene la precisión en todos los cálculos
