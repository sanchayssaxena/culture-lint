import React, { useState } from 'react'
import { useUser, useAuth } from '@clerk/clerk-react'
import { NATIONALITIES } from '../lib/nationalities'

export default function OnboardingModal({ onComplete }) {
  const { user } = useUser()
  const { getToken } = useAuth()

  const fullName = user?.fullName || user?.firstName || 'User'
  const defaultEmployeeId = `USR-${user?.id?.slice(-6).toUpperCase()}`

  const [employeeId, setEmployeeId] = useState(defaultEmployeeId)
  const [nationality, setNationality] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nationality || !employeeId.trim()) return
    setSaving(true)
    setError(null)

    try {
      // Step 1: Save nationality to Clerk unsafeMetadata from frontend
      await user.update({
        unsafeMetadata: { nationality },
      })

      // Step 2: Sync to Neon DB
      // Step 2: Sync to Neon DB
try {
  const token = await getToken()
  const res = await fetch('/api/onboard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      nationality,
      name: fullName,
      employeeId: employeeId.trim(),
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    // Show error instead of silently continuing
    throw new Error(data.error || 'DB sync failed')
  }
} catch (apiErr) {
  console.error('DB sync failed:', apiErr)
  setError('Failed to save profile: ' + apiErr.message)
  setSaving(false)
  return // Stop here so user can retry
}
      // Step 3: Reload user session
      await user.reload()
      onComplete()
    } catch (e) {
      console.error('Onboarding error:', e)
      setError('Something went wrong: ' + e.message)
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
        <div className="px-6 py-5" style={{ background: '#000', borderBottom: '3px solid #A100FF' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-bold text-lg tracking-tight">CultureLint</span>
            <span className="font-bold text-lg" style={{ color: '#A100FF' }}>{'>'}</span>
          </div>
          <p className="text-xs tracking-widest uppercase" style={{ color: '#999' }}>
            Welcome — complete your profile
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-sm mb-1" style={{ color: '#333' }}>
            Hi <strong>{fullName}</strong>. Set up your profile to enable accurate cultural linting.
          </p>
          <p className="text-xs mb-6" style={{ color: '#999' }}>
            Your profile will be added to the employee directory so colleagues can message you too.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name — read only */}
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase mb-1.5"
                style={{ color: '#666' }}>
                Full Name
              </label>
              <div
                className="w-full px-3 py-2.5 text-sm font-medium"
                style={{ border: '1px solid #CCCCCC', background: '#F2F2F2', color: '#666' }}
              >
                {fullName}
              </div>
              <p className="text-xs mt-1" style={{ color: '#999' }}>
                Pulled from your sign-in account
              </p>
            </div>

            {/* Employee ID — editable */}
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase mb-1.5"
                style={{ color: '#666' }}>
                Employee ID <span style={{ color: '#A100FF' }}>*</span>
              </label>
              <input
                className="w-full px-3 py-2.5 text-sm font-medium"
                style={{ border: '1px solid #000', background: '#fff', outline: 'none' }}
                onFocus={e => e.target.style.outline = '2px solid #A100FF'}
                onBlur={e => e.target.style.outline = 'none'}
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                placeholder="e.g. ACN-12345"
                required
              />
              <p className="text-xs mt-1" style={{ color: '#999' }}>
                Enter your corporate employee ID or keep the auto-generated one
              </p>
            </div>

            {/* Nationality */}
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase mb-1.5"
                style={{ color: '#666' }}>
                Nationality <span style={{ color: '#A100FF' }}>*</span>
              </label>
              <select
                className="w-full px-3 py-2.5 text-sm font-medium"
                style={{ border: '1px solid #000', background: '#fff', outline: 'none', cursor: 'pointer' }}
                onFocus={e => e.target.style.outline = '2px solid #A100FF'}
                onBlur={e => e.target.style.outline = 'none'}
                value={nationality}
                onChange={e => setNationality(e.target.value)}
                required
              >
                <option value="">Select your nationality…</option>
                {NATIONALITIES.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <p className="text-xs mt-1" style={{ color: '#999' }}>
                Used as your sender culture in the Message Drafter
              </p>
            </div>

            {/* Error */}
            {error && (
              <p
                className="text-xs px-3 py-2"
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

            {/* Submit */}
            <button
              type="submit"
              disabled={!nationality || !employeeId.trim() || saving}
              className="w-full py-3 text-sm font-bold tracking-widest uppercase"
              style={{
                background: !nationality || !employeeId.trim() || saving ? '#CCCCCC' : '#A100FF',
                color: '#fff',
                border: 'none',
                cursor: !nationality || !employeeId.trim() || saving ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => {
                if (nationality && employeeId.trim() && !saving)
                  e.target.style.background = '#7B00C2'
              }}
              onMouseLeave={e => {
                if (nationality && employeeId.trim() && !saving)
                  e.target.style.background = '#A100FF'
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
