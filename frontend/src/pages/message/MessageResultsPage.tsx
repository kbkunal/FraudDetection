import React, { useEffect, useState } from 'react'
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, LifeBuoy, AlertTriangle, CheckCircle2, ShieldAlert, Link as LinkIcon, Phone } from 'lucide-react'
import { messageApi } from '../../lib/api'
import { IndicatorCard } from '../../components/ui/IndicatorCard'
import { Disclaimer } from '../../components/ui/Disclaimer'

export function MessageResultsPage() {
  const { analysisId } = useParams<{ analysisId: string }>()
  const location = useLocation()
  const navigate = useNavigate()

  const [result, setResult] = useState<any>(location.state?.result || null)
  const [loading, setLoading] = useState(!location.state?.result)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!result && analysisId) {
      messageApi.getAnalysis(analysisId)
        .then((res: any) => setResult(res))
        .catch(() => setError('Unable to load message analysis. Session may have expired.'))
        .finally(() => setLoading(false))
    }
  }, [analysisId, result])

  const handleDownloadPdf = async () => {
    if (!analysisId) return
    setDownloading(true)
    try {
      const response = await fetch(`/api/v1/messages/analyses/${analysisId}/report`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error()
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `cybershield-message-${analysisId.slice(0, 8)}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch {
      alert('Failed to generate message report PDF.')
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
        <Link to="/message-fraud" className="text-xs text-brand-600 font-semibold hover:underline">
          Return to Message Module
        </Link>
      </div>
    )
  }

  const indicators = result.indicators || []
  const urls = result.urls || []
  const entities = result.entities || []
  const categories = result.categories || []
  const isHighRisk = result.overall_assessment === 'high_risk'
  const isMediumRisk = result.overall_assessment === 'medium_risk'

  return (
    <div className="space-y-8 py-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/message-fraud')}
              className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
            >
              <ArrowLeft size={13} /> Message Overview
            </button>
            <span className="text-neutral-300">/</span>
            <span className="text-xs font-mono text-neutral-500">ID: {analysisId?.slice(0, 8)}</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900">Message Smishing Analysis Findings</h1>
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
          Estimated categories: <span className="font-semibold">{categories.join(', ') || 'Unclassified'}</span>. Review indicators highlight specific smishing tactics and pressure phrasing.
        </p>
      </div>

      {/* Extracted URLs & Entities */}
      {(urls.length > 0 || entities.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {urls.length > 0 && (
            <div className="bg-white border border-neutral-100 p-4 rounded-sm space-y-2">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                <LinkIcon size={14} className="text-brand-500" /> Extracted URLs (Defanged)
              </h3>
              <div className="space-y-1.5">
                {urls.map((u: any, i: number) => (
                  <div key={i} className="p-2 bg-neutral-50 border border-neutral-100 rounded-sm text-xs font-mono flex justify-between items-center">
                    <span className="truncate max-w-xs">{u.defanged_url}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-sans font-bold bg-amber-100 text-amber-800">
                      {u.reputation_status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {entities.filter((e: any) => e.entity_type === 'phone_number').length > 0 && (
            <div className="bg-white border border-neutral-100 p-4 rounded-sm space-y-2">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                <Phone size={14} className="text-brand-500" /> Extracted Contact Numbers
              </h3>
              <div className="space-y-1.5">
                {entities.filter((e: any) => e.entity_type === 'phone_number').map((p: any, i: number) => (
                  <div key={i} className="p-2 bg-neutral-50 border border-neutral-100 rounded-sm text-xs font-mono">
                    {p.value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Indicators */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Triggered Smishing Indicators ({indicators.length})</h2>
        {indicators.length === 0 ? (
          <div className="p-6 bg-white border border-neutral-100 rounded-sm text-center text-xs text-neutral-500">
            No specific smishing rules triggered. (Note: Sophisticated spear-phishing may not match standard templates.)
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

      {/* Limitations */}
      <Disclaimer
        limitations={[
          'CyberShield analyzes message content and cannot verify the true telecom originator without carrier data.',
          'Attackers frequently alter wording to bypass automated spam and smishing filters.',
          'Legitimate bank and service notifications may occasionally share vocabulary with smishing templates.',
          'Never click unverified links or share authentication codes regardless of message claims.',
        ]}
      />
    </div>
  )
}
