import { ProyectosTable } from '@/components/proyectos/ProyectosTable'
import { getProyectos, getEstadosProyecto, getEcoRegiones } from '@/app/actions/proyectos'
import { getClientes } from '@/app/actions/clientes'

// =====================================================
// SERVER COMPONENT - PROYECTOS PAGE
// =====================================================

export default async function ProyectosPage() {
  // Fetch all data in parallel
  const [proyectosResult, clientesResult, estadosResult, ecoRegionesResult] = await Promise.all([
    getProyectos({ pageSize: 1000 }),
    getClientes({ pageSize: 1000 }),
    getEstadosProyecto(),
    getEcoRegiones(),
  ])

  // Extract data with fallback to empty arrays
  const proyectos = proyectosResult.success && proyectosResult.data ? proyectosResult.data.data : []
  const clientes = clientesResult.success && clientesResult.data ? clientesResult.data.data : []
  const estados = estadosResult.success && estadosResult.data ? estadosResult.data : []
  const ecoRegiones = ecoRegionesResult.success && ecoRegionesResult.data ? ecoRegionesResult.data : []

  return (
    <div className="container mx-auto py-8">
      <ProyectosTable
        initialData={proyectos}
        clientes={clientes}
        estados={estados}
        ecoRegiones={ecoRegiones}
      />
    </div>
  )
}
