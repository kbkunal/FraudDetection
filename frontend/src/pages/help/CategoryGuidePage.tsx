import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, FileText, PhoneCall, ExternalLink } from 'lucide-react'
import { helpApi } from '../../lib/api'

export function CategoryGuidePage() {
  const { category } = useParams<{ category: string }>()
  const [guideSteps, setGuideSteps] = useState<any[]>([])
  const [checklist, setChecklist] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!category) return
    Promise.all([
      fetch(`/api/v1/help/guides/${category}`).then(r => r.json()),
      fetch(`/api/v1/help/checklists/${category}`).then(r => r.json()),
    ])
      .then(([gRes, cRes]) => {
        if (gRes?.data) setGuideSteps(gRes.data)
        if (cRes?.data) setChecklist(cRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [category])

  const formattedTitle = category ? category.replace(/_/g, ' ').toUpperCase() : 'GUIDE'

  return (
    <div className="space-y-8 py-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Link to="/help" className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1">
          <ArrowLeft size={13} /> Back to Help Centre
        </Link>
      </div>

      <div className="border-b border-neutral-100 pb-4">
        <h1 className="text-2xl font-bold text-neutral-900">
          Response Guide: {formattedTitle}
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Standard investigative response protocol, precautions, and evidence preservation guidelines.
        </p>
      </div>

      {loading ? (
        <div className="py-8 text-xs text-neutral-500">Loading guide instructions...</div>
      ) : (
        <div className="space-y-8">
          {/* Step by step action guides */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Recommended Action Steps</h2>
            {guideSteps.length === 0 ? (
              <div className="p-4 bg-white border border-neutral-100 rounded-sm text-xs text-neutral-500">
                General action guide: Call 1930 for financial loss, preserve communications, and report on cybercrime.gov.in.
              </div>
            ) : (
              <div className="space-y-3">
                {guideSteps.map((step: any, i: number) => (
                  <div
                    key={step.id || i}
                    className={`p-5 rounded-sm border ${step.is_critical ? 'bg-red-50/50 border-red-200' : 'bg-white border-neutral-100'} space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.is_critical ? 'bg-red-600 text-white' : 'bg-neutral-800 text-white'}`}>
                          {step.step_order || i + 1}
                        </span>
                        <h3 className="text-sm font-bold text-neutral-900">{step.title}</h3>
                      </div>
                      {step.is_critical && (
                        <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-sm uppercase font-mono">
                          Critical Action
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed pl-8">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evidence Checklist */}
          {checklist.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Required Evidence Checklist</h2>
              <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-sm bg-white text-xs">
                {checklist.map((item: any, i: number) => (
                  <div key={item.id || i} className="p-4 space-y-1">
                    <div className="flex items-center justify-between font-semibold text-neutral-900">
                      <span>{item.evidence_type}</span>
                      {item.is_required && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm">
                          Mandatory
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-600">{item.description}</p>
                    {item.instructions && (
                      <p className="text-[11px] text-neutral-400 italic">Instructions: {item.instructions}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-neutral-100">
            <Link
              to="/help/incident-summary"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-sm transition-colors"
            >
              <FileText size={13} />
              Prepare Incident Summary PDF
            </Link>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-neutral-200 hover:border-brand-500 text-neutral-800 text-xs font-semibold rounded-sm transition-colors"
            >
              File Official Complaint (cybercrime.gov.in) <ExternalLink size={13} />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
