import React, { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

const fieldBase =
  'block w-full rounded-sm border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 ' +
  'focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 ' +
  'disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed transition-colors duration-150'

interface CommonProps {
  label?: string
  error?: string
  helper?: string
  required?: boolean
  className?: string
}

// ─── Text Input ───────────────────────────────────────────────────────────────

interface InputProps extends CommonProps, InputHTMLAttributes<HTMLInputElement> {
  id: string
}

export function Input({ id, label, error, helper, required, className, ...props }: InputProps) {
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-neutral-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={id}
        className={clsx(fieldBase, error && 'border-red-400 focus:border-red-500 focus:ring-red-500')}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!error && helper && <p className="text-xs text-neutral-500">{helper}</p>}
    </div>
  )
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends CommonProps, TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string
}

export function Textarea({ id, label, error, helper, required, className, ...props }: TextareaProps) {
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-neutral-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={id}
        className={clsx(fieldBase, 'resize-y min-h-[100px]', error && 'border-red-400')}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!error && helper && <p className="text-xs text-neutral-500">{helper}</p>}
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends CommonProps, SelectHTMLAttributes<HTMLSelectElement> {
  id: string
  children: ReactNode
}

export function Select({ id, label, error, helper, required, className, children, ...props }: SelectProps) {
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-neutral-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={id}
        className={clsx(fieldBase, 'cursor-pointer', error && 'border-red-400')}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!error && helper && <p className="text-xs text-neutral-500">{helper}</p>}
    </div>
  )
}

export default Input
