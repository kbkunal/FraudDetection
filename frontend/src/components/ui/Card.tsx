import React, { ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  title?: string
  subtitle?: string
  actions?: ReactNode
  className?: string
  bodyClassName?: string
  noPadding?: boolean
}

export function Card({
  children, title, subtitle, actions, className, bodyClassName, noPadding = false
}: CardProps) {
  return (
    <div className={clsx('bg-white border border-neutral-100 rounded-sm', className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between px-5 py-4 border-b border-neutral-100">
          <div>
            {title && <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>}
            {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0 ml-4">{actions}</div>}
        </div>
      )}
      <div className={clsx(!noPadding && 'px-5 py-4', bodyClassName)}>
        {children}
      </div>
    </div>
  )
}

// Stat card for dashboard
interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  change?: string
  className?: string
}

export function StatCard({ label, value, icon, change, className }: StatCardProps) {
  return (
    <div className={clsx('bg-white border border-neutral-100 rounded-sm px-5 py-4', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">{value}</p>
          {change && <p className="mt-1 text-xs text-neutral-500">{change}</p>}
        </div>
        {icon && (
          <div className="p-2 bg-brand-50 rounded-sm text-brand-500">{icon}</div>
        )}
      </div>
    </div>
  )
}

export default Card
