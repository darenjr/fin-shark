'use client'

import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const STORAGE_KEY = 'app_passcode'

// Probe a protected endpoint to validate the passcode
async function checkPasscode(passcode: string): Promise<boolean> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'
  try {
    // PATCH with an empty body to /assets/probe — will 404 (asset not found)
    // but a wrong passcode returns 401 before the DB is consulted
    const res = await fetch(`${apiBase}/assets/00000000-0000-0000-0000-000000000000`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-passcode': passcode },
      body: JSON.stringify({}),
    })
    // 404 = passcode correct, asset just doesn't exist — that's fine
    // 422 = validation error, passcode still accepted
    // 401 = wrong passcode
    return res.status !== 401
  } catch {
    // Network error — let them through optimistically, api calls will surface the real error
    return true
  }
}

interface Props {
  children: React.ReactNode
}

export default function PasscodeGate({ children }: Props) {
  const [unlocked, setUnlocked] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setUnlocked(true)
    }
    setReady(true)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setChecking(true)
    setError('')
    const valid = await checkPasscode(input)
    if (valid) {
      localStorage.setItem(STORAGE_KEY, input)
      setUnlocked(true)
    } else {
      setError('Incorrect passcode')
    }
    setChecking(false)
  }

  // Avoid flash of gate on page load when already unlocked
  if (!ready) return null

  if (unlocked) return <>{children}</>

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Milestone Mission Control</h1>
          <p className="text-sm text-muted-foreground">Enter your passcode to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="passcode">Passcode</Label>
            <Input
              id="passcode"
              type="password"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <Button type="submit" className="w-full" disabled={checking}>
            {checking ? 'Checking…' : 'Unlock'}
          </Button>
        </form>
      </div>
    </div>
  )
}
