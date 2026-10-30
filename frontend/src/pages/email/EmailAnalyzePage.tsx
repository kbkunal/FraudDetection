import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, AlertCircle } from 'lucide-react'
import { emailApi } from '../../lib/api'

export function EmailAnalyzePage() {
  const navigate = useNavigate()
  const [fromAddress, setFromAddress] = useState('')
  const [replyTo, setReplyTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [claimedOrg, setClaimedOrg] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSample = (sampleType: string) => {
    if (sampleType === 'sbi') {
      setFromAddress('security@sbi-alerts.xyz')
      setReplyTo('support@sbibank-secure.net')
      setSubject('Action Required: Verify Your SBI Account Within 24 Hours')
      setBody('Dear Customer, Your SBI account requires immediate KYC verification. Click here to confirm your internet banking credentials: http://sbi-kyc-update.xyz. Failure to do so will result in permanent account suspension.')
      setClaimedOrg('State Bank of India')
    } else if (sampleType === 'bec') {
      setFromAddress('cfo-office@vendor-company.com.frauddomain.net')
      setReplyTo('payments@overseas-vendor-bank.com')
      setSubject('URGENT: Updated Bank Coordinates for Invoice #INV-2024-91')
      setBody('Hi Accounts Team, Please note our primary bank account has changed due to an annual audit. Please execute the wire transfer of Rs 8,50,000 to the new account coordinates detailed below.')
      setClaimedOrg('Corporate Vendor')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromAddress || !subject || !body) {
      setError('From address, Subject, and Body are required.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res: any = await emailApi.analyze({
        from_address: fromAddress,
        reply_to: replyTo || undefined,
        subject,
        body,
        claimed_org: claimedOrg || undefined,
      })
      if (res && res.analysis_run_id) {
        navigate(`/email-fraud/results/${res.analysis_run_id}`, { state: { result: res } })
      } else {
        setError('Analysis returned without an identifier.')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Email analysis request failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 py-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/email-fraud')}
          className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
        >
          <ArrowLeft size={13} /> Back to Email Overview
        </button>
      </div>

      <div className="border-b border-neutral-100 pb-4">
        <h1 className="text-xl font-bold text-neutral-900">Manual Email Analysis</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Evaluate sender domain similarity, Reply-To mismatches, and phishing patterns from manual text fields.
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
          onClick={() => loadSample('sbi')}
          className="px-2 py-1 bg-white border border-neutral-200 hover:border-brand-500 text-neutral-700 rounded-sm"
        >
          Lookalike Domain (SBI Phish)
        </button>
        <button
          type="button"
          onClick={() => loadSample('bec')}
          className="px-2 py-1 bg-white border border-neutral-200 hover:border-brand-500 text-neutral-700 rounded-sm"
        >
          BEC Wire Transfer / Invoice Scams
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-neutral-700 block">From Address / Sender Header *</label>
            <input
              type="text"
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
              placeholder="e.g. security@sbi-alerts.xyz"
              required
              className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-neutral-700 block">Reply-To Address (If Different)</label>
            <input
              type="text"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              placeholder="e.g. collector@scam-mail.com"
              className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-neutral-700 block">Subject Line *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
              required
              className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-neutral-700 block">Claimed Organization (Optional)</label>
            <input
              type="text"
              value={claimedOrg}
              onChange={(e) => setClaimedOrg(e.target.value)}
              placeholder="e.g. HDFC Bank, Income Tax Dept"
              className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-700 block">Email Body Text *</label>
          <textarea
            rows={7}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Paste raw email message body text here..."
            required
            className="w-full px-3 py-2 border border-neutral-200 rounded-sm text-xs font-mono focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-[11px] text-neutral-400">
            Manual input cannot evaluate SPF or DKIM signatures.
          </span>
          <button
            type="submit"
            disabled={loading || !fromAddress || !subject || !body}
            className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-neutral-300 text-white font-semibold text-xs rounded-sm transition-colors"
          >
            {loading ? 'Forensically Analyzing...' : 'Analyze Email'}
          </button>
        </div>
      </form>
    </div>
  )
}
