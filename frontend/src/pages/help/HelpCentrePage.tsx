import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LifeBuoy,
  PhoneCall,
  ShieldAlert,
  FileCheck2,
  FileText,
  Bot,
  ArrowRight,
  ExternalLink,
  CreditCard,
  Building2,
  MessageSquare,
  Mail,
  Lock,
  ShoppingBag,
  Share2,
} from 'lucide-react'
import { EmergencyBanner } from '../../components/ui/EmergencyBanner'
import { helpApi, HelpCategory, HelpContact } from '../../lib/api'

export function HelpCentrePage() {
  const [categories, setCategories] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([helpApi.getCategories(), helpApi.getContacts()])
      .then(([cats, cnts]: any) => {
        setCategories(Array.isArray(cats) ? cats : [])
        setContacts(Array.isArray(cnts) ? cnts : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-10 py-6">
      {/* Top Banner: 1930 & 112 immediate emergency guidance without login */}
      <EmergencyBanner />

      {/* Header */}
      <div className="space-y-3 border-b border-neutral-100 pb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded-sm">
          <LifeBuoy size={14} className="text-brand-500" />
          <span>Module 4 · Public Victim Guidance & Complaint Dossier</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-neutral-900">
          Fraud Victim Help Centre
        </h1>
        <p className="text-sm text-neutral-600 max-w-3xl leading-relaxed">
          Comprehensive step-by-step guidance for citizens who have suffered digital fraud. Learn how to freeze funds during golden hours, protect evidence, file formal police complaints, and prepare an incident dossier.
        </p>
      </div>

      {/* Quick Access Tools */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to="/help/emergency"
          className="p-5 border border-red-200 bg-red-50 hover:bg-red-100 rounded-sm text-red-950 space-y-2 block transition-colors"
        >
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            <PhoneCall size={16} className="text-red-600" /> Emergency Actions
          </div>
          <p className="text-xs text-red-900 leading-relaxed">
            Lost money in the last 24 hours? Immediate steps to initiate CFCFRMS freeze.
          </p>
        </Link>

        <Link
          to="/help/evidence"
          className="p-5 border border-neutral-100 bg-white hover:border-brand-500 rounded-sm text-neutral-900 space-y-2 block transition-colors"
        >
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            <FileCheck2 size={16} className="text-brand-500" /> Evidence Checklist
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Essential artifacts to preserve before reporting to banks or filing an FIR.
          </p>
        </Link>

        <Link
          to="/help/incident-summary"
          className="p-5 border border-neutral-100 bg-white hover:border-brand-500 rounded-sm text-neutral-900 space-y-2 block transition-colors"
        >
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            <FileText size={16} className="text-brand-500" /> Prepare Complaint PDF
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Assemble an organized incident summary ready for cybercrime.gov.in.
          </p>
        </Link>

        <Link
          to="/help/assistant"
          className="p-5 border border-neutral-100 bg-white hover:border-brand-500 rounded-sm text-neutral-900 space-y-2 block transition-colors"
        >
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            <Bot size={16} className="text-brand-500" /> Verified Assistant
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Ask questions grounded in officially verified MHA and RBI advisories.
          </p>
        </Link>
      </div>

      {/* Fraud Categories Selection */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-neutral-900">Select Fraud Category for Guided Action</h2>
          <p className="text-xs text-neutral-500">Each guide contains what to do, what NOT to do, whom to contact, and evidence checklists.</p>
        </div>

        {loading ? (
          <div className="text-xs text-neutral-400 py-6">Loading verified guides...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((cat: any) => (
              <Link
                key={cat.id || cat.code}
                to={`/help/${cat.code}`}
                className="p-4 bg-white border border-neutral-100 rounded-sm hover:border-brand-400 space-y-2 block transition-colors group"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-neutral-900 group-hover:text-brand-600 transition-colors">
                    {cat.name}
                  </h3>
                  <ArrowRight size={13} className="text-neutral-300 group-hover:text-brand-600 transition-colors" />
                </div>
                <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Official Directory */}
      <div className="bg-neutral-50 p-6 rounded-sm border border-neutral-100 space-y-4">
        <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Verified Official Contacts Directory</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {contacts.map((c: any) => (
            <div key={c.id} className="p-3 bg-white border border-neutral-200 rounded-sm space-y-1.5">
              <div className="font-semibold text-neutral-900">{c.name}</div>
              {c.phone && (
                <div className="text-brand-600 font-mono font-bold text-sm">{c.phone}</div>
              )}
              {c.url && (
                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-neutral-500 hover:text-brand-600 flex items-center gap-1 text-[11px] truncate"
                >
                  <ExternalLink size={11} /> {c.url}
                </a>
              )}
              <p className="text-[11px] text-neutral-500 pt-1 border-t border-neutral-100">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
