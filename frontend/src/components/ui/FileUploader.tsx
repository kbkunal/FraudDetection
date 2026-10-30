import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, File, X, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'

interface FileUploaderProps {
  accept: Record<string, string[]>
  maxSizeMb?: number
  onFileSelected: (file: File) => void
  onFileRemoved?: () => void
  label?: string
  hint?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function FileUploader({
  accept,
  maxSizeMb = 10,
  onFileSelected,
  onFileRemoved,
  label,
  hint,
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    setError(null)
    if (rejected.length > 0) {
      const msg = rejected[0]?.errors[0]?.message ?? 'Invalid file'
      setError(msg)
      return
    }
    const file = accepted[0]
    if (!file) return
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File exceeds the maximum size of ${maxSizeMb} MB.`)
      return
    }
    setSelectedFile(file)
    setUploadProgress(0)
    // Simulate progress animation
    let p = 0
    const interval = setInterval(() => {
      p += Math.random() * 25
      if (p >= 100) { p = 100; clearInterval(interval) }
      setUploadProgress(Math.min(100, Math.round(p)))
    }, 150)
    onFileSelected(file)
  }, [maxSizeMb, onFileSelected])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    maxSize: maxSizeMb * 1024 * 1024,
  })

  const remove = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    setError(null)
    onFileRemoved?.()
  }

  const acceptedTypes = Object.values(accept).flat().join(', ')

  return (
    <div className="flex flex-col gap-2">
      {label && <p className="text-sm font-medium text-neutral-700">{label}</p>}

      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={clsx(
            'border-2 border-dashed rounded-sm px-6 py-10 text-center cursor-pointer transition-colors duration-150',
            isDragActive
              ? 'border-brand-500 bg-brand-50'
              : 'border-neutral-200 bg-neutral-50 hover:border-brand-400 hover:bg-brand-50/40'
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto mb-3 text-neutral-400" size={32} />
          {isDragActive ? (
            <p className="text-sm font-medium text-brand-600">Drop the file here…</p>
          ) : (
            <>
              <p className="text-sm font-medium text-neutral-700">
                Drag & drop a file, or <span className="text-brand-500 underline">browse</span>
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Accepted: {acceptedTypes} · Max {maxSizeMb} MB
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="border border-neutral-100 rounded-sm bg-neutral-50 p-4">
          <div className="flex items-center gap-3">
            <File size={20} className="text-brand-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800 truncate">{selectedFile.name}</p>
              <p className="text-xs text-neutral-500">{formatBytes(selectedFile.size)}</p>
            </div>
            {uploadProgress >= 100 ? (
              <CheckCircle2 size={18} className="text-green-500 shrink-0" />
            ) : null}
            <button
              onClick={remove}
              className="text-neutral-400 hover:text-neutral-700 transition-colors"
              aria-label="Remove file"
            >
              <X size={16} />
            </button>
          </div>
          {uploadProgress < 100 && (
            <div className="mt-3">
              <div className="h-1 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1">Reading file… {uploadProgress}%</p>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}

export default FileUploader
