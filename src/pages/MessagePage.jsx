import React, { useState, useEffect, useRef } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'

function RiskBadge({ risk }) {
  const styles = {
    high:   { background: '#fff0f0', color: '#cc0000', border: '1px solid #ffcccc' },
    medium: { background: '#fffbf0', color: '#996600', border: '1px solid #ffe699' },
    low:    { background: '#f0fff4', color: '#006600', border: '1px solid #99ddaa' },
  }
  const labels = { high: '▲ HIGH RISK', medium: '◆ MEDIUM RISK', low: '✓ LOOKS GOOD' }
  return (
    <span className="inline-flex items-center px-3 py-1 text-xs font-bold tracking-widest"
      style={styles[risk] || styles.medium}>
      {labels[risk] || risk}
    </span>
  )
}

function FlagCard({ flag }) {
  return (
    <div style={{ border: '1px solid #E6E6E6', background: '#fff', borderLeft: '3px solid #A100FF' }}>
      <div className="px-5 py-4">
        <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#A100FF' }}>
          {flag.dimension}
        </p>
        <p className="text-sm font-medium mb-3" style={{ color: '#000' }}>{flag.issue}</p>
        <div style={{ background: '#F2F2F2', padding: '10px 14px', borderLeft: '2px solid #CCCCCC' }}>
          <p className="text-sm" style={{ color: '#333' }}>{flag.suggestion}</p>
        </div>
      </div>
    </div>
  )
}

function IntentBadge({ intent }) {
  const colors = {
    'CRITICAL-ACTION':  { bg: '#fff0f0', color: '#cc0000', border: '#ffcccc' },
    'ESCALATION':       { bg: '#fff0f0', color: '#cc0000', border: '#ffcccc' },
    'APPROVAL-REQUEST': { bg: '#fffbf0', color: '#996600', border: '#ffe699' },
    'FOLLOW-UP':        { bg: '#fffbf0', color: '#996600', border: '#ffe699' },
    'FEEDBACK-ONLY':    { bg: '#f0f4ff', color: '#003399', border: '#99aaee' },
    'SUGGESTION':       { bg: '#f5e6ff', color: '#7B00C2', border: '#E8B4FF' },
    'QUESTION-ONLY':    { bg: '#f0fff4', color: '#006600', border: '#99ddaa' },
    'STATUS-UPDATE':    { bg: '#f2f2f2', color: '#333333', border: '#cccccc' },
  }
  const style = colors[intent?.label] || colors['STATUS-UPDATE']
  return (
    <div className="mb-4 px-5 py-3"
      style={{ background: style.bg, border: `1px solid ${style.border}`, borderLeft: `3px solid ${style.color}` }}>
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold tracking-widest uppercase px-2 py-0.5"
          style={{ background: style.color, color: '#fff' }}>
          {intent?.label}
        </span>
        <span className="text-sm" style={{ color: '#333' }}>{intent?.reason}</span>
      </div>
    </div>
  )
}

export default function MessagePage() {
  const { getToken } = useAuth()
  const { user } = useUser()

  // Sender profile — loaded from /api/me (db-backed)
  const [sender, setSender] = useState(null)
  const [senderLoading, setSenderLoading] = useState(true)

  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const dropRef = useRef(null)

  // Load sender profile from DB
  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken()
        const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        setSender(data)
      } catch (_) {
        // fallback to Clerk metadata
        setSender({ nationality: user?.unsafeMetadata?.nationality || 'American', name: user?.fullName })
      } finally {
        setSenderLoading(false)
      }
    }
    load()
  }, [])

  // Load all employees for recipient dropdown (exclude self)
  useEffect(() => {
    const load = async () => {
      const token = await getToken()
      const res = await fetch('/api/employees', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      // Exclude the logged-in user's own record from recipient list
      const selfId = `USR-${user?.id?.slice(-6).toUpperCase()}`
      setEmployees(data.filter(e => e.employee_id !== selfId))
    }
    load()
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectEmployee = (emp) => {
    setSelected(emp)
    setSearch(emp.name)
    setShowDropdown(false)
    setResult(null)
  }

  const handleCheck = async () => {
    if (!selected || !message.trim() || !sender?.nationality) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const token = await getToken()
      const res = await fetch('/api/lint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message,
          senderNationality: sender.nationality,
          recipientNationality: selected.nationality,
          recipientName: selected.name,
        }),
      })
      if (!res.ok) throw new Error('Lint request failed')
      setResult(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const senderNationality = sender?.nationality || '…'
  const senderName = sender?.name || user?.fullName || ''

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#000' }}>
          Message Drafter
        </h1>
        <div className="mt-1 h-0.5 w-12" style={{ background: '#A100FF' }} />
        <p className="text-sm mt-2" style={{ color: '#666' }}>
          Flags cultural mismatches before you send
        </p>
      </div>
      

      {/* Sender identity card */}
      <div className="mb-4 px-5 py-3 flex items-center gap-4"
        style={{ background: '#000', borderLeft: '3px solid #A100FF' }}>
        <div>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: '#666' }}>
            Sending as
          </p>
          <p className="text-sm font-semibold text-white mt-0.5">{senderName}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: '#666' }}>
            Your culture
          </p>
          {senderLoading ? (
            <p className="text-xs mt-0.5" style={{ color: '#999' }}>Loading…</p>
          ) : (
            <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-bold tracking-widest uppercase"
              style={{ background: '#A100FF', color: '#fff' }}>
              {senderNationality}
            </span>
          )}
        </div>
      </div>

      {/* Form card */}
      <div style={{ background: '#fff', border: '1px solid #E6E6E6' }}>
        <div className="px-6 py-3" style={{ background: '#000', borderBottom: '3px solid #A100FF' }}>
          <span className="text-xs font-bold tracking-widest uppercase text-white">Compose Message</span>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Recipient */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#666' }}>
              Recipient
            </label>
            <div className="relative" ref={dropRef}>
              <input
                className="w-full px-3 py-2.5 text-sm"
                style={{ border: '1px solid #000', background: '#fff', outline: 'none' }}
                onFocus={e => { e.target.style.outline = '2px solid #A100FF'; setShowDropdown(true) }}
                onBlur={e => e.target.style.outline = 'none'}
                placeholder="Search employee by name…"
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  setSelected(null)
                  setShowDropdown(true)
                  setResult(null)
                }}
              />
              {showDropdown && filtered.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-0"
                  style={{ background: '#fff', border: '1px solid #000', borderTop: 'none', maxHeight: '200px', overflowY: 'auto' }}>
                  {filtered.map(emp => (
                    <button key={emp.id}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left text-sm"
                      style={{ background: 'none', border: 'none', borderBottom: '1px solid #E6E6E6', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F5E6FF'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      onClick={() => selectEmployee(emp)}
                    >
                      <span className="font-semibold" style={{ color: '#000' }}>{emp.name}</span>
                      <span className="text-xs font-bold tracking-wide" style={{ color: '#A100FF' }}>{emp.nationality}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selected && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs" style={{ color: '#999' }}>Recipient culture:</span>
                <span className="text-xs font-bold tracking-widest uppercase px-2 py-0.5"
                  style={{ background: '#F5E6FF', color: '#7B00C2', border: '1px solid #E8B4FF' }}>
                  {selected.nationality}
                </span>
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#666' }}>
              Your Message
            </label>
            <textarea
              className="w-full px-3 py-2.5 text-sm"
              style={{ border: '1px solid #000', background: '#F2F2F2', resize: 'vertical', minHeight: '140px', fontFamily: 'Barlow, sans-serif', outline: 'none' }}
              onFocus={e => e.target.style.outline = '2px solid #A100FF'}
              onBlur={e => e.target.style.outline = 'none'}
              placeholder="Type your message or email draft here…"
              value={message}
              onChange={e => { setMessage(e.target.value); setResult(null) }}
            />
            <p className="text-xs mt-1" style={{ color: '#999' }}>{message.length} characters</p>
          </div>

          {/* CTA */}
          <button
            onClick={handleCheck}
            disabled={!selected || !message.trim() || loading || senderLoading}
            className="w-full py-3 text-sm font-bold tracking-widest uppercase flex items-center justify-center gap-2"
            style={{
              background: (!selected || !message.trim() || loading || senderLoading) ? '#CCCCCC' : '#A100FF',
              color: '#fff',
              border: 'none',
              cursor: (!selected || !message.trim() || loading || senderLoading) ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (selected && message.trim() && !loading) e.target.style.background = '#7B00C2' }}
            onMouseLeave={e => { if (selected && message.trim() && !loading) e.target.style.background = '#A100FF' }}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                ANALYSING…
              </>
            ) : '▶ CHECK FOR CULTURAL ISSUES'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 px-5 py-3 text-sm font-medium"
          style={{ background: '#fff0f0', border: '1px solid #ffcccc', borderLeft: '3px solid #cc0000', color: '#cc0000' }}>
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
  <div className="mt-6 space-y-4">

    {/* Summary header */}
    <div style={{ background: '#000', borderBottom: '3px solid #A100FF', padding: '12px 20px' }}
      className="flex items-center justify-between">
      <span className="text-xs font-bold tracking-widest uppercase text-white">Analysis Result</span>
      <RiskBadge risk={result.risk} />
    </div>

    {/* Intent badge */}
    {result.intent && <IntentBadge intent={result.intent} />}

    {/* Flags */}
    {result.flags?.length > 0 && (
      <div className="space-y-3">
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color: '#666' }}>Issues Found</p>
        {result.flags.map((flag, i) => <FlagCard key={i} flag={flag} />)}
      </div>
    )}

    {/* Rewrite */}
    {result.rewrite && (
      <div style={{ background: '#fff', border: '1px solid #E6E6E6' }}>
        <div className="px-5 py-3 flex items-center justify-between"
          style={{ background: '#F5E6FF', borderBottom: '2px solid #A100FF' }}>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: '#7B00C2' }}>
            ✦ Culturally Adapted Version
          </p>
          <button
            onClick={() => navigator.clipboard.writeText(result.rewrite)}
            className="text-xs font-bold tracking-widest uppercase px-3 py-1"
            style={{ border: '1px solid #7B00C2', background: '#fff', color: '#7B00C2', cursor: 'pointer' }}
            onMouseEnter={e => e.target.style.background = '#F5E6FF'}
            onMouseLeave={e => e.target.style.background = '#fff'}
          >
            Copy
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#000' }}>
            {result.rewrite}
          </p>
        </div>
      </div>
    )}

  </div>
)}
    </div>
  )
}
