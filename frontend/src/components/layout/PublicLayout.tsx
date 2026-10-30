import React, { ReactNode } from 'react'
import { PublicHeader } from './PublicHeader'
import { PublicFooter } from './PublicFooter'

interface PublicLayoutProps {
  children: ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}

export default PublicLayout
