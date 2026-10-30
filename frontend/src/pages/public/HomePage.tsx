import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, ArrowRight, CreditCard, MessageSquare, Mail, LifeBuoy, AlertTriangle, CheckCircle, FileText, Lock } from 'lucide-react'
import { EmergencyBanner } from '../../components/ui/EmergencyBanner'

export function HomePage() {
  return (
    <div className="space-y-16 py-8">
      {/* Emergency Guidance */}
      <EmergencyBanner />

      {/* Hero Section */}
      <section className="text-left space-y-6 pt-4 border-b border-neutral-100 pb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold rounded-sm">
          <Shield size={14} className="text-brand-500" />
          <span>Investigation Support & Victim Assistance Platform</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-900 max-w-4xl">
          Explainable Cyber Fraud Analysis and Evidence-Linked Intelligence
        </h1>
        <p className="text-base md:text-lg text-neutral-600 max-w-3xl leading-relaxed">
          CyberShield assists citizens and analysts in inspecting suspicious digital communications, detecting anomalous UPI transaction patterns, preserving digital evidence, and preparing verified incident dossiers for law enforcement.
        </p>

        <div className="flex flex-wrap gap-4 pt-2">
          <Link
            to="/upi-fraud"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm rounded-sm transition-colors"
          >
            Check Something Suspicious
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/help"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-neutral-200 hover:border-brand-500 text-neutral-800 font-medium text-sm rounded-sm transition-colors"
          >
            <LifeBuoy size={16} className="text-brand-500" />
            I Have Lost Money / Need Help
          </Link>
        </div>
      </section>

      {/* Four Core Modules */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Platform Core Modules</h2>
          <p className="text-sm text-neutral-500">Four integrated modules designed for triage, technical verification, and response.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Module 1 */}
          <div className="border border-neutral-100 bg-white p-6 rounded-sm flex flex-col justify-between space-y-4 hover:border-brand-300 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-brand-50 text-brand-600 flex items-center justify-center rounded-sm">
                <CreditCard size={20} />
              </div>
              <h3 className="font-semibold text-neutral-900">UPI Fraud Detection</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Analyze transaction sequences, fund velocity, aggregation hubs, and rapid multi-account hops with Isolation Forest anomaly scoring and NetworkX graphs.
              </p>
            </div>
            <Link to="/upi-fraud" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 pt-2">
              Inspect Transactions <ArrowRight size={13} />
            </Link>
          </div>

          {/* Module 2 */}
          <div className="border border-neutral-100 bg-white p-6 rounded-sm flex flex-col justify-between space-y-4 hover:border-brand-300 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-brand-50 text-brand-600 flex items-center justify-center rounded-sm">
                <MessageSquare size={20} />
              </div>
              <h3 className="font-semibold text-neutral-900">Message Smishing Scanner</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Scan SMS, WhatsApp, and Telegram text for banking impersonation, fake KYC expiry threats, digital-arrest intimidation, and defanged malicious URLs.
              </p>
            </div>
            <Link to="/message-fraud" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 pt-2">
              Scan Message <ArrowRight size={13} />
            </Link>
          </div>

          {/* Module 3 */}
          <div className="border border-neutral-100 bg-white p-6 rounded-sm flex flex-col justify-between space-y-4 hover:border-brand-300 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-brand-50 text-brand-600 flex items-center justify-center rounded-sm">
                <Mail size={20} />
              </div>
              <h3 className="font-semibold text-neutral-900">Email Phishing & BEC</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Inspect .EML headers, identify lookalike typo-squatted domains, parse SPF/DKIM/DMARC auth records, and detect dangerous executable attachments.
              </p>
            </div>
            <Link to="/email-fraud" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 pt-2">
              Analyze Email <ArrowRight size={13} />
            </Link>
          </div>

          {/* Module 4 */}
          <div className="border border-neutral-100 bg-white p-6 rounded-sm flex flex-col justify-between space-y-4 hover:border-brand-300 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-brand-50 text-brand-600 flex items-center justify-center rounded-sm">
                <LifeBuoy size={20} />
              </div>
              <h3 className="font-semibold text-neutral-900">Fraud Victim Help Centre</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Immediate golden-hour steps for 1930 reporting, bank dispute registration, category-specific evidence preservation checklists, and complaint PDF generation.
              </p>
            </div>
            <Link to="/help" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 pt-2">
              Access Help Centre <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* How CyberShield Works */}
      <section className="bg-neutral-50 border border-neutral-100 p-8 rounded-sm space-y-6">
        <h2 className="text-lg font-bold text-neutral-900">Investigation & Triage Workflow</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-brand-600 font-mono font-bold text-sm">01 / Input & Normalization</div>
            <h4 className="font-semibold text-neutral-900 text-sm">Submit Artifacts Safely</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Pasted text, CSV files, and EML attachments are parsed in an isolated sandbox. Secrets like OTPs, CVVs, and UPI PINs are never requested or stored.
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-brand-600 font-mono font-bold text-sm">02 / Multi-Layer Detection</div>
            <h4 className="font-semibold text-neutral-900 text-sm">Explainable Indicators</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Rules, supervised baselines, and unsupervised anomaly detection generate traceable indicators with exact condition triggers and severity ratings.
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-brand-600 font-mono font-bold text-sm">03 / Guided Response</div>
            <h4 className="font-semibold text-neutral-900 text-sm">Evidence Dossier</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Download clean ReportLab PDF summaries to present to bank fraud desks or attach to formal complaints filed on cybercrime.gov.in.
            </p>
          </div>
        </div>
      </section>

      {/* Scope & Disclaimers */}
      <section className="border-l-4 border-neutral-400 bg-white p-6 border border-neutral-100 rounded-sm space-y-3">
        <div className="flex items-center gap-2 text-neutral-900 font-semibold text-sm">
          <AlertTriangle size={16} className="text-amber-500" />
          <span>Operational Boundaries and Legal Disclaimers</span>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">
          CyberShield is an independent academic and technological prototype. It is <b>not</b> a replacement for India's National Cyber Crime Reporting Portal, I4C, CFCFRMS, state police departments, or commercial banking dispute channels. CyberShield does not autonomously freeze accounts, retrieve live NPCI records from a UTR alone, guarantee fund recovery, or make judicial determinations of guilt.
        </p>
      </section>
    </div>
  )
}
