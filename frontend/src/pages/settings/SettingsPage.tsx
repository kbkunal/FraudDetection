import React, { useState } from 'react'
import { SlidersHorizontal, Shield, Key, Bell, Database, Check } from 'lucide-react'
import { useAuth } from '../../lib/auth'

export function SettingsPage() {
  const { user } = useAuth()
  const [retentionDays, setRetentionDays] = useState('30')
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [telemetry, setTelemetry] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-100 pb-4">
        <h1 className="text-xl font-bold text-neutral-900">Workspace & Security Settings</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Configure analysis data retention, session boundaries, and system preferences.
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm flex items-center gap-2">
          <Check size={14} className="text-emerald-600" />
          Settings saved successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* User Account Info */}
        <div className="bg-white border border-neutral-100 rounded-sm p-5 space-y-4">
          <div className="flex items-center gap-2 font-semibold text-neutral-800 text-xs uppercase tracking-wider border-b border-neutral-100 pb-2">
            <Key size={14} className="text-brand-500" />
            Account Credentials
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-neutral-500 block mb-1">Username</label>
              <input
                type="text"
                disabled
                value={user?.username || ''}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-sm text-neutral-700 font-mono"
              />
            </div>
            <div>
              <label className="text-neutral-500 block mb-1">Email Address</label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-sm text-neutral-700 font-mono"
              />
            </div>
            <div>
              <label className="text-neutral-500 block mb-1">Assigned Role</label>
              <span className="inline-block px-2.5 py-1 bg-brand-50 text-brand-700 font-semibold rounded-sm uppercase text-[10px]">
                {user?.role || 'user'}
              </span>
            </div>
          </div>
        </div>

        {/* Data Privacy & Retention */}
        <div className="bg-white border border-neutral-100 rounded-sm p-5 space-y-4">
          <div className="flex items-center gap-2 font-semibold text-neutral-800 text-xs uppercase tracking-wider border-b border-neutral-100 pb-2">
            <Database size={14} className="text-brand-500" />
            Data Privacy & Minimal Retention (Principle 4)
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-neutral-700 font-medium block mb-1">
                Forensic Analysis Retention Window
              </label>
              <select
                value={retentionDays}
                onChange={e => setRetentionDays(e.target.value)}
                className="w-full md:w-64 px-3 py-2 bg-white border border-neutral-200 rounded-sm text-neutral-800 focus:outline-none focus:border-brand-500"
              >
                <option value="7">7 Days (Strict Privacy)</option>
                <option value="30">30 Days (Standard Investigation)</option>
                <option value="90">90 Days (Extended Legal Review)</option>
              </select>
              <p className="text-[11px] text-neutral-400 mt-1">
                Completed UPI and message analysis records older than this duration are purged in accordance with data-minimization policies.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
              <div>
                <p className="font-medium text-neutral-800">Aggregated Threat Telemetry</p>
                <p className="text-[11px] text-neutral-400">Share pseudonymized smishing domain indicators with law enforcement coordination bodies.</p>
              </div>
              <input
                type="checkbox"
                checked={telemetry}
                onChange={e => setTelemetry(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-400"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white border border-neutral-100 rounded-sm p-5 space-y-4">
          <div className="flex items-center gap-2 font-semibold text-neutral-800 text-xs uppercase tracking-wider border-b border-neutral-100 pb-2">
            <Bell size={14} className="text-brand-500" />
            Alert Preferences
          </div>
          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="font-medium text-neutral-800">High-Priority smishing bulletin notices</p>
              <p className="text-[11px] text-neutral-400">Receive verified alerts regarding emerging smishing APK campaigns.</p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={e => setEmailAlerts(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-400"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs rounded-sm transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  )
}

