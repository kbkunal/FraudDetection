import React, { useEffect, useState } from 'react'
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, LifeBuoy, AlertTriangle, CheckCircle2, ShieldAlert, Paperclip, Link as LinkIcon, ShieldCheck } from 'lucide-react'
import { emailApi } from '../../lib/api'
import { IndicatorCard } from '../../components/ui/IndicatorCard'
import { Disclaimer } from '../../components/ui/Disclaimer'

export function EmailResultsPage() {
  const { analysisId } = useParams<{ analysisId: string }>()
  const location = useLocation()
  const navigate = useNavigate()

  const [result, setResult] = useState<any>(location.state?.result || null)
  const [loading, setLoading] = useState(!location.state?.result)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!result && analysisId) {
      emailApi.getAnalysis(analysisId)
        .then((res: any) => setResult(res))
        .catch(() => setError('Unable to load email forensic analysis. Session may have expired.'))
        .finally(() => setLoading(false))
    }
  }, [analysisId, result])

  const handleDownloadPdf = async () => {
    if (!analysisId) return
    setDownloading(true)
    try {
      const response = await fetch(`/api/v1/emails/analyses/${analysisId}/report`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error()
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `cybershield-email-${analysisId.slice(0, 8)}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch {
      alert('Failed to generate email report PDF.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-xs text-neutral-500">Parsing and evaluating headers...</div>
  }

  if (error || !result) {
    return (
      <div className="py-12 text-center space-y-4">
        <AlertTriangle size={32} className="mx-auto text-amber-500" />
        <h2 className="text-sm font-bold text-neutral-800">Analysis Record Unavailable</h2>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto">{error || 'No analysis data found.'}</p>
        <Link to="/email-fraud" className="text-xs text-brand-600 font-semibold hover:underline">
          Return to Email Module
        </Link>
      </div>
    )
  }

  const sender = result.sender_analysis || {}
  const auth = result.auth_results || {}
  const indicators = result.content_indicators || []
  const urls = result.urls || []
  const attachments = result.attachments || []
  const isHighRisk = result.overall_assessment === 'high_risk'
  const isMediumRisk = result.overall_assessment === 'medium_risk'

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/email-fraud')}
              className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
            >
              <ArrowLeft size={13} /> Email Overview
            </button>
            <span className="text-neutral-300">/</span>
            <span className="text-xs font-mono text-neutral-500">ID: {analysisId?.slice(0, 8)}</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900">Email Forensic Findings</h1>
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

      {/* Assessment Banner */}
      <div className={`p-4 rounded-sm border ${isHighRisk ? 'bg-red-50 border-red-200 text-red-900' : isMediumRisk ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-neutral-50 border-neutral-200 text-neutral-800'}`}>
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-1">
          {isHighRisk || isMediumRisk ? <ShieldAlert size={15} /> : <CheckCircle2 size={15} className="text-green-600" />}
          <span>Overall Assessment: {result.overall_assessment?.replace('_', ' ').toUpperCase()}</span>
        </div>
        <p className="text-xs leading-relaxed opacity-90">
          Sender: <span className="font-mono">{sender.from_address || 'N/A'}</span>. {sender.lookalike_domain_detected ? '⚠️ Lookalike typo-squatted domain detected.' : 'No typo-squatting detected against known banking institutions.'}
        </p>
      </div>

      {/* Technical Forensic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Domain Analysis */}
        <div className="bg-white border border-neutral-100 p-5 rounded-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Sender & Domain Analysis</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-neutral-50">
              <span className="text-neutral-500">From Address:</span>
              <span className="font-mono text-neutral-800">{sender.from_address || '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-50">
              <span className="text-neutral-500">Reply-To Address:</span>
              <span className="font-mono text-neutral-800">{sender.reply_to || 'None'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-50">
              <span className="text-neutral-500">Reply-To Mismatch:</span>
              <span className={sender.reply_to_mismatch ? 'font-bold text-red-600' : 'text-neutral-600'}>
                {sender.reply_to_mismatch ? 'YES (Diversion Flag)' : 'No'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-neutral-500">Lookalike Domain:</span>
              <span className={sender.lookalike_domain_detected ? 'font-bold text-red-600' : 'text-green-700'}>
                {sender.lookalike_domain_detected ? `DETECTED (${sender.lookalike_similarity}%)` : 'None detected'}
              </span>
            </div>
          </div>
          {sender.notes && sender.notes.length > 0 && (
            <div className="p-2.5 bg-neutral-50 border border-neutral-100 rounded-sm text-[11px] text-neutral-600 space-y-1">
              {sender.notes.map((n: string, i: number) => (
                <div key={i}>• {n}</div>
              ))}
            </div>
          )}
        </div>

        {/* Authentication Headers */}
        <div className="bg-white border border-neutral-100 p-5 rounded-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Authentication Headers</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-sm">
              <div className="text-[10px] text-neutral-400 font-semibold uppercase">SPF</div>
              <div className={`text-xs font-bold mt-1 ${auth.spf === 'pass' ? 'text-green-600' : auth.spf === 'fail' ? 'text-red-600' : 'text-neutral-500'}`}>
                {auth.spf?.toUpperCase()}
              </div>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-sm">
              <div className="text-[10px] text-neutral-400 font-semibold uppercase">DKIM</div>
              <div className={`text-xs font-bold mt-1 ${auth.dkim === 'pass' ? 'text-green-600' : auth.dkim === 'fail' ? 'text-red-600' : 'text-neutral-500'}`}>
                {auth.dkim?.toUpperCase()}
              </div>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-sm">
              <div className="text-[10px] text-neutral-400 font-semibold uppercase">DMARC</div>
              <div className={`text-xs font-bold mt-1 ${auth.dmarc === 'pass' ? 'text-green-600' : auth.dmarc === 'fail' ? 'text-red-600' : 'text-neutral-500'}`}>
                {auth.dmarc?.toUpperCase()}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-neutral-500 italic pt-1">
            {auth.provenance_note}
          </p>
        </div>
      </div>

      {/* Attachments Inspection */}
      {attachments.length > 0 && (
        <div className="bg-white border border-neutral-100 p-5 rounded-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
            <Paperclip size={14} className="text-brand-500" /> Attachments Forensic Metadata ({attachments.length})
          </h3>
          <div className="divide-y divide-neutral-100 text-xs">
            {attachments.map((att: any, i: number) => (
              <div key={i} className="py-2.5 flex justify-between items-center">
                <div className="space-y-0.5">
                  <div className="font-semibold text-neutral-900">{att.filename}</div>
                  <div className="font-mono text-[11px] text-neutral-400">SHA-256: {att.sha256_hash}</div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase ${att.reputation_status === 'high_risk' ? 'bg-red-100 text-red-800' : 'bg-neutral-100 text-neutral-600'}`}>
                    {att.reputation_status}
                  </span>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{(att.file_size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Indicators */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Triggered Phishing Indicators ({indicators.length})</h2>
        {indicators.length === 0 ? (
          <div className="p-6 bg-white border border-neutral-100 rounded-sm text-center text-xs text-neutral-500">
            No explicit phishing rules were triggered.
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

      <Disclaimer
        limitations={[
          'A passing SPF, DKIM, or DMARC record does not prove benign intent; threat actors routinely authenticate domains they control.',
          'CyberShield inspects attachment hashes and metadata; attachments are never executed in a sandbox environment.',
          'Manual form inputs cannot evaluate cryptographic signatures or intermediate relay hops.',
        ]}
      />
    </div>
  )
}
