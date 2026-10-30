import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckSquare, Square, FileText, AlertCircle, Shield } from 'lucide-react'

interface CheckItem {
  id: string
  title: string
  details: string
  category: string
}

const DEFAULT_ITEMS: CheckItem[] = [
  { id: '1', title: '12-Digit Transaction Reference (UTR)', details: 'Found in payment confirmation SMS or UPI app receipt details.', category: 'UPI & Banking' },
  { id: '2', title: 'Bank Account Statement (PDF)', details: 'Download official statement highlighting unauthorized debit entries, timestamp, and balance.', category: 'UPI & Banking' },
  { id: '3', title: 'Payment Receipt Screenshots', details: 'Full uncropped screenshot showing recipient VPA/account and timestamp.', category: 'UPI & Banking' },
  { id: '4', title: 'Original SMS / WhatsApp Messages', details: 'Preserve complete message thread. Do not delete fraudulent chats.', category: 'Communications' },
  { id: '5', title: 'Caller Phone Numbers & Call History', details: 'Take screenshots of call log entries showing incoming scam numbers and call duration.', category: 'Communications' },
  { id: '6', title: 'Raw Email .EML File with Full Headers', details: 'Download message as .eml to preserve Authentication-Results and routing hops.', category: 'Email & Web' },
  { id: '7', title: 'Phishing Portal URL & Browser Screenshots', details: 'Copy exact link address and capture screenshot showing browser URL bar.', category: 'Email & Web' },
  { id: '8', title: 'Fake Letters, Arrest Warrants, or Notices', details: 'Preserve original image files of fake CBI/Police/Court documents sent via chat.', category: 'Digital Arrest' },
  { id: '9', title: 'Bank Dispute Reference Number', details: 'Reference ID issued when you reported the fraud to your bank branch or hotline.', category: 'Official Logs' },
]

export function EvidencePage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const completedCount = Object.values(checked).filter(Boolean).length

  return (
    <div className="space-y-6 py-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Link to="/help" className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1">
          <ArrowLeft size={13} /> Back to Help Centre
        </Link>
      </div>

      <div className="border-b border-neutral-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Evidence Preservation Checklist</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Track artifacts you have preserved in browser memory. Checklist completion is <b>not</b> required prior to calling 1930.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold rounded-sm font-mono shrink-0">
          Preserved: {completedCount} / {DEFAULT_ITEMS.length}
        </div>
      </div>

      <div className="space-y-3">
        {DEFAULT_ITEMS.map((item) => {
          const isDone = !!checked[item.id]
          return (
            <div
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`p-4 rounded-sm border cursor-pointer select-none transition-colors flex items-start gap-3 ${isDone ? 'bg-brand-50/40 border-brand-200' : 'bg-white border-neutral-200 hover:border-neutral-300'}`}
            >
              <button
                type="button"
                className="mt-0.5 text-brand-600 focus:outline-none"
              >
                {isDone ? <CheckSquare size={16} /> : <Square size={16} className="text-neutral-400" />}
              </button>
              <div className="space-y-0.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${isDone ? 'text-brand-900 line-through' : 'text-neutral-900'}`}>
                    {item.title}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">[{item.category}]</span>
                </div>
                <p className="text-neutral-500 leading-relaxed">{item.details}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-sm flex justify-between items-center text-xs">
        <span className="text-neutral-500">Ready to synthesize your facts into a document?</span>
        <Link
          to="/help/incident-summary"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-sm transition-colors"
        >
          <FileText size={13} />
          Generate Incident Summary PDF
        </Link>
      </div>
    </div>
  )
}
