# Visualización Adaptativa de Unidades

## Descripción

Sistema de formateo inteligente que convierte automáticamente unidades de medida a formatos más legibles cuando las cantidades son grandes.

## Problema Resuelto

**Antes:**
- 50,000 g (difícil de leer)
- 2,500 ml (poco intuitivo)

**Después:**
- 50 kg (más legible)
- 2.5 l (más intuitivo)

## Implementación

### Función Principal

`/lib/utils/units.ts` - Líneas 226-291

```typescript
export function formatCantidadConUnidad(
  cantidad: number,
  unidadBase: string,
  locale: string = 'es-AR'
): string
```

### Lógica de Conversión

#### 1. Peso (g → kg)
```typescript
Si cantidad >= 1000 Y unidad es 'g' o 'gramo':
  - Dividir cantidad / 1000
  - Cambiar unidad a 'kg'

Ejemplos:
  - 50000 g → 50 kg
  - 2500 g → 2.5 kg
  - 750 g → 750 g (sin cambio)
```

#### 2. Volumen (ml → l)
```typescript
Si cantidad >= 1000 Y unidad es 'ml' o 'mililitro':
  - Dividir cantidad / 1000
  - Cambiar unidad a 'l'

Ejemplos:
  - 1500 ml → 1.5 l
  - 3000 ml → 3 l
  - 250 ml → 250 ml (sin cambio)
```

#### 3. Unidades Contables
```typescript
Las unidades NO se convierten, solo se formatean:

Ejemplos:
  - 100 u → 100 u
  - 5000 u → 5,000 u (con separador de miles)
```

### Formateo de Números

Utiliza `Intl.NumberFormat('es-AR')` para formateo localizado:

```typescript
const formatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

// Ejemplos
formatter.format(50)      // "50"
formatter.format(2.5)     // "2,5"
formatter.format(1500)    // "1.500"
formatter.format(50000)   // "50.000"
```

## Componentes Modificados

### 1. `/components/stock/StockTable.tsx`

**Cambio**: Columna "Stock Actual"

**Antes:**
```tsx
{/* Stock Actual */}
<TableCell className="text-right">
  <span className="font-mono font-semibold">
    {new Intl.NumberFormat('es-AR').format(item.stock_actual)}
  </span>
</TableCell>

{/* Unidad */}
<TableCell>{item.unidad_medida}</TableCell>
```

**Después:**
```tsx
{/* Stock Actual con Unidad */}
<TableCell className="text-right">
  <span className="font-mono font-semibold">
    {formatCantidadConUnidad(item.stock_actual, item.unidad_medida)}
  </span>
</TableCell>
```

**Mejoras:**
- ✅ Unidad integrada con cantidad
- ✅ Conversión automática a unidades mayores
- ✅ Una columna menos en la tabla
- ✅ Mejor legibilidad

### 2. `/components/stock/MovimientosDialog.tsx`

**Cambio**: Badge de cantidad

**Antes:**
```tsx
<Badge variant={esEntrada ? 'success' : 'destructive'}>
  {esEntrada && '+'}
  {new Intl.NumberFormat('es-AR').format(cantidad)} {movimiento.unidad_medida || ''}
</Badge>
```

**Después:**
```tsx
<Badge variant={esEntrada ? 'success' : 'destructive'}>
  {esEntrada && '+'}
  {formatCantidadConUnidad(Math.abs(cantidad), movimiento.unidad_medida || 'unidad')}
</Badge>
```

**Notas:**
- Usa `Math.abs()` porque las cantidades pueden ser negativas (salidas)
- El signo +/- se muestra por separado según el tipo de movimiento

### 3. `/components/stock/MovimientosTable.tsx`

**Cambio**: Badge de cantidad en tabla de historial completo

**Antes:**
```tsx
<Badge variant={esEntrada ? 'success' : 'destructive'} className="font-mono">
  {esEntrada && '+'}
  {new Intl.NumberFormat('es-AR').format(cantidad)} {movimiento.unidad_medida || ''}
</Badge>
```

**Después:**
```tsx
<Badge variant={esEntrada ? 'success' : 'destructive'} className="font-mono">
  {esEntrada && '+'}
  {formatCantidadConUnidad(Math.abs(cantidad), movimiento.unidad_medida || 'unidad')}
</Badge>
```

## Ejemplos de Uso

### Ejemplo 1: Stock de Semillas

```typescript
// Datos de entrada
stock_actual: 50000
unidad_medida: 'g'

// Visualización
formatCantidadConUnidad(50000, 'g')
// Output: "50 kg"
```

**En UI:**
```
┌─────────────────┬──────────────┐
│ Insumo          │ Stock Actual │
├─────────────────┼──────────────┤
│ Semilla de Pino │ 50 kg        │ ✅ Legible
└─────────────────┴──────────────┘

vs

┌─────────────────┬──────────────┐
│ Insumo          │ Stock Actual │
├─────────────────┼──────────────┤
│ Semilla de Pino │ 50,000 g     │ ❌ Difícil de leer
└─────────────────┴──────────────┘
```

### Ejemplo 2: Movimiento de Agua

```typescript
// Entrada
cantidad: 1500
unidad_medida: 'ml'

// Visualización
formatCantidadConUnidad(1500, 'ml')
// Output: "1.5 l"
```

**En Badge:**
```tsx
<Badge variant="success">
  +1.5 l  ✅ Intuitivo
</Badge>

vs

<Badge variant="success">
  +1,500 ml  ❌ Menos claro
</Badge>
```

### Ejemplo 3: Stock Bajo

```typescript
// Entrada
stock_actual: 750
unidad_medida: 'g'

// Visualización
formatCantidadConUnidad(750, 'g')
// Output: "750 g"  (sin conversión, < 1000)
```

### Ejemplo 4: Unidades Contables

```typescript
// Entrada
stock_actual: 5000
unidad_medida: 'unidad'

// Visualización
formatCantidadConUnidad(5000, 'unidad')
// Output: "5,000 u"  (no se convierte, solo formato)
```

### Ejemplo 5: Salida de Stock

```typescript
// Movimiento de salida
cantidad: -2500
unidad_medida: 'g'

// En componente
{esEntrada && '+'}
{formatCantidadConUnidad(Math.abs(cantidad), unidad_medida)}

// Output: "2.5 kg"  (sin signo negativo, se muestra icono de salida)
```

## Tabla de Conversiones

| Cantidad Original | Unidad | Resultado | Razón |
|-------------------|--------|-----------|-------|
| 50,000 g | g | 50 kg | >= 1000 y es base (g) |
| 2,500 g | g | 2.5 kg | >= 1000 y es base (g) |
| 750 g | g | 750 g | < 1000, mantener |
| 1,500 ml | ml | 1.5 l | >= 1000 y es base (ml) |
| 250 ml | ml | 250 ml | < 1000, mantener |
| 5 kg | kg | 5 kg | Ya está en unidad mayor |
| 2.5 l | l | 2.5 l | Ya está en unidad mayor |
| 5,000 u | u | 5,000 u | Unidades no se convierten |
| 100 u | u | 100 u | Unidades no se convierten |

## Beneficios

### 1. Mejor Legibilidad
- ✅ 50 kg es más fácil de leer que 50,000 g
- ✅ 1.5 l es más intuitivo que 1,500 ml
- ✅ Reduce carga cognitiva del usuario

### 2. Interfaz Más Limpia
- ✅ Menos columnas en tablas (stock + unidad juntos)
- ✅ Formato consistente en toda la aplicación
- ✅ Aprovecha mejor el espacio horizontal

### 3. Formato Localizado
- ✅ Separadores de miles según locale argentino
- ✅ Coma como separador decimal
- ✅ Punto como separador de miles

### 4. Flexibilidad
- ✅ Usuarios pueden ingresar en cualquier unidad compatible
- ✅ Sistema convierte automáticamente para visualización
- ✅ Backend sigue manejando conversiones correctamente

## Casos de Prueba

### Test 1: Conversión de gramos a kilogramos
```typescript
expect(formatCantidadConUnidad(50000, 'g')).toBe('50 kg')
expect(formatCantidadConUnidad(2500, 'g')).toBe('2,5 kg')  // Locale es-AR
expect(formatCantidadConUnidad(1000, 'g')).toBe('1 kg')
```

### Test 2: Mantener gramos cuando < 1000
```typescript
expect(formatCantidadConUnidad(750, 'g')).toBe('750 g')
expect(formatCantidadConUnidad(100, 'g')).toBe('100 g')
expect(formatCantidadConUnidad(999, 'g')).toBe('999 g')
```

### Test 3: Conversión de mililitros a litros
```typescript
expect(formatCantidadConUnidad(1500, 'ml')).toBe('1,5 l')
expect(formatCantidadConUnidad(3000, 'ml')).toBe('3 l')
```

### Test 4: Mantener mililitros cuando < 1000
```typescript
expect(formatCantidadConUnidad(250, 'ml')).toBe('250 ml')
expect(formatCantidadConUnidad(500, 'ml')).toBe('500 ml')
```

### Test 5: Unidades contables no se convierten
```typescript
expect(formatCantidadConUnidad(100, 'unidad')).toBe('100 u')
expect(formatCantidadConUnidad(5000, 'unidad')).toBe('5.000 u')
```

### Test 6: Unidades ya mayores no se modifican
```typescript
expect(formatCantidadConUnidad(5, 'kg')).toBe('5 kg')
expect(formatCantidadConUnidad(2.5, 'litro')).toBe('2,5 l')
```

## Compatibilidad

### Unidades Soportadas

**Peso:**
- `'gramo'`, `'g'` → Base (convierte a kg si >= 1000)
- `'kilogramo'`, `'kg'` → Mayor (no convierte)

**Volumen:**
- `'mililitro'`, `'ml'` → Base (convierte a l si >= 1000)
- `'litro'`, `'l'` → Mayor (no convierte)

**Contable:**
- `'unidad'`, `'u'` → No convierte, solo formatea

### Manejo de Errores

```typescript
// Unidad no reconocida
formatCantidadConUnidad(100, 'xyz')
// Output: "100 xyz"  (formateo básico, no convierte)
```

## Integración con Backend

La función de visualización **NO afecta** los cálculos del backend:

1. **Backend** sigue guardando valores en unidades originales
2. **Backend** sigue usando `convertToBaseUnit()` para cálculos
3. **Frontend** usa `formatCantidadConUnidad()` solo para **mostrar**
4. **Separación de responsabilidades**: Backend = cálculo, Frontend = presentación

### Ejemplo de Flujo Completo

```typescript
// 1. Usuario ingresa entrada de stock
Form Input: 2500 gramos

// 2. Backend guarda tal cual
DB: cantidad = 2500, unidad_medida = 'g'

// 3. Backend calcula stock total (conversión interna)
Stock calculation:
  - Movimiento 1: 2000 g → 2000 (base)
  - Movimiento 2: 2500 g → 2500 (base)
  - Total: 4500 g (base)

// 4. Frontend obtiene stock
API Response: { stock_actual: 4500, unidad_medida: 'g' }

// 5. Frontend formatea para mostrar
UI Display: formatCantidadConUnidad(4500, 'g')
Result: "4.5 kg"  ✅ Legible para el usuario
```

## Notas de Implementación

### Por qué 1000 como umbral?

- 1 kg = 1000 g
- 1 l = 1000 ml
- Punto natural de conversión en sistema métrico
- Legibilidad: números de 1-3 dígitos son más fáciles de leer

### Por qué solo convertir unidades base?

- Evita conversiones circulares (kg → g → kg)
- Mantiene la lógica simple y predecible
- Usuario puede elegir la unidad de entrada

### Limitaciones

- No convierte entre tipos diferentes (peso ↔ volumen)
- Solo soporta un nivel de conversión (g ↔ kg, ml ↔ l)
- No maneja unidades no métricas (onzas, libras, etc.)

## Fecha de Implementación

**Fecha**: 2025-11-18

**Archivos modificados:**
- `/lib/utils/units.ts` (nueva función)
- `/components/stock/StockTable.tsx`
- `/components/stock/MovimientosDialog.tsx`
- `/components/stock/MovimientosTable.tsx`
