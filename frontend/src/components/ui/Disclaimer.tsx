import React from 'react'
import { AlertCircle } from 'lucide-react'

const LIMITATIONS = [
  'This analysis is based on pattern detection and heuristic rules, not direct access to bank or payment system records.',
  'A UTR number or UPI transaction reference alone cannot verify whether a transaction occurred or was fraudulent.',
  'Analysis results do not constitute legal evidence or an official finding of fraud.',
  'No personal data (UPI PIN, OTP, password, CVV, card number) was or should be submitted.',
  'The system cannot access RBI, NPCI, bank, or law enforcement databases.',
  'Results may include false positives (patterns that appear suspicious but are benign) and may miss fraudulent transactions.',
  'Do not use this report as a substitute for filing a complaint with the National Cyber Crime Reporting Portal (cybercrime.gov.in) or calling 1930.',
]

interface DisclaimerProps {
  additional?: string[]
  limitations?: string[]
  className?: string
}

export function Disclaimer({ additional, limitations, className }: DisclaimerProps) {
  const all = limitations || (additional ? [...LIMITATIONS, ...additional] : LIMITATIONS)
  return (
    <div className={`border border-neutral-200 rounded-sm bg-neutral-50 px-5 py-4 ${className ?? ''}`}>
      <div className="flex items-start gap-2 mb-3">
        <AlertCircle size={16} className="text-neutral-500 mt-0.5 shrink-0" />
        <p className="text-sm font-semibold text-neutral-700">Analysis Limitations and Disclaimers</p>
      </div>
      <ul className="space-y-1.5">
        {all.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-neutral-600">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-neutral-400 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Disclaimer
