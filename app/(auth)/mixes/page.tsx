import { MixesTable } from '@/components/mixes/MixesTable'
import { getMixes } from '@/app/actions/mixes'

// =====================================================
// SERVER COMPONENT - MIXES PAGE
// =====================================================

export default async function MixesPage() {
  // Fetch mixes
  const mixesResult = await getMixes({ pageSize: 1000 })

  // Extract data with fallback to empty array
  const mixes = mixesResult.success && mixesResult.data ? mixesResult.data.data : []

  return (
    <div className="container mx-auto py-8">
      <MixesTable initialData={mixes} />
    </div>
  )
}
