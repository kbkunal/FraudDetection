import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare, AlertCircle, ShieldAlert } from 'lucide-react'
import { messageApi } from '../../lib/api'

export function MessageAnalyzePage() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [sourceApp, setSourceApp] = useState('SMS')
  const [senderId, setSenderId] = useState('')
  const [language, setLanguage] = useState('en')
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSample = (sampleType: string) => {
    if (sampleType === 'kyc') {
      setText('Dear Customer, Your SBI account will be blocked in 24 hours due to incomplete KYC. Update immediately at http://sbi-kyc-update.xyz to avoid suspension. Call 9876543210')
      setSenderId('AD-SBIBNK')
      setSourceApp('SMS')
    } else if (sampleType === 'digital_arrest') {
      setText('CBI NOTICE: Your phone number is linked to financial money laundering and customs contraband. You are placed under digital arrest. Pay settlement fine Rs 50000 via UPI to prevent police dispatch.')
      setSenderId('+919876500000')
      setSourceApp('WhatsApp')
    } else if (sampleType === 'upi') {
      setText('Refund of Rs 2,500 has been initiated for your cancelled order. Click to accept: http://gpay-refund.xyz/accept. Enter your UPI PIN to claim money.')
      setSenderId('PhonePe-Refund')
      setSourceApp('SMS')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) {
      setError('Please paste or type the message text.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res: any = await messageApi.analyze({
        text,
        source: sourceApp,
        sender_id: senderId,
        language,
        context_notes: context,
      })
      if (res && res.analysis_run_id) {
        navigate(`/message-fraud/results/${res.analysis_run_id}`, { state: { result: res } })
      } else {
        setError('Analysis returned without an identifier.')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Message analysis request failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 py-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/message-fraud')}
          className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
        >
          <ArrowLeft size={13} /> Back to Message Overview
        </button>
      </div>

      <div className="border-b border-neutral-100 pb-4">
        <h1 className="text-xl font-bold text-neutral-900">Scan Suspicious Text Message</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Paste SMS, WhatsApp, or Telegram message content for pattern heuristics, defanged URL reputation, and smishing classification.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Preset Samples */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-neutral-600">Load Sample Test:</span>
        <button
          type="button"
          onClick={() => loadSample('kyc')}
          className="px-2 py-1 bg-white border border-neutral-200 hover:border-brand-500 text-neutral-700 rounded-sm"
        >
          Fake KYC SMS
        </button>
        <button
          type="button"
          onClick={() => loadSample('digital_arrest')}
          className="px-2 py-1 bg-white border border-neutral-200 hover:border-brand-500 text-neutral-700 rounded-sm"
        >
          Digital Arrest Threat
        </button>
        <button
          type="button"
          onClick={() => loadSample('upi')}
          className="px-2 py-1 bg-white border border-neutral-200 hover:border-brand-500 text-neutral-700 rounded-sm"
        >
          UPI PIN Scam
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-700 block">Message Body *</label>
          <textarea
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste complete message body text here..."
            required
            className="w-full px-3 py-2 bg-white text-neutral-900 placeholder:text-neutral-400 border border-neutral-200 rounded-sm text-xs font-mono focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="font-semibold text-neutral-600 block mb-1">Source Application</label>
            <select
              value={sourceApp}
              onChange={(e) => setSourceApp(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm bg-white text-neutral-900 focus:outline-none focus:border-brand-500"
            >
              <option value="SMS">SMS Message</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Telegram">Telegram</option>
              <option value="Other">Other / Web Chat</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-neutral-600 block mb-1">Sender ID / Phone (Optional)</label>
            <input
              type="text"
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              placeholder="+919876543210 or AD-SBIBNK"
              className="w-full px-2.5 py-1.5 bg-white text-neutral-900 placeholder:text-neutral-400 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-600 block mb-1">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm bg-white text-neutral-900 focus:outline-none focus:border-brand-500"
            >
              <option value="en">English</option>
              <option value="hi">Hindi (हिंदी)</option>
              <option value="mr">Marathi (मराठी)</option>
              <option value="other">Other Indian Language</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-700 block">Context / Narrative (Optional)</label>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. Received right after ordering groceries online"
            className="w-full px-2.5 py-1.5 bg-white text-neutral-900 placeholder:text-neutral-400 border border-neutral-200 rounded-sm text-xs focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-[11px] text-neutral-400">
            Never submit real bank OTPs or account passwords.
          </span>
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-neutral-300 text-white font-semibold text-xs rounded-sm transition-colors"
          >
            {loading ? 'Scanning Message...' : 'Analyze Message'}
          </button>
        </div>
      </form>
    </div>
  )
}
