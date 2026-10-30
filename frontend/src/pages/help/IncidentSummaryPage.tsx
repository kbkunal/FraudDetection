import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, Download, AlertTriangle, ShieldCheck } from 'lucide-react'
import { helpApi } from '../../lib/api'

export function IncidentSummaryPage() {
  const [category, setCategory] = useState('UPI & Payment Fraud')
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().slice(0, 10))
  const [lossAmount, setLossAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [transactionRef, setTransactionRef] = useState('')
  const [complaintRefs, setComplaintRefs] = useState('')
  const [narrative, setNarrative] = useState('')
  const [evidenceNotes, setEvidenceNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGeneratePdf = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!narrative.trim() || narrative.length < 10) {
      setError('Please provide a descriptive narrative of the incident (minimum 10 characters).')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const payload = {
        category,
        incident_date: incidentDate,
        loss_amount: lossAmount ? parseFloat(lossAmount) : null,
        payment_method: paymentMethod,
        transaction_ref: transactionRef || null,
        complaint_refs: complaintRefs || null,
        narrative,
        evidence_notes: evidenceNotes || null,
      }

      const blob: any = await helpApi.generateSummary(payload)
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `cybershield_incident_summary_${incidentDate}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch {
      setError('Failed to generate incident summary PDF. Please check input parameters.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 py-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Link to="/help" className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1">
          <ArrowLeft size={13} /> Back to Help Centre
        </Link>
      </div>

      <div className="border-b border-neutral-100 pb-4">
        <h1 className="text-xl font-bold text-neutral-900">Prepare Incident Summary Dossier</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Structure your incident facts into a clean, downloadable PDF to attach when filing at <b>cybercrime.gov.in</b> or submitting an official dispute to your bank branch.
        </p>
      </div>

      {/* Warning */}
      <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-sm space-y-1">
        <div className="font-bold flex items-center gap-1.5">
          <AlertTriangle size={15} className="text-amber-600" />
          PRIVACY & SAFETY INSTRUCTION
        </div>
        <p>
          DO NOT include passwords, PINs, OTPs, CVVs, or full 16-digit debit/credit card numbers in this summary. This document is a user-prepared summary for investigative reference, not an official police complaint.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleGeneratePdf} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-neutral-700 block">Incident Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm bg-white focus:outline-none focus:border-brand-500"
            >
              <option value="UPI & Payment Fraud">UPI & Payment Fraud</option>
              <option value="Banking & Netbanking Fraud">Banking & Netbanking Fraud</option>
              <option value="Credit / Debit Card Fraud">Credit / Debit Card Fraud</option>
              <option value="SMS / WhatsApp Smishing">SMS / WhatsApp Smishing</option>
              <option value="Email Phishing & BEC">Email Phishing & BEC</option>
              <option value="Digital Arrest Extortion">Digital Arrest Extortion</option>
              <option value="Social Media Impersonation">Social Media Impersonation</option>
              <option value="Online Shopping Fraud">Online Shopping Fraud</option>
              <option value="Other Cyber Financial Fraud">Other Cyber Financial Fraud</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-neutral-700 block">Approximate Incident Date *</label>
            <input
              type="date"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              required
              className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-neutral-700 block">Estimated Loss Amount (INR)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={lossAmount}
              onChange={(e) => setLossAmount(e.target.value)}
              placeholder="e.g. 25000"
              className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-neutral-700 block">Payment Method Used</label>
            <input
              type="text"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              placeholder="UPI (PhonePe, GPay), Netbanking..."
              className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-neutral-700 block">Transaction Reference / UTR</label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="12-digit UTR or reference"
              className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <label className="font-semibold text-neutral-700 block">Existing Complaint Reference Numbers (Optional)</label>
          <input
            type="text"
            value={complaintRefs}
            onChange={(e) => setComplaintRefs(e.target.value)}
            placeholder="e.g. 1930 Ack: CFCFRMS-981290, Bank Dispute: DISP-2024-819"
            className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="space-y-1 text-xs">
          <label className="font-semibold text-neutral-700 block">Incident Narrative (Describe what happened) *</label>
          <textarea
            rows={5}
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder="Chronological sequence: When did the call or message arrive? What did the caller claim? How was the transfer authorized? What actions have you taken so far?"
            required
            className="w-full px-3 py-2 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500 text-xs"
          />
        </div>

        <div className="space-y-1 text-xs">
          <label className="font-semibold text-neutral-700 block">Preserved Evidence Notes</label>
          <textarea
            rows={3}
            value={evidenceNotes}
            onChange={(e) => setEvidenceNotes(e.target.value)}
            placeholder="List preserved screenshots, caller numbers (+91...), sender email addresses, bank statements downloaded, etc."
            className="w-full px-3 py-2 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500 text-xs"
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-[11px] text-neutral-400">
            Generates PDF in compliance with Swiss ERP formatting rules.
          </span>
          <button
            type="submit"
            disabled={loading || !narrative.trim()}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-neutral-300 text-white font-semibold text-xs rounded-sm transition-colors"
          >
            <Download size={13} />
            {loading ? 'Generating PDF...' : 'Download Incident Summary Dossier'}
          </button>
        </div>
      </form>
    </div>
  )
}
