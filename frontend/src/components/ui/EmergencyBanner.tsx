import React from 'react'
import { Phone, ExternalLink, AlertTriangle } from 'lucide-react'

export function EmergencyBanner() {
  return (
    <div className="bg-red-600 text-white" role="alert" aria-live="assertive">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-wrap items-start gap-3">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              If you have lost money to cyber fraud: Call{' '}
              <a href="tel:1930" className="underline font-bold text-white hover:text-red-100">
                1930
              </a>{' '}
              immediately — National Cyber Crime Financial Helpline
            </p>
            <div className="flex flex-wrap gap-4 mt-2 text-xs">
              <a
                href="tel:1930"
                className="flex items-center gap-1 underline hover:text-red-100 font-medium"
              >
                <Phone size={13} /> Call 1930
              </a>
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 underline hover:text-red-100 font-medium"
              >
                <ExternalLink size={13} /> cybercrime.gov.in
              </a>
              <a
                href="tel:112"
                className="flex items-center gap-1 underline hover:text-red-100 font-medium"
              >
                <Phone size={13} /> 112 (Emergency)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmergencyBanner
