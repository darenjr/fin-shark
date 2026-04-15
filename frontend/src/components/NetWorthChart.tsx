'use client'

import type { Snapshot } from '@/types'
import { formatSGD } from '@/lib/format'

interface Props {
  snapshots: Snapshot[] // newest-first from API; we reverse internally
}

const W = 600
const H = 200
const PAD = { top: 16, right: 16, bottom: 40, left: 72 }

function toPlotCoords(
  snapshots: Snapshot[],
): { x: number; y: number; snap: Snapshot }[] {
  if (snapshots.length === 0) return []

  const oldest = new Date(snapshots[0].timestamp).getTime()
  const newest = new Date(snapshots[snapshots.length - 1].timestamp).getTime()
  const tRange = newest - oldest || 1

  const values = snapshots.map((s) => s.total_net_worth)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const vRange = maxV - minV || 1

  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  return snapshots.map((snap) => {
    const t = new Date(snap.timestamp).getTime()
    const x = PAD.left + ((t - oldest) / tRange) * innerW
    const y = PAD.top + (1 - (snap.total_net_worth - minV) / vRange) * innerH
    return { x, y, snap }
  })
}

function yAxisTicks(snapshots: Snapshot[]): { y: number; label: string }[] {
  if (snapshots.length === 0) return []
  const values = snapshots.map((s) => s.total_net_worth)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const vRange = maxV - minV || 1
  const innerH = H - PAD.top - PAD.bottom
  const count = 4
  return Array.from({ length: count + 1 }, (_, i) => {
    const frac = i / count
    const value = minV + frac * vRange
    const y = PAD.top + (1 - frac) * innerH
    return { y, label: formatSGD(value) }
  })
}

export default function NetWorthChart({ snapshots }: Props) {
  // API returns newest-first; chart needs oldest-first
  const ordered = [...snapshots].reverse()
  const points = toPlotCoords(ordered)
  const ticks = yAxisTicks(ordered)

  if (points.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No snapshots yet — take one to start tracking.
      </div>
    )
  }

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')

  // Build area fill path
  const firstX = points[0].x
  const lastX = points[points.length - 1].x
  const bottomY = H - PAD.bottom
  const areaPath =
    `M${firstX},${bottomY} ` +
    points.map((p) => `L${p.x},${p.y}`).join(' ') +
    ` L${lastX},${bottomY} Z`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      aria-label="Net worth over time"
    >
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y-axis grid lines + labels */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={PAD.left}
            y1={t.y}
            x2={W - PAD.right}
            y2={t.y}
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth="1"
          />
          <text
            x={PAD.left - 8}
            y={t.y}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize="9"
            fill="currentColor"
            fillOpacity="0.45"
          >
            {t.label}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#areaGrad)" />

      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke="#6366f1"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#6366f1" />
      ))}

      {/* X-axis: first and last date labels */}
      {points.length >= 1 && (
        <text
          x={points[0].x}
          y={H - PAD.bottom + 14}
          textAnchor="middle"
          fontSize="9"
          fill="currentColor"
          fillOpacity="0.45"
        >
          {new Date(points[0].snap.timestamp).toLocaleDateString('en-SG', {
            day: 'numeric',
            month: 'short',
          })}
        </text>
      )}
      {points.length >= 2 && (
        <text
          x={points[points.length - 1].x}
          y={H - PAD.bottom + 14}
          textAnchor="middle"
          fontSize="9"
          fill="currentColor"
          fillOpacity="0.45"
        >
          {new Date(points[points.length - 1].snap.timestamp).toLocaleDateString(
            'en-SG',
            { day: 'numeric', month: 'short' },
          )}
        </text>
      )}
    </svg>
  )
}
