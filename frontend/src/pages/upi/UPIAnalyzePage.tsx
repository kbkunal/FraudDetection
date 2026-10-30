import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, CreditCard, AlertCircle, ArrowLeft } from 'lucide-react'
import { upiApi, UPITransaction } from '../../lib/api'

export function UPIAnalyzePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [transactions, setTransactions] = useState<UPITransaction[]>([
    {
      transaction_ref: 'TXN' + Math.floor(100000000000 + Math.random() * 900000000000),
      amount: 15000,
      timestamp: new Date().toISOString().slice(0, 16),
      status: 'SUCCESS',
      direction: 'SENT',
      sender_upi: 'victim@okaxis',
      recipient_upi: 'mule_account@ybl',
      bank_name: 'Axis Bank',
      notes: 'Payment made after deceptive call',
    },
  ])

  const addRow = () => {
    setTransactions([
      ...transactions,
      {
        transaction_ref: 'TXN' + Math.floor(100000000000 + Math.random() * 900000000000),
        amount: 5000,
        timestamp: new Date().toISOString().slice(0, 16),
        status: 'SUCCESS',
        direction: 'SENT',
        sender_upi: '',
        recipient_upi: '',
        bank_name: '',
        notes: '',
      },
    ])
  }

  const removeRow = (index: number) => {
    if (transactions.length <= 1) return
    setTransactions(transactions.filter((_, i) => i !== index))
  }

  const updateRow = (index: number, field: keyof UPITransaction, val: any) => {
    const updated = [...transactions]
    updated[index] = { ...updated[index], [field]: val }
    setTransactions(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res: any = await upiApi.analyze(transactions)
      if (res && res.analysis_run_id) {
        navigate(`/upi-fraud/results/${res.analysis_run_id}`, { state: { result: res } })
      } else {
        setError('Failed to obtain analysis run ID from server.')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Analysis request failed. Please check field values.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/upi-fraud')}
          className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
        >
          <ArrowLeft size={13} /> Back to UPI overview
        </button>
      </div>

      <div className="border-b border-neutral-100 pb-4">
        <h1 className="text-xl font-bold text-neutral-900">Manual Transaction Entry</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Enter transaction parameters to evaluate rule heuristics, fund velocity, and off-hour flags.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {transactions.map((tx, idx) => (
            <div key={idx} className="border border-neutral-200 bg-white p-4 rounded-sm space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold text-neutral-700 pb-2 border-b border-neutral-100">
                <span>Transaction #{idx + 1}</span>
                {transactions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="text-red-500 hover:text-red-700 flex items-center gap-1 text-[11px]"
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-neutral-600 block mb-1">Amount (INR) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={tx.amount}
                    onChange={(e) => updateRow(idx, 'amount', parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-600 block mb-1">Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={tx.timestamp}
                    onChange={(e) => updateRow(idx, 'timestamp', e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-600 block mb-1">Direction *</label>
                  <select
                    value={tx.direction}
                    onChange={(e) => updateRow(idx, 'direction', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm bg-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="SENT">Outgoing (Debit)</option>
                    <option value="RECEIVED">Incoming (Credit)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-neutral-600 block mb-1">Status</label>
                  <select
                    value={tx.status}
                    onChange={(e) => updateRow(idx, 'status', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm bg-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="SUCCESS">SUCCESS</option>
                    <option value="FAILED">FAILED</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-neutral-600 block mb-1">Sender UPI ID (Masked)</label>
                  <input
                    type="text"
                    value={tx.sender_upi || ''}
                    onChange={(e) => updateRow(idx, 'sender_upi', e.target.value)}
                    placeholder="victim@okhdfc"
                    className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-600 block mb-1">Recipient UPI ID</label>
                  <input
                    type="text"
                    value={tx.recipient_upi || ''}
                    onChange={(e) => updateRow(idx, 'recipient_upi', e.target.value)}
                    placeholder="scammer@ybl"
                    className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-600 block mb-1">UTR / Reference (Optional)</label>
                  <input
                    type="text"
                    value={tx.transaction_ref || ''}
                    onChange={(e) => updateRow(idx, 'transaction_ref', e.target.value)}
                    placeholder="12-digit UTR"
                    className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 hover:border-brand-500 text-neutral-700 text-xs font-semibold rounded-sm transition-colors"
          >
            <Plus size={13} /> Add Another Transaction
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-neutral-300 text-white font-semibold text-xs rounded-sm transition-colors"
          >
            {loading ? 'Evaluating Indicators...' : 'Run Fraud Analysis'}
          </button>
        </div>
      </form>
    </div>
  )
}
