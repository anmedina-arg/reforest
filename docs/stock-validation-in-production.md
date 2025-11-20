# Validación de Stock en el Flujo de Producción

Este documento explica cómo funciona la validación de stock en todo el ciclo de vida de una producción.

## Flujo Completo de Producción

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PLANIFICAR PRODUCCIÓN (createProduccion)                 │
├─────────────────────────────────────────────────────────────┤
│   Estado: Planificado                                       │
│   ✅ Valida que HAY stock suficiente                        │
│   ❌ NO descuenta stock                                     │
│   📝 Crea registro en estado "Planificado"                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. INICIAR PRODUCCIÓN (iniciarProduccion)                   │
├─────────────────────────────────────────────────────────────┤
│   Estado: Planificado → En Producción                      │
│   ❌ NO valida stock                                        │
│   ❌ NO descuenta stock                                     │
│   📝 Solo cambia estado                                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. COMPLETAR PRODUCCIÓN (completarProduccion)               │
├─────────────────────────────────────────────────────────────┤
│   Estado: En Producción → Completada/Parcial               │
│   ✅ Valida que HAY stock suficiente (por cantidad nueva)   │
│   ✅ DESCUENTA stock (solo cantidad nueva)                  │
│   ✅ Genera disponibilidad (solo cantidad nueva)            │
│   📝 Actualiza cantidad_real acumulada                      │
└─────────────────────────────────────────────────────────────┘
```

## 1. Validación al Planificar (createProduccion)

### ¿Cuándo se ejecuta?
Cuando el usuario crea una nueva producción desde la interfaz del proyecto.

### ¿Qué valida?
Verifica que existe suficiente stock para producir la cantidad planificada completa.

### Cálculo
```typescript
// Por cada insumo de la receta:
cantidadNecesaria = cantidad_teorica × cantidad_planificada

// Ejemplo:
// Receta: 0.5 kg de semilla por iSeed
// Planificado: 1000 iSeeds
// Necesario: 0.5 kg × 1000 = 500 kg
```

### Comportamiento

**Si HAY stock suficiente:**
```typescript
✅ Crea producción en estado "Planificado"
✅ NO descuenta stock (solo valida)
✅ Usuario puede continuar con el flujo
```

**Si NO hay stock suficiente:**
```typescript
❌ NO crea la producción
❌ Retorna error con lista detallada:

"Stock insuficiente para planificar la producción:
Semilla de Pino: disponible 300 kg, necesario 500 kg
Humus: disponible 100 kg, necesario 200 kg"
```

### Código de Validación

```typescript
// app/actions/produccion.ts - createProduccion()

// 1. Obtener insumos de la receta
const { data: recetaInsumos } = await supabase
  .from('receta_insumo')
  .select('id_insumo, cantidad_teorica, unidad:unidad_medida(...)')
  .eq('id_receta', id_receta)

// 2. Calcular cantidades necesarias
const insumosCalculados = recetaInsumos.map(ri => ({
  id_insumo: ri.id_insumo,
  cantidad_necesaria: ri.cantidad_teorica × cantidad_planificada,
  unidad_medida: ri.unidad.abreviatura
}))

// 3. Validar stock para cada insumo
for (const insumo of insumosCalculados) {
  // Obtener unidad oficial del insumo
  const { data: insumoData } = await supabase
    .from('insumo')
    .select('unidad:unidad_medida(...)')
    .eq('id_insumo', insumo.id_insumo)

  const unidadInsumo = insumoData.unidad.abreviatura

  // Calcular stock actual
  const { data: movimientos } = await supabase
    .from('movimiento_laboratorio')
    .select('cantidad')
    .eq('id_insumo', insumo.id_insumo)

  const stockActual = sum(movimientos.cantidad)

  // Comparar con conversión de unidades
  const haySuficiente = compareStock(
    stockActual,
    unidadInsumo,
    insumo.cantidad_necesaria,
    insumo.unidad_medida
  )

  if (!haySuficiente) {
    stockInsuficiente.push(
      `${insumo.nombre}: disponible ${formatCantidad(stockActual, unidadInsumo)}, ` +
      `necesario ${formatCantidad(insumo.cantidad_necesaria, insumo.unidad_medida)}`
    )
  }
}

// 4. Si hay stock insuficiente, no crear
if (stockInsuficiente.length > 0) {
  return {
    success: false,
    error: `Stock insuficiente para planificar la producción:\n${stockInsuficiente.join('\n')}`
  }
}

// 5. Si todo OK, crear producción
```

## 2. Validación al Completar (completarProduccion)

### ¿Cuándo se ejecuta?
Cuando el usuario completa una producción (total o parcialmente).

### ¿Qué valida?
Verifica que existe suficiente stock para producir la cantidad ingresada en este momento.

### Cálculo
```typescript
// Por cada insumo de la receta:
cantidadNecesaria = cantidad_teorica × cantidad_ingresada

// Ejemplo:
// Receta: 0.5 kg de semilla por iSeed
// Ingresado ahora: 400 iSeeds (de 1000 planificados)
// Necesario: 0.5 kg × 400 = 200 kg
```

### Comportamiento

**Si HAY stock suficiente:**
```typescript
✅ Descuenta stock (cantidad_ingresada)
✅ Genera disponibilidad (cantidad_ingresada)
✅ Actualiza cantidad_real acumulada
✅ Cambia estado según corresponda:
   - Si cantidad_real >= cantidad_planificada → "Completada"
   - Si cantidad_real < cantidad_planificada → "Parcialmente Completada"
```

**Si NO hay stock suficiente:**
```typescript
❌ NO descuenta stock
❌ NO genera disponibilidad
❌ NO actualiza cantidad_real
❌ Retorna error con lista detallada

"Stock insuficiente para completar la producción:
Semilla de Pino: disponible 150 kg, necesario 200 kg"
```

## Comparación de Validaciones

| Aspecto | createProduccion | completarProduccion |
|---------|------------------|---------------------|
| **Cuándo** | Al planificar | Al completar |
| **Valida** | Cantidad planificada total | Cantidad ingresada nueva |
| **Cálculo** | cantidad_teorica × cantidad_planificada | cantidad_teorica × cantidad_ingresada |
| **Descuenta** | ❌ NO | ✅ SÍ (solo cantidad nueva) |
| **Si falla** | No crea producción | No completa, mantiene estado |
| **Permite parciales** | ❌ NO | ✅ SÍ |

## Ejemplo Completo

### Escenario
- **Receta "iSeed Básico"**:
  - 0.5 kg de Semilla de Pino
  - 0.3 kg de Humus
- **Stock actual**:
  - Semilla: 800 kg
  - Humus: 500 kg

### Flujo 1: Planificar 1000 iSeeds

```typescript
// createProduccion({ cantidad_planificada: 1000 })

Validación:
  Semilla necesaria: 0.5 kg × 1000 = 500 kg
  Humus necesario: 0.3 kg × 1000 = 300 kg

  Stock actual:
    Semilla: 800 kg ✅ (>= 500 kg)
    Humus: 500 kg ✅ (>= 300 kg)

Resultado: ✅ Producción creada en estado "Planificado"
Stock después: Sin cambios (NO se descuenta)
```

### Flujo 2: Iniciar Producción

```typescript
// iniciarProduccion({ id_produccion })

Validación: Ninguna (solo cambia estado)

Resultado: ✅ Estado cambia a "En Producción"
Stock después: Sin cambios
```

### Flujo 3: Completar 400 iSeeds

```typescript
// completarProduccion({ cantidad_real: 400 })

Validación:
  Semilla necesaria: 0.5 kg × 400 = 200 kg
  Humus necesario: 0.3 kg × 400 = 120 kg

  Stock actual:
    Semilla: 800 kg ✅ (>= 200 kg)
    Humus: 500 kg ✅ (>= 120 kg)

Resultado: ✅ Producción completada parcialmente
  - Estado: "Parcialmente Completada"
  - cantidad_real: 400 iSeeds
  - Stock descontado:
    • Semilla: 800 kg - 200 kg = 600 kg
    • Humus: 500 kg - 120 kg = 380 kg
  - Disponibilidad creada: 400 iSeeds
```

### Flujo 4: Completar 600 iSeeds adicionales

```typescript
// completarProduccion({ cantidad_real: 600 })

Validación:
  Semilla necesaria: 0.5 kg × 600 = 300 kg
  Humus necesario: 0.3 kg × 600 = 180 kg

  Stock actual:
    Semilla: 600 kg ✅ (>= 300 kg)
    Humus: 380 kg ✅ (>= 180 kg)

Resultado: ✅ Producción completada totalmente
  - Estado: "Completada"
  - cantidad_real: 400 + 600 = 1000 iSeeds (acumulado)
  - Stock descontado:
    • Semilla: 600 kg - 300 kg = 300 kg
    • Humus: 380 kg - 180 kg = 200 kg
  - Disponibilidad creada: 600 iSeeds (nueva)
```

## Beneficios del Sistema

### 1. Validación Temprana
- ✅ Detecta problemas de stock al planificar
- ✅ Evita crear producciones que no se pueden completar
- ✅ Usuario recibe feedback inmediato

### 2. Validación en Completado
- ✅ Verifica stock antes de descontar
- ✅ Previene descuentos incorrectos
- ✅ Soporta entregas parciales

### 3. Conversión de Unidades
- ✅ Compara correctamente diferentes unidades (kg vs g, l vs ml)
- ✅ Mensajes claros con unidades formateadas
- ✅ Detección de unidades incompatibles

### 4. Trazabilidad
- ✅ Logs detallados en cada paso
- ✅ Mensajes de error descriptivos
- ✅ Auditoría completa del proceso

## Logs de Debug

### createProduccion
```typescript
[createProduccion] 1. Validando stock disponible para la producción...
[createProduccion] 2. Insumos requeridos: [...]
[createProduccion] 3. Verificando stock con conversión de unidades: {...}
[createProduccion] 4. Stock insuficiente detectado: [...]  // Si falla
[createProduccion] 5. Validación de stock exitosa, todos los insumos disponibles  // Si OK
```

### completarProduccion
```typescript
[completarProduccion] 11. Insumos calculados (solo por cantidad ingresada): [...]
[completarProduccion] 11.1. Verificando stock con conversión de unidades: {...}
[completarProduccion] 11.2. Stock insuficiente detectado: [...]  // Si falla
[completarProduccion] 11.3. Validación de stock exitosa, todos los insumos disponibles  // Si OK
```

## Casos Edge

### Receta sin insumos
```typescript
// createProduccion continúa sin validación
console.log('[createProduccion] La receta no tiene insumos registrados, continuando sin validación de stock')
```

### Stock exacto
```typescript
// Stock: 500 kg
// Necesario: 500 kg
// compareStock(500, 'kg', 500, 'kg') → true ✅
```

### Unidades incompatibles
```typescript
// Stock: 2 kg (peso)
// Necesario: 1.5 l (volumen)
// Error: "No se pueden comparar unidades de diferentes tipos"
```

### Múltiples insumos insuficientes
```typescript
// Retorna lista completa:
"Stock insuficiente para planificar la producción:
Semilla de Pino: disponible 300 kg, necesario 500 kg
Humus: disponible 100 kg, necesario 200 kg
Agua: disponible 800 ml, necesario 1.500 ml"
```
