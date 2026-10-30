import React from 'react'
import { Shield, AlertTriangle, BookOpen, ExternalLink } from 'lucide-react'

export function AboutPage() {
  return (
    <div className="space-y-10 py-6 max-w-4xl">
      <div className="space-y-4 border-b border-neutral-100 pb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-brand-50 text-brand-700 text-xs font-semibold rounded-sm">
          <Shield size={13} className="text-brand-500" /> System Architecture & Positioning
        </div>
        <h1 className="text-3xl font-bold text-neutral-900">About CyberShield</h1>
        <p className="text-sm text-neutral-600 leading-relaxed">
          CyberShield is an explainable cyber-fraud analysis and victim-assistance web prototype designed to support citizens and fraud triage analysts across payment, message, and email threats.
        </p>
      </div>

      <div className="space-y-6 text-xs text-neutral-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-neutral-900">1. Problem Statement & Scope</h2>
          <p>
            Victims of cyber financial fraud frequently experience confusion regarding where to report, how to stop fund exfiltration, and how to preserve perishable technical evidence. Furthermore, investigators face high volumes of disparate SMS alerts, transaction logs, and phishing emails that require rapid triage.
          </p>
          <p>
            CyberShield bridges this gap with four connected modules:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><b>UPI Fraud Detection:</b> Algorithmic velocity checking and NetworkX relationship graphs.</li>
            <li><b>Message Fraud Detection:</b> Smishing pattern heuristics, defanged URL reputation, and entity extraction.</li>
            <li><b>Email Fraud Detection:</b> RFC 822 EML header parsing, lookalike domain matching, and SPF/DKIM/DMARC checks.</li>
            <li><b>Victim Help Centre:</b> Public emergency triage (1930), guided category steps, and complaint dossier generation.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-neutral-900">2. Positioning within the Indian Ecosystem</h2>
          <p>
            India possesses an established institutional framework for cybercrime mitigation:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><b>1930:</b> The national cyber financial fraud helpline coordinating with CFCFRMS to freeze accounts.</li>
            <li><b>cybercrime.gov.in:</b> The National Cyber Crime Reporting Portal under the Ministry of Home Affairs (I4C).</li>
            <li><b>112:</b> Emergency Response Support System for physical safety emergencies.</li>
            <li><b>Chakshu (Sanchar Saathi):</b> Department of Telecommunications portal for reporting fraudulent SMS and calls.</li>
          </ul>
          <p>
            CyberShield does not replace these official portals. It functions strictly as an analytical workbench and evidence preparation aid.
          </p>
        </section>

        <section className="space-y-3 p-4 bg-neutral-50 border border-neutral-200 rounded-sm">
          <h3 className="font-bold text-neutral-900 flex items-center gap-1.5">
            <AlertTriangle size={15} className="text-amber-600" />
            Explicit Limitations and Prohibited Claims
          </h3>
          <ul className="list-disc list-inside space-y-1 text-neutral-600">
            <li>CyberShield cannot access live private NPCI or bank records from a UTR alone.</li>
            <li>Anomaly scores reflect statistical variance, not legal proof of guilt.</li>
            <li>SPF/DKIM/DMARC passing does not guarantee benign intent (threat actors use their own authenticated domains).</li>
            <li>Unknown URL reputation does not mean a URL is safe.</li>
            <li>CyberShield does not autonomously freeze accounts, recover money, or file complaints on a user's behalf.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
