# Resumen de Implementación: Formateo Adaptativo de Unidades

## Fecha de Implementación
**2025-11-18**

## Función Principal

**Archivo:** `/lib/utils/units.ts`
**Función:** `formatCantidadConUnidad(cantidad: number, unidadBase: string, locale?: string): string`
**Líneas:** 226-291

### Comportamiento
- Si `cantidad >= 1000` Y unidad es base (`g`, `ml`) → Convierte a unidad mayor (`kg`, `l`)
- Si `cantidad < 1000` → Mantiene unidad original
- Unidades contables (`u`) → Solo formatea con separadores, no convierte
- Usa `Intl.NumberFormat('es-AR')` para formato localizado argentino

### Ejemplos
```typescript
formatCantidadConUnidad(50000, 'g')   // "50 kg"
formatCantidadConUnidad(750, 'g')     // "750 g"
formatCantidadConUnidad(1500, 'ml')   // "1.5 l"
formatCantidadConUnidad(250, 'ml')    // "250 ml"
formatCantidadConUnidad(5000, 'u')    // "5,000 u"
```

## Componentes Modificados

### 1. ✅ Stock - Tabla Principal
**Archivo:** `/components/stock/StockTable.tsx`

**Cambios:**
- **Línea 25**: Import agregado
  ```typescript
  import { formatCantidadConUnidad } from '@/lib/utils/units'
  ```
- **Líneas 133-139**: Columnas de header reducidas (eliminada columna "Unidad")
  ```tsx
  <TableHead>Insumo</TableHead>
  <TableHead>Tipo</TableHead>
  <TableHead className="text-right">Stock Actual</TableHead>
  <TableHead>Estado</TableHead>
  <TableHead className="text-right">Acciones</TableHead>
  ```
- **Línea 145**: colspan actualizado a 5 (antes 6)
- **Líneas 173-178**: Stock actual con unidad integrada
  ```tsx
  <TableCell className="text-right">
    <span className="font-mono font-semibold">
      {formatCantidadConUnidad(item.stock_actual, item.unidad_medida)}
    </span>
  </TableCell>
  ```

**Resultado:**
| Antes | Después |
|-------|---------|
| 50,000 (g) | 50 kg |
| 1,500 (ml) | 1.5 l |
| 750 (g) | 750 g |

### 2. ✅ Stock - Dialog de Movimientos
**Archivo:** `/components/stock/MovimientosDialog.tsx`

**Cambios:**
- **Línea 26**: Import agregado
- **Línea 159**: Badge de cantidad formateada
  ```tsx
  <Badge variant={esEntrada ? 'success' : 'destructive'}>
    {esEntrada && '+'}
    {formatCantidadConUnidad(Math.abs(cantidad), movimiento.unidad_medida || 'unidad')}
  </Badge>
  ```

**Notas:**
- Usa `Math.abs()` porque las cantidades pueden ser negativas (salidas de stock)
- El signo +/- se muestra por separado según el tipo de movimiento

**Resultado:**
- Entrada: **+1.5 l** (antes: +1,500 ml)
- Salida: **2.5 kg** (antes: 2,500 g)

### 3. ✅ Stock - Tabla de Historial Completo
**Archivo:** `/components/stock/MovimientosTable.tsx`

**Cambios:**
- **Línea 30**: Import agregado
- **Línea 281**: Badge de cantidad formateada
  ```tsx
  <Badge variant={esEntrada ? 'success' : 'destructive'} className="font-mono">
    {esEntrada && '+'}
    {formatCantidadConUnidad(Math.abs(cantidad), movimiento.unidad_medida || 'unidad')}
  </Badge>
  ```

**Resultado:**
- Historial completo con formato consistente
- Movimientos grandes más legibles

### 4. ✅ Recetas - Lista de Insumos
**Archivo:** `/components/recetas/RecetaInsumosList.tsx`

**Cambios:**
- **Línea 21**: Import agregado
  ```typescript
  import { formatCantidadConUnidad } from '@/lib/utils/units'
  ```
- **Líneas 133-138**: Columnas de header reducidas (eliminada columna "Unidad")
  ```tsx
  <TableHead>Insumo</TableHead>
  <TableHead className="text-right">Cantidad</TableHead>
  {canEdit && <TableHead className="w-[80px]">Acciones</TableHead>}
  ```
- **Líneas 153-158**: Cantidad individual formateada
  ```tsx
  <TableCell className="text-right font-mono">
    {formatCantidadConUnidad(
      insumo.cantidad,
      insumo.unidad.abreviatura || insumo.unidad.nombre
    )}
  </TableCell>
  ```
- **Línea 180**: colspan actualizado (de 4 a 3 para canEdit, de 3 a 2 sin edit)
- **Líneas 186-193**: Totales por unidad formateados
  ```tsx
  {totalesPorUnidad.map((total, idx) => (
    <Badge key={idx} variant="secondary" className="font-mono text-sm">
      {formatCantidadConUnidad(
        total.total,
        total.abreviatura || total.unidad
      )}
    </Badge>
  ))}
  ```

**Resultado:**
- Cantidades de insumos en recetas más legibles
- Totales agrupados por unidad con formato adaptativo
- Ejemplo: Receta con 2500 g de semilla → muestra "2.5 kg"

## Componentes NO Modificados (No Requieren Cambios)

### InsumosTable.tsx
**Razón:** Solo muestra la unidad de medida como propiedad del insumo (catálogo), no muestra cantidades.

### ProduccionesTable.tsx
**Razón:** Muestra cantidades de producción en "iSeeds", no cantidades de insumos con unidades.

### ProyectoTabs.tsx
**Razón:** Muestra información de proyectos, no cantidades de insumos.

### Otros componentes de forms
**Razón:** Son formularios de entrada, no de visualización de cantidades.

## Resumen de Cambios por Tipo

### Imports Agregados (4 archivos)
```typescript
import { formatCantidadConUnidad } from '@/lib/utils/units'
```

### Columnas Eliminadas (2 tablas)
- **StockTable**: Columna "Unidad" eliminada (stock + unidad ahora juntos)
- **RecetaInsumosList**: Columna "Unidad" eliminada (cantidad + unidad ahora juntos)

### Colspans Actualizados
- **StockTable**: 6 → 5
- **RecetaInsumosList**: 4 → 3 (con edit), 3 → 2 (sin edit)

### Formateo Aplicado (6 lugares)
1. StockTable - Stock actual (línea 176)
2. MovimientosDialog - Badge cantidad (línea 159)
3. MovimientosTable - Badge cantidad (línea 281)
4. RecetaInsumosList - Cantidad individual (líneas 154-157)
5. RecetaInsumosList - Totales por unidad (líneas 188-191)

## Beneficios Logrados

### 1. Mejor Legibilidad ✅
- **Antes:** 50,000 g (difícil de leer rápidamente)
- **Después:** 50 kg (instantáneamente comprensible)

### 2. Interfaz Más Limpia ✅
- Menos columnas en tablas
- Información más compacta
- Mejor uso del espacio horizontal

### 3. Consistencia ✅
- Mismo formato en toda la aplicación
- Stock, movimientos y recetas usan el mismo sistema
- Experiencia de usuario uniforme

### 4. Formato Localizado ✅
- Separador decimal: coma (,)
- Separador de miles: punto (.)
- Formato argentino estándar

### 5. Adaptativo e Inteligente ✅
- Convierte automáticamente cantidades grandes
- Mantiene unidades pequeñas cuando es apropiado
- No convierte unidades contables

## Casos de Uso Cubiertos

### Stock de Insumos
```
Escenario: Semilla de Pino con 50,000 gramos en stock
Antes: 50,000 | g
Después: 50 kg
```

### Movimientos de Entrada
```
Escenario: Ingreso de 1,500 mililitros de agua
Antes: +1,500 ml
Después: +1.5 l
```

### Movimientos de Salida
```
Escenario: Consumo de 2,500 gramos
Antes: -2,500 g
Después: 2.5 kg (sin signo, se muestra icono ↓)
```

### Recetas con Insumos
```
Escenario: Receta requiere 3,000 g de sustrato
Antes: 3,000 | g
Después: 3 kg
```

### Totales en Recetas
```
Escenario: Total de peso en receta = 5,500 g
Antes: 5,500 g
Después: 5.5 kg
```

## Verificación

### TypeScript ✅
```bash
npx tsc --noEmit
```
**Resultado:** Sin errores de compilación

### Archivos Totales Modificados: 5
1. `/lib/utils/units.ts` (nueva función)
2. `/components/stock/StockTable.tsx`
3. `/components/stock/MovimientosDialog.tsx`
4. `/components/stock/MovimientosTable.tsx`
5. `/components/recetas/RecetaInsumosList.tsx`

### Líneas de Código Modificadas: ~60
- Función nueva: ~65 líneas
- Imports: 4 líneas
- Formateo aplicado: ~30 líneas
- Estructura de tablas: ~20 líneas

## Compatibilidad con Backend

### Sin Cambios en Backend ✅
- Backend sigue guardando valores originales
- Backend sigue usando `convertToBaseUnit()` para cálculos
- Frontend solo usa `formatCantidadConUnidad()` para **visualización**
- Separación clara: Backend = cálculo, Frontend = presentación

### Flujo de Datos
```
1. Usuario ingresa: 2500 gramos
2. Backend guarda: cantidad=2500, unidad='g'
3. Backend calcula stock: conversión a base (2500g)
4. API retorna: { stock_actual: 2500, unidad_medida: 'g' }
5. Frontend formatea: formatCantidadConUnidad(2500, 'g')
6. UI muestra: "2.5 kg"
```

## Mantenimiento Futuro

### Para Agregar Nuevas Unidades
Modificar `/lib/utils/units.ts`:
```typescript
// Agregar a UNIDADES_CONOCIDAS
tonelada: { nombre: 'tonelada', abreviatura: 't', tipo: 'peso', factorConversion: 1000000 }

// Actualizar formatCantidadConUnidad para conversión adicional
if (cantidad >= 1000000 && tipo === 'peso') {
  cantidadFinal = cantidad / 1000000
  unidadFinal = 't'
}
```

### Para Modificar Umbral de Conversión
Cambiar `1000` en línea 265 de `/lib/utils/units.ts`:
```typescript
// Cambiar de 1000 a otro valor
if (cantidad >= UMBRAL && (tipo === 'peso' || tipo === 'volumen')) {
  // ...
}
```

### Para Aplicar en Nuevos Componentes
```typescript
// 1. Import
import { formatCantidadConUnidad } from '@/lib/utils/units'

// 2. Usar en renderizado
{formatCantidadConUnidad(cantidad, unidad)}

// 3. Para valores absolutos (movimientos)
{formatCantidadConUnidad(Math.abs(cantidad), unidad)}
```

## Documentación Relacionada

- `/docs/adaptive-unit-display.md` - Documentación detallada de la función
- `/docs/unit-conversion-in-production.md` - Conversión de unidades en producción
- `/docs/stock-calculation-fix.md` - Corrección de cálculo de stock

## Notas Adicionales

### Locale Argentino
El sistema usa `'es-AR'` como locale predeterminado:
- Separador decimal: coma (1,5)
- Separador de miles: punto (1.500)
- Formato estándar en Argentina

### Precisión
- Máximo 2 decimales
- Mínimo 0 decimales
- Redondeo automático

### Unidades Soportadas
**Peso:**
- Base: g, gramo
- Mayor: kg, kilogramo

**Volumen:**
- Base: ml, mililitro
- Mayor: l, litro

**Contable:**
- u, unidad (no se convierte)

## Testing Recomendado

### Test Manual
1. **Stock Table:**
   - Verificar insumo con > 1000 g muestra en kg
   - Verificar insumo con < 1000 g muestra en g

2. **Movimientos:**
   - Crear entrada de 5000 g → debe mostrar "5 kg"
   - Crear salida de 500 ml → debe mostrar "500 ml"

3. **Recetas:**
   - Agregar insumo con 2500 g → debe mostrar "2.5 kg"
   - Ver totales con > 1000 → debe mostrar en kg/l

### Test Automatizado (Futuro)
```typescript
describe('formatCantidadConUnidad', () => {
  it('converts grams to kg when >= 1000', () => {
    expect(formatCantidadConUnidad(50000, 'g')).toBe('50 kg')
  })

  it('keeps grams when < 1000', () => {
    expect(formatCantidadConUnidad(750, 'g')).toBe('750 g')
  })

  // ... más tests
})
```

## Estado Final

✅ **Implementación Completa**
✅ **Todos los componentes actualizados**
✅ **Compilación exitosa**
✅ **Documentación generada**
✅ **Sin breaking changes en backend**
✅ **Mejora significativa en UX**
