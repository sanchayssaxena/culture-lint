import React, { useState } from 'react'
import { SignedIn, SignedOut, SignIn, useUser } from '@clerk/clerk-react'
import EmployeePage from './pages/EmployeePage'
import MessagePage from './pages/MessagePage'
import Header from './components/Header'
import OnboardingModal from './components/OnboardingModal'

function AppShell() {
  const { user, isLoaded } = useUser()
  const [tab, setTab] = useState('employees')

  // Show onboarding if nationality hasn't been set yet
  const needsOnboarding = isLoaded && !user?.unsafeMetadata?.nationality

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F2F2F2' }}>
      {/* Onboarding blocks interaction until complete */}
      {needsOnboarding && (
        <OnboardingModal onComplete={() => {
          // user.reload() is called inside the modal — no extra state needed,
          // publicMetadata will be set and this condition re-evaluates to false
        }} />
      )}

      <Header tab={tab} setTab={setTab} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {tab === 'employees' ? <EmployeePage /> : <MessagePage />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <>
      <SignedOut>
        <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-10 px-4">
          <div className="text-center">
            <div className="flex items-center gap-3 justify-center mb-2">
              <span className="text-4xl font-bold text-white tracking-tight">CultureLint</span>
              <span className="text-4xl font-bold" style={{ color: '#A100FF' }}>{'>'}</span>
            </div>
            <p className="text-sm mt-2" style={{ color: '#999999' }}>
              Cross-cultural communication intelligence
            </p>
            <div className="mt-1 h-0.5 w-16 mx-auto" style={{ background: '#A100FF' }} />
          </div>
          <SignIn routing="hash" />
        </div>
      </SignedOut>

      <SignedIn>
        <AppShell />
      </SignedIn>
    </>
  )
}
