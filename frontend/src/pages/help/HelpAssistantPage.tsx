import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Bot, Send, ShieldAlert, BookOpen, ExternalLink, AlertTriangle } from 'lucide-react'
import { helpApi } from '../../lib/api'

interface Message {
  sender: 'user' | 'assistant'
  text: string
  sources?: string[]
  emergency?: boolean
}

export function HelpAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: 'Hello. I am the CyberShield Guidance Assistant. I retrieve verified procedures from India\'s National Cyber Crime advisories, RBI regulations, and MHA protocols. How can I assist you today?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const askPreset = (q: string) => {
    setInput(q)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userText = input.trim()
    setInput('')
    setMessages(prev => [...prev, { sender: 'user', text: userText }])
    setLoading(true)

    try {
      const res: any = await helpApi.askAssistant(userText)
      const ans = res?.answer || 'I could not retrieve an answer for this query. Please call 1930 for official guidance.'
      const sources = res?.sources || []
      const emergency = res?.emergency_guidance || false

      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: ans,
          sources: Array.isArray(sources) ? sources : [],
          emergency,
        },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Unable to connect to knowledge retrieval service. For urgent cyber fraud issues, please call 1930 directly.',
          emergency: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 py-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Link to="/help" className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1">
          <ArrowLeft size={13} /> Back to Help Centre
        </Link>
      </div>

      <div className="border-b border-neutral-100 pb-4">
        <h1 className="text-xl font-bold text-neutral-900">Verified Assistance Query</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Grounded knowledge assistant referencing MHA advisories, RBI directions, and DoT procedures.
        </p>
      </div>

      {/* Preset Query Chips */}
      <div className="space-y-1.5 text-xs">
        <span className="font-semibold text-neutral-600">Common Questions:</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => askPreset('I just transferred money to a scammer through UPI. What should I do right now?')}
            className="px-2.5 py-1 bg-white border border-neutral-200 hover:border-brand-500 text-neutral-700 rounded-sm text-[11px]"
          >
            "I just lost money to UPI fraud"
          </button>
          <button
            type="button"
            onClick={() => askPreset('I received a call claiming to be Police putting me under Digital Arrest. Is this real?')}
            className="px-2.5 py-1 bg-white border border-neutral-200 hover:border-brand-500 text-neutral-700 rounded-sm text-[11px]"
          >
            "What is Digital Arrest?"
          </button>
          <button
            type="button"
            onClick={() => askPreset('Do I need to enter my UPI PIN to receive a cashback or refund?')}
            className="px-2.5 py-1 bg-white border border-neutral-200 hover:border-brand-500 text-neutral-700 rounded-sm text-[11px]"
          >
            "Do I enter UPI PIN to receive money?"
          </button>
        </div>
      </div>

      {/* Chat Thread */}
      <div className="border border-neutral-200 rounded-sm bg-neutral-50 min-h-[350px] max-h-[500px] overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-sm text-xs space-y-2 ${m.sender === 'user'
                  ? 'bg-brand-500 text-white'
                  : m.emergency
                    ? 'bg-red-50 border border-red-300 text-red-950'
                    : 'bg-white border border-neutral-200 text-neutral-800'
                }`}
            >
              <div className="whitespace-pre-line leading-relaxed">{m.text}</div>

              {m.sources && m.sources.length > 0 && (
                <div className="pt-2 border-t border-neutral-200/60 text-[10px] space-y-0.5">
                  <span className="font-semibold text-neutral-500 uppercase tracking-wider block">Grounded Sources:</span>
                  {m.sources.map((s, idx) => (
                    <div key={idx} className="text-brand-600 truncate">• {typeof s === 'object' ? (s as any).url || (s as any).title : String(s)}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-xs text-neutral-400 italic">Searching verified advisories...</div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about filing procedures, banking disputes, or scams..."
          className="flex-1 px-3 py-2 bg-white text-neutral-900 placeholder:text-neutral-400 border border-neutral-200 rounded-sm text-xs focus:outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-neutral-300 text-white font-semibold text-xs rounded-sm transition-colors flex items-center gap-1.5"
        >
          <Send size={13} />
          Send
        </button>
      </form>

      <p className="text-[11px] text-neutral-400 italic text-center">
        This assistant provides informational retrieval and does not substitute legal counsel or official police recording.
      </p>
    </div>
  )
}
