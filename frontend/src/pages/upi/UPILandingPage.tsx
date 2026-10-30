import React from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Upload, PenLine, AlertTriangle, ShieldCheck, ArrowRight, Download } from 'lucide-react'

export function UPILandingPage() {
  return (
    <div className="space-y-10 py-6">
      {/* Title & Warning */}
      <div className="space-y-4 border-b border-neutral-100 pb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded-sm">
          <CreditCard size={14} className="text-brand-500" />
          <span>Module 1 · Payment Pattern Forensics</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-neutral-900">
          UPI Transaction Fraud Detection
        </h1>
        <p className="text-sm text-neutral-600 max-w-3xl leading-relaxed">
          Analyze user-provided transaction records to identify anomalous patterns: rapid-fire velocity, many-to-one aggregation hubs, rapid multi-hop transfers, and off-hour movements.
        </p>

        {/* Warning Banner */}
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-sm space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle size={15} className="text-amber-600" />
            CRITICAL SECURITY NOTICE
          </div>
          <p>
            NEVER enter your UPI PIN, OTP, CVV, Netbanking password, or card numbers. A Unique Transaction Reference (UTR) alone cannot retrieve private NPCI records or verify live bank balances.
          </p>
        </div>
      </div>

      {/* Two Entry Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Manual Entry */}
        <div className="border border-neutral-100 bg-white p-6 rounded-sm space-y-4 flex flex-col justify-between hover:border-brand-400 transition-colors">
          <div className="space-y-3">
            <div className="w-10 h-10 bg-brand-50 text-brand-600 flex items-center justify-center rounded-sm">
              <PenLine size={20} />
            </div>
            <h3 className="text-base font-bold text-neutral-900">Manual Transaction Entry</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Enter individual suspicious transactions manually. Ideal for analyzing a recent unauthorized debit or comparing sequential transfer amounts.
            </p>
            <ul className="text-xs text-neutral-500 space-y-1 list-disc list-inside pt-1">
              <li>Amount, timestamp, and optional 12-digit UTR</li>
              <li>Sender and recipient UPI handles (pseudonymized for safety)</li>
              <li>Transaction direction (Sent / Received)</li>
            </ul>
          </div>
          <Link
            to="/upi-fraud/analyze"
            className="inline-flex items-center justify-center gap-2 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs rounded-sm transition-colors"
          >
            Enter Transactions Manually
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* CSV Upload */}
        <div className="border border-neutral-100 bg-white p-6 rounded-sm space-y-4 flex flex-col justify-between hover:border-brand-400 transition-colors">
          <div className="space-y-3">
            <div className="w-10 h-10 bg-brand-50 text-brand-600 flex items-center justify-center rounded-sm">
              <Upload size={20} />
            </div>
            <h3 className="text-base font-bold text-neutral-900">Upload Transaction CSV</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Upload bank statement exports or transaction batches (up to 1,000 rows). Evaluates feature vectors with Isolation Forest anomaly detection and generates relationship graphs.
            </p>
            <ul className="text-xs text-neutral-500 space-y-1 list-disc list-inside pt-1">
              <li>Accepts standard .CSV bank exports</li>
              <li>Calculates velocity, burst frequency, and node degrees</li>
              <li>Includes synthetic sample dataset for testing</li>
            </ul>
          </div>
          <Link
            to="/upi-fraud/upload"
            className="inline-flex items-center justify-center gap-2 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs rounded-sm transition-colors"
          >
            Upload CSV File
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Feature & Indicator Overview */}
      <div className="bg-neutral-50 p-6 rounded-sm border border-neutral-100 space-y-4">
        <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Detection Layer Architecture</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-neutral-600">
          <div>
            <h4 className="font-semibold text-neutral-900 mb-1">Layer 1: Rule Heuristics</h4>
            <p>Explicit pattern matching: high velocity bursts (&gt;5 txns/hr), rapid fund movement (&lt;5 min gaps), and off-hour transfers (1 AM - 5 AM).</p>
          </div>
          <div>
            <h4 className="font-semibold text-neutral-900 mb-1">Layer 2: Anomaly Scoring</h4>
            <p>Isolation Forest calculates multi-dimensional deviation across amounts, hour, day-of-week, and recipient novelty.</p>
          </div>
          <div>
            <h4 className="font-semibold text-neutral-900 mb-1">Layer 3: Network Graph</h4>
            <p>NetworkX models money flows between pseudonymized UPI IDs to detect funnel accounts and mule chains.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
