import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Shield,
  LayoutDashboard,
  FolderOpen,
  CreditCard,
  MessageSquare,
  Mail,
  LifeBuoy,
  FileText,
  Settings,
  SlidersHorizontal,
  LogOut,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../../lib/auth'
import clsx from 'clsx'

interface NavItem {
  label: string
  to?: string
  icon?: React.ReactNode
  section?: string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { label: 'Overview',                   to: '/dashboard',       icon: <LayoutDashboard size={16} /> },
  { label: 'Case Management',            to: '/incidents',        icon: <FolderOpen size={16} /> },
  { label: 'ANALYSIS',                   section: 'ANALYSIS' },
  { label: 'UPI Transaction Analysis',   to: '/upi-fraud',        icon: <CreditCard size={16} /> },
  { label: 'Message Analysis',           to: '/message-fraud',    icon: <MessageSquare size={16} /> },
  { label: 'Email Analysis',             to: '/email-fraud',      icon: <Mail size={16} /> },
  { label: 'HELP',                       section: 'HELP' },
  { label: 'Victim Help Centre',         to: '/help',             icon: <LifeBuoy size={16} /> },
  { label: 'SYSTEM',                     section: 'SYSTEM' },
  { label: 'Reports',                    to: '/dashboard',        icon: <FileText size={16} /> },
  { label: 'Administration',             to: '/admin',            icon: <Settings size={16} />, adminOnly: true },
  { label: 'Settings',                   to: '/settings',         icon: <SlidersHorizontal size={16} /> },
]

export function Sidebar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-neutral-100 flex flex-col z-30">
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-neutral-100 shrink-0">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <Shield size={22} className="text-brand-500" />
          <span className="text-sm font-semibold text-neutral-900">CyberShield</span>
        </NavLink>
        <NavLink
          to="/"
          title="Open Public Website"
          className="text-[10px] font-medium text-neutral-400 hover:text-brand-600 flex items-center gap-1 px-1.5 py-0.5 rounded-sm hover:bg-neutral-50 transition-colors"
        >
          Website <ExternalLink size={10} />
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item, i) => {
          if (item.adminOnly && !isAdmin) return null

          if (item.section) {
            return (
              <div key={i} className="px-3 pt-5 pb-1">
                <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                  {item.section}
                </p>
              </div>
            )
          }

          if (!item.to) return null

          return (
            <NavLink
              key={item.to + i}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-sm transition-colors duration-100',
                  isActive
                    ? 'text-brand-500 bg-brand-50 border-l-[3px] border-brand-500 -ml-[3px] pl-[calc(0.75rem+3px)]'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                )
              }
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-neutral-100 px-3 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-700 shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-neutral-800 truncate">
              {user?.username ?? user?.email ?? 'User'}
            </p>
            <p className="text-[10px] text-neutral-400 truncate">{user?.role ?? 'user'}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors rounded-sm"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
