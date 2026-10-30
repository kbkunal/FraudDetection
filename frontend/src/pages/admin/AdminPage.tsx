import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Settings,
  Shield,
  FileText,
  Users,
  Phone,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
} from 'lucide-react'
import { useAuth } from '../../lib/auth'

export function AdminPage() {
  const { isAdmin } = useAuth()
  const [overview, setOverview] = useState<any>(null)
  const [articles, setArticles] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState<'overview' | 'articles' | 'contacts'>('overview')

  // New article form
  const [showAddArticle, setShowAddArticle] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/admin/overview', {
        headers: { Authorization: `Bearer ${localStorage.getItem('cs_token')}` },
      }).then(r => r.json()),
      fetch('/api/v1/help/articles').then(r => r.json()),
      fetch('/api/v1/help/contacts').then(r => r.json()),
    ])
      .then(([oRes, aRes, cRes]) => {
        if (oRes?.data) setOverview(oRes.data)
        if (aRes?.data) setArticles(aRes.data)
        if (cRes?.data) setContacts(cRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!isAdmin) {
    return (
      <div className="py-12 text-center space-y-3">
        <Shield size={36} className="mx-auto text-red-500" />
        <h2 className="text-base font-bold text-neutral-900">Access Restricted</h2>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto">
          Administrator privileges are required to view this panel.
        </p>
        <Link to="/dashboard" className="text-xs text-brand-600 font-semibold hover:underline">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    try {
      const res = await fetch('/api/v1/admin/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('cs_token')}`,
        },
        body: JSON.stringify({
          category_id: 'd5b36e23-bb48-4a72-bc79-cbbff93db152', // default general
          title,
          content,
          source_url: sourceUrl || undefined,
          is_published: true,
        }),
      })
      if (!res.ok) throw new Error()
      setShowAddArticle(false)
      setTitle('')
      setContent('')
      setSourceUrl('')
      // refresh articles
      const updated = await fetch('/api/v1/help/articles').then(r => r.json())
      if (updated?.data) setArticles(updated.data)
    } catch {
      alert('Failed to publish article.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-100 pb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-neutral-100 text-neutral-700 text-[11px] font-mono font-semibold rounded-sm mb-1">
          <Settings size={12} /> Restricted Governance Portal
        </div>
        <h1 className="text-xl font-bold text-neutral-900">Content & Policy Administration</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Review published help articles, manage verified emergency contact entries, and audit compliance logs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-neutral-200 text-xs font-semibold text-neutral-600">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 border-b-2 transition-colors ${activeTab === 'overview' ? 'border-brand-500 text-brand-600' : 'border-transparent hover:text-neutral-900'}`}
        >
          System Overview
        </button>
        <button
          onClick={() => setActiveTab('articles')}
          className={`pb-2 border-b-2 transition-colors ${activeTab === 'articles' ? 'border-brand-500 text-brand-600' : 'border-transparent hover:text-neutral-900'}`}
        >
          Approved Help Articles ({articles.length})
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`pb-2 border-b-2 transition-colors ${activeTab === 'contacts' ? 'border-brand-500 text-brand-600' : 'border-transparent hover:text-neutral-900'}`}
        >
          Verified Contacts ({contacts.length})
        </button>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-neutral-100 p-4 rounded-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400">Published Articles</span>
              <div className="text-2xl font-bold text-neutral-900 font-mono">{articles.length}</div>
            </div>
            <div className="bg-white border border-neutral-100 p-4 rounded-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400">Verified Contacts</span>
              <div className="text-2xl font-bold text-neutral-900 font-mono">{contacts.length}</div>
            </div>
            <div className="bg-white border border-neutral-100 p-4 rounded-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400">Fraud Categories</span>
              <div className="text-2xl font-bold text-neutral-900 font-mono">9</div>
            </div>
            <div className="bg-white border border-neutral-100 p-4 rounded-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400">System Status</span>
              <div className="text-sm font-bold text-green-700 flex items-center gap-1.5 mt-2">
                <CheckCircle size={14} /> Operational
              </div>
            </div>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-sm text-xs text-neutral-600 space-y-1">
            <div className="font-semibold text-neutral-900">Administrator Content Governance Rule</div>
            <p>
              Official helplines (1930, 112, Sanchar Saathi Chakshu) must reflect verified official government gazettes or directives. The AI Assistant draws only from approved articles published in this registry.
            </p>
          </div>
        </div>
      )}

      {/* Tab: Articles */}
      {activeTab === 'articles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Help Centre Article Library</h2>
            <button
              onClick={() => setShowAddArticle(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-sm"
            >
              <Plus size={13} /> Draft New Article
            </button>
          </div>

          <div className="divide-y divide-neutral-100 bg-white border border-neutral-100 rounded-sm text-xs">
            {articles.map((art) => (
              <div key={art.id} className="p-4 space-y-1">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-neutral-900">{art.title}</div>
                  <span className="px-1.5 py-0.5 rounded-sm bg-green-50 text-green-700 text-[10px] font-semibold">
                    Published
                  </span>
                </div>
                <p className="text-neutral-600 leading-relaxed text-[11px] line-clamp-2">{art.content}</p>
                {art.source_url && (
                  <div className="text-[10px] text-brand-600 truncate pt-1">Source: {art.source_url}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Contacts */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Verified Official Helplines</h2>
          <div className="divide-y divide-neutral-100 bg-white border border-neutral-100 rounded-sm text-xs">
            {contacts.map((c) => (
              <div key={c.id} className="p-4 flex justify-between items-center">
                <div className="space-y-0.5">
                  <div className="font-semibold text-neutral-900">{c.name}</div>
                  <div className="text-neutral-500 text-[11px]">{c.description}</div>
                  <div className="text-[10px] text-neutral-400">Verified by: {c.verified_by || 'MHA'}</div>
                </div>
                <div className="font-mono font-bold text-neutral-900 text-sm">
                  {c.phone || c.url}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: New Article */}
      {showAddArticle && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-neutral-200 rounded-sm p-6 max-w-lg w-full space-y-4">
            <h3 className="text-sm font-bold text-neutral-900">Publish Verified Help Article</h3>
            <form onSubmit={handleAddArticle} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Article Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Guidance on Limiting Liability Under RBI Guidelines"
                  required
                  className="w-full px-2.5 py-1.5 bg-white text-neutral-900 placeholder:text-neutral-400 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Content Body *</label>
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Factual, actionable advice quoting official circulars or helplines..."
                  required
                  className="w-full px-2.5 py-1.5 bg-white text-neutral-900 placeholder:text-neutral-400 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Official Reference URL (Optional)</label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://rbi.org.in/..."
                  className="w-full px-2.5 py-1.5 bg-white text-neutral-900 placeholder:text-neutral-400 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddArticle(false)}
                  className="px-3 py-1.5 border border-neutral-200 text-neutral-700 rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !content.trim()}
                  className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 disabled:bg-neutral-300 text-white font-semibold rounded-sm"
                >
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
