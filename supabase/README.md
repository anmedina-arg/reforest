# Reforest - Base de Datos Supabase

Migración optimizada y limpia para la base de datos de Reforest en Supabase.

## 📁 Estructura de archivos

```
supabase/
├── migrations/                            # Migraciones de schema
│   ├── 20251028_001_initial_schema.sql   # Schema inicial completo
│   └── 20251028_002_enable_rls.sql       # Políticas de Row Level Security
├── seeds/                                 # Datos de prueba e iniciales
│   └── 01_initial_data.sql               # Datos de siembra del sistema
├── docs/                                  # Documentación y ejemplos
│   └── example_queries.sql               # Consultas de ejemplo útiles
├── deprecated/                            # Archivos obsoletos (no usar)
│   └── reforest-migration-1-10-25.sql    # Migración original sin limpiar
└── README.md                              # Esta documentación
```

## 🚀 Inicio rápido

### Opción 1: Supabase Dashboard (Recomendado)

1. Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor**
3. Ejecuta en este orden:
   ```sql
   -- 1. Ejecuta migrations/20251028_001_initial_schema.sql
   -- 2. Ejecuta migrations/20251028_002_enable_rls.sql
   -- 3. Ejecuta seeds/01_initial_data.sql
   ```

### Opción 2: Supabase CLI

```bash
# Asegúrate de estar en la raíz del proyecto
cd reforest

# Ejecuta las migraciones
supabase db reset  # Resetea y ejecuta todas las migraciones

# O manualmente:
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase/migrations/20251028_001_initial_schema.sql
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase/seeds/01_initial_data.sql
```

## 📋 Orden de ejecución

| Orden | Archivo | Descripción | Obligatorio |
|-------|---------|-------------|-------------|
| 1 | `migrations/20251028_001_initial_schema.sql` | Schema completo: extensiones, funciones, tablas y triggers | ✅ Sí |
| 2 | `migrations/20251028_002_enable_rls.sql` | Políticas de Row Level Security (RLS) y roles | ✅ Sí |
| 3 | `seeds/01_initial_data.sql` | Datos iniciales del sistema | ✅ Sí |
| - | `docs/example_queries.sql` | Consultas de ejemplo para referencia | ❌ No (solo documentación) |

## ✨ Características principales

### ✅ Timestamps automáticos
Todas las tablas incluyen:
- `created_at` - Fecha de creación (automático)
- `updated_at` - Fecha de última actualización (automático con trigger)
- `deleted_at` - Soft deletes (para no perder datos históricos)

### ✅ Triggers para updated_at
Se actualizan automáticamente en cada UPDATE:
```sql
CREATE TRIGGER trigger_update_[tabla]
    BEFORE UPDATE ON [tabla]
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

### ✅ Sin UUIDs hardcodeados
Todos los INSERTs usan subqueries dinámicas:
```sql
-- ❌ Antes (frágil, no portable)
INSERT INTO receta_insumo VALUES ('807729ee-4e0e-4595-b1ca-ac2c96cc2822', ...)

-- ✅ Ahora (robusto, portable)
INSERT INTO receta_insumo VALUES (
  (SELECT id_receta FROM receta WHERE nombre = 'Receta Básica para Algarrobo blanco'),
  ...
)
```

### ✅ Organización lógica
- ✨ Sin duplicados de tablas (eliminadas 6 duplicaciones)
- 🔗 Orden correcto de dependencias (respeta foreign keys)
- 📂 Secciones claramente delimitadas
- 💬 Comentarios descriptivos

### ✅ Row Level Security (RLS)
Seguridad a nivel de fila basada en roles:
- 🔒 RLS habilitado en todas las tablas principales
- 👁️ **Lectura**: Todos los usuarios autenticados
- ✏️ **Escritura**: Solo admin, operador_lab, operador_campo
- 📋 Tablas catálogo sin RLS (solo lectura desde app)

## 🔐 Roles y permisos

El sistema utiliza 4 roles almacenados en el JWT del usuario (`auth.jwt()->>'role'`):

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **admin** | Superusuario | ✅ Lectura + ✅ Escritura completa |
| **operador_lab** | Personal de laboratorio | ✅ Lectura + ✅ Gestión de ensayos y producción |
| **operador_campo** | Personal de campo | ✅ Lectura + ✅ Gestión de proyectos |
| **viewer** | Solo visualización | ✅ Lectura solamente |

### Asignar roles a usuarios

```sql
-- Asignar rol a un usuario existente
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "operador_lab"}'::jsonb
WHERE email = 'usuario@example.com';

-- Verificar rol del usuario autenticado
SELECT auth.jwt()->>'role' AS mi_rol;

-- Ver todos los usuarios con sus roles
SELECT email, raw_user_meta_data->>'role' AS role
FROM auth.users;
```

### Tablas con RLS habilitado

Las siguientes 15 tablas principales tienen RLS:
- Cliente, Proyecto, Produccion_iSeeds
- Disponibilidad, Consumo_proyecto
- Insumo, Receta, Receta_insumo
- Produccion_insumo, Mix_iSeeds
- Movimiento_laboratorio
- Registro_ensayos_laboratorio, Registro_requerimiento_ensayos
- Resultados_parametros, Receta_Insumo_ensayo

### Tablas catálogo (sin RLS)

Las siguientes 13 tablas catálogo **NO** tienen RLS (acceso de lectura para todos):
- Estado_proyecto, Estado_produccion, Estado_ensayo
- Tipo_movimiento, Tipo_consumo, Tipo_insumo
- Tipo_ensayo_laboratorio, Unidad_medida
- Eco_region, Especie
- Ubicacion_insumo, Responsables_laboratorio, Parametros_ensayo

## 🗄️ Estructura de datos

### Tablas catálogo (13 tablas)
Datos maestros del sistema:
- `Cliente` - Clientes del sistema
- `Estado_proyecto`, `Estado_produccion`, `Estado_ensayo` - Estados de flujos
- `Tipo_movimiento`, `Tipo_consumo`, `Tipo_insumo` - Tipos de operaciones
- `Tipo_ensayo_laboratorio` - Tipos de ensayos
- `Unidad_medida` - Unidades (kg, ml, etc.)
- `Eco_region`, `Especie` - Geografía y especies
- `Ubicacion_insumo` - Ubicaciones de almacenamiento
- `Responsables_laboratorio` - Personal del laboratorio

### Tablas principales (14 tablas)
Datos operacionales:
- `Proyecto` - Proyectos forestales
- `Produccion_iSeeds` - Producción de semillas encapsuladas
- `Disponibilidad` - Stock disponible por producción
- `Consumo_proyecto` - Consumo de iSeeds por proyecto
- `Insumo` - Insumos del sistema (semillas, cápsulas, etc.)
- `Receta` - Recetas de producción
- `Mix_iSeeds` - Mix de semillas
- `Produccion_insumo` - Lotes de producción de insumos
- `Movimiento_laboratorio` - Movimientos de stock (ingresos/salidas)
- `Registro_requerimiento_ensayos` - Solicitudes de ensayos
- `Registro_ensayos_laboratorio` - Ensayos ejecutados
- `Parametros_ensayo` - Parámetros a medir en ensayos
- `Resultados_parametros` - Resultados de mediciones

### Tablas de relación Many-to-Many (2 tablas)
- `Receta_insumo` - Composición de recetas (qué insumos y cantidades)
- `Receta_Insumo_ensayo` - Relación entre recetas y ensayos

## 🗑️ Soft Deletes

Para "eliminar" registros sin perderlos (recomendado para auditoría):

```sql
-- Marcar como eliminado
UPDATE proyecto
SET deleted_at = NOW()
WHERE id_proyecto = 'uuid';

-- Consultar solo registros activos
SELECT * FROM proyecto
WHERE deleted_at IS NULL;

-- Restaurar registro
UPDATE proyecto
SET deleted_at = NULL
WHERE id_proyecto = 'uuid';

-- Ver registros eliminados
SELECT * FROM proyecto
WHERE deleted_at IS NOT NULL;
```

## 🌱 Datos de siembra incluidos

Los datos iniciales (`seeds/01_initial_data.sql`) incluyen:

| Categoría | Cantidad | Detalles |
|-----------|----------|----------|
| **Responsables** | 2 | Andres Medina, Pablo Caram |
| **Clientes** | 5 | Organizaciones de ejemplo |
| **Estados** | 15 | Ensayos (7), Producción (3), Proyectos (5) |
| **Tipos** | 11 | Movimientos (4), Consumo (3), Insumo (4) |
| **Eco-regiones** | 3 | Cerrado, Yungas, Mata atlántica |
| **Especies** | 48 | Especies forestales nativas |
| **Unidades de medida** | 7 | u, kg, g, ml, l, m, cm |
| **Insumos** | 9 | Semillas (4), Promotores (2), Sustratos (2), Cápsulas (1) |
| **Recetas** | 4 | Recetas completas con composición |

### Detalle de recetas incluidas:
1. **Receta Básica para Algarrobo blanco** (4 insumos)
2. **Receta Avanzada para Lapacho amarillo** (4 insumos)
3. **Receta Rápida para Tipa** (4 insumos)

## 📚 Consultas útiles

Ver `docs/example_queries.sql` para ejemplos de:
- 🔍 Consultas de recetas por autor
- 📋 Composición detallada de recetas
- 🏗️ Proyectos por cliente/estado/región
- 📦 Producción y disponibilidad
- 🧪 Insumos por tipo
- 🔬 Ensayos y resultados
- 📊 Reportes de consumo
- 🗑️ Uso de soft deletes

## 🔄 Migraciones futuras

Para agregar cambios después de la migración inicial:

1. Crea un nuevo archivo en `migrations/` con el formato:
   ```
   migrations/YYYYMMDD_XXX_descripcion.sql
   ```
   Ejemplo: `20251029_002_add_user_roles.sql`

2. Incluye solo los cambios incrementales:
   ```sql
   -- Agregar nueva columna
   ALTER TABLE proyecto ADD COLUMN status_detalle TEXT;

   -- Agregar nueva tabla
   CREATE TABLE nuevo_modelo (...);
   ```

3. Actualiza este README con los cambios

## ⚠️ Notas importantes

- 🚫 **No usar DELETE directo** - Usa soft deletes con `deleted_at`
- ⚡ **Los triggers son automáticos** - No llames `update_updated_at()` manualmente
- 🔗 **Las foreign keys validan integridad** - Inserta datos en orden correcto
- 🆔 **Los UUIDs son automáticos** - No los especifiques en INSERTs (usa `DEFAULT` o déjalos fuera)
- 📦 **Archivos en deprecated/** - No usar, están para referencia histórica

## 🔌 Integración con Next.js

### Cliente de Supabase (Browser)
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Cliente de Supabase (Server)
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

### Ejemplo de consulta con tipos seguros
```typescript
// types/database.types.ts - Genera con: npx supabase gen types typescript

import { supabase } from '@/lib/supabase/client'

// Consultar recetas
const { data: recetas, error } = await supabase
  .from('receta')
  .select('*, receta_insumo(*, insumo(*))')
  .is('deleted_at', null)

// Insertar proyecto
const { data: proyecto, error } = await supabase
  .from('proyecto')
  .insert({
    nombre_del_proyecto: 'Proyecto Demo',
    id_cliente: 'uuid-del-cliente',
    // created_at y updated_at se agregan automáticamente
  })
  .select()
  .single()
```

## 📖 Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

## 🆘 Troubleshooting

### Error: "relation already exists"
Ya ejecutaste la migración. Para resetear:
```bash
# Supabase CLI
supabase db reset

# O en SQL Editor
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

### Error: "violates foreign key constraint"
Asegúrate de ejecutar `seeds/01_initial_data.sql` en el orden correcto. Los responsables de laboratorio deben insertarse antes que las recetas.

### Error: "permission denied"
Verifica que tengas permisos de administrador en tu proyecto de Supabase. Las migraciones requieren privilegios elevados.

---

**Versión:** 1.0.0
**Última actualización:** 28 de Octubre, 2025
**Autor:** Equipo Reforest
