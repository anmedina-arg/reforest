import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getUserRole } from '@/lib/auth'
import { getRecetas, getResponsablesLaboratorio } from '@/app/actions/recetas'
import { RecetasTable } from '@/components/recetas/RecetasTable'

export default async function RecetasPage() {
  // Obtener rol del usuario
  const userRole = await getUserRole()

  // Si el usuario no tiene rol, redirigir al dashboard
  if (!userRole) {
    redirect('/dashboard')
  }

  // Obtener datos iniciales en paralelo
  const [recetasResult, responsablesResult] = await Promise.all([
    getRecetas({ pageSize: 1000 }), // Traer todas las recetas para client-side filtering
    getResponsablesLaboratorio(),
  ])

  // Manejar errores
  if (!recetasResult.success || !recetasResult.data) {
    return (
      <div className="container mx-auto p-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              No se pudieron cargar las recetas: {recetasResult.error}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!responsablesResult.success || !responsablesResult.data) {
    return (
      <div className="container mx-auto p-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              No se pudieron cargar los responsables de laboratorio: {responsablesResult.error}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const recetas = recetasResult.data.data
  const responsables = responsablesResult.data

  return (
    <div className="container mx-auto p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Recetas</h1>
        <p className="text-muted-foreground">
          Administra las recetas de iSeeds que combinan insumos para crear semillas mejoradas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recetas</CardTitle>
          <CardDescription>
            {recetas.length} {recetas.length === 1 ? 'receta registrada' : 'recetas registradas'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecetasTable
            initialData={recetas}
            responsables={responsables}
            userRole={userRole}
          />
        </CardContent>
      </Card>
    </div>
  )
}
