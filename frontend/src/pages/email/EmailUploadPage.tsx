import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, ArrowLeft, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { emailApi } from '../../lib/api'

export function EmailUploadPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      if (!selected.name.toLowerCase().endsWith('.eml')) {
        setError('Only .eml email files are supported.')
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
      setError('Please select an .eml file.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res: any = await emailApi.uploadEml(file)
      if (res && res.analysis_run_id) {
        navigate(`/email-fraud/results/${res.analysis_run_id}`, { state: { result: res } })
      } else {
        setError('Upload processed but no analysis identifier was returned.')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to parse .eml file. Check file integrity.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 py-6 max-w-xl">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/email-fraud')}
          className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
        >
          <ArrowLeft size={13} /> Back to Email Overview
        </button>
      </div>

      <div className="border-b border-neutral-100 pb-4">
        <h1 className="text-xl font-bold text-neutral-900">Upload Raw .EML File</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Upload exported email files for cryptographic header analysis (SPF, DKIM, DMARC), MIME inspection, and attachment hashing.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-6">
        <div className="border-2 border-dashed border-neutral-200 hover:border-brand-500 p-8 rounded-sm text-center bg-white space-y-3 cursor-pointer">
          <input
            type="file"
            accept=".eml"
            onChange={handleFileChange}
            id="eml-file-input"
            className="hidden"
          />
          <label htmlFor="eml-file-input" className="cursor-pointer block space-y-2">
            <Upload size={32} className="mx-auto text-neutral-400" />
            <div className="text-xs font-semibold text-neutral-800">
              {file ? file.name : 'Click to select .EML file or drag and drop'}
            </div>
            <p className="text-[11px] text-neutral-400">
              Standard RFC 822 .eml format up to 10MB
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

        <div className="p-3 bg-neutral-50 border border-neutral-200 text-neutral-600 text-[11px] rounded-sm space-y-1">
          <div className="font-semibold text-neutral-800">How to export an .EML file:</div>
          <p>• <b>Gmail:</b> Open email → click three dots (More) → click "Download message".</p>
          <p>• <b>Outlook:</b> File → Save As → Outlook Message Format (.msg or .eml).</p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!file || loading}
            className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-neutral-300 text-white font-semibold text-xs rounded-sm transition-colors"
          >
            {loading ? 'Forensically Parsing...' : 'Parse & Inspect Headers'}
          </button>
        </div>
      </form>
    </div>
  )
}
