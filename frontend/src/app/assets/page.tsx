import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import AssetTable from '@/components/AssetTable'
import { getAssets } from '@/lib/api'

export default async function AssetsPage() {
  let assets = null
  let error = ''

  try {
    assets = await getAssets()
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load assets'
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-500/30 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertTitle className="text-red-400">Backend unreachable</AlertTitle>
          <AlertDescription className="text-red-300/80">{error}</AlertDescription>
        </Alert>
      )}

      <AssetTable initial={assets ?? []} />
    </div>
  )
}
