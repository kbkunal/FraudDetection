import React from 'react'
import { Shield, Lock, EyeOff, FileText } from 'lucide-react'

export function PrivacyPage() {
  return (
    <div className="space-y-10 py-6 max-w-4xl">
      <div className="space-y-4 border-b border-neutral-100 pb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-brand-50 text-brand-700 text-xs font-semibold rounded-sm">
          <Lock size={13} className="text-brand-500" /> Privacy-by-Design & Data Handling
        </div>
        <h1 className="text-3xl font-bold text-neutral-900">Privacy & Data Protection Policy</h1>
        <p className="text-sm text-neutral-600 leading-relaxed">
          How CyberShield handles submitted transactions, digital communications, and user incident workspaces.
        </p>
      </div>

      <div className="space-y-6 text-xs text-neutral-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-neutral-900">1. Data Minimization Principles</h2>
          <p>
            CyberShield adheres to strict data minimization:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>We <b>never</b> request, collect, or store payment secrets (OTPs, UPI PINs, ATM PINs, CVVs, passwords).</li>
            <li>Public analyses can be run anonymously without creating an account or storing persistent records.</li>
            <li>Uploaded files (CSV, EML) are processed in memory and retained only in ephemeral temporary storage during analysis.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-neutral-900">2. Consented Cross-Module Linking</h2>
          <p>
            When a signed-in victim chooses to connect an SMS scan, a UPI record, and an email into an incident workspace, this requires explicit checkbox consent. CyberShield does not automatically link records or aggregate cross-user submissions into public feeds.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-neutral-900">3. Workspace Ownership & Deletion</h2>
          <p>
            Users retain full control over their saved incident dossiers. You may delete any saved incident at any time from the case detail view, which immediately removes all linked references from the database.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-neutral-900">4. Synthetic & Educational Data</h2>
          <p>
            Demonstrations, training benchmarks, and sample datasets distributed with CyberShield use synthetic fictional identifiers. Real victim cases or confidential banking data are never incorporated without formal statutory authorization.
          </p>
        </section>
      </div>
    </div>
  )
}
