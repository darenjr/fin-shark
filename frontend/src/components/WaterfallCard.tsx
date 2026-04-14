import { Calendar, ShieldAlert, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { MilestoneFunding } from '@/types'
import { formatSGD, formatPct } from '@/lib/format'

interface Props {
  mf: MilestoneFunding
}

const CATEGORY_EMOJI: Record<string, string> = {
  Wedding: '💍',
  Housing: '🏠',
  Travel: '✈️',
  Emergency: '🛡️',
  Investment: '📈',
  Other: '🎯',
}

export default function WaterfallCard({ mf }: Props) {
  const { milestone, funded_amount, funding_pct, is_fully_funded,
          funding_breakdown, volatile_pct, months_to_target,
          derisk_warning, stress_breaks } = mf

  const target = milestone.target_amount
  const stablePct  = (funding_breakdown.stable   / target) * 100
  const modPct     = (funding_breakdown.moderate  / target) * 100
  const highPct    = (funding_breakdown.high      / target) * 100
  const unfundedPct = Math.max(0, 100 - stablePct - modPct - highPct)

  const borderColor = derisk_warning || stress_breaks
    ? 'border-amber-500/50'
    : is_fully_funded
    ? 'border-emerald-500/30'
    : 'border-border'

  return (
    <Card className={`border ${borderColor} transition-colors`}>
      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
              {milestone.priority_rank}
            </span>
            <h3 className="font-semibold text-foreground">{milestone.name}</h3>
          </div>
          <div className="flex shrink-0 flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">
              {CATEGORY_EMOJI[milestone.category]} {milestone.category}
            </Badge>
            {derisk_warning && (
              <Badge className="bg-amber-500/20 text-amber-400 text-xs border-amber-500/30">
                <ShieldAlert className="mr-1 h-3 w-3" /> De-risk
              </Badge>
            )}
            {stress_breaks && (
              <Badge className="bg-red-500/20 text-red-400 text-xs border-red-500/30">
                <Zap className="mr-1 h-3 w-3" /> Stress Break
              </Badge>
            )}
            {is_fully_funded && !stress_breaks && (
              <Badge className="bg-emerald-500/20 text-emerald-400 text-xs border-emerald-500/30">
                Funded ✓
              </Badge>
            )}
          </div>
        </div>

        {/* Stacked funding bar */}
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-700">
          <div className="flex h-full">
            <div style={{ width: `${stablePct}%` }}  className="bg-emerald-500 transition-all" />
            <div style={{ width: `${modPct}%` }}     className="bg-blue-400 transition-all" />
            <div style={{ width: `${highPct}%` }}    className="bg-amber-400 transition-all" />
            <div style={{ width: `${unfundedPct}%` }} className="bg-transparent" />
          </div>
        </div>

        {/* Amounts */}
        <div className="mt-2 flex items-baseline justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{formatSGD(funded_amount)}</span>
            {' '}of {formatSGD(target)}
          </p>
          <p className="text-sm font-semibold text-foreground">{formatPct(funding_pct)}</p>
        </div>

        {/* Breakdown legend + meta */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {funding_breakdown.stable > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Stable {formatSGD(funding_breakdown.stable)}
            </span>
          )}
          {funding_breakdown.moderate > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
              Moderate {formatSGD(funding_breakdown.moderate)}
            </span>
          )}
          {funding_breakdown.high > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
              High {formatSGD(funding_breakdown.high)} ({formatPct(volatile_pct)})
            </span>
          )}
          <span className="ml-auto flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {months_to_target.toFixed(1)} months
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
