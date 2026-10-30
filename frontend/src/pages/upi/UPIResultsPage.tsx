import React, { useEffect, useState } from 'react'
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, LifeBuoy, AlertTriangle, FileText, CheckCircle2, ShieldAlert } from 'lucide-react'
import { upiApi, UPIAnalysisResult } from '../../lib/api'
import { IndicatorCard } from '../../components/ui/IndicatorCard'
import { Disclaimer } from '../../components/ui/Disclaimer'

export function UPIResultsPage() {
  const { analysisId } = useParams<{ analysisId: string }>()
  const location = useLocation()
  const navigate = useNavigate()

  const [result, setResult] = useState<any>(location.state?.result || null)
  const [loading, setLoading] = useState(!location.state?.result)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!result && analysisId) {
      upiApi.getAnalysis(analysisId)
        .then((res: any) => setResult(res))
        .catch(() => setError('Unable to load analysis results. The session may have expired.'))
        .finally(() => setLoading(false))
    }
  }, [analysisId, result])

  const handleDownloadPdf = async () => {
    if (!analysisId) return
    setDownloading(true)
    try {
      const blob: any = await upiApi.generateReport(analysisId)
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `cybershield-upi-${analysisId.slice(0, 8)}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch {
      alert('Failed to generate report PDF.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-xs text-neutral-500">Loading analysis findings...</div>
  }

  if (error || !result) {
    return (
      <div className="py-12 text-center space-y-4">
        <AlertTriangle size={32} className="mx-auto text-amber-500" />
        <h2 className="text-sm font-bold text-neutral-800">Analysis Record Unavailable</h2>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto">{error || 'No analysis data found.'}</p>
        <Link to="/upi-fraud" className="text-xs text-brand-600 font-semibold hover:underline">
          Return to UPI Module
        </Link>
      </div>
    )
  }

  const indicators = result.indicators || []
  const transactions = result.transactions || []
  const hasCritical = indicators.some((i: any) => i.severity?.toLowerCase() === 'critical')
  const hasHigh = indicators.some((i: any) => i.severity?.toLowerCase() === 'high')

  return (
    <div className="space-y-8 py-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/upi-fraud')}
              className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
            >
              <ArrowLeft size={13} /> UPI Overview
            </button>
            <span className="text-neutral-300">/</span>
            <span className="text-xs font-mono text-neutral-500">ID: {analysisId?.slice(0, 8)}</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900">UPI Transaction Analysis Findings</h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 hover:border-brand-500 text-neutral-700 text-xs font-semibold rounded-sm transition-colors"
          >
            <Download size={13} />
            {downloading ? 'Exporting...' : 'Export Dossier (PDF)'}
          </button>
          <Link
            to="/help"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-sm transition-colors"
          >
            <LifeBuoy size={13} />
            I Lost Money (1930 Guidance)
          </Link>
        </div>
      </div>

      {/* Summary Banner */}
      <div className={`p-4 rounded-sm border ${hasCritical ? 'bg-red-50 border-red-200 text-red-900' : hasHigh ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-neutral-50 border-neutral-200 text-neutral-800'}`}>
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-1">
          {hasCritical || hasHigh ? <ShieldAlert size={15} /> : <CheckCircle2 size={15} className="text-green-600" />}
          <span>{hasCritical ? 'High Review Priority — Anomalous Patterns Flagged' : hasHigh ? 'Medium Review Priority — Behavioral Indicators Triggered' : 'Analysis Complete — No Explicit Pattern Rule Hits'}</span>
        </div>
        <p className="text-xs leading-relaxed opacity-90">
          Evaluated {transactions.length} transaction record(s). Found {indicators.length} review indicator(s). Indicators serve as prioritization signals for manual review and do not constitute autonomous proof of guilt or fraudulent intent.
        </p>
      </div>

      {/* Indicators Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Review Indicators ({indicators.length})</h2>
        {indicators.length === 0 ? (
          <div className="p-6 bg-white border border-neutral-100 rounded-sm text-center text-xs text-neutral-500">
            No configured fraud rules or anomaly thresholds were triggered in this transaction sequence.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {indicators.map((ind: any, i: number) => (
              <IndicatorCard
                key={i}
                indicator={{
                  code: ind.code,
                  type: ind.type,
                  severity: (ind.severity || 'medium').toUpperCase() as any,
                  explanation: ind.explanation,
                  evidence: ind.evidence_reference,
                  detection_method: ind.method,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-neutral-100 rounded-sm space-y-3 p-4">
        <h2 className="text-sm font-bold text-neutral-900">Submitted Transaction Records ({transactions.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-100 text-neutral-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Reference / UTR</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Direction</th>
                <th className="py-2.5 px-3">Sender</th>
                <th className="py-2.5 px-3">Recipient</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {transactions.map((tx: any, idx: number) => (
                <tr key={idx} className="hover:bg-neutral-50">
                  <td className="py-2.5 px-3 font-mono">{tx.transaction_ref || 'N/A'}</td>
                  <td className="py-2.5 px-3 text-neutral-600">{String(tx.timestamp || '').slice(0, 16)}</td>
                  <td className="py-2.5 px-3 font-semibold text-neutral-900">INR {Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold ${tx.direction?.toUpperCase() === 'SENT' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                      {tx.direction || 'OUTGOING'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-neutral-600 font-mono">{tx.sender_upi || '—'}</td>
                  <td className="py-2.5 px-3 text-neutral-600 font-mono">{tx.recipient_upi || '—'}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">{tx.status || 'SUCCESS'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Limitations Disclaimer */}
      <Disclaimer
        limitations={[
          'A UTR alone cannot verify fraud, check bank account balances, or retrieve private NPCI logs.',
          'Isolation Forest anomaly detection flags mathematical statistical deviations, not legal culpability.',
          'High frequency transaction activity may reflect normal merchant operations during peak sale windows.',
          'CyberShield outputs require independent verification before submission to dispute arbitration.',
        ]}
      />
    </div>
  )
}
