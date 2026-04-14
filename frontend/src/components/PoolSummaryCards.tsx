import { TrendingDown, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { WaterfallResult } from '@/types'
import { formatSGD, formatPct } from '@/lib/format'

interface Props {
  data: WaterfallResult
}

export default function PoolSummaryCards({ data }: Props) {
  const haircut = data.total_pool > 0
    ? (data.total_pool - data.stress_pool) / data.total_pool
    : 0

  const cards = [
    {
      label: 'Total Pool',
      value: formatSGD(data.total_pool),
      sub: 'Sum of all assets',
      icon: DollarSign,
      accent: 'text-indigo-400',
    },
    {
      label: 'Stress Pool',
      value: formatSGD(data.stress_pool),
      sub: `−${formatPct(haircut)} after haircuts`,
      icon: TrendingDown,
      accent: 'text-amber-400',
    },
    {
      label: 'Unfunded Surplus',
      value: formatSGD(data.remaining_pool),
      sub: 'Left over after all milestones',
      icon: CheckCircle,
      accent: 'text-emerald-400',
    },
    {
      label: 'Milestones at Risk',
      value: String(data.milestones_breaking_under_stress.length),
      sub: data.milestones_breaking_under_stress.length > 0
        ? data.milestones_breaking_under_stress.join(', ')
        : 'All survive stress test',
      icon: AlertTriangle,
      accent: data.milestones_breaking_under_stress.length > 0 ? 'text-red-400' : 'text-emerald-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {c.label}
              </p>
              <c.icon className={`h-4 w-4 shrink-0 ${c.accent}`} />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{c.value}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{c.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
