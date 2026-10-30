import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

// ─── Base client ────────────────────────────────────────────────────────────

/**
 * Resolves the backend API base URL from the environment.
 * In development without VITE_API_BASE_URL, defaults to '/api/v1' (routed via Vite proxy).
 * In production (e.g. Vercel), points to the deployed backend URL (e.g. Render).
 */
const resolveBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (!envUrl || typeof envUrl !== 'string' || !envUrl.trim()) {
    return '/api/v1'
  }
  const clean = envUrl.trim().replace(/\/+$/, '')
  return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`
}

const api: AxiosInstance = axios.create({
  baseURL: resolveBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Request: attach JWT
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('cs_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response: unwrap APIResponse envelope; handle 401
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Backend wraps responses: { success, data, message }
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return { ...response, data: response.data.data }
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cs_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LoginRequest { email: string; password: string }
export interface RegisterRequest { email: string; username: string; password: string; confirmPassword?: string }
export interface UserProfile { id: string; email: string; username: string; role: 'user' | 'admin' | string; created_at: string }
export interface AuthResponse { access_token: string; token_type?: string; expires_in?: number; token?: string; user: UserProfile }

export interface UPITransaction {
  transaction_ref?: string
  amount: number
  timestamp: string
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REVERSED'
  direction: 'SENT' | 'RECEIVED'
  sender_upi?: string
  recipient_upi?: string
  bank_name?: string
  notes?: string
}

export interface Indicator {
  code: string
  type: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
  explanation: string
  evidence?: string
  detection_method?: string
}

export interface AnalysisResult {
  id: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED'
  created_at: string
  completed_at?: string
  indicators: Indicator[]
  summary?: string
  limitations?: string[]
  suggested_actions?: string[]
}

export interface UPIAnalysisResult extends AnalysisResult {
  transactions: UPITransaction[]
  graph?: { nodes: GraphNode[]; edges: GraphEdge[] }
}

export interface GraphNode { id: string; label: string; type: string }
export interface GraphEdge { source: string; target: string; weight: number; label?: string }

export interface MessageAnalysisResult extends AnalysisResult {
  categories?: string[]
  extracted_urls?: string[]
  extracted_phones?: string[]
  url_reputation?: Record<string, string>
}

export interface EmailAnalysisResult extends AnalysisResult {
  authentication?: { spf?: string; dkim?: string; dmarc?: string }
  from_address?: string
  reply_to?: string
  subject?: string
  categories?: string[]
  extracted_urls?: string[]
  attachments?: { name: string; type: string; size: number }[]
  has_reply_to_mismatch?: boolean
}

export interface HelpCategory { id: string; name: string; slug: string; icon: string; description: string }
export interface HelpGuide {
  category: string
  immediate_actions: string[]
  do_not: string[]
  who_to_contact: string[]
  evidence_to_preserve: string[]
  reporting_links: { label: string; url: string }[]
}
export interface HelpContact { id: string; name: string; phone?: string; url?: string; verified_at: string; source: string }
export interface HelpChecklist { id: string; category: string; items: { id: string; label: string; description?: string }[] }

export interface Incident {
  id: string
  reference: string
  title: string
  incident_type: string
  type?: string  // alias kept for display convenience
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED'
  narrative?: string
  created_at: string
  updated_at: string
  analyses?: string[]
  evidence?: string[]
  timeline?: { timestamp: string; event: string }[]
}

export interface AdminArticle {
  id: string; title: string; category: string; published: boolean
  created_at: string; updated_at: string; content: string
}
export interface AuditEvent { id: string; user: string; action: string; resource: string; timestamp: string }

// ─── Auth API ────────────────────────────────────────────────────────────────

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data).then(r => r.data),
  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data).then(r => r.data),
  me: () =>
    api.get<UserProfile>('/auth/me').then(r => r.data),
}

// ─── UPI API ─────────────────────────────────────────────────────────────────

export const upiApi = {
  analyze: (transactions: UPITransaction[]) =>
    api.post<UPIAnalysisResult>('/upi/analyze', { transactions }).then(r => r.data),
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<UPIAnalysisResult>('/upi/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data)
  },
  getAnalysis: (id: string) =>
    api.get<UPIAnalysisResult>(`/upi/analyses/${id}`).then(r => r.data),
  getGraph: (id: string) =>
    api.get<{ nodes: GraphNode[]; edges: GraphEdge[] }>(`/upi/analyses/${id}/graph`).then(r => r.data),
  generateReport: (id: string) =>
    api.post(`/upi/analyses/${id}/report`, {}, { responseType: 'blob' }).then(r => r.data),
}

// ─── Message API ─────────────────────────────────────────────────────────────

export const messageApi = {
  analyze: (payload: { text: string; source: string; sender_id?: string; language?: string; context_notes?: string }) =>
    api.post<MessageAnalysisResult>('/messages/analyze', payload).then(r => r.data),
  getAnalysis: (id: string) =>
    api.get<MessageAnalysisResult>(`/messages/analyses/${id}`).then(r => r.data),
  generateReport: (id: string) =>
    api.post(`/messages/analyses/${id}/report`, {}, { responseType: 'blob' }).then(r => r.data),
}

// ─── Email API ───────────────────────────────────────────────────────────────

export const emailApi = {
  analyze: (payload: { from_address: string; reply_to?: string; subject: string; body: string; claimed_org?: string }) =>
    api.post<EmailAnalysisResult>('/emails/analyze', payload).then(r => r.data),
  uploadEml: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<EmailAnalysisResult>('/emails/upload-eml', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data)
  },
  getAnalysis: (id: string) =>
    api.get<EmailAnalysisResult>(`/emails/analyses/${id}`).then(r => r.data),
  generateReport: (id: string) =>
    api.post(`/emails/analyses/${id}/report`, {}, { responseType: 'blob' }).then(r => r.data),
}

// ─── Help API ────────────────────────────────────────────────────────────────

export const helpApi = {
  getCategories: () =>
    api.get<HelpCategory[]>('/help/categories').then(r => r.data),
  getGuide: (category: string) =>
    api.get<HelpGuide>(`/help/guides/${category}`).then(r => r.data),
  getContacts: () =>
    api.get<HelpContact[]>('/help/contacts').then(r => r.data),
  getChecklist: (category?: string) =>
    category
      ? api.get<HelpChecklist[]>(`/help/checklists/${category}`).then(r => r.data)
      : api.get<HelpChecklist[]>('/help/checklists/general').then(r => r.data),
  generateSummary: (payload: Record<string, unknown>) =>
    api.post('/help/incident-summary', payload, { responseType: 'blob' }).then(r => r.data),
  askAssistant: (question: string) =>
    api.post<{ answer: string; sources: { title: string; url?: string }[] }>('/help/assistant', { question }).then(r => r.data),
  getArticles: (category?: string) =>
    api.get<AdminArticle[]>('/help/articles', { params: { category } }).then(r => r.data),
}

// ─── Incident API ─────────────────────────────────────────────────────────────

export const incidentApi = {
  create: (payload: Partial<Incident>) =>
    api.post<Incident>('/incidents', {
      title: payload.title,
      incident_type: payload.incident_type ?? payload.type,
      narrative: payload.narrative,
    }).then(r => r.data),
  get: (id?: string) =>
    id
      ? api.get<Incident>(`/incidents/${id}`).then(r => r.data)
      : api.get<Incident[]>('/incidents').then(r => r.data),
  update: (id: string, payload: Partial<Incident>) =>
    api.put<Incident>(`/incidents/${id}`, payload).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/incidents/${id}`).then(r => r.data),
  addLink: (id: string, analysisId: string, module: string) =>
    api.post(`/incidents/${id}/analyses`, { analysis_id: analysisId, module }).then(r => r.data),
  removeLink: (id: string, analysisId: string) =>
    api.delete(`/incidents/${id}/analyses/${analysisId}`).then(r => r.data),
}

export default api
