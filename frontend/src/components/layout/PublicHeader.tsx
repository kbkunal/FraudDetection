import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Shield, Menu, X, Phone, LayoutDashboard, LogOut } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import clsx from 'clsx'

const navLinks = [
  { label: 'Home',           to: '/' },
  { label: 'UPI Fraud',      to: '/upi-fraud' },
  { label: 'Message Fraud',  to: '/message-fraud' },
  { label: 'Email Fraud',    to: '/email-fraud' },
  { label: 'Help Centre',    to: '/help' },
  { label: 'About',          to: '/about' },
]

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 h-16 bg-white border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <Shield size={26} className="text-brand-500" />
          <span className="text-base font-semibold text-neutral-900 tracking-tight">CyberShield</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'px-3 py-1.5 text-sm font-medium rounded-sm transition-colors duration-150',
                  isActive
                    ? 'text-brand-600 bg-brand-50'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="tel:1930"
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-sm transition-colors"
          >
            <Phone size={13} />
            1930 Emergency
          </a>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-3 py-1.5 rounded-sm transition-colors"
              >
                <LayoutDashboard size={13} />
                Portal ({user?.username || 'Workspace'})
              </Link>
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors rounded-sm"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-brand-500 border border-brand-500 hover:bg-brand-50 px-4 py-1.5 rounded-sm transition-colors"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-neutral-600 hover:text-neutral-900"
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-neutral-100 shadow-lg z-40">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'px-3 py-2.5 text-sm font-medium rounded-sm',
                    isActive ? 'text-brand-600 bg-brand-50' : 'text-neutral-700 hover:bg-neutral-50'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <hr className="my-2 border-neutral-100" />
            <a href="tel:1930" className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-red-600">
              <Phone size={14} /> 1930 — Emergency Helpline
            </a>
            {isAuthenticated ? (
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="text-xs font-semibold text-brand-600 flex items-center gap-1.5"
                >
                  <LayoutDashboard size={13} /> Open Portal ({user?.username})
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); logout() }}
                  className="text-xs text-red-600 hover:underline"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setMobileOpen(false); navigate('/login') }}
                className="mt-1 w-full text-left px-3 py-2.5 text-sm font-medium text-brand-500 hover:bg-brand-50 rounded-sm"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

export default PublicHeader
