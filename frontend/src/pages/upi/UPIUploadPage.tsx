import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, ArrowLeft, AlertCircle, Download, CheckCircle2 } from 'lucide-react'
import { upiApi } from '../../lib/api'

export function UPIUploadPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      if (!selected.name.toLowerCase().endsWith('.csv')) {
        setError('Only .csv files are supported.')
        setFile(null)
        return
      }
      setError(null)
      setFile(selected)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a CSV file first.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res: any = await upiApi.upload(file)
      if (res && res.analysis_run_id) {
        navigate(`/upi-fraud/results/${res.analysis_run_id}`, { state: { result: res } })
      } else {
        setError('Upload succeeded but no analysis identifier was returned.')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'CSV upload processing failed. Verify column headers.')
    } finally {
      setLoading(false)
    }
  }

  const downloadSampleCsv = () => {
    const csvContent =
      'transaction_ref,timestamp,amount,status,direction,sender_upi,recipient_upi,bank_name,notes\n' +
      'TXN981023812,2024-10-15 02:30:00,45000,SUCCESS,outgoing,victim@okaxis,mule1@ybl,Axis Bank,Suspicious late-night burst\n' +
      'TXN981023813,2024-10-15 02:35:00,45000,SUCCESS,outgoing,victim@okaxis,mule2@ybl,Axis Bank,Follow-up rapid transfer\n' +
      'TXN981023814,2024-10-15 02:40:00,45000,SUCCESS,outgoing,victim@okaxis,mule3@okicici,Axis Bank,Third rapid transfer'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'cybershield_sample_transactions.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
        <h1 className="text-xl font-bold text-neutral-900">Upload Transaction CSV Batch</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Upload bank statement files or batch transaction logs for automated velocity, anomaly, and graph modeling.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-6 max-w-xl">
        <div className="border-2 border-dashed border-neutral-200 hover:border-brand-500 p-8 rounded-sm text-center bg-white space-y-3 cursor-pointer">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            id="csv-file-input"
            className="hidden"
          />
          <label htmlFor="csv-file-input" className="cursor-pointer block space-y-2">
            <Upload size={32} className="mx-auto text-neutral-400" />
            <div className="text-xs font-semibold text-neutral-800">
              {file ? file.name : 'Click to select CSV file or drag and drop'}
            </div>
            <p className="text-[11px] text-neutral-400">
              CSV file up to 5MB (maximum 1,000 transaction rows)
            </p>
          </label>
        </div>

        {file && (
          <div className="p-3 bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs rounded-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-green-600" />
              <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-[11px] text-red-500 hover:underline"
            >
              Clear
            </button>
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={downloadSampleCsv}
            className="inline-flex items-center gap-1.5 text-xs text-brand-600 font-semibold hover:underline"
          >
            <Download size={13} /> Download Sample CSV Template
          </button>

          <button
            type="submit"
            disabled={!file || loading}
            className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-neutral-300 text-white font-semibold text-xs rounded-sm transition-colors"
          >
            {loading ? 'Processing Batch...' : 'Upload & Run Analysis'}
          </button>
        </div>
      </form>
    </div>
  )
}
