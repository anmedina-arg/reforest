'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Mail, Phone, User, Calendar, MapPin, Sprout, Package } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import { AsignarMixDialog } from './AsignarMixDialog'
import type { ProyectoWithRelations, MixISeeds } from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

interface ProyectoTabsProps {
  proyecto: ProyectoWithRelations
  mixes: Array<MixISeeds & { recetas_count: number }>
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function formatFecha(fecha: string | null): string {
  if (!fecha) return '-'
  try {
    return format(new Date(fecha), "dd 'de' MMMM 'de' yyyy", { locale: es })
  } catch {
    return '-'
  }
}

// =====================================================
// COMPONENT
// =====================================================

export function ProyectoTabs({ proyecto, mixes }: ProyectoTabsProps) {
  const [asignarMixOpen, setAsignarMixOpen] = useState(false)

  return (
    <>
      <Tabs defaultValue="informacion" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="informacion">Información</TabsTrigger>
          <TabsTrigger value="produccion">Producción</TabsTrigger>
        </TabsList>

        {/* ==================== TAB INFORMACIÓN ==================== */}
        <TabsContent value="informacion" className="space-y-6">
          {/* Datos Generales del Proyecto */}
          <Card>
            <CardHeader>
              <CardTitle>Datos del Proyecto</CardTitle>
              <CardDescription>Información general y detalles del proyecto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre del Proyecto */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Nombre del Proyecto
                  </label>
                  <p className="text-base font-medium mt-1">{proyecto.nombre_del_proyecto}</p>
                </div>

                {/* Código */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Código</label>
                  <p className="text-base font-mono mt-1">
                    {proyecto.codigo_proyecto || '-'}
                  </p>
                </div>

                {/* Nombre Fantasía */}
                {proyecto.nombre_fantasia && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Nombre Fantasía
                    </label>
                    <p className="text-base mt-1">{proyecto.nombre_fantasia}</p>
                  </div>
                )}

                {/* Estado */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estado</label>
                  <div className="mt-1">
                    <Badge variant="default">
                      {proyecto.estado_proyecto?.nombre || 'Sin estado'}
                    </Badge>
                  </div>
                </div>

                {/* Eco-región */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Eco-región
                  </label>
                  <p className="text-base mt-1">
                    {proyecto.eco_region?.nombre || '-'}
                  </p>
                </div>

                {/* Hectáreas */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Sprout className="h-4 w-4" />
                    Hectáreas
                  </label>
                  <p className="text-base mt-1">
                    {proyecto.hectareas !== null && proyecto.hectareas !== undefined
                      ? `${proyecto.hectareas.toLocaleString()} ha`
                      : '-'}
                  </p>
                </div>

                {/* Cantidad iSeeds */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Cantidad iSeeds
                  </label>
                  <p className="text-base mt-1">
                    {proyecto.cantidad_iseeds !== null && proyecto.cantidad_iseeds !== undefined
                      ? proyecto.cantidad_iseeds.toLocaleString()
                      : '-'}
                  </p>
                </div>

                {/* Polígonos Entregados */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Polígonos Entregados
                  </label>
                  <div className="mt-1">
                    <Badge variant={proyecto.poligonos_entregados ? 'success' : 'secondary'}>
                      {proyecto.poligonos_entregados ? 'Sí' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha de Inicio
                  </label>
                  <p className="text-base mt-1">{formatFecha(proyecto.fecha_inicio)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha de Fin
                  </label>
                  <p className="text-base mt-1">{formatFecha(proyecto.fecha_fin)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
              <CardDescription>Información del cliente asociado al proyecto</CardDescription>
            </CardHeader>
            <CardContent>
              {proyecto.cliente ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                    <p className="text-base font-medium mt-1">
                      {proyecto.cliente.nombre_cliente}
                    </p>
                  </div>

                  {proyecto.cliente.email && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </label>
                      <p className="text-base mt-1">{proyecto.cliente.email}</p>
                    </div>
                  )}

                  {proyecto.cliente.phone && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Teléfono
                      </label>
                      <p className="text-base mt-1">{proyecto.cliente.phone}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No hay cliente asignado</p>
              )}
            </CardContent>
          </Card>

          {/* Mix de Recetas */}
          <Card>
            <CardHeader>
              <CardTitle>Mix de Semillas Asignado</CardTitle>
              <CardDescription>Mezcla de recetas utilizada en el proyecto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {proyecto.mix ? (
                <div className="space-y-4">
                  {/* Nombre y descripción del mix */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Nombre del Mix
                    </label>
                    <p className="text-base font-medium mt-1">{proyecto.mix.nombre}</p>
                  </div>

                  {proyecto.mix.descripcion && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Descripción
                      </label>
                      <p className="text-base mt-1">{proyecto.mix.descripcion}</p>
                    </div>
                  )}

                  <Separator />

                  {/* Lista de recetas en el mix */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Recetas ({proyecto.mix.recetas?.length || 0})
                    </label>
                    {proyecto.mix.recetas && proyecto.mix.recetas.length > 0 ? (
                      <div className="space-y-2">
                        {proyecto.mix.recetas.map((receta) => (
                          <div
                            key={receta.id_receta}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{receta.nombre}</p>
                              {receta.descripcion && (
                                <p className="text-sm text-muted-foreground">
                                  {receta.descripcion}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary">
                                {receta.cantidad_iseeds.toLocaleString()} iSeeds
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No hay recetas en este mix
                      </p>
                    )}
                  </div>

                  <Separator />

                  <Button onClick={() => setAsignarMixOpen(true)} variant="outline" size="sm">
                    Cambiar Mix
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">No hay mix asignado</p>
                  <Button onClick={() => setAsignarMixOpen(true)}>Asignar Mix</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TAB PRODUCCIÓN ==================== */}
        <TabsContent value="produccion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Producción</CardTitle>
              <CardDescription>Historial de producción del proyecto</CardDescription>
            </CardHeader>
            <CardContent>
              {!proyecto.mix ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Para iniciar la producción, primero debes asignar un mix al proyecto
                  </p>
                  <Button onClick={() => setAsignarMixOpen(true)}>Asignar Mix</Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay producciones registradas para este proyecto
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    La funcionalidad de producción estará disponible próximamente
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para asignar mix */}
      <AsignarMixDialog
        open={asignarMixOpen}
        onOpenChange={setAsignarMixOpen}
        proyectoId={proyecto.id_proyecto}
        mixActual={proyecto.mix}
        mixes={mixes}
      />
    </>
  )
}
