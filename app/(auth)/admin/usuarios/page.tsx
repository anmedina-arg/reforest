import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { requireRole, formatRole } from '@/lib/auth'
import { listUsers } from '@/lib/supabase/admin'
import { CreateUserForm } from '@/components/admin/CreateUserForm'

export default async function AdminUsuariosPage() {
  try {
    // Verificar que el usuario sea admin
    await requireRole('admin')
  } catch (error) {
    // Si no es admin, redirigir al dashboard
    redirect('/dashboard')
  }

  // Obtener la lista de usuarios
  const users = await listUsers()

  // Función helper para obtener el color del badge según el rol
  function getRoleBadgeVariant(role: string | null) {
    switch (role) {
      case 'admin':
        return 'default'
      case 'operador_lab':
        return 'secondary'
      case 'operador_campo':
        return 'outline'
      case 'viewer':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <div className="container mx-auto p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Administración de Usuarios</h1>
        <p className="text-muted-foreground">
          Crea y administra usuarios del sistema
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulario de creación */}
        <div className="lg:col-span-1">
          <CreateUserForm />
        </div>

        {/* Tabla de usuarios */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios del Sistema</CardTitle>
              <CardDescription>
                Lista de todos los usuarios registrados ({users.length} {users.length === 1 ? 'usuario' : 'usuarios'})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Creado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No hay usuarios registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => {
                        const role = user.user_metadata?.role || null
                        const nombre = user.user_metadata?.full_name || 'Sin nombre'
                        const createdAt = new Date(user.created_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })

                        return (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.email}
                            </TableCell>
                            <TableCell>{nombre}</TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(role)}>
                                {formatRole(role)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {createdAt}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
