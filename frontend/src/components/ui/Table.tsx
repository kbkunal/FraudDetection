import React, { ReactNode } from 'react'
import clsx from 'clsx'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  className?: string
}

interface TableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  emptyTitle?: string
  emptyMessage?: string
  className?: string
  loading?: boolean
}

export function Table<T extends Record<string, unknown>>({
  columns, data, emptyTitle = 'No records', emptyMessage = 'No data available.', className, loading
}: TableProps<T>) {
  return (
    <div className={clsx('w-full overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-neutral-100">
        <thead className="bg-neutral-50">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={clsx(
                  'px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 bg-white">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
                  <svg className="animate-spin h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Loading…
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState title={emptyTitle} message={emptyMessage} />
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className={i % 2 === 1 ? 'bg-neutral-50/60' : 'bg-white'}>
                {columns.map(col => (
                  <td key={col.key} className={clsx('px-4 py-3 text-sm text-neutral-700', col.className)}>
                    {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

interface EmptyStateProps { title: string; message?: string; action?: ReactNode }

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-neutral-400">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
        </svg>
      </div>
      <p className="text-sm font-medium text-neutral-700">{title}</p>
      {message && <p className="text-xs text-neutral-500 mt-1 max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export default Table
