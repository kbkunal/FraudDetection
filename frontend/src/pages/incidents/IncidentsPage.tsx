import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, Plus, ArrowRight, Clock, ShieldAlert, AlertCircle } from 'lucide-react'
import { incidentApi, Incident } from '../../lib/api'

export function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [title, setTitle] = useState('')
  const [incidentType, setIncidentType] = useState('UPI Financial Fraud')
  const [narrative, setNarrative] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchIncidents = () => {
    setLoading(true)
    incidentApi.get()
      .then((data: any) => setIncidents(Array.isArray(data) ? data : []))
      .catch(() => setIncidents([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchIncidents()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      await incidentApi.create({
        title,
        incident_type: incidentType,
        narrative,
      })
      setShowCreateModal(false)
      setTitle('')
      setNarrative('')
      fetchIncidents()
    } catch {
      alert('Failed to create incident workspace.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-100 pb-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Incident Workspaces</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Centrally manage digital fraud dossiers, link cross-module analysis outputs, and track evidence timelines.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-sm transition-colors"
        >
          <Plus size={14} />
          Create Incident Workspace
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-neutral-400">Loading incidents...</div>
      ) : incidents.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white border border-neutral-100 rounded-sm">
          <FolderOpen size={36} className="mx-auto text-neutral-300" />
          <h3 className="text-sm font-semibold text-neutral-700">No Incidents Created Yet</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Create an incident workspace when you need to combine an SMS smishing record, a fraudulent UPI transaction, and evidence notes into one report.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium rounded-sm transition-colors"
          >
            <Plus size={14} />
            Create Workspace
          </button>
        </div>
      ) : (
        <div className="bg-white border border-neutral-100 rounded-sm divide-y divide-neutral-100">
          {incidents.map((inc) => (
            <div key={inc.id} className="p-4 hover:bg-neutral-50 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-900">{inc.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-neutral-100 text-neutral-700 uppercase font-semibold">
                    {inc.status || 'OPEN'}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Type: {inc.incident_type || inc.type}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 line-clamp-1">{inc.narrative || 'No description entered'}</p>
              </div>
              <Link
                to={`/incidents/${inc.id}`}
                className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
              >
                Open Workspace <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-neutral-200 rounded-sm p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-neutral-900">New Incident Workspace</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Incident Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unauthorized UPI Debit Following Fake Bank SMS"
                  required
                  className="w-full px-2.5 py-1.5 bg-white text-neutral-900 placeholder:text-neutral-400 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Incident Category *</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm bg-white text-neutral-900 focus:outline-none focus:border-brand-500"
                >
                  <option value="UPI Financial Fraud">UPI Financial Fraud</option>
                  <option value="Banking Phishing">Banking Phishing</option>
                  <option value="Digital Arrest Intimidation">Digital Arrest Intimidation</option>
                  <option value="Fake KYC Account Block">Fake KYC Account Block</option>
                  <option value="Credit / Debit Card Fraud">Credit / Debit Card Fraud</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Initial Narrative / Summary</label>
                <textarea
                  rows={3}
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder="Summary of what occurred and approximate timeline..."
                  className="w-full px-2.5 py-1.5 bg-white text-neutral-900 placeholder:text-neutral-400 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 border border-neutral-200 hover:border-neutral-300 text-neutral-700 rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 disabled:bg-neutral-300 text-white font-semibold rounded-sm"
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
