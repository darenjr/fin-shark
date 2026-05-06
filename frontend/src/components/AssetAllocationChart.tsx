'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatSGD } from '@/lib/format'
import type { Asset, AssetType } from '@/types'

interface Props {
  assets: Asset[]
}

const TYPE_ORDER: AssetType[] = ['Cash', 'Stocks', 'CPF-OA', 'Crypto']

const TYPE_COLORS: Record<AssetType, string> = {
  Cash: '#c7d2fe',
  Stocks: '#818cf8',
  'CPF-OA': '#6366f1',
  Crypto: '#4338ca',
}

const W = 640
const H = 420
const CX = W / 2
const CY = 200
const R_OUTER = 108
const R_INNER = 70
const GAP = 0.025

function polar(r: number, a: number) {
  return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) }
}

function arcPath(a1: number, a2: number) {
  const start = a1 + GAP / 2
  const end = a2 - GAP / 2
  const outerStart = polar(R_OUTER, start)
  const outerEnd = polar(R_OUTER, end)
  const innerStart = polar(R_INNER, start)
  const innerEnd = polar(R_INNER, end)
  const largeArc = end - start > Math.PI ? 1 : 0
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${R_OUTER} ${R_OUTER} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${R_INNER} ${R_INNER} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ')
}

export default function AssetAllocationChart({ assets }: Props) {
  const [hidden, setHidden] = useState<Set<AssetType>>(new Set())

  const totals: Record<AssetType, number> = {
    Cash: 0,
    Stocks: 0,
    'CPF-OA': 0,
    Crypto: 0,
  }
  for (const a of assets) totals[a.type] += a.balance

  const presentTypes = TYPE_ORDER.filter((t) => totals[t] > 0)
  const visibleTotal = presentTypes
    .filter((t) => !hidden.has(t))
    .reduce((s, t) => s + totals[t], 0)

  const toggle = (t: AssetType) => {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  const segments = presentTypes
    .filter((t) => !hidden.has(t))
    .map((t) => ({
      type: t,
      value: totals[t],
      pct: totals[t] / visibleTotal,
      color: TYPE_COLORS[t],
    }))

  const hasAssets = presentTypes.length > 0

  let cursor = 0
  const placed = segments.map((s) => {
    const a1 = cursor
    const a2 = cursor + s.pct * 2 * Math.PI
    cursor = a2
    return { ...s, a1, a2, mid: (a1 + a2) / 2 }
  })

  const TICK_COUNT = 64
  const TICK_R1 = 46
  const TICK_R2 = 58
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const a = (i / TICK_COUNT) * 2 * Math.PI
    return { p1: polar(TICK_R1, a), p2: polar(TICK_R2, a) }
  })

  const labels = placed.map((s) => {
    const anchor = polar(R_OUTER, s.mid)
    const elbow = polar(R_OUTER + 22, s.mid)
    const isRight = Math.sin(s.mid) >= 0
    const labelX = isRight ? W - 40 : 40
    const elbowX = isRight
      ? Math.max(elbow.x, W - 170)
      : Math.min(elbow.x, 170)
    return {
      ...s,
      anchor,
      elbow: { x: elbowX, y: elbow.y },
      leaderMid: elbow,
      labelX,
      labelY: elbow.y,
      textAnchor: (isRight ? 'end' : 'start') as 'end' | 'start',
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">Portfolio Composition</CardTitle>
        <CardDescription>
          Balance distribution by asset type — click a slice or legend item to exclude it
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasAssets ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No assets yet — add one below to see your allocation.
          </div>
        ) : (
          <>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Asset allocation donut chart">
              <circle
                cx={CX}
                cy={CY}
                r={(R_OUTER + R_INNER) / 2}
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.06"
                strokeWidth={R_OUTER - R_INNER}
              />

              {ticks.map((t, i) => (
                <line
                  key={i}
                  x1={t.p1.x}
                  y1={t.p1.y}
                  x2={t.p2.x}
                  y2={t.p2.y}
                  stroke="currentColor"
                  strokeOpacity="0.22"
                  strokeWidth="1"
                />
              ))}

              {segments.length === 0 && (
                <text
                  x={CX}
                  y={CY + 4}
                  textAnchor="middle"
                  fontSize="13"
                  fill="currentColor"
                  fillOpacity="0.5"
                >
                  All asset types hidden
                </text>
              )}

              {placed.map((s, i) => (
                <path
                  key={i}
                  d={arcPath(s.a1, s.a2)}
                  fill={s.color}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onClick={() => toggle(s.type)}
                >
                  <title>{`${s.type} — click to hide`}</title>
                </path>
              ))}

              {labels.map((l, i) => (
                <g key={i}>
                  <path
                    d={`M ${l.anchor.x} ${l.anchor.y} L ${l.leaderMid.x} ${l.leaderMid.y} L ${l.elbow.x} ${l.elbow.y}`}
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity="0.35"
                    strokeWidth="1"
                  />
                  <text
                    x={l.labelX}
                    y={l.labelY - 10}
                    textAnchor={l.textAnchor}
                    fontSize="13"
                    fontWeight="600"
                    fill="currentColor"
                    fillOpacity="0.9"
                  >
                    {l.type}
                  </text>
                  <text
                    x={l.labelX}
                    y={l.labelY + 8}
                    textAnchor={l.textAnchor}
                    fontSize="18"
                    fontWeight="700"
                    fill="currentColor"
                    fillOpacity="0.95"
                  >
                    {(l.pct * 100).toFixed(1)}%
                  </text>
                  <text
                    x={l.labelX}
                    y={l.labelY + 24}
                    textAnchor={l.textAnchor}
                    fontSize="11"
                    fill="currentColor"
                    fillOpacity="0.55"
                  >
                    {formatSGD(l.value)}
                  </text>
                </g>
              ))}
            </svg>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {presentTypes.map((t) => {
                const isHidden = hidden.has(t)
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggle(t)}
                    aria-pressed={!isHidden}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      isHidden
                        ? 'border-muted bg-transparent text-muted-foreground line-through opacity-60 hover:opacity-80'
                        : 'border-border bg-muted/40 text-foreground hover:bg-muted/70'
                    }`}
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: TYPE_COLORS[t] }}
                    />
                    <span>{t}</span>
                    <span className="text-muted-foreground">
                      {formatSGD(totals[t])}
                    </span>
                  </button>
                )
              })}
              {hidden.size > 0 && (
                <button
                  type="button"
                  onClick={() => setHidden(new Set())}
                  className="rounded-full border border-border bg-transparent px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/40"
                >
                  Reset
                </button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
