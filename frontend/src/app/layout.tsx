import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import PasscodeGate from '@/components/PasscodeGate'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Milestone Mission Control',
  description: 'Risk-aware waterfall tracker for life milestones',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="flex h-full overflow-hidden bg-background text-foreground antialiased">
        <PasscodeGate>
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
        </PasscodeGate>
      </body>
    </html>
  )
}
