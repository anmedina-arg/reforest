import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { MixRecetasTable } from '@/components/mixes/MixRecetasTable'
import { getMix } from '@/app/actions/mixes'
import { getRecetas } from '@/app/actions/recetas'

// =====================================================
// PAGE PROPS (Next.js 15 - params is a Promise)
// =====================================================

interface MixDetailPageProps {
  params: Promise<{ id: string }>
}

// =====================================================
// SERVER COMPONENT - MIX DETAIL PAGE
// =====================================================

export default async function MixDetailPage({ params }: MixDetailPageProps) {
  // Next.js 15: await params
  const { id } = await params

  // Fetch mix and recetas in parallel
  const [mixResult, recetasResult] = await Promise.all([
    getMix(id),
    getRecetas({ pageSize: 1000 }),
  ])

  // Handle mix not found
  if (!mixResult.success || !mixResult.data) {
    notFound()
  }

  const mix = mixResult.data
  const todasRecetas = recetasResult.success && recetasResult.data ? recetasResult.data.data : []

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link href="/mixes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Mixes
          </Button>
        </Link>
      </div>

      {/* Header with mix info */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{mix.nombre}</h1>
        {mix.descripcion && (
          <p className="text-lg text-muted-foreground">{mix.descripcion}</p>
        )}
      </div>

      <Separator />

      {/* Mix metadata card */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Mix</CardTitle>
          <CardDescription>Datos generales del mix de iSeeds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nombre</label>
              <p className="text-base font-medium mt-1">{mix.nombre}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Cantidad de Recetas
              </label>
              <p className="text-base font-medium mt-1">
                {mix.recetas.length} {mix.recetas.length === 1 ? 'receta' : 'recetas'}
              </p>
            </div>

            {mix.descripcion && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                <p className="text-base mt-1">{mix.descripcion}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recetas table */}
      <Card>
        <CardContent className="pt-6">
          <MixRecetasTable mixId={mix.id_mix} recetas={mix.recetas} todasRecetas={todasRecetas} />
        </CardContent>
      </Card>
    </div>
  )
}
