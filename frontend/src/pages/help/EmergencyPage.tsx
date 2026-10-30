import React from 'react'
import { Link } from 'react-router-dom'
import { PhoneCall, ShieldAlert, ArrowLeft, ExternalLink, Clock, AlertTriangle, FileText } from 'lucide-react'

export function EmergencyPage() {
  return (
    <div className="space-y-8 py-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Link to="/help" className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1">
          <ArrowLeft size={13} /> Back to Help Centre
        </Link>
      </div>

      <div className="border-b border-neutral-100 pb-4">
        <h1 className="text-2xl font-bold text-neutral-900">Emergency Fraud Response (Immediate Action)</h1>
        <p className="text-xs text-neutral-500 mt-1">
          If money was debited from your account without authorization, follow these steps immediately. Do not delay.
        </p>
      </div>

      {/* Step 1: Call 1930 */}
      <div className="p-6 bg-red-50 border-2 border-red-300 rounded-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-xs">1</span>
            <h2 className="text-base font-bold text-red-950">Call 1930 — National Cyber Crime Helpline</h2>
          </div>
          <span className="px-2 py-0.5 bg-red-200 text-red-900 font-mono text-[10px] font-bold rounded-sm uppercase">Golden Hours Action</span>
        </div>
        <p className="text-xs text-red-900 leading-relaxed">
          The 1930 helpline operates 24/7 across India. It connects directly to the Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS), allowing law enforcement to flag and freeze stolen funds in the recipient bank or wallet before the fraudsters can withdraw at an ATM.
        </p>
        <div className="p-3 bg-white border border-red-200 rounded-sm space-y-1.5 text-xs">
          <div className="font-semibold text-neutral-900">Have these details ready before calling:</div>
          <ul className="list-disc list-inside text-neutral-600 space-y-0.5">
            <li>Your bank account number or UPI ID from which money was debited</li>
            <li>12-digit Unique Transaction Reference (UTR) number or Transaction ID</li>
            <li>Exact date, time, and amount debited</li>
            <li>Recipient name, bank account, or UPI VPA (if visible)</li>
          </ul>
        </div>
      </div>

      {/* Step 2: Contact Your Bank */}
      <div className="p-6 bg-white border border-neutral-200 rounded-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-neutral-900 text-white font-bold flex items-center justify-center text-xs">2</span>
          <h2 className="text-base font-bold text-neutral-900">Notify Your Bank Immediately</h2>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Call your bank's 24/7 emergency debit/credit card blocking and fraud desk. Request them to:
        </p>
        <ul className="text-xs text-neutral-600 space-y-1 list-disc list-inside">
          <li>Temporarily freeze or block your netbanking user ID, UPI facility, or debit card</li>
          <li>Log a formal electronic transaction dispute and provide a <b>Dispute Reference Number</b></li>
          <li>Under RBI guidelines (Limiting Liability of Customers in Unauthorized Electronic Banking Transactions), reporting unauthorized transactions within 3 working days protects you from customer liability where there was no negligence.</li>
        </ul>
      </div>

      {/* Step 3: Formal Portal Complaint */}
      <div className="p-6 bg-white border border-neutral-200 rounded-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-neutral-900 text-white font-bold flex items-center justify-center text-xs">3</span>
          <h2 className="text-base font-bold text-neutral-900">Register on cybercrime.gov.in</h2>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">
          After calling 1930, lodge a formal cyber financial fraud complaint on India's official national portal:
        </p>
        <a
          href="https://cybercrime.gov.in"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-sm transition-colors"
        >
          Open National Cyber Crime Reporting Portal <ExternalLink size={13} />
        </a>
      </div>

      {/* Emergency Physical Danger */}
      <div className="p-4 bg-neutral-900 text-white rounded-sm space-y-2">
        <div className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-amber-400">
          <ShieldAlert size={14} /> Immediate Physical Danger or Extortion
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed">
          If you are facing immediate physical harm, threats of violence, kidnapping, or extreme extortion, call <b>112 (ERSS)</b> or visit your nearest local police station immediately.
        </p>
      </div>
    </div>
  )
}
