import React from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, ArrowRight, AlertTriangle, Shield, CheckCircle } from 'lucide-react'

export function MessageLandingPage() {
  return (
    <div className="space-y-10 py-6">
      <div className="space-y-4 border-b border-neutral-100 pb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded-sm">
          <MessageSquare size={14} className="text-brand-500" />
          <span>Module 2 · SMS & Messaging Forensics</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-neutral-900">
          Message Fraud & Smishing Scanner
        </h1>
        <p className="text-sm text-neutral-600 max-w-3xl leading-relaxed">
          Analyze suspicious SMS messages, WhatsApp alerts, and Telegram communications for known smishing tactics: fake KYC suspension notices, OTP extraction patterns, fake lottery rewards, digital-arrest threats, and defanged malicious URLs.
        </p>

        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-sm space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle size={15} className="text-amber-600" />
            PRIVACY & SECURITY REMINDER
          </div>
          <p>
            Do NOT submit active One-Time Passwords (OTPs), PINs, or confidential banking passwords. CyberShield analyzes text patterns and sender metadata; it cannot authenticate the real sender identity without carrier-level telecommunications access.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left: Action Card */}
        <div className="border border-neutral-100 bg-white p-6 rounded-sm space-y-4 hover:border-brand-400 transition-colors">
          <h2 className="text-base font-bold text-neutral-900">Scan Suspicious Communication</h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Paste the suspicious message body along with optional sender information and platform details to run our rule engine and baseline NLP classifier.
          </p>
          <Link
            to="/message-fraud/analyze"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs rounded-sm transition-colors"
          >
            Open Message Scanner
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Right: Known Patterns */}
        <div className="bg-neutral-50 p-6 rounded-sm border border-neutral-100 space-y-3">
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Identified Smishing Categories</h3>
          <ul className="text-xs text-neutral-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-neutral-900 w-32 shrink-0">Banking Impersonation:</span>
              <span>Messages mimicking SBI, HDFC, ICICI, Axis claiming account closure or unauthorized logins.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-neutral-900 w-32 shrink-0">Fake KYC Update:</span>
              <span>Threats to suspend PAN or Aadhaar linking unless updated via an unverified domain link.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-neutral-900 w-32 shrink-0">Digital Arrest:</span>
              <span>Coercive threats from fake Police, CBI, or ED personnel threatening FIRs or judicial detention.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-neutral-900 w-32 shrink-0">UPI Refund Trap:</span>
              <span>Requests instructing victims to enter their UPI PIN or scan a QR code to 'claim' a cashback or refund.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
