'use client'

import { useState, useTransition } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import NetWorthChart from '@/components/NetWorthChart'
import { createSnapshot, getSnapshots } from '@/lib/api'
import { formatSGD } from '@/lib/format'
import type { Snapshot } from '@/types'

interface Props {
  initialSnapshots: Snapshot[]
}

export default function HistoryClient({ initialSnapshots }: Props) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>(initialSnapshots)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleTakeSnapshot() {
    setError('')
    startTransition(async () => {
      try {
        await createSnapshot()
        const fresh = await getSnapshots(90)
        setSnapshots(fresh)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Snapshot failed')
      }
    })
  }

  const latest = snapshots[0] // newest-first
  const previous = snapshots[1]
  const delta =
    latest && previous
      ? latest.total_net_worth - previous.total_net_worth
      : null

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {latest && (
            <div>
              <p className="text-3xl font-bold text-foreground">
                {formatSGD(latest.total_net_worth)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Last snapshot:{' '}
                {new Date(latest.timestamp).toLocaleString('en-SG', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
          {delta !== null && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                delta >= 0
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-red-500/15 text-red-400'
              }`}
            >
              {delta >= 0 ? '+' : ''}
              {formatSGD(delta)} vs prev
            </span>
          )}
        </div>

        <Button
          onClick={handleTakeSnapshot}
          disabled={isPending}
          size="sm"
          className="gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          Take Snapshot
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {/* Chart */}
      <Card>
        <CardContent className="p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Pool — last {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''}
          </p>
          <NetWorthChart snapshots={snapshots} />
        </CardContent>
      </Card>

      {/* Table */}
      {snapshots.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Date
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Net Worth
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((snap, i) => {
                  const next = snapshots[i + 1]
                  const change = next
                    ? snap.total_net_worth - next.total_net_worth
                    : null
                  return (
                    <tr
                      key={snap.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-5 py-3 text-foreground">
                        {new Date(snap.timestamp).toLocaleString('en-SG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-foreground">
                        {formatSGD(snap.total_net_worth)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {change !== null ? (
                          <span
                            className={
                              change >= 0
                                ? 'text-emerald-400'
                                : 'text-red-400'
                            }
                          >
                            {change >= 0 ? '+' : ''}
                            {formatSGD(change)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
