import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import PoolSummaryCards from '@/components/PoolSummaryCards'
import WaterfallCard from '@/components/WaterfallCard'
import { getWaterfall } from '@/lib/api'

export default async function DashboardPage() {
  let data = null
  let error = ''

  try {
    data = await getWaterfall()
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load waterfall data'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Risk-aware waterfall — assets flow into milestones by priority
        </p>
      </div>

      {error && (
        <Alert className="border-red-500/30 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertTitle className="text-red-400">Backend unreachable</AlertTitle>
          <AlertDescription className="text-red-300/80">{error}</AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          <PoolSummaryCards data={data} />

          {data.any_derisk_warning && (
            <Alert className="border-amber-500/30 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertTitle className="text-amber-400">De-risk Warning</AlertTitle>
              <AlertDescription className="text-amber-300/80">
                One or more near-term milestones are being funded by high-volatility assets.
                Consider rebalancing towards Cash or stable ETFs.
              </AlertDescription>
            </Alert>
          )}

          {data.milestones.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">No milestones yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add milestones and assets to see the waterfall.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Waterfall Allocation
              </h3>
              <div className="grid gap-3 lg:grid-cols-2">
                {data.milestones.map((mf) => (
                  <WaterfallCard key={mf.milestone.id} mf={mf} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
