import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, HelpCircle, Search, ChevronDown, User, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import clsx from 'clsx'

function useBreadcrumb(pathname: string): string {
  const map: Record<string, string> = {
    '/dashboard': 'Overview',
    '/incidents': 'Case Management',
    '/upi-fraud': 'UPI Transaction Analysis',
    '/upi-fraud/analyze': 'UPI — Manual Entry',
    '/upi-fraud/upload': 'UPI — CSV Upload',
    '/message-fraud': 'Message Analysis',
    '/message-fraud/analyze': 'Message — New Analysis',
    '/email-fraud': 'Email Analysis',
    '/email-fraud/analyze': 'Email — Manual Entry',
    '/email-fraud/upload': 'Email — EML Upload',
    '/help': 'Victim Help Centre',
    '/admin': 'Administration',
  }
  // Check exact, then prefix
  if (map[pathname]) return map[pathname]
  const prefix = Object.keys(map).find(k => pathname.startsWith(k + '/') && k !== '/')
  return prefix ? map[prefix] : 'CyberShield'
}

export function Topbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')

  const breadcrumb = useBreadcrumb(location.pathname)
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <header className="h-14 bg-white border-b border-neutral-100 flex items-center gap-4 px-6 shrink-0 z-20">
      {/* Breadcrumb */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-900 truncate">{breadcrumb}</p>
      </div>

      {/* Search */}
      <div className="hidden sm:flex items-center gap-2 border border-neutral-100 rounded-sm px-3 py-1.5 bg-neutral-50 w-56 focus-within:border-brand-400 focus-within:bg-white transition-colors">
        <Search size={14} className="text-neutral-400 shrink-0" />
        <input
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          placeholder="Search…"
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-neutral-400 text-neutral-800"
        />
      </div>

      {/* Notification bell */}
      <button className="relative p-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 rounded-sm transition-colors">
        <Bell size={18} />
      </button>

      {/* Help */}
      <button
        onClick={() => navigate('/help')}
        className="p-2 text-neutral-500 hover:text-brand-500 hover:bg-brand-50 rounded-sm transition-colors"
        title="Help Centre"
      >
        <HelpCircle size={18} />
      </button>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setUserMenuOpen(v => !v)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-neutral-50 transition-colors"
        >
          <div className="w-7 h-7 rounded-sm bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-700">
            {initials}
          </div>
          <span className="hidden sm:block text-sm font-medium text-neutral-700 max-w-[120px] truncate">
            {user?.username ?? user?.email}
          </span>
          <ChevronDown size={14} className="text-neutral-400" />
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 top-10 w-48 bg-white border border-neutral-100 rounded-sm shadow-md z-50">
            <div className="px-3 py-2 border-b border-neutral-100">
              <p className="text-xs font-semibold text-neutral-800 truncate">{user?.email}</p>
              <p className="text-[10px] text-neutral-400">{user?.role}</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => { setUserMenuOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 text-left"
              >
                <User size={14} /> Profile
              </button>
              <button
                onClick={() => { setUserMenuOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 text-left"
              >
                <Settings size={14} /> Settings
              </button>
              <hr className="my-1 border-neutral-100" />
              <button
                onClick={() => { setUserMenuOpen(false); logout() }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Topbar
