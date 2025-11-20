# Conversión de Unidades en Validación de Stock

Este documento explica cómo funciona la conversión automática de unidades al validar stock durante la completación de producciones.

## Problema Anterior

**ANTES** de la integración de conversión de unidades:

```typescript
// ❌ Comparación simple sin considerar unidades
if (stockActual < insumo.cantidad_necesaria) {
  error(`Stock insuficiente: ${stockActual} vs ${cantidad_necesaria}`)
}
```

**Problemas:**
1. Si el stock está en `kilogramos` pero la receta en `gramos` → falla incorrectamente
2. Si el stock está en `litros` pero la receta en `mililitros` → falla incorrectamente
3. Mensajes de error sin unidades → confusión

### Ejemplo del problema:
```
Stock disponible: 2 kilogramos
Receta necesita: 1500 gramos

Comparación simple: 2 < 1500 → ❌ ERROR (incorrecto!)
Realidad: 2 kg = 2000 g > 1500 g → ✅ OK
```

## Solución Actual

**DESPUÉS** de la integración:

```typescript
// ✅ Comparación con conversión automática de unidades
const haySuficiente = compareStock(
  stockActual,
  unidadStock,        // 'kilogramo'
  cantidadNecesaria,
  unidadNecesaria     // 'gramo'
)

if (!haySuficiente) {
  error(
    `Stock insuficiente: ` +
    `disponible ${formatCantidad(stockActual, unidadStock)}, ` +
    `necesario ${formatCantidad(cantidadNecesaria, unidadNecesaria)}`
  )
}
```

**Beneficios:**
1. ✅ Conversión automática entre unidades compatibles
2. ✅ Validación correcta independiente de las unidades
3. ✅ Mensajes de error claros con unidades formateadas
4. ✅ Detección de unidades incompatibles

### Ejemplo de la solución:
```
Stock disponible: 2 kilogramos
Receta necesita: 1500 gramos

Conversión: 2 kg → 2000 g
Comparación: 2000 g >= 1500 g → ✅ OK
```

## Flujo de Validación

```
┌─────────────────────────────────────────────────────────────┐
│ 1. OBTENER DATOS DEL INSUMO                                 │
├─────────────────────────────────────────────────────────────┤
│   - Buscar insumo en BD                                     │
│   - Obtener unidad oficial del insumo (ej: 'kilogramo')    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CALCULAR STOCK ACTUAL                                    │
├─────────────────────────────────────────────────────────────┤
│   - Sumar todos los movimientos del insumo                 │
│   - Stock en unidad oficial: 2 kg                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. OBTENER CANTIDAD NECESARIA DE LA RECETA                 │
├─────────────────────────────────────────────────────────────┤
│   - Receta especifica: 1500 g                              │
│   - Unidad de la receta: 'gramo'                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. COMPARAR CON CONVERSIÓN DE UNIDADES                     │
├─────────────────────────────────────────────────────────────┤
│   compareStock(2, 'kilogramo', 1500, 'gramo')              │
│                                                             │
│   Internamente:                                             │
│   - Convierte 2 kg a unidad base → 2000 g                  │
│   - Convierte 1500 g a unidad base → 1500 g                │
│   - Compara: 2000 >= 1500 → true                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. RESULTADO                                                │
├─────────────────────────────────────────────────────────────┤
│   ✅ Stock suficiente → Continuar producción                │
│   ❌ Stock insuficiente → Mostrar error con cantidades      │
└─────────────────────────────────────────────────────────────┘
```

## Casos de Uso

### Caso 1: Stock suficiente con conversión

```typescript
Stock: 3 kg
Necesario: 2500 g

compareStock(3, 'kilogramo', 2500, 'gramo')
// Conversión: 3 kg → 3000 g
// Comparación: 3000 g >= 2500 g
// Resultado: ✅ true

// Producción continúa normalmente
```

### Caso 2: Stock insuficiente

```typescript
Stock: 1 kg
Necesario: 1500 g

compareStock(1, 'kilogramo', 1500, 'gramo')
// Conversión: 1 kg → 1000 g
// Comparación: 1000 g >= 1500 g
// Resultado: ❌ false

// Error mostrado al usuario:
// "Stock insuficiente para completar la producción:
//  Semilla de Pino: disponible 1 kg, necesario 1.500 g"
```

### Caso 3: Unidades incompatibles

```typescript
Stock: 2 kg (peso)
Necesario: 1.5 litros (volumen)

compareStock(2, 'kilogramo', 1.5, 'litro')
// Error: No se pueden comparar unidades de diferentes tipos

// Error mostrado al usuario:
// "Error al comparar unidades para Semilla de Pino:
//  No se pueden comparar unidades de diferentes tipos:
//  'kilogramo' (peso) vs 'litro' (volumen)"
```

### Caso 4: Unidades en volumen

```typescript
Stock: 2.5 litros
Necesario: 2000 ml

compareStock(2.5, 'litro', 2000, 'mililitro')
// Conversión: 2.5 l → 2500 ml
// Comparación: 2500 ml >= 2000 ml
// Resultado: ✅ true

// Producción continúa normalmente
```

## Logs de Debug

La función `completarProduccion()` incluye logs detallados para debugging:

```typescript
console.log('[completarProduccion] 11.1. Verificando stock con conversión de unidades:', {
  insumo: 'Semilla de Pino',
  stockActual: 2,
  unidadStock: 'kilogramo',
  cantidadNecesaria: 1500,
  unidadNecesaria: 'gramo',
})

// Si hay stock insuficiente:
console.log('[completarProduccion] 11.2. Stock insuficiente detectado:', [
  'Semilla de Pino: disponible 1 kg, necesario 1.500 g'
])

// Si todo está OK:
console.log('[completarProduccion] 11.3. Validación de stock exitosa, todos los insumos disponibles')
```

## Mensajes de Error

### Stock insuficiente (múltiples insumos)

```
Stock insuficiente para completar la producción:
Semilla de Pino: disponible 1 kg, necesario 1.500 g
Humus: disponible 500 g, necesario 800 g
Agua: disponible 1,5 l, necesario 2.000 ml
```

### Error de conversión

```
Error al comparar unidades para Semilla de Pino:
No se pueden comparar unidades de diferentes tipos: "kilogramo" (peso) vs "litro" (volumen)
```

### Unidad no reconocida

```
Error al comparar unidades para Semilla de Pino:
Unidad "libras" no reconocida. Unidades válidas: kilogramo, kg, gramo, g, litro, l, mililitro, ml, unidad, u
```

## Unidades Soportadas

### Peso (base: gramo)
- **kilogramo** (kg) = 1000 gramos
- **gramo** (g) = 1 gramo

### Volumen (base: mililitro)
- **litro** (l) = 1000 mililitros
- **mililitro** (ml) = 1 mililitro

### Unidades Contables (base: unidad)
- **unidad** (u) = 1 unidad

## Notas Importantes

1. **Unidad del insumo**: Se obtiene de la tabla `Insumo.unidad_medida`, que es la unidad "oficial" del insumo.

2. **Unidad de la receta**: Se obtiene de `Receta_insumo.unidad_medida`, que debería coincidir con la del insumo (pero puede diferir, por eso la conversión).

3. **Stock acumulado**: El stock se calcula sumando todos los movimientos del insumo, asumiendo que están en la unidad oficial del insumo.

4. **Case-insensitive**: Las unidades son case-insensitive ('Kilogramo', 'kilogramo', 'KILOGRAMO' son equivalentes).

5. **Nombres y abreviaturas**: Se puede usar tanto el nombre completo ('kilogramo') como la abreviatura ('kg').

## Testing Manual

Para probar la conversión de unidades:

1. **Crear un insumo** con unidad en kilogramos
2. **Agregar stock** de 2 kg mediante movimiento de entrada
3. **Crear una receta** que use ese insumo con 1500 gramos
4. **Iniciar y completar producción** con 1 iSeed

**Resultado esperado**:
- ✅ Validación pasa (2 kg >= 1500 g)
- ✅ Se descuentan 1500 g del stock
- ✅ Stock final: 0.5 kg (500 g)

## Integración Futura

Este sistema de conversión de unidades también puede integrarse en:

- ✅ `completarProduccion()` - Ya integrado
- ⬜ `registrarEntradaStock()` - Pendiente
- ⬜ `registrarSalidaStock()` - Pendiente
- ⬜ Reportes de stock - Pendiente
- ⬜ Alertas de stock bajo - Pendiente
