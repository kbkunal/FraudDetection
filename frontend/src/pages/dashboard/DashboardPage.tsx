import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CreditCard,
  MessageSquare,
  Mail,
  FolderOpen,
  ArrowRight,
  Clock,
  ShieldAlert,
  FileText,
  AlertCircle,
  Plus,
} from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { incidentApi, Incident } from '../../lib/api'

export function DashboardPage() {
  const { user } = useAuth()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    incidentApi.get()
      .then((data: any) => {
        setIncidents(Array.isArray(data) ? data : [])
      })
      .catch(() => setIncidents([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white border border-neutral-100 p-6 rounded-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Welcome, {user?.username || user?.email || 'Investigator'}</h1>
          <p className="text-xs text-neutral-500 mt-1">
            CyberShield Case Management & Investigation Workspace · Account Role: <span className="font-semibold text-brand-600 uppercase">{user?.role || 'User'}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/incidents"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-sm transition-colors"
          >
            <Plus size={14} />
            New Incident Workspace
          </Link>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/upi-fraud"
          className="border border-neutral-100 bg-white p-5 rounded-sm hover:border-brand-400 transition-colors group block space-y-3"
        >
          <div className="flex justify-between items-center">
            <div className="w-8 h-8 rounded-sm bg-brand-50 text-brand-600 flex items-center justify-center">
              <CreditCard size={18} />
            </div>
            <ArrowRight size={14} className="text-neutral-400 group-hover:text-brand-600 transition-colors" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">UPI Fraud Detection</h3>
            <p className="text-xs text-neutral-500 mt-1">Manual entry or CSV upload with velocity & relationship graphs.</p>
          </div>
        </Link>

        <Link
          to="/message-fraud"
          className="border border-neutral-100 bg-white p-5 rounded-sm hover:border-brand-400 transition-colors group block space-y-3"
        >
          <div className="flex justify-between items-center">
            <div className="w-8 h-8 rounded-sm bg-brand-50 text-brand-600 flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
            <ArrowRight size={14} className="text-neutral-400 group-hover:text-brand-600 transition-colors" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Message Smishing Scanner</h3>
            <p className="text-xs text-neutral-500 mt-1">Evaluate SMS & WhatsApp for banking impersonation & fake KYC threats.</p>
          </div>
        </Link>

        <Link
          to="/email-fraud"
          className="border border-neutral-100 bg-white p-5 rounded-sm hover:border-brand-400 transition-colors group block space-y-3"
        >
          <div className="flex justify-between items-center">
            <div className="w-8 h-8 rounded-sm bg-brand-50 text-brand-600 flex items-center justify-center">
              <Mail size={18} />
            </div>
            <ArrowRight size={14} className="text-neutral-400 group-hover:text-brand-600 transition-colors" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Email Phishing & BEC</h3>
            <p className="text-xs text-neutral-500 mt-1">Parse .EML headers, verify lookalike domains, and examine attachments.</p>
          </div>
        </Link>
      </div>

      {/* Incident Workspaces */}
      <div className="bg-white border border-neutral-100 rounded-sm">
        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Your Incident Workspaces</h2>
            <p className="text-xs text-neutral-500">Connected case dossiers with linked cross-module evidence.</p>
          </div>
          <Link to="/incidents" className="text-xs text-brand-600 font-semibold hover:underline">
            View All ({incidents.length})
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-neutral-400">Loading case records...</div>
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FolderOpen size={32} className="mx-auto text-neutral-300" />
            <h3 className="text-sm font-medium text-neutral-700">No Incidents Created Yet</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Create an incident workspace when you need to combine an SMS smishing record, a fraudulent UPI transaction, and evidence notes into one report.
            </p>
            <Link
              to="/incidents"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-sm"
            >
              <Plus size={13} />
              Create First Incident
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {incidents.slice(0, 5).map((inc) => (
              <div key={inc.id} className="p-4 hover:bg-neutral-50 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-900">{inc.title}</span>
                    <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono font-bold bg-neutral-100 text-neutral-700 rounded-sm">
                      {inc.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 line-clamp-1">{inc.narrative || 'No narrative provided'}</p>
                </div>
                <Link
                  to={`/incidents/${inc.id}`}
                  className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
                >
                  Open <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Synthetic Data & Review Notice */}
      <div className="p-4 bg-neutral-50 border border-neutral-200 text-neutral-600 text-xs rounded-sm space-y-1">
        <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
          <AlertCircle size={14} className="text-neutral-500" />
          Review Priority Indicator Notice
        </div>
        <p>
          Detection model outputs reflect pattern similarity to synthetic benchmarks and rule heuristics. Models do not establish legal proof of fraud or determine individual guilt. Always conduct thorough human review before taking investigative or dispute actions.
        </p>
      </div>
    </div>
  )
}
