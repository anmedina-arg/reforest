'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Mail, Phone, User, Calendar, MapPin, Sprout, Package, TrendingUp, History, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { AsignarMixDialog } from './AsignarMixDialog'
import { NuevaProduccionDialog } from './NuevaProduccionDialog'
import { ProduccionesTable } from './ProduccionesTable'
import { RegistrarConsumoDialog } from './RegistrarConsumoDialog'
import { getDisponibilidadesByProduccion } from '@/app/actions/disponibilidad'
import type {
  ProyectoWithRelations,
  MixISeeds,
  ProduccionWithRelations,
  ConsumoWithRelations,
  DisponibilidadWithConsumo,
} from '@/types/entities'

// =====================================================
// TYPES
// =====================================================

interface ProyectoTabsProps {
  proyecto: ProyectoWithRelations
  mixes: Array<MixISeeds & { recetas_count: number }>
  producciones: ProduccionWithRelations[]
  disponibilidadTotal: number
  consumos: ConsumoWithRelations[]
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

export function ProyectoTabs({
  proyecto,
  mixes,
  producciones,
  disponibilidadTotal,
  consumos,
}: ProyectoTabsProps) {
  const [asignarMixOpen, setAsignarMixOpen] = useState(false)
  const [nuevaProduccionOpen, setNuevaProduccionOpen] = useState(false)
  const [registrarConsumoOpen, setRegistrarConsumoOpen] = useState(false)
  const [disponibilidadesSeleccionadas, setDisponibilidadesSeleccionadas] = useState<
    DisponibilidadWithConsumo[]
  >([])
  const [isLoadingDisponibilidades, setIsLoadingDisponibilidades] = useState(false)

  // Obtener producciones completadas
  const produccionesCompletadas = producciones.filter((p) =>
    p.estado_produccion?.nombre?.toLowerCase().includes('completada')
  )

  // Handler para abrir el dialog de registrar consumo
  async function handleAbrirRegistrarConsumo() {
    setIsLoadingDisponibilidades(true)

    try {
      // Obtener todas las disponibilidades de todas las producciones completadas
      const disponibilidadesPromises = produccionesCompletadas.map((p) =>
        getDisponibilidadesByProduccion({ id_produccion: p.id_produccion })
      )

      const results = await Promise.all(disponibilidadesPromises)

      // Combinar todas las disponibilidades en un solo array
      const todasDisponibilidades: DisponibilidadWithConsumo[] = []
      results.forEach((result) => {
        if (result.success && result.data) {
          todasDisponibilidades.push(...result.data)
        }
      })

      setDisponibilidadesSeleccionadas(todasDisponibilidades)
      setRegistrarConsumoOpen(true)
    } catch (error) {
      toast.error('Error al obtener disponibilidades')
    } finally {
      setIsLoadingDisponibilidades(false)
    }
  }

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
          {/* DISPONIBILIDAD TOTAL - Card destacado */}
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Disponibilidad Total</CardTitle>
                    <CardDescription>iSeeds disponibles para consumo</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-primary">
                    {disponibilidadTotal.toLocaleString()}
                  </p>
                  <div className="mt-2">
                    <Badge
                      variant={disponibilidadTotal > 0 ? 'success' : 'destructive'}
                      className="text-sm"
                    >
                      {disponibilidadTotal > 0 ? 'Stock Disponible' : 'Sin Stock'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            {produccionesCompletadas.length > 0 && (
              <CardContent>
                <Button
                  onClick={handleAbrirRegistrarConsumo}
                  disabled={isLoadingDisponibilidades || disponibilidadTotal === 0}
                  className="w-full sm:w-auto"
                >
                  {isLoadingDisponibilidades ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      <Package className="mr-2 h-4 w-4" />
                      Registrar Consumo
                    </>
                  )}
                </Button>
              </CardContent>
            )}
          </Card>

          {/* HISTORIAL DE PRODUCCIONES */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Producción</CardTitle>
                  <CardDescription>Historial de producción del proyecto</CardDescription>
                </div>
                {proyecto.mix && proyecto.mix.recetas && proyecto.mix.recetas.length > 0 && (
                  <Button onClick={() => setNuevaProduccionOpen(true)}>
                    <Package className="mr-2 h-4 w-4" />
                    Nueva Producción
                  </Button>
                )}
              </div>
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
              ) : producciones.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No hay producciones registradas para este proyecto
                  </p>
                  <Button onClick={() => setNuevaProduccionOpen(true)}>
                    Crear Primera Producción
                  </Button>
                </div>
              ) : (
                <ProduccionesTable producciones={producciones} />
              )}
            </CardContent>
          </Card>

          {/* HISTORIAL DE CONSUMOS */}
          {consumos.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <History className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle>Historial de Consumos</CardTitle>
                    <CardDescription>
                      Registro de consumos de iSeeds en el proyecto
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cantidad Consumida</TableHead>
                        <TableHead>Fecha Producción Origen</TableHead>
                        <TableHead>Disponible Restante</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consumos.map((consumo) => (
                        <TableRow key={consumo.id_consumo}>
                          <TableCell>{formatFecha(consumo.fecha_consumo)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {consumo.cantidad_consumida?.toLocaleString() || 0} iSeeds
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatFecha(consumo.disponibilidad?.fecha_produccion || null)}
                          </TableCell>
                          <TableCell>
                            {consumo.disponibilidad ? (
                              <Badge
                                variant={
                                  consumo.disponibilidad.cantidad_disponible > 0
                                    ? 'success'
                                    : 'secondary'
                                }
                              >
                                {consumo.disponibilidad.cantidad_disponible.toLocaleString()}{' '}
                                iSeeds
                              </Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
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

      {/* Dialog para nueva producción */}
      {proyecto.mix && proyecto.mix.recetas && (
        <NuevaProduccionDialog
          open={nuevaProduccionOpen}
          onOpenChange={setNuevaProduccionOpen}
          proyectoId={proyecto.id_proyecto}
          recetas={proyecto.mix.recetas}
        />
      )}

      {/* Dialog para registrar consumo */}
      <RegistrarConsumoDialog
        open={registrarConsumoOpen}
        onOpenChange={setRegistrarConsumoOpen}
        proyectoId={proyecto.id_proyecto}
        disponibilidades={disponibilidadesSeleccionadas}
      />
    </>
  )
}
