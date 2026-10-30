import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  FolderOpen,
  Plus,
  Trash2,
  FileText,
  Clock,
  Link as LinkIcon,
  ShieldAlert,
  Download,
  AlertTriangle,
} from 'lucide-react'
import { incidentApi, Incident } from '../../lib/api'

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [incident, setIncident] = useState<any>(null)
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'analyses' | 'evidence' | 'timeline'>('overview')

  // Link analysis state
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [analysisRunId, setAnalysisRunId] = useState('')
  const [moduleType, setModuleType] = useState('upi')
  const [consentGiven, setConsentGiven] = useState(false)
  const [linking, setLinking] = useState(false)

  const fetchIncidentData = () => {
    if (!id) return
    setLoading(true)
    Promise.all([
      incidentApi.get(id),
      fetch(`/api/v1/incidents/${id}/links`).then(r => r.json()),
    ])
      .then(([incData, linkData]: any) => {
        setIncident(incData)
        if (linkData?.data) setLinks(linkData.data)
      })
      .catch(() => navigate('/incidents'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchIncidentData()
  }, [id])

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this incident workspace?')) return
    try {
      await incidentApi.delete(id)
      navigate('/incidents')
    } catch {
      alert('Failed to delete incident.')
    }
  }

  const handleLinkAnalysis = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !analysisRunId.trim()) return
    if (!consentGiven) {
      alert('Explicit consent is required to link an analysis run to this incident workspace.')
      return
    }

    setLinking(true)
    try {
      const res = await fetch(`/api/v1/incidents/${id}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_run_id: analysisRunId.trim(),
          module_type: moduleType,
          consent_given: true,
        }),
      })
      if (!res.ok) throw new Error()
      setShowLinkModal(false)
      setAnalysisRunId('')
      setConsentGiven(false)
      fetchIncidentData()
    } catch {
      alert('Failed to link analysis. Ensure the Analysis Run ID is valid.')
    } finally {
      setLinking(false)
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-xs text-neutral-400">Loading incident workspace...</div>
  }

  if (!incident) return null

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/incidents')}
              className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
            >
              <ArrowLeft size={13} /> Incidents
            </button>
            <span className="text-neutral-300">/</span>
            <span className="text-xs font-mono text-neutral-500">ID: {incident.id?.slice(0, 8)}</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900">{incident.title}</h1>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span>Type: <b className="text-neutral-800">{incident.incident_type || incident.type}</b></span>
            <span>•</span>
            <span>Status: <b className="text-neutral-800 uppercase">{incident.status}</b></span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowLinkModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-sm transition-colors"
          >
            <LinkIcon size={13} /> Link Analysis Run
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-sm transition-colors"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-neutral-200 text-xs font-semibold text-neutral-600">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 border-b-2 transition-colors ${activeTab === 'overview' ? 'border-brand-500 text-brand-600' : 'border-transparent hover:text-neutral-900'}`}
        >
          Overview & Narrative
        </button>
        <button
          onClick={() => setActiveTab('analyses')}
          className={`pb-2 border-b-2 transition-colors ${activeTab === 'analyses' ? 'border-brand-500 text-brand-600' : 'border-transparent hover:text-neutral-900'}`}
        >
          Connected Analyses ({links.length})
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-2 border-b-2 transition-colors ${activeTab === 'timeline' ? 'border-brand-500 text-brand-600' : 'border-transparent hover:text-neutral-900'}`}
        >
          Audit Timeline
        </button>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white border border-neutral-100 p-6 rounded-sm space-y-4">
            <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Victim Narrative</h2>
            <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-line">
              {incident.narrative || 'No narrative has been logged for this incident.'}
            </p>
          </div>

          <div className="bg-neutral-50 p-4 border border-neutral-100 rounded-sm space-y-2 text-xs">
            <h3 className="font-bold text-neutral-900">Cross-Module Integration Principles</h3>
            <p className="text-neutral-600 leading-relaxed">
              When linking multiple modules (e.g. an SMS scan and a UPI transaction record), CyberShield preserves the original evidence and automated indicators separately from the user statement. CyberShield does not infer causality solely because two events occurred during the same timeframe.
            </p>
          </div>
        </div>
      )}

      {/* Tab: Analyses */}
      {activeTab === 'analyses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Linked Module Analyses</h2>
            <button
              onClick={() => setShowLinkModal(true)}
              className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
            >
              <Plus size={13} /> Link Another Analysis
            </button>
          </div>

          {links.length === 0 ? (
            <div className="p-8 bg-white border border-neutral-100 rounded-sm text-center text-xs text-neutral-400">
              No analysis runs linked to this incident yet. Click "Link Analysis Run" to connect a UPI or Message result.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 bg-white border border-neutral-100 rounded-sm text-xs">
              {links.map((link) => (
                <div key={link.id} className="p-4 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-neutral-900 uppercase tracking-wider text-[11px]">
                      Module: {link.module_type}
                    </div>
                    <div className="font-mono text-neutral-500 text-[11px]">
                      Run ID: {link.analysis_run_id}
                    </div>
                    <div className="text-[10px] text-green-700 font-semibold">
                      ✓ Consented cross-module link established at {new Date(link.link_created_at).toLocaleString()}
                    </div>
                  </div>
                  <Link
                    to={link.module_type === 'upi' ? `/upi-fraud/results/${link.analysis_run_id}` : link.module_type === 'email' ? `/email-fraud/results/${link.analysis_run_id}` : `/message-fraud/results/${link.analysis_run_id}`}
                    className="text-xs font-semibold text-brand-600 hover:underline"
                  >
                    View Result
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-white border border-neutral-100 p-6 rounded-sm space-y-4">
          <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Audit & Activity Log</h2>
          <div className="space-y-3 text-xs border-l-2 border-neutral-200 pl-4">
            <div className="space-y-1">
              <div className="font-semibold text-neutral-900">Incident Workspace Created</div>
              <div className="text-neutral-400 font-mono text-[10px]">{new Date(incident.created_at).toLocaleString()}</div>
            </div>
            {links.map((l) => (
              <div key={l.id} className="space-y-1">
                <div className="font-semibold text-neutral-900">Analysis Linked: {l.module_type.toUpperCase()} ({l.analysis_run_id.slice(0, 8)})</div>
                <div className="text-neutral-400 font-mono text-[10px]">{new Date(l.link_created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-neutral-200 rounded-sm p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-neutral-900">Link Analysis Run to Incident</h3>
            <p className="text-xs text-neutral-500">
              Enter the UUID of a completed analysis run from any scanner module.
            </p>
            <form onSubmit={handleLinkAnalysis} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Module Type *</label>
                <select
                  value={moduleType}
                  onChange={(e) => setModuleType(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm bg-white"
                >
                  <option value="upi">UPI Transaction Module</option>
                  <option value="message">Message Smishing Module</option>
                  <option value="email">Email Phishing Module</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Analysis Run UUID *</label>
                <input
                  type="text"
                  value={analysisRunId}
                  onChange={(e) => setAnalysisRunId(e.target.value)}
                  placeholder="e.g. 2cf8f101-8b16-423c-999f-b2d5158a158e"
                  required
                  className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm font-mono text-[11px]"
                />
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-sm space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="text-[11px] text-neutral-700 leading-tight">
                    I explicitly consent to connecting this analysis result to this incident workspace for evidence collation.
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-3 py-1.5 border border-neutral-200 text-neutral-700 rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linking || !analysisRunId.trim() || !consentGiven}
                  className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 disabled:bg-neutral-300 text-white font-semibold rounded-sm"
                >
                  {linking ? 'Linking...' : 'Connect Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
