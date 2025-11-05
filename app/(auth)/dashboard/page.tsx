import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getUserDisplayName, getUserRole, formatRole, getUser } from '@/lib/auth'

export default async function DashboardPage() {
  const user = await getUser()
  const userName = await getUserDisplayName()
  const userRole = await getUserRole()
  const formattedRole = formatRole(userRole)

  return (
    <div className="container mx-auto p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido a la plataforma de gestión forestal
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card de bienvenida */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Bienvenido, {userName}</CardTitle>
            <CardDescription>
              Estás conectado a Reforest
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rol:</span>
              <Badge variant={userRole === 'admin' ? 'default' : 'secondary'}>
                {formattedRole}
              </Badge>
            </div>
            {user?.email && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="text-sm font-medium">{user.email}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de estadísticas placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Proyectos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-sm text-muted-foreground">Sin proyectos aún</p>
          </CardContent>
        </Card>

        {/* Accesos rápidos */}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
            <CardDescription>Navega a las secciones principales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <QuickAccessButton
                title="Proyectos"
                description="Gestionar proyectos forestales"
                icon="📊"
                href="/proyectos"
              />
              <QuickAccessButton
                title="Insumos"
                description="Catálogo de insumos"
                icon="🌱"
                href="/insumos"
              />
              <QuickAccessButton
                title="Recetas"
                description="Fórmulas de producción"
                icon="📋"
                href="/recetas"
              />
              <QuickAccessButton
                title="Ensayos"
                description="Registro de ensayos"
                icon="🔬"
                href="/ensayos"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function QuickAccessButton({
  title,
  description,
  icon,
  href,
}: {
  title: string
  description: string
  icon: string
  href: string
}) {
  return (
    <a
      href={href}
      className="group flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <span className="font-semibold group-hover:text-primary">{title}</span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </a>
  )
}
