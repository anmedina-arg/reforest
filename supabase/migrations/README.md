# Migraciones de Base de Datos - Reforest

Este directorio contiene las migraciones SQL para la base de datos de Supabase.

## Orden de Ejecución

Las migraciones deben ejecutarse en orden:

1. **`20251028_001_initial_schema.sql`** - Schema inicial
   - Crea todas las tablas del sistema
   - Define relaciones (foreign keys)
   - Agrega triggers para updated_at
   - Crea funciones auxiliares

2. **`20251028_002_enable_rls.sql`** - Row Level Security inicial
   - Habilita RLS en todas las tablas
   - Crea políticas de lectura (SELECT) para todos los usuarios autenticados
   - Crea políticas de escritura para operadores y admins
   - **NOTA:** Esta migración contiene un bug en el path del rol (corregido en 003)

3. **`003_fix_rls_policies.sql`** ⚠️ **IMPORTANTE - APLICAR ESTA MIGRACIÓN**
   - Corrige el bug en las políticas RLS
   - Actualiza el path del rol: `auth.jwt() -> 'user_metadata' ->> 'role'`
   - Debe aplicarse DESPUÉS de crear usuarios con roles en user_metadata

## Cómo Aplicar las Migraciones

### Opción 1: Supabase Dashboard (Recomendado)

1. Ir a [Supabase Dashboard](https://app.supabase.com)
2. Seleccionar tu proyecto
3. Ir a **SQL Editor**
4. Copiar y pegar el contenido de cada archivo SQL
5. Ejecutar en orden (001 → 002 → 003)

### Opción 2: Supabase CLI

```bash
# Conectar a tu proyecto
supabase link --project-ref your-project-ref

# Aplicar migración específica
supabase db push

# O ejecutar un archivo específico
psql $DATABASE_URL -f supabase/migrations/003_fix_rls_policies.sql
```

### Opción 3: SQL directo con psql

```bash
psql postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres \
  -f supabase/migrations/003_fix_rls_policies.sql
```

## Estado Actual de RLS

### ✅ Políticas de Lectura (SELECT)
Todos los usuarios autenticados pueden leer:
- ✅ Insumos
- ✅ Proyectos
- ✅ Recetas
- ✅ Producción de iSeeds
- ✅ Ensayos de laboratorio
- ✅ Clientes
- ✅ Disponibilidad
- ✅ Y todas las demás tablas

### ✅ Políticas de Escritura (INSERT, UPDATE, DELETE)
Solo usuarios con estos roles pueden modificar datos:
- ✅ `admin` - Acceso completo al sistema
- ✅ `operador_lab` - Gestión de laboratorio y ensayos
- ✅ `operador_campo` - Gestión de proyectos forestales
- ❌ `viewer` - Solo lectura (sin permisos de modificación)

## Verificar que RLS está Funcionando

### 1. Verificar que las políticas existen

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 2. Probar acceso con diferentes roles

```sql
-- Como admin (debe tener acceso completo)
SELECT auth.jwt() -> 'user_metadata' ->> 'role';

-- Intentar insertar (debe funcionar si eres admin/operador)
INSERT INTO insumo (nombre, id_tipo_insumo, unidad_medida)
VALUES ('Test', 'uuid-tipo', 'uuid-unidad');
```

### 3. Verificar que viewer NO puede escribir

```sql
-- Login como viewer
-- Intentar insertar (debe FALLAR)
INSERT INTO insumo (nombre, id_tipo_insumo, unidad_medida)
VALUES ('Test', 'uuid-tipo', 'uuid-unidad');
-- Error esperado: new row violates row-level security policy
```

## Troubleshooting

### Error: "new row violates row-level security policy"

**Causa:** El usuario no tiene el rol correcto en `user_metadata`

**Solución:**
```sql
-- Verificar el rol del usuario
SELECT raw_user_meta_data->>'role' FROM auth.users WHERE email = 'usuario@ejemplo.com';

-- Actualizar el rol si es necesario
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"admin"')
WHERE email = 'usuario@ejemplo.com';
```

### Error: "relation does not exist"

**Causa:** PostgreSQL es case-sensitive con nombres de tabla entre comillas

**Solución:**
- Las tablas se crearon con nombres en PascalCase pero PostgreSQL las convirtió a minúsculas
- Siempre usar nombres en minúsculas: `insumo`, `proyecto`, `tipo_insumo`, etc.
- NO usar: `Insumo`, `Proyecto`, `Tipo_insumo`

### Error: "column auth.jwt() does not exist"

**Causa:** Estás intentando ejecutar las queries fuera de una sesión autenticada de Supabase

**Solución:**
- Las funciones `auth.jwt()` solo funcionan en el contexto de Supabase Auth
- Para testing, ejecuta las queries desde tu aplicación Next.js con un usuario autenticado

## Próximos Pasos

Después de aplicar estas migraciones:

1. ✅ Crear usuarios con roles usando el admin panel (`/admin/usuarios`)
2. ✅ Verificar que los usuarios pueden leer datos
3. ✅ Verificar que solo admin/operadores pueden modificar datos
4. ✅ Verificar que viewers solo pueden leer

## Notas de Seguridad

- ⚠️ El `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS - solo usar en server-side
- ✅ El `SUPABASE_ANON_KEY` respeta RLS - seguro para el cliente
- 🔒 Nunca exponer el service role key al navegador
- 🔐 Siempre usar políticas RLS para seguridad a nivel de fila
- 👥 Los roles se almacenan en `user_metadata` y son inmutables desde el cliente

## Referencias

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
