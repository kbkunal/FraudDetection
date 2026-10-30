import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../../lib/auth'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border border-neutral-100 bg-white p-8 md:p-12 rounded-sm shadow-sm">
        {/* Left: Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield size={22} className="text-brand-500" />
              <span className="font-bold text-neutral-900 tracking-tight">CyberShield</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Sign in to CyberShield</h1>
            <p className="text-xs text-neutral-500">Access your saved incident dossiers and case workspaces.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 block">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-3 py-2 border border-neutral-200 rounded-sm text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-neutral-700 block">Password</label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact system administrator to reset password.') }} className="text-[11px] text-brand-600 hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-3 py-2 pr-10 border border-neutral-200 rounded-sm text-sm focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-neutral-300 text-white font-medium text-sm rounded-sm transition-colors"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-100 flex justify-between">
            <span>Don't have an account?</span>
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </div>

        {/* Right: Security info */}
        <div className="bg-neutral-50 p-6 rounded-sm border border-neutral-100 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider text-xs">Default Prototype Credentials</h3>
            <div className="p-3 bg-white border border-neutral-200 rounded-sm font-mono text-xs space-y-1">
              <div><span className="text-neutral-500">Admin:</span> admin@cybershield.local</div>
              <div><span className="text-neutral-500">Password:</span> CyberShield@2024</div>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Public users may use all detection scanners and generate local incident summaries without creating an account. Sign-in is only required for persistent incident workspaces.
            </p>
          </div>

          <div className="border-t border-neutral-200 pt-4 space-y-2">
            <div className="text-[11px] font-semibold text-neutral-700 flex items-center gap-1.5">
              <Lock size={13} className="text-brand-500" />
              Role-Based Access Enforcement
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              CyberShield isolates private incident dossiers by user identity. Administrators cannot inspect private victim evidence without explicit statutory authorization.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
