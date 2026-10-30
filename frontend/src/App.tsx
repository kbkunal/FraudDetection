import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'

// Layouts
import { PublicLayout } from './components/layout/PublicLayout'
import { AuthenticatedLayout } from './components/layout/AuthenticatedLayout'

// Pages - Public & Scanners
import { HomePage } from './pages/public/HomePage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { UPILandingPage } from './pages/upi/UPILandingPage'
import { UPIAnalyzePage } from './pages/upi/UPIAnalyzePage'
import { UPIUploadPage } from './pages/upi/UPIUploadPage'
import { UPIResultsPage } from './pages/upi/UPIResultsPage'
import { MessageLandingPage } from './pages/message/MessageLandingPage'
import { MessageAnalyzePage } from './pages/message/MessageAnalyzePage'
import { MessageResultsPage } from './pages/message/MessageResultsPage'
import { EmailLandingPage } from './pages/email/EmailLandingPage'
import { EmailAnalyzePage } from './pages/email/EmailAnalyzePage'
import { EmailUploadPage } from './pages/email/EmailUploadPage'
import { EmailResultsPage } from './pages/email/EmailResultsPage'
import { HelpCentrePage } from './pages/help/HelpCentrePage'
import { EmergencyPage } from './pages/help/EmergencyPage'
import { CategoryGuidePage } from './pages/help/CategoryGuidePage'
import { EvidencePage } from './pages/help/EvidencePage'
import { IncidentSummaryPage } from './pages/help/IncidentSummaryPage'
import { HelpAssistantPage } from './pages/help/HelpAssistantPage'
import { AboutPage } from './pages/about/AboutPage'
import { PrivacyPage } from './pages/about/PrivacyPage'

// Pages - Authenticated
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { IncidentsPage } from './pages/incidents/IncidentsPage'
import { IncidentDetailPage } from './pages/incidents/IncidentDetailPage'
import { AdminPage } from './pages/admin/AdminPage'
import { SettingsPage } from './pages/settings/SettingsPage'

function PublicRoute({ children }: { children: React.ReactNode }) {
  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4">
        {children}
      </div>
    </PublicLayout>
  )
}

function AdaptiveRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="flex items-center gap-3 text-neutral-500 text-sm">
          <svg className="animate-spin h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading CyberShield…
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>
  }

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4">
        {children}
      </div>
    </PublicLayout>
  )
}

export function App() {
  return (
    <Routes>
      {/* Pure Public Landing & Auth */}
      <Route path="/" element={<PublicRoute><HomePage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Adaptive Scanner Routes: Public for visitors, Sidebar workspace for logged-in users */}
      <Route path="/upi-fraud" element={<AdaptiveRoute><UPILandingPage /></AdaptiveRoute>} />
      <Route path="/upi-fraud/analyze" element={<AdaptiveRoute><UPIAnalyzePage /></AdaptiveRoute>} />
      <Route path="/upi-fraud/upload" element={<AdaptiveRoute><UPIUploadPage /></AdaptiveRoute>} />
      <Route path="/upi-fraud/results/:analysisId" element={<AdaptiveRoute><UPIResultsPage /></AdaptiveRoute>} />

      <Route path="/message-fraud" element={<AdaptiveRoute><MessageLandingPage /></AdaptiveRoute>} />
      <Route path="/message-fraud/analyze" element={<AdaptiveRoute><MessageAnalyzePage /></AdaptiveRoute>} />
      <Route path="/message-fraud/results/:analysisId" element={<AdaptiveRoute><MessageResultsPage /></AdaptiveRoute>} />

      <Route path="/email-fraud" element={<AdaptiveRoute><EmailLandingPage /></AdaptiveRoute>} />
      <Route path="/email-fraud/analyze" element={<AdaptiveRoute><EmailAnalyzePage /></AdaptiveRoute>} />
      <Route path="/email-fraud/upload" element={<AdaptiveRoute><EmailUploadPage /></AdaptiveRoute>} />
      <Route path="/email-fraud/results/:analysisId" element={<AdaptiveRoute><EmailResultsPage /></AdaptiveRoute>} />

      {/* Help Centre - Adaptive */}
      <Route path="/help" element={<AdaptiveRoute><HelpCentrePage /></AdaptiveRoute>} />
      <Route path="/help/emergency" element={<AdaptiveRoute><EmergencyPage /></AdaptiveRoute>} />
      <Route path="/help/evidence" element={<AdaptiveRoute><EvidencePage /></AdaptiveRoute>} />
      <Route path="/help/incident-summary" element={<AdaptiveRoute><IncidentSummaryPage /></AdaptiveRoute>} />
      <Route path="/help/assistant" element={<AdaptiveRoute><HelpAssistantPage /></AdaptiveRoute>} />
      <Route path="/help/:category" element={<AdaptiveRoute><CategoryGuidePage /></AdaptiveRoute>} />

      <Route path="/about" element={<AdaptiveRoute><AboutPage /></AdaptiveRoute>} />
      <Route path="/privacy" element={<AdaptiveRoute><PrivacyPage /></AdaptiveRoute>} />

      {/* Dedicated Workspace Routes */}
      <Route
        path="/dashboard"
        element={
          <AuthenticatedLayout>
            <DashboardPage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/incidents"
        element={
          <AuthenticatedLayout>
            <IncidentsPage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/incidents/:id"
        element={
          <AuthenticatedLayout>
            <IncidentDetailPage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/admin"
        element={
          <AuthenticatedLayout requireAdmin={true}>
            <AdminPage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <AuthenticatedLayout>
            <SettingsPage />
          </AuthenticatedLayout>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
