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
import { createMilestone, updateMilestone, deleteMilestone } from '@/lib/api'
import { formatSGD } from '@/lib/format'
import type { Milestone, MilestoneCategory } from '@/types'

const CATEGORIES: MilestoneCategory[] = [
  'Wedding', 'Housing', 'Travel', 'Emergency', 'Investment', 'Other',
]

const EMPTY_FORM = {
  name: '',
  target_amount: '',
  target_date: '',
  priority_rank: '',
  category: 'Other' as MilestoneCategory,
}

interface Props {
  initial: Milestone[]
}

export default function MilestoneTable({ initial }: Props) {
  const [milestones, setMilestones] = useState<Milestone[]>(initial)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Milestone | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setOpen(true)
  }

  function openEdit(m: Milestone) {
    setEditing(m)
    setForm({
      name: m.name,
      target_amount: String(m.target_amount),
      target_date: m.target_date,
      priority_rank: String(m.priority_rank),
      category: m.category,
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
        target_amount: parseFloat(form.target_amount),
        target_date: form.target_date,
        priority_rank: parseInt(form.priority_rank),
        category: form.category,
      }
      if (editing) {
        const updated = await updateMilestone(editing.id, payload)
        setMilestones((prev) => prev.map((m) => (m.id === editing.id ? updated : m)))
      } else {
        const created = await createMilestone(payload)
        setMilestones((prev) => [...prev, created].sort((a, b) => a.priority_rank - b.priority_rank))
      }
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this milestone?')) return
    await deleteMilestone(id)
    setMilestones((prev) => prev.filter((m) => m.id !== id))
  }

  const sorted = [...milestones].sort((a, b) => a.priority_rank - b.priority_rank)

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Milestones</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Life goals in waterfall priority order
          </p>
        </div>
        <Button onClick={openAdd} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Milestone
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No milestones yet — add one to start the waterfall.
                </TableCell>
              </TableRow>
            )}
            {sorted.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {m.priority_rank}
                  </span>
                </TableCell>
                <TableCell className="font-medium text-foreground">{m.name}</TableCell>
                <TableCell className="font-mono text-foreground">{formatSGD(m.target_amount)}</TableCell>
                <TableCell className="text-muted-foreground">{m.target_date}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">{m.category}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(m.id)}
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
            <DialogTitle>{editing ? 'Edit Milestone' : 'Add Milestone'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="m-name">Name</Label>
              <Input
                id="m-name"
                placeholder="e.g. BTO Renovation"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="m-amount">Target Amount (SGD)</Label>
                <Input
                  id="m-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="50000"
                  value={form.target_amount}
                  onChange={(e) => setForm((f) => ({ ...f, target_amount: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-rank">Priority Rank</Label>
                <Input
                  id="m-rank"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={form.priority_rank}
                  onChange={(e) => setForm((f) => ({ ...f, priority_rank: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="m-date">Target Date</Label>
                <Input
                  id="m-date"
                  type="date"
                  value={form.target_date}
                  onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v as MilestoneCategory }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
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
