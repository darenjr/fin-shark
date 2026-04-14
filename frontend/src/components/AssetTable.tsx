'use client'

import { useState } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createAsset, updateAsset, deleteAsset } from '@/lib/api'
import { formatSGD } from '@/lib/format'
import type { Asset, AssetType, VolatilityLevel, Owner } from '@/types'

const VOL_LABEL: Record<number, string> = { 1: 'Stable', 2: 'Moderate', 3: 'High' }
const VOL_COLOR: Record<number, string> = {
  1: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  2: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  3: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

const EMPTY_FORM = {
  name: '',
  type: 'Cash' as AssetType,
  balance: '',
  volatility_level: '1' as string,
  owner: 'UserA' as Owner,
}

interface Props {
  initial: Asset[]
}

export default function AssetTable({ initial }: Props) {
  const [assets, setAssets] = useState<Asset[]>(initial)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Asset | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setOpen(true)
  }

  function openEdit(asset: Asset) {
    setEditing(asset)
    setForm({
      name: asset.name,
      type: asset.type,
      balance: String(asset.balance),
      volatility_level: String(asset.volatility_level),
      owner: asset.owner,
    })
    setError('')
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        type: form.type,
        balance: parseFloat(form.balance),
        volatility_level: parseInt(form.volatility_level) as VolatilityLevel,
        owner: form.owner,
      }
      if (editing) {
        const updated = await updateAsset(editing.id, payload)
        setAssets((prev) => prev.map((a) => (a.id === editing.id ? updated : a)))
      } else {
        const created = await createAsset(payload)
        setAssets((prev) => [...prev, created])
      }
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this asset?')) return
    await deleteAsset(id)
    setAssets((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Assets</h2>
          <p className="mt-1 text-sm text-muted-foreground">All assets in the liquid pool</p>
        </div>
        <Button onClick={openAdd} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Asset
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Volatility</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No assets yet — add one to get started.
                </TableCell>
              </TableRow>
            )}
            {assets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium text-foreground">{asset.name}</TableCell>
                <TableCell className="text-muted-foreground">{asset.type}</TableCell>
                <TableCell className="font-mono text-foreground">{formatSGD(asset.balance)}</TableCell>
                <TableCell>
                  <Badge className={`text-xs ${VOL_COLOR[asset.volatility_level]}`}>
                    {VOL_LABEL[asset.volatility_level]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{asset.owner}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(asset)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(asset.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g. DBS Multiplier"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as AssetType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['Cash', 'Stocks', 'Crypto', 'CPF-OA'] as AssetType[]).map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Owner</Label>
                <Select value={form.owner} onValueChange={(v) => setForm((f) => ({ ...f, owner: v as Owner }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['UserA', 'UserB', 'Shared'] as Owner[]).map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="balance">Balance (SGD)</Label>
                <Input
                  id="balance"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.balance}
                  onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Volatility</Label>
                <Select
                  value={form.volatility_level}
                  onValueChange={(v) => setForm((f) => ({ ...f, volatility_level: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 — Stable (Cash/CPF)</SelectItem>
                    <SelectItem value="2">2 — Moderate (ETFs)</SelectItem>
                    <SelectItem value="3">3 — High (Crypto)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
