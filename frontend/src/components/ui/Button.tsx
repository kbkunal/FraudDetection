import React, { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  children?: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-white border border-brand-500 hover:bg-brand-600 hover:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
  secondary:
    'bg-white text-neutral-700 border border-neutral-100 hover:bg-neutral-50 hover:border-neutral-200 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
  danger:
    'bg-red-600 text-white border border-red-600 hover:bg-red-700 hover:border-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2',
  ghost:
    'bg-transparent text-neutral-600 border border-transparent hover:bg-neutral-50 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs font-medium gap-1.5',
  md: 'px-4 py-2 text-sm font-medium gap-2',
  lg: 'px-5 py-2.5 text-base font-medium gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      className={clsx(
        'inline-flex items-center justify-center rounded-sm transition-colors duration-150 select-none',
        variantClasses[variant],
        sizeClasses[size],
        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}

export default Button
