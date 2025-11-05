'use client'

import { createContext, useContext, useState } from 'react'
import { useAuth } from './auth'
import { Session } from '@supabase/supabase-js'
import { UserTeamProvider } from './user-team-provider'

type AuthContextType = {
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authView, setAuthView] = useState<any>('sign_in')
  const [authDialog, setAuthDialog] = useState(true)
  const { session, loading } = useAuth(setAuthDialog, setAuthView)

  return (
    <AuthContext.Provider value={{ session, loading }}>
      <UserTeamProvider session={session}>{children}</UserTeamProvider>
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
