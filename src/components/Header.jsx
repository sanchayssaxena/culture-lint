import React from 'react'
import { UserButton, useUser } from '@clerk/clerk-react'

export default function Header({ tab, setTab }) {
  const { user } = useUser()

  return (
    <header style={{ background: '#000000', borderBottom: '3px solid #A100FF' }}>
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-6">

        {/* Accenture-style logo: wordmark + > symbol */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-white font-bold text-lg tracking-tight">CultureLinter</span>
          <span className="font-bold text-lg" style={{ color: '#A100FF' }}>{'>'}</span>
        </div>

        {/* Tabs — Accenture uses text links not pill buttons */}
        <nav className="flex gap-0">
          <button
            onClick={() => setTab('employees')}
            className="relative px-5 py-0 h-14 text-sm font-semibold tracking-wide transition-all"
            style={{
              color: tab === 'employees' ? '#A100FF' : '#CCCCCC',
              borderBottom: tab === 'employees' ? '3px solid #A100FF' : '3px solid transparent',
              background: 'none',
              border: 'none',
              borderBottom: tab === 'employees' ? '3px solid #A100FF' : '3px solid transparent',
              cursor: 'pointer',
            }}
          >
            EMPLOYEES
          </button>
          <button
            onClick={() => setTab('messages')}
            className="relative px-5 py-0 h-14 text-sm font-semibold tracking-wide transition-all"
            style={{
              color: tab === 'messages' ? '#A100FF' : '#CCCCCC',
              background: 'none',
              border: 'none',
              borderBottom: tab === 'messages' ? '3px solid #A100FF' : '3px solid transparent',
              cursor: 'pointer',
            }}
          >
            MESSAGE DRAFTER
          </button>
        </nav>

        {/* User area */}
        <div className="flex items-center gap-3 shrink-0">
          {user?.unsafeMetadata?.nationality && (
            <span className="text-xs tracking-wide" style={{ color: '#999999' }}>
              {user.publicMetadata.nationality}
            </span>
          )}
          <UserButton afterSignOutUrl="/" />
        </div>

      </div>
    </header>
  )
}
