import React from 'react'
import clsx from 'clsx'

type BadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  label: string
  className?: string
}

const variantConfig: Record<BadgeVariant, { dot: string; bg: string; text: string }> = {
  info:    { dot: 'bg-brand-500', bg: 'bg-brand-50',   text: 'text-brand-600' },
  success: { dot: 'bg-green-500', bg: 'bg-green-50',   text: 'text-green-700' },
  warning: { dot: 'bg-amber-500', bg: 'bg-amber-50',   text: 'text-amber-700' },
  danger:  { dot: 'bg-red-500',   bg: 'bg-red-50',     text: 'text-red-700'   },
  neutral: { dot: 'bg-neutral-400', bg: 'bg-neutral-100', text: 'text-neutral-600' },
}

export function Badge({ variant = 'neutral', label, className }: BadgeProps) {
  const { dot, bg, text } = variantConfig[variant]
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-medium',
        bg, text, className
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
      {label}
    </span>
  )
}

// Severity badge helper
export function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, BadgeVariant> = {
    CRITICAL: 'danger',
    HIGH:     'danger',
    MEDIUM:   'warning',
    LOW:      'info',
    INFO:     'neutral',
  }
  return <Badge variant={map[severity] ?? 'neutral'} label={severity} />
}

export default Badge
