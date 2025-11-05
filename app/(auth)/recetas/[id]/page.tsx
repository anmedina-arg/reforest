import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import { getUserRole } from '@/lib/auth'
import { getReceta } from '@/app/actions/recetas'
import { getInsumos, getUnidadesMedida } from '@/app/actions/insumos'
import { RecetaInsumosList } from '@/components/recetas/RecetaInsumosList'

// =====================================================
// TYPES
// =====================================================

interface RecetaDetailPageProps {
  params: Promise<{
    id: string
  }>
}

// =====================================================
// PAGE COMPONENT
// =====================================================

export default async function RecetaDetailPage({ params }: RecetaDetailPageProps) {
  const { id } = await params

  // Verificar autenticación
  const userRole = await getUserRole()

  if (!userRole) {
    redirect('/dashboard')
  }

  // Obtener datos en paralelo
  const [recetaResult, insumosResult, unidadesResult] = await Promise.all([
    getReceta(id),
    getInsumos({ pageSize: 1000 }), // Todos los insumos disponibles
    getUnidadesMedida(),
  ])

  // Manejar errores
  if (!recetaResult.success || !recetaResult.data) {
    if (recetaResult.error?.includes('no encontrada')) {
      notFound()
    }

    return (
      <div className="container mx-auto p-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              No se pudo cargar la receta: {recetaResult.error}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!insumosResult.success || !insumosResult.data) {
    return (
      <div className="container mx-auto p-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              No se pudieron cargar los insumos: {insumosResult.error}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!unidadesResult.success || !unidadesResult.data) {
    return (
      <div className="container mx-auto p-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              No se pudieron cargar las unidades de medida: {unidadesResult.error}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const receta = recetaResult.data
  const insumosDisponibles = insumosResult.data.data
  const unidadesDisponibles = unidadesResult.data

  // Formatear fecha
  let fechaCreacion = 'N/A'
  try {
    fechaCreacion = format(new Date(receta.created_at), "d 'de' MMMM 'de' yyyy", {
      locale: es,
    })
  } catch {
    // Keep default
  }

  return (
    <div className="container mx-auto p-6 md:p-8">
      {/* Breadcrumb / Navegación */}
      <div className="mb-6">
        <Link href="/recetas">
          <Button variant="ghost" size="sm" className="mb-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Volver a Recetas
          </Button>
        </Link>
      </div>

      {/* Header con información de la receta */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{receta.nombre}</h1>
            {receta.descripcion && (
              <p className="text-lg text-muted-foreground max-w-2xl">{receta.descripcion}</p>
            )}
          </div>
          <Badge variant="outline" className="text-sm">
            {receta.insumos.length} {receta.insumos.length === 1 ? 'insumo' : 'insumos'}
          </Badge>
        </div>

        <Separator className="my-6" />

        {/* Metadata */}
        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          {/* Autor */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>
              {receta.autor ? (
                <span className="font-medium text-foreground">
                  {receta.autor.nombre_responsable}
                </span>
              ) : (
                <span>Sin autor</span>
              )}
            </span>
          </div>

          {/* Fecha de creación */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              <span className="font-medium text-foreground">Creada:</span> {fechaCreacion}
            </span>
          </div>
        </div>
      </div>

      {/* Card con lista de insumos */}
      <Card>
        <CardHeader>
          <CardTitle>Composición de la Receta</CardTitle>
          <CardDescription>
            Insumos que componen esta receta de iSeeds con sus cantidades y unidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecetaInsumosList
            recetaId={receta.id_receta}
            insumos={receta.insumos}
            insumosDisponibles={insumosDisponibles}
            unidadesDisponibles={unidadesDisponibles}
            userRole={userRole}
          />
        </CardContent>
      </Card>
    </div>
  )
}
