import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, Upload, PenLine, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react'

export function EmailLandingPage() {
  return (
    <div className="space-y-10 py-6">
      <div className="space-y-4 border-b border-neutral-100 pb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded-sm">
          <Mail size={14} className="text-brand-500" />
          <span>Module 3 · Email Forensics & BEC Detection</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-neutral-900">
          Email Fraud & Phishing Detection
        </h1>
        <p className="text-sm text-neutral-600 max-w-3xl leading-relaxed">
          Forensic analysis of email headers and content: detect lookalike domains using rapid string metrics, inspect SPF/DKIM/DMARC authentication results, identify Reply-To diversion, and flag hazardous attachments.
        </p>

        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-sm space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle size={15} className="text-amber-600" />
            FORENSIC SCOPE & AUTHENTICATION LIMITATION
          </div>
          <p>
            Manual email input evaluates content and visible headers only. For cryptographic signature verification (DKIM) and SPF origin tracking, upload the original <b>.eml</b> file exported from your email client. Remember: a passing SPF/DKIM check only confirms sender infrastructure, not benign intent.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Manual Form */}
        <div className="border border-neutral-100 bg-white p-6 rounded-sm space-y-4 flex flex-col justify-between hover:border-brand-400 transition-colors">
          <div className="space-y-3">
            <div className="w-10 h-10 bg-brand-50 text-brand-600 flex items-center justify-center rounded-sm">
              <PenLine size={20} />
            </div>
            <h3 className="text-base font-bold text-neutral-900">Manual Email Details</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Analyze visible fields: From address, Reply-To header, Subject line, and message body. Ideal for quick triage of phishing scams or invoice diversion requests.
            </p>
            <ul className="text-xs text-neutral-500 space-y-1 list-disc list-inside pt-1">
              <li>Lookalike typo-squatting comparison against 15+ verified domains</li>
              <li>Reply-To vs From address domain consistency checks</li>
              <li>Keyword-based Business Email Compromise (BEC) detection</li>
            </ul>
          </div>
          <Link
            to="/email-fraud/analyze"
            className="inline-flex items-center justify-center gap-2 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs rounded-sm transition-colors"
          >
            Enter Email Manually
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* EML Upload */}
        <div className="border border-neutral-100 bg-white p-6 rounded-sm space-y-4 flex flex-col justify-between hover:border-brand-400 transition-colors">
          <div className="space-y-3">
            <div className="w-10 h-10 bg-brand-50 text-brand-600 flex items-center justify-center rounded-sm">
              <Upload size={20} />
            </div>
            <h3 className="text-base font-bold text-neutral-900">Upload Raw .EML File</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Upload the complete RFC 822 email file (.eml). Safely parses MIME structure, Authentication-Results (SPF, DKIM, DMARC), and attachment hashes without executing code.
            </p>
            <ul className="text-xs text-neutral-500 space-y-1 list-disc list-inside pt-1">
              <li>Inspects raw Authentication-Results headers</li>
              <li>SHA-256 fingerprinting for attachments</li>
              <li>HTML text extraction without browser execution risks</li>
            </ul>
          </div>
          <Link
            to="/email-fraud/upload"
            className="inline-flex items-center justify-center gap-2 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs rounded-sm transition-colors"
          >
            Upload .EML File
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
