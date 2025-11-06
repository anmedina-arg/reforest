import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProyectoTabs } from '@/components/proyectos/ProyectoTabs'

import { getProyecto } from '@/app/actions/proyectos'
import { getMixes } from '@/app/actions/mixes'

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getEstadoBadgeVariant(
  estadoNombre?: string
): 'default' | 'secondary' | 'success' | 'destructive' {
  if (!estadoNombre) return 'default'

  const nombre = estadoNombre.toLowerCase()

  if (nombre.includes('activo') || nombre.includes('en curso')) {
    return 'success' // verde
  }
  if (nombre.includes('completado') || nombre.includes('finalizado')) {
    return 'default' // azul
  }
  if (nombre.includes('pausado') || nombre.includes('pendiente')) {
    return 'secondary' // gris
  }
  if (nombre.includes('cancelado')) {
    return 'destructive' // rojo
  }

  return 'default'
}

// =====================================================
// PAGE PROPS (Next.js 15 - params is a Promise)
// =====================================================

interface ProyectoDetailPageProps {
  params: Promise<{ id: string }>
}

// =====================================================
// SERVER COMPONENT - PROYECTO DETAIL PAGE
// =====================================================

export default async function ProyectoDetailPage({ params }: ProyectoDetailPageProps) {
  // Next.js 15: await params
  const { id } = await params

  // Fetch proyecto and mixes in parallel
  const [proyectoResult, mixesResult] = await Promise.all([
    getProyecto(id),
    getMixes({ pageSize: 1000 }),
  ])

  // Handle proyecto not found
  if (!proyectoResult.success || !proyectoResult.data) {
    notFound()
  }

  const proyecto = proyectoResult.data
  const mixes = mixesResult.success && mixesResult.data ? mixesResult.data.data : []

  const estadoVariant = getEstadoBadgeVariant(proyecto.estado_proyecto?.nombre)

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link href="/proyectos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Proyectos
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {proyecto.nombre_del_proyecto}
            </h1>
            {proyecto.nombre_fantasia && (
              <p className="text-lg text-muted-foreground">{proyecto.nombre_fantasia}</p>
            )}
          </div>

          <Badge variant={estadoVariant} className="text-base px-3 py-1 self-start">
            {proyecto.estado_proyecto?.nombre || 'Sin estado'}
          </Badge>
        </div>

        {proyecto.codigo_proyecto && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Código:</span>
            <span className="font-mono text-sm font-medium">{proyecto.codigo_proyecto}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <ProyectoTabs proyecto={proyecto} mixes={mixes} />
    </div>
  )
}
