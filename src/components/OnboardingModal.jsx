import React, { useState } from 'react'
import { useUser, useAuth } from '@clerk/clerk-react'
import { NATIONALITIES } from '../lib/nationalities'

export default function OnboardingModal({ onComplete }) {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [nationality, setNationality] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Derive a display name and employee ID from Clerk user
  const fullName = user?.fullName || user?.firstName || 'User'
  const employeeId = `USR-${user?.id?.slice(-6).toUpperCase()}`

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nationality) return
    setSaving(true)
    setError(null)

    try {
      const token = await getToken()

      // 1. Save nationality to Clerk publicMetadata
      await fetch('/api/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nationality, name: fullName, employeeId }),
      })

      // 2. Reload Clerk user so publicMetadata is fresh in the session
      await user.reload()

      onComplete()
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <div className="w-full max-w-md" style={{ background: '#fff' }}>

        {/* Header */}
        <div
          className="px-6 py-5"
          style={{ background: '#000', borderBottom: '3px solid #A100FF' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-bold text-lg tracking-tight">CultureLint</span>
            <span className="font-bold text-lg" style={{ color: '#A100FF' }}>{'>'}</span>
          </div>
          <p className="text-xs tracking-widest uppercase" style={{ color: '#999' }}>
            Welcome — one quick step
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-sm mb-1" style={{ color: '#333' }}>
            Hi <strong>{fullName}</strong>. To give you accurate cultural linting,
            we need to know your nationality. This sets your sender profile.
          </p>
          <p className="text-xs mb-6" style={{ color: '#999' }}>
            Your profile will be added to the employee directory so colleagues can
            message you too.
          </p>

          {/* Auto-filled fields (read-only) */}
          <div className="space-y-3 mb-5">
            {[
              { label: 'Your Name', value: fullName },
              { label: 'Employee ID', value: employeeId },
            ].map(({ label, value }) => (
              <div key={label}>
                <label
                  className="block text-xs font-bold tracking-widest uppercase mb-1.5"
                  style={{ color: '#666' }}
                >
                  {label}
                </label>
                <div
                  className="w-full px-3 py-2.5 text-sm font-medium"
                  style={{
                    border: '1px solid #CCCCCC',
                    background: '#F2F2F2',
                    color: '#666',
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Nationality selector */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                className="block text-xs font-bold tracking-widest uppercase mb-1.5"
                style={{ color: '#666' }}
              >
                Your Nationality <span style={{ color: '#A100FF' }}>*</span>
              </label>
              <select
                className="w-full px-3 py-2.5 text-sm font-medium"
                style={{
                  border: nationality ? '1px solid #000' : '1px solid #A100FF',
                  background: '#fff',
                  outline: 'none',
                  cursor: 'pointer',
                }}
                onFocus={e => (e.target.style.outline = '2px solid #A100FF')}
                onBlur={e => (e.target.style.outline = 'none')}
                value={nationality}
                onChange={e => setNationality(e.target.value)}
                required
              >
                <option value="">Select your nationality…</option>
                {NATIONALITIES.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {error && (
              <p
                className="text-xs mb-4 px-3 py-2"
                style={{
                  background: '#fff0f0',
                  border: '1px solid #ffcccc',
                  borderLeft: '3px solid #cc0000',
                  color: '#cc0000',
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!nationality || saving}
              className="w-full py-3 text-sm font-bold tracking-widest uppercase transition-colors"
              style={{
                background: !nationality || saving ? '#CCCCCC' : '#A100FF',
                color: '#fff',
                border: 'none',
                cursor: !nationality || saving ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => {
                if (nationality && !saving) e.target.style.background = '#7B00C2'
              }}
              onMouseLeave={e => {
                if (nationality && !saving) e.target.style.background = '#A100FF'
              }}
            >
              {saving ? 'SAVING…' : 'CONTINUE ▶'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
