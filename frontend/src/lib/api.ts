import type { Asset, Milestone, Snapshot, WaterfallResult } from '@/types'

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

function getPasscode(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('app_passcode') ?? ''
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method?.toUpperCase() ?? 'GET'
  const isWrite = method === 'POST' || method === 'PATCH' || method === 'DELETE'

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }

  if (isWrite) {
    headers['x-passcode'] = getPasscode()
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, cache: 'no-store' })
  if (res.status === 204) return undefined as T
  const json = await res.json()
  if (!res.ok) throw new Error(json.detail ?? 'Request failed')
  return json as T
}

// ── Assets ────────────────────────────────────────────────────────────────────

export const getAssets = () => apiFetch<Asset[]>('/assets/')

export const createAsset = (data: Omit<Asset, 'id'>) =>
  apiFetch<Asset>('/assets/', { method: 'POST', body: JSON.stringify(data) })

export const updateAsset = (id: string, data: Partial<Omit<Asset, 'id'>>) =>
  apiFetch<Asset>(`/assets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

export const deleteAsset = (id: string) =>
  apiFetch<void>(`/assets/${id}`, { method: 'DELETE' })

// ── Milestones ────────────────────────────────────────────────────────────────

export const getMilestones = () => apiFetch<Milestone[]>('/milestones/')

export const createMilestone = (data: Omit<Milestone, 'id'>) =>
  apiFetch<Milestone>('/milestones/', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const updateMilestone = (
  id: string,
  data: Partial<Omit<Milestone, 'id'>>,
) =>
  apiFetch<Milestone>(`/milestones/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

export const deleteMilestone = (id: string) =>
  apiFetch<void>(`/milestones/${id}`, { method: 'DELETE' })

// ── Snapshots ─────────────────────────────────────────────────────────────────

export const getSnapshots = (limit = 90) =>
  apiFetch<Snapshot[]>(`/snapshots/?limit=${limit}`)

export const createSnapshot = () =>
  apiFetch<Snapshot>('/snapshots/', { method: 'POST' })

// ── Waterfall ─────────────────────────────────────────────────────────────────

export const getWaterfall = () => apiFetch<WaterfallResult>('/waterfall/')
