import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FolderKanban } from 'lucide-react'
import { getUserDisplayName, getUserRole, formatRole, getUser } from '@/lib/auth'
import { getProyectos } from '@/app/actions/proyectos'

export default async function DashboardPage() {
  const user = await getUser()
  const userName = await getUserDisplayName()
  const userRole = await getUserRole()
  const formattedRole = formatRole(userRole)

  // Obtener proyectos activos (no eliminados)
  const proyectosResult = await getProyectos({ page: 1, pageSize: 1 })
  const totalProyectos = proyectosResult.data?.total || 0

  return (
    <div className="container mx-auto p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido a Reforest Lab Manager
        </p>
      </div>

      {/* Main content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Card de bienvenida */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl">Hola, {userName} 👋</CardTitle>
            <CardDescription>
              Estás conectado como {formattedRole.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Rol:</span>
              <Badge variant={userRole === 'admin' ? 'default' : 'secondary'}>
                {formattedRole}
              </Badge>
            </div>
            {user?.email && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="text-sm font-medium">{user.email}</span>
              </div>
            )}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Usa el menú lateral para navegar entre las diferentes secciones de la plataforma.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card de proyectos activos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              Proyectos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {new Intl.NumberFormat('es-AR').format(totalProyectos)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {totalProyectos === 0
                ? 'Sin proyectos aún'
                : totalProyectos === 1
                ? 'proyecto registrado'
                : 'proyectos registrados'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
