import React from 'react'
import { SeverityBadge } from './Badge'
import { Indicator } from '../../lib/api'
import clsx from 'clsx'

interface IndicatorCardProps {
  indicator: Indicator
  className?: string
}

const severityBorder: Record<string, string> = {
  CRITICAL: 'border-l-red-500',
  HIGH:     'border-l-orange-400',
  MEDIUM:   'border-l-amber-400',
  LOW:      'border-l-brand-400',
  INFO:     'border-l-neutral-300',
}

export function IndicatorCard({ indicator, className }: IndicatorCardProps) {
  const borderColor = severityBorder[indicator.severity] ?? 'border-l-neutral-300'

  return (
    <div
      className={clsx(
        'bg-white border border-neutral-100 rounded-sm border-l-4 px-5 py-4',
        borderColor,
        className
      )}
    >
      <div className="flex flex-wrap items-start gap-3 mb-2">
        <SeverityBadge severity={indicator.severity} />
        <span className="text-xs font-mono text-neutral-500 bg-neutral-50 border border-neutral-100 px-2 py-0.5 rounded-sm">
          {indicator.code}
        </span>
        {indicator.type && (
          <span className="text-xs font-medium text-neutral-500">{indicator.type}</span>
        )}
      </div>

      <p className="text-sm text-neutral-800 leading-relaxed">{indicator.explanation}</p>

      {indicator.evidence && (
        <div className="mt-3 pt-3 border-t border-neutral-100">
          <p className="text-xs font-medium text-neutral-500 mb-1">Evidence reference</p>
          <p className="text-xs text-neutral-600 font-mono break-all">{indicator.evidence}</p>
        </div>
      )}

      {indicator.detection_method && (
        <div className="mt-2">
          <span className="text-xs text-neutral-400">Detection method: </span>
          <span className="text-xs text-neutral-600">{indicator.detection_method}</span>
        </div>
      )}

      <p className="mt-3 text-xs text-neutral-400 italic">
        Note: This indicator reflects a pattern that warrants review. It does not establish that fraud has occurred.
      </p>
    </div>
  )
}

export default IndicatorCard
