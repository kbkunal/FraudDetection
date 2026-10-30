import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, Phone, ExternalLink } from 'lucide-react'

export function PublicFooter() {
  return (
    <footer className="bg-neutral-50 border-t border-neutral-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand + disclaimer */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={20} className="text-brand-500" />
              <span className="text-sm font-semibold text-neutral-900">CyberShield</span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              CyberShield is a prototype analysis and assistance tool. It is{' '}
              <strong className="font-semibold text-neutral-700">not</strong> an official government platform,
              law enforcement tool, or replacement for the{' '}
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-500 underline"
              >
                National Cyber Crime Reporting Portal
              </a>.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">Quick Links</p>
            <ul className="space-y-2">
              {[
                { to: '/upi-fraud', label: 'UPI Fraud Analysis' },
                { to: '/message-fraud', label: 'Message Fraud Analysis' },
                { to: '/email-fraud', label: 'Email Fraud Analysis' },
                { to: '/help', label: 'Victim Help Centre' },
                { to: '/help/emergency', label: 'Emergency Guidance' },
                { to: '/help/incident-summary', label: 'Incident Summary' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-xs text-neutral-600 hover:text-brand-600 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Official resources */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">Official Resources</p>
            <ul className="space-y-3">
              <li>
                <a href="tel:1930" className="flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700">
                  <Phone size={13} /> 1930 — Cyber Crime Financial Helpline
                </a>
              </li>
              <li>
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-brand-600 hover:text-brand-700 underline"
                >
                  <ExternalLink size={13} /> cybercrime.gov.in
                </a>
              </li>
              <li>
                <a href="tel:112" className="flex items-center gap-2 text-xs font-semibold text-neutral-700 hover:text-neutral-900">
                  <Phone size={13} /> 112 — Emergency Services
                </a>
              </li>
              <li>
                <a
                  href="https://www.rbi.org.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-neutral-600 hover:text-neutral-800 underline"
                >
                  <ExternalLink size={13} /> Reserve Bank of India
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-200 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-neutral-400">
            © 2024 CyberShield — Prototype. Not an official government service.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-xs text-neutral-500 hover:text-neutral-700">Privacy</Link>
            <Link to="/about" className="text-xs text-neutral-500 hover:text-neutral-700">About</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default PublicFooter
