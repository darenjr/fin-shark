import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getSnapshots } from '@/lib/api'
import HistoryClient from './HistoryClient'

export default async function HistoryPage() {
  let snapshots = null
  let error = ''

  try {
    snapshots = await getSnapshots(90)
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load snapshot history'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Net Worth History</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Append-only snapshots of your total asset pool over time
        </p>
      </div>

      {error && (
        <Alert className="border-red-500/30 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertTitle className="text-red-400">Backend unreachable</AlertTitle>
          <AlertDescription className="text-red-300/80">{error}</AlertDescription>
        </Alert>
      )}

      {snapshots !== null && <HistoryClient initialSnapshots={snapshots} />}
    </div>
  )
}
