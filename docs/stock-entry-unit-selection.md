# Selección de Unidades en Registro de Stock

## Problema Anterior

El formulario de registro de entrada de stock tenía un campo de unidad de medida como `Input` disabled que se auto-completaba con la unidad del insumo seleccionado, pero **no permitía cambiar la unidad**.

### Comportamiento Anterior
```typescript
// Campo disabled, no editable
<Input {...field} disabled value={field.value || ''} />

// Descripción: "Se asigna automáticamente según el insumo"
```

**Problemas:**
1. ❌ No se podía cambiar la unidad aunque fuera compatible
2. ❌ Si el insumo tiene unidad "kilogramo" pero quieres ingresar "gramo", no era posible
3. ❌ Falta de flexibilidad para el usuario

## Solución Implementada

El campo ahora es un **Select editable** que muestra solo las unidades compatibles con el tipo de unidad del insumo seleccionado.

### Comportamiento Nuevo
```typescript
// Select editable con unidades compatibles
<Select
  onValueChange={field.onChange}
  value={field.value}
  disabled={isLoading || !insumoSeleccionado}
>
  <SelectContent>
    {getUnidadesDisponibles().map((unidad) => (
      <SelectItem key={unidad.value} value={unidad.value}>
        {unidad.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// Descripción: "Selecciona la unidad de medida (se sugiere la unidad del insumo)"
```

**Beneficios:**
1. ✅ Permite elegir entre unidades compatibles
2. ✅ Auto-sugiere la unidad del insumo
3. ✅ Solo muestra unidades del mismo tipo (peso, volumen, unidad)
4. ✅ Conversión automática en backend

## Unidades Disponibles

### Peso
```typescript
const UNIDADES_PESO = [
  { value: 'kilogramo', label: 'Kilogramo (kg)' },
  { value: 'kg', label: 'kg' },
  { value: 'gramo', label: 'Gramo (g)' },
  { value: 'g', label: 'g' },
]
```

### Volumen
```typescript
const UNIDADES_VOLUMEN = [
  { value: 'litro', label: 'Litro (l)' },
  { value: 'l', label: 'l' },
  { value: 'mililitro', label: 'Mililitro (ml)' },
  { value: 'ml', label: 'ml' },
]
```

### Unidad
```typescript
const UNIDADES_UNIDAD = [
  { value: 'unidad', label: 'Unidad (u)' },
  { value: 'u', label: 'u' },
]
```

## Lógica de Filtrado

El sistema determina qué unidades mostrar según el tipo de unidad del insumo:

```typescript
const getUnidadesDisponibles = () => {
  if (!insumoData || !insumoData.unidad) {
    // Si no hay insumo, mostrar todas las unidades
    return [...UNIDADES_PESO, ...UNIDADES_VOLUMEN, ...UNIDADES_UNIDAD]
  }

  // Obtener nombre/abreviatura de la unidad del insumo
  const unidadNombre = insumoData.unidad.abreviatura || insumoData.unidad.nombre || 'unidad'

  try {
    // Determinar el tipo de unidad (peso, volumen, unidad)
    const tipo = getTipoUnidad(unidadNombre)

    // Retornar solo unidades del mismo tipo
    switch (tipo) {
      case 'peso':
        return UNIDADES_PESO
      case 'volumen':
        return UNIDADES_VOLUMEN
      case 'unidad':
        return UNIDADES_UNIDAD
      default:
        return [...UNIDADES_PESO, ...UNIDADES_VOLUMEN, ...UNIDADES_UNIDAD]
    }
  } catch (error) {
    // Si no se puede determinar el tipo, mostrar todas
    console.warn('No se pudo determinar el tipo de unidad:', error)
    return [...UNIDADES_PESO, ...UNIDADES_VOLUMEN, ...UNIDADES_UNIDAD]
  }
}
```

## Flujo de Usuario

### 1. Seleccionar Insumo
```
Usuario selecciona: "Semilla de Pino"
Unidad del insumo: "kilogramo"
```

### 2. Campo de Unidad se Auto-completa
```
Campo unidad_medida se completa automáticamente con: "kilogramo"
Select muestra solo unidades de peso: kilogramo, kg, gramo, g
```

### 3. Usuario Puede Cambiar la Unidad
```
Usuario cambia a: "gramo"
Sistema acepta el cambio ✅
```

### 4. Backend Convierte Automáticamente
```
Stock guardado: 2000 gramos
Unidad del insumo: kilogramo

Al mostrar stock: 2000 g = 2 kg (conversión automática)
```

## Ejemplos de Uso

### Caso 1: Insumo de Peso

```typescript
Insumo: "Semilla de Pino"
Unidad oficial: "kilogramo"

Unidades disponibles en Select:
  - Kilogramo (kg)
  - kg
  - Gramo (g)
  - g

Usuario elige: "gramo"
Ingresa: 2000
Backend guarda: 2000 gramos

Stock acumulado se convierte automáticamente para comparaciones
```

### Caso 2: Insumo de Volumen

```typescript
Insumo: "Agua Destilada"
Unidad oficial: "litro"

Unidades disponibles en Select:
  - Litro (l)
  - l
  - Mililitro (ml)
  - ml

Usuario elige: "ml"
Ingresa: 1500
Backend guarda: 1500 mililitros

Al validar: 1500 ml = 1.5 l (conversión automática)
```

### Caso 3: Insumo Contable

```typescript
Insumo: "Macetas Plásticas"
Unidad oficial: "unidad"

Unidades disponibles en Select:
  - Unidad (u)
  - u

Usuario elige: "u"
Ingresa: 100
Backend guarda: 100 unidades
```

## Prevención de Errores

### Unidades Incompatibles
El sistema **previene** seleccionar unidades incompatibles:

```typescript
Insumo: "Semilla de Pino" (peso: kilogramo)

Unidades DISPONIBLES:
  ✅ kilogramo, kg, gramo, g

Unidades NO DISPONIBLES:
  ❌ litro, l, mililitro, ml (volumen)
  ❌ unidad, u (contable)
```

### Auto-sugerencia Inteligente
```typescript
// Al seleccionar un insumo:
handleInsumoChange(insumoId) {
  const insumo = insumos.find(i => i.id_insumo === insumoId)

  if (insumo && insumo.unidad) {
    // Auto-completa con la unidad del insumo
    form.setValue('unidad_medida', insumo.unidad.abreviatura || insumo.unidad.nombre)
  }

  form.setValue('id_insumo', insumoId)
}
```

## Integración con Conversión de Unidades

El backend usa la utilidad `compareStock()` y `convertToBaseUnit()` para:

1. **Validar stock suficiente** (al planificar/completar producción)
2. **Convertir automáticamente** entre unidades compatibles
3. **Mostrar cantidades** en formato legible

### Ejemplo de Conversión
```typescript
// Stock guardado en diferentes unidades:
Entrada 1: 2 kilogramos
Entrada 2: 1500 gramos
Entrada 3: 0.5 kg

// Backend suma automáticamente:
Total: 2 kg + 1500 g + 0.5 kg = 2000 g + 1500 g + 500 g = 4000 g = 4 kg

// Al validar producción que necesita 3.5 kg:
compareStock(4000, 'gramo', 3.5, 'kilogramo')
// 4000 g >= 3500 g → ✅ true
```

## Cambios en el Código

### Archivo Modificado
`/components/stock/RegistrarEntradaDialog.tsx`

### Imports Agregados
```typescript
import { getTipoUnidad, type TipoUnidad } from '@/lib/utils/units'
```

### Constantes Agregadas
```typescript
const UNIDADES_PESO = [...]
const UNIDADES_VOLUMEN = [...]
const UNIDADES_UNIDAD = [...]
```

### Función Agregada
```typescript
const getUnidadesDisponibles = () => {
  // Determina qué unidades mostrar según el tipo de insumo
}
```

### Campo Modificado
```typescript
// ANTES: Input disabled
<Input {...field} disabled value={field.value || ''} />

// DESPUÉS: Select editable
<Select
  onValueChange={field.onChange}
  value={field.value}
  disabled={isLoading || !insumoSeleccionado}
>
  <SelectContent>
    {getUnidadesDisponibles().map(unidad => (
      <SelectItem key={unidad.value} value={unidad.value}>
        {unidad.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

## Estados del Campo

### Disabled (antes de seleccionar insumo)
```
Estado: Disabled
Placeholder: "Selecciona una unidad"
Razón: Necesita primero seleccionar un insumo
```

### Enabled (después de seleccionar insumo)
```
Estado: Enabled
Valor inicial: Unidad del insumo
Opciones: Solo unidades compatibles
Permite: Cambiar a cualquier unidad del mismo tipo
```

### Loading
```
Estado: Disabled
Razón: Form está guardando
Previene: Cambios durante el guardado
```

## Mensajes al Usuario

### Descripción del Campo
```
"Selecciona la unidad de medida (se sugiere la unidad del insumo)"
```

### Placeholder
```
"Selecciona una unidad"
```

### Validación
Si el usuario no selecciona unidad:
```
Error: "Este campo es requerido"
```

## Testing Manual

Para verificar que funciona correctamente:

1. **Abrir el formulario** de registro de entrada
2. **Seleccionar un insumo** con unidad "kilogramo"
3. **Verificar** que el Select se auto-completa con "kilogramo"
4. **Click en el Select** de unidad
5. **Verificar** que muestra: kilogramo, kg, gramo, g
6. **Cambiar a** "gramo"
7. **Ingresar cantidad** 2000
8. **Guardar** entrada
9. **Verificar** que se guardó correctamente con unidad "gramo"

## Conclusión

El formulario ahora permite:
- ✅ Elegir la unidad al registrar stock
- ✅ Conversión automática entre unidades compatibles
- ✅ Solo muestra unidades del mismo tipo
- ✅ Auto-sugiere la unidad del insumo
- ✅ Flexible para diferentes casos de uso
- ✅ Previene errores de unidades incompatibles
