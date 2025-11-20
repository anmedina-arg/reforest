# Verificación: Almacenamiento de Unidades en Movimientos

## Estado Actual: ✅ CORRECTO

El sistema **ya está guardando correctamente** los nombres/abreviaturas de unidades en lugar de UUIDs en la tabla `movimiento_laboratorio`.

## Estructura de la Base de Datos

### Tabla `receta_insumo`
```sql
CREATE TABLE Receta_insumo (
    id_receta UUID REFERENCES Receta(id_receta),
    id_insumo UUID REFERENCES Insumo(id_insumo),
    cantidad_teorica INT,
    unidad_medida UUID REFERENCES Unidad_medida(id_unidad),  -- ⚠️ UUID (referencia)
    ...
);
```

**Importante**: En `receta_insumo`, el campo `unidad_medida` es un **UUID** que referencia la tabla `Unidad_medida`.

### Tabla `movimiento_laboratorio`
```sql
CREATE TABLE Movimiento_laboratorio (
    id_movimiento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_insumo UUID REFERENCES Insumo(id_insumo),
    cantidad INT,
    unidad_medida VARCHAR(50),  -- ✅ Texto (abreviatura)
    id_tipo_movimiento UUID REFERENCES Tipo_movimiento(id_tipo_movimiento),
    ...
);
```

**Importante**: En `movimiento_laboratorio`, el campo `unidad_medida` es **VARCHAR(50)** (texto plano).

## Problema Potencial (Ya Resuelto)

Si el código simplemente copiara el valor de `receta_insumo.unidad_medida` directamente, guardaría UUIDs:

```typescript
// ❌ INCORRECTO (no es lo que hace el código actual)
unidad_medida: ri.unidad_medida  // Esto sería un UUID
```

## Implementación Actual: ✅ CORRECTA

### 1. `completarProduccion()` - Lines 884-920

**Paso 1: JOIN con tabla de unidades**
```typescript
const { data: recetaInsumos } = await supabase
  .from('receta_insumo')
  .select(`
    id_insumo,
    cantidad_teorica,
    unidad:unidad_medida!inner(    // ✅ Alias 'unidad' para el JOIN
      id_unidad,
      nombre,                       // ✅ Obtiene nombre de la unidad
      abreviatura                   // ✅ Obtiene abreviatura
    ),
    insumo:id_insumo(
      id_insumo,
      nombre
    )
  `)
  .eq('id_receta', produccion.id_receta)
```

**Paso 2: Extraer abreviatura del objeto unidad**
```typescript
const insumosCalculados = recetaInsumos.map((ri: any) => ({
  id_insumo: ri.id_insumo,
  nombre_insumo: ri.insumo?.nombre || 'Sin nombre',
  cantidad_necesaria: (ri.cantidad_teorica || 0) * cantidadIngresada,
  unidad_medida: ri.unidad?.abreviatura || ri.unidad?.nombre || 'unidad',  // ✅ Extrae texto
}))
```

**Paso 3: Insertar abreviatura en movimientos**
```typescript
const movimientosData = insumosCalculados.map((insumo) => ({
  id_insumo: insumo.id_insumo,
  cantidad: -insumo.cantidad_necesaria,
  unidad_medida: insumo.unidad_medida,  // ✅ Ya es abreviatura (texto)
  id_tipo_movimiento: tipoMovimiento.id_tipo_movimiento,
  fecha: fechaFinFinal,
  observacion,
}))

await supabase
  .from('movimiento_laboratorio')
  .insert(movimientosData)
```

### 2. `createProduccion()` - Lines 411-447

**Mismo patrón correcto:**
```typescript
// Líneas 411-415: JOIN con unidad_medida
unidad:unidad_medida!inner(
  id_unidad,
  nombre,
  abreviatura
)

// Línea 446: Extraer abreviatura
unidad_medida: ri.unidad?.abreviatura || ri.unidad?.nombre || 'unidad',
```

### 3. `registrarEntrada()` - stock.ts

**Recibe texto directamente del formulario:**
```typescript
export async function registrarEntrada(input: RegistrarEntradaInput) {
  // input.unidad_medida ya es texto (ej: 'kg', 'g', 'l')

  await supabase
    .from('movimiento_laboratorio')
    .insert({
      id_insumo,
      cantidad,
      unidad_medida,  // ✅ Texto desde el formulario
      id_tipo_movimiento,
      fecha,
      observacion,
    })
}
```

## Flujo de Datos Completo

### Ejemplo: Completar Producción

```
1. receta_insumo.unidad_medida (DB)
   → UUID: '123e4567-e89b-12d3-a456-426614174000'

2. JOIN con unidad_medida
   → { id_unidad: '123...', nombre: 'kilogramo', abreviatura: 'kg' }

3. Extraer abreviatura (línea 919)
   → 'kg'

4. Crear movimiento (línea 1108)
   → { unidad_medida: 'kg' }

5. INSERT en movimiento_laboratorio
   → unidad_medida (VARCHAR) = 'kg' ✅
```

### Ejemplo: Registrar Entrada de Stock

```
1. Usuario selecciona en formulario
   → Select value: 'kg'

2. Form envía a backend
   → { unidad_medida: 'kg' }

3. INSERT en movimiento_laboratorio
   → unidad_medida (VARCHAR) = 'kg' ✅
```

## Verificación de Consistencia

### ✅ Todos los puntos de inserción usan texto

| Función | Archivo | Línea | Valor Insertado |
|---------|---------|-------|-----------------|
| `completarProduccion()` | produccion.ts | 1108 | `ri.unidad?.abreviatura` (texto) |
| `createProduccion()` | produccion.ts | 446 | `ri.unidad?.abreviatura` (texto) |
| `registrarEntrada()` | stock.ts | 357 | `unidad_medida` del form (texto) |

### ✅ JOINs correctos

| Función | Líneas | JOIN |
|---------|--------|------|
| `completarProduccion()` | 884-888 | `unidad:unidad_medida!inner(...)` |
| `createProduccion()` | 411-415 | `unidad:unidad_medida!inner(...)` |
| `registrarEntrada()` | N/A | No necesita JOIN (recibe texto) |

## Valores Almacenados

Los valores guardados en `movimiento_laboratorio.unidad_medida` son:

### Peso
- `'kilogramo'` o `'kg'`
- `'gramo'` o `'g'`

### Volumen
- `'litro'` o `'l'`
- `'mililitro'` o `'ml'`

### Unidad
- `'unidad'` o `'u'`

## Sistema de Conversión

El sistema de conversión de unidades (`/lib/utils/units.ts`) espera **texto**, no UUIDs:

```typescript
// ✅ Funciona correctamente
convertToBaseUnit(1000, 'g')  // Retorna 1000
convertToBaseUnit(1, 'kg')    // Retorna 1000
convertUnit(2000, 'g', 'kg')  // Retorna 2

// ❌ Fallaría con UUIDs
convertToBaseUnit(1, '123e4567-e89b-12d3-a456-426614174000')  // Error
```

## Logs de Verificación

Los logs actuales confirman que se usan abreviaturas:

```typescript
// completarProduccion - línea 922
console.log('[completarProduccion] 11. Insumos calculados:', insumosCalculados)
// Output: { unidad_medida: 'kg', ... }

// createProduccion - línea 449
console.log('[createProduccion] 2. Insumos requeridos:', insumosCalculados)
// Output: { unidad_medida: 'g', ... }

// getStockByInsumo - línea 242
console.log(`[getStockByInsumo] Movimiento: ${cantidad} ${unidadMov} = ${cantidadBase} (base)`)
// Output: "Movimiento: 2 kg = 2000 (base)"
```

## Conclusión

✅ **El código actual ya está correcto**. No se requieren cambios.

**Razones:**
1. Todos los INSERT usan `ri.unidad?.abreviatura` (texto), no `ri.unidad_medida` (UUID)
2. Los JOIN están configurados correctamente para obtener nombre y abreviatura
3. La tabla `movimiento_laboratorio.unidad_medida` es VARCHAR(50), compatible con texto
4. El sistema de conversión de unidades funciona correctamente con valores de texto
5. Los formularios envían texto directamente

**Verificado en:**
- `app/actions/produccion.ts` - Líneas 411-447, 884-920, 1105-1116
- `app/actions/stock.ts` - Líneas 352-363
- `supabase/migrations/20251028_001_initial_schema.sql` - Líneas 267-279, 342-351
- `lib/utils/units.ts` - Todo el archivo

**Fecha de verificación**: 2025-11-18
