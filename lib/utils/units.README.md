# Utilidad de Conversión de Unidades

Utilidad para conversión, comparación y formateo de unidades de medida en el sistema Reforest.

## Características

- ✅ Conversión entre unidades compatibles (kg ↔ g, l ↔ ml)
- ✅ Comparación de cantidades en diferentes unidades
- ✅ Validación de compatibilidad de unidades
- ✅ Formateo de cantidades con locale
- ✅ Manejo robusto de errores
- ✅ TypeScript con tipos estrictos

## Unidades Soportadas

### Peso
- **Kilogramo** (kg, kilogramo)
- **Gramo** (g, gramo) ← Unidad base

### Volumen
- **Litro** (l, litro)
- **Mililitro** (ml, mililitro) ← Unidad base

### Unidades Contables
- **Unidad** (u, unidad) ← Unidad base

## API

### `convertToBaseUnit(cantidad, unidad): number`

Convierte una cantidad a su unidad base (gramos, mililitros o unidades).

```typescript
convertToBaseUnit(2, 'kilogramo')    // 2000 gramos
convertToBaseUnit(1.5, 'litro')      // 1500 mililitros
convertToBaseUnit(500, 'g')          // 500 gramos
```

### `getBaseUnit(tipo): string`

Obtiene el nombre de la unidad base para un tipo.

```typescript
getBaseUnit('peso')       // 'gramo'
getBaseUnit('volumen')    // 'mililitro'
getBaseUnit('unidad')     // 'unidad'
```

### `getTipoUnidad(unidad): TipoUnidad`

Obtiene el tipo de una unidad (peso, volumen, unidad).

```typescript
getTipoUnidad('kilogramo')  // 'peso'
getTipoUnidad('ml')         // 'volumen'
getTipoUnidad('unidad')     // 'unidad'
```

### `compareStock(stockCantidad, stockUnidad, requiredCantidad, requiredUnidad): boolean`

Compara si el stock disponible es suficiente para la cantidad requerida.

```typescript
// ¿Tenemos suficiente stock?
compareStock(2, 'kilogramo', 1500, 'gramo')  // true (2000g >= 1500g)
compareStock(1, 'litro', 1200, 'ml')         // false (1000ml < 1200ml)
compareStock(500, 'g', 0.4, 'kg')            // true (500g >= 400g)

// Error: unidades incompatibles
compareStock(5, 'kg', 3, 'litro')  // Error: no se puede comparar peso con volumen
```

### `convertUnit(cantidad, unidadOrigen, unidadDestino): number`

Convierte una cantidad de una unidad a otra compatible.

```typescript
convertUnit(2, 'kilogramo', 'gramo')      // 2000
convertUnit(1500, 'mililitro', 'litro')   // 1.5
convertUnit(0.5, 'kg', 'g')               // 500

// Error: unidades incompatibles
convertUnit(2, 'kg', 'litro')  // Error: no se puede convertir peso a volumen
```

### `formatCantidad(cantidad, unidad, locale?): string`

Formatea una cantidad con su unidad de forma legible.

```typescript
formatCantidad(2500, 'gramo')           // "2.500 g"
formatCantidad(1.5, 'litro')            // "1,5 l"
formatCantidad(1000, 'ml')              // "1.000 ml"
formatCantidad(1000, 'ml', 'en-US')     // "1,000 ml"
```

## Casos de Uso Comunes

### 1. Verificar Stock Antes de Producción

```typescript
import { compareStock, formatCantidad } from '@/lib/utils/units'

function verificarStock(
  stockDisponible: number,
  stockUnidad: string,
  necesario: number,
  necesarioUnidad: string
) {
  const haySuficiente = compareStock(
    stockDisponible,
    stockUnidad,
    necesario,
    necesarioUnidad
  )

  if (!haySuficiente) {
    throw new Error(
      `Stock insuficiente. Disponible: ${formatCantidad(stockDisponible, stockUnidad)}, ` +
      `Necesario: ${formatCantidad(necesario, necesarioUnidad)}`
    )
  }

  return true
}

// Uso
verificarStock(3, 'kilogramo', 2500, 'gramo')  // ✓ true
verificarStock(1, 'litro', 1200, 'ml')         // ✗ Error
```

### 2. Calcular Stock Restante

```typescript
import { convertToBaseUnit, convertUnit, formatCantidad } from '@/lib/utils/units'

function calcularStockRestante(
  stockInicial: number,
  stockUnidad: string,
  consumo: number,
  consumoUnidad: string
) {
  // Convertir todo a unidad base
  const stockBase = convertToBaseUnit(stockInicial, stockUnidad)
  const consumoBase = convertToBaseUnit(consumo, consumoUnidad)

  // Calcular restante
  const restanteBase = stockBase - consumoBase

  // Convertir de vuelta a la unidad del stock
  const restante = convertUnit(restanteBase, 'gramo', stockUnidad)

  return {
    inicial: formatCantidad(stockInicial, stockUnidad),
    consumido: formatCantidad(consumo, consumoUnidad),
    restante: formatCantidad(restante, stockUnidad),
    restanteNumerico: restante
  }
}

// Uso
const resultado = calcularStockRestante(5, 'kilogramo', 1500, 'gramo')
console.log(resultado)
// {
//   inicial: "5 kg",
//   consumido: "1.500 g",
//   restante: "3,5 kg",
//   restanteNumerico: 3.5
// }
```

### 3. Validar Unidades en Formularios

```typescript
import { getTipoUnidad, compareStock } from '@/lib/utils/units'

function validarEntradaStock(
  cantidad: number,
  unidad: string,
  tipoEsperado: 'peso' | 'volumen' | 'unidad'
) {
  try {
    const tipo = getTipoUnidad(unidad)

    if (tipo !== tipoEsperado) {
      return {
        valid: false,
        error: `Se esperaba una unidad de ${tipoEsperado}, pero se recibió ${tipo}`
      }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: (error as Error).message
    }
  }
}

// Uso en un server action
validarEntradaStock(500, 'gramo', 'peso')      // { valid: true }
validarEntradaStock(500, 'litro', 'peso')      // { valid: false, error: "..." }
validarEntradaStock(500, 'libras', 'peso')     // { valid: false, error: "..." }
```

## Manejo de Errores

La librería lanza errores descriptivos en casos como:

1. **Unidad no reconocida**
```typescript
convertToBaseUnit(10, 'libras')
// Error: Unidad "libras" no reconocida. Unidades válidas: kilogramo, kg, gramo, g, ...
```

2. **Unidades incompatibles**
```typescript
compareStock(2, 'kilogramo', 1.5, 'litro')
// Error: No se pueden comparar unidades de diferentes tipos: "kilogramo" (peso) vs "litro" (volumen)
```

3. **Tipo de unidad inválido**
```typescript
getBaseUnit('temperatura' as any)
// Error: Tipo de unidad "temperatura" no válido
```

## Integración con Server Actions

```typescript
// app/actions/stock.ts
import { compareStock, convertToBaseUnit, formatCantidad } from '@/lib/utils/units'

export async function verificarDisponibilidadInsumo(
  id_insumo: string,
  cantidadNecesaria: number,
  unidadNecesaria: string
) {
  // Obtener stock actual de la BD
  const stock = await supabase
    .from('stock')
    .select('cantidad, unidad')
    .eq('id_insumo', id_insumo)
    .single()

  if (!stock.data) {
    return { disponible: false, mensaje: 'Insumo no encontrado en stock' }
  }

  try {
    const hayStock = compareStock(
      stock.data.cantidad,
      stock.data.unidad,
      cantidadNecesaria,
      unidadNecesaria
    )

    if (!hayStock) {
      return {
        disponible: false,
        mensaje: `Stock insuficiente. Disponible: ${formatCantidad(stock.data.cantidad, stock.data.unidad)}, Necesario: ${formatCantidad(cantidadNecesaria, unidadNecesaria)}`
      }
    }

    return { disponible: true }
  } catch (error) {
    return {
      disponible: false,
      mensaje: `Error al verificar stock: ${(error as Error).message}`
    }
  }
}
```

## Testing

Para probar la utilidad, ejecuta:

```bash
npx tsx lib/utils/units.test.example.ts
```

Este comando ejecutará todos los ejemplos y casos de prueba.

## Agregar Nuevas Unidades

Para agregar soporte para nuevas unidades, edita el objeto `UNIDADES_CONOCIDAS` en `units.ts`:

```typescript
export const UNIDADES_CONOCIDAS: Record<string, UnidadConversion> = {
  // ... unidades existentes ...

  // Agregar nueva unidad
  tonelada: { nombre: 'tonelada', abreviatura: 't', tipo: 'peso', factorConversion: 1000000 },
  t: { nombre: 'tonelada', abreviatura: 't', tipo: 'peso', factorConversion: 1000000 },
}
```

**Nota:** El `factorConversion` debe ser el multiplicador para convertir a la unidad base:
- Peso: base = gramo
- Volumen: base = mililitro
- Unidad: base = unidad

## Notas Importantes

1. **Case-insensitive**: Todas las funciones aceptan nombres de unidades en mayúsculas o minúsculas.
2. **Nombres y abreviaturas**: Puedes usar tanto el nombre completo ("kilogramo") como la abreviatura ("kg").
3. **Validación automática**: Las funciones validan automáticamente la compatibilidad de unidades.
4. **Manejo de errores**: Siempre usa try-catch al trabajar con unidades provistas por usuarios.
