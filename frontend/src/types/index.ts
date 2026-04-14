export type AssetType = 'Cash' | 'Crypto' | 'Stocks' | 'CPF-OA'
export type VolatilityLevel = 1 | 2 | 3
export type Owner = 'UserA' | 'UserB' | 'Shared'
export type MilestoneCategory =
  | 'Wedding'
  | 'Housing'
  | 'Travel'
  | 'Emergency'
  | 'Investment'
  | 'Other'

export interface Asset {
  id: string
  name: string
  type: AssetType
  balance: number
  volatility_level: VolatilityLevel
  owner: Owner
}

export interface Milestone {
  id: string
  name: string
  target_amount: number
  target_date: string // ISO date "YYYY-MM-DD"
  priority_rank: number
  category: MilestoneCategory
}

export interface VolatilityBreakdown {
  stable: number
  moderate: number
  high: number
}

export interface MilestoneFunding {
  milestone: Milestone
  funded_amount: number
  funding_pct: number
  is_fully_funded: boolean
  funding_breakdown: VolatilityBreakdown
  volatile_pct: number
  months_to_target: number
  derisk_warning: boolean
  stress_funded_amount: number
  stress_funding_pct: number
  stress_is_fully_funded: boolean
  stress_breaks: boolean
}

export interface WaterfallResult {
  milestones: MilestoneFunding[]
  total_pool: number
  stress_pool: number
  remaining_pool: number
  stress_remaining_pool: number
  any_derisk_warning: boolean
  milestones_breaking_under_stress: string[]
}
