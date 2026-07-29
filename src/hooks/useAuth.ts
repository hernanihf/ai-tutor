import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

async function isEmailWhitelisted(email: string): Promise<boolean> {
  const { data } = await supabase
    .from('email_whitelist')
    .select('email')
    .eq('email', email)
    .maybeSingle()
  return data !== null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [blockedEmail, setBlockedEmail] = useState<string | null>(null)

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null
      if (!sessionUser) { setUser(null); return }

      void isEmailWhitelisted(sessionUser.email ?? '').then((allowed) => {
        if (allowed) {
          setBlockedEmail(null)
          setUser(sessionUser)
        } else {
          void supabase.auth.signOut()
          setBlockedEmail(sessionUser.email ?? 'desconocido')
          setUser(null)
        }
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { user, loading, blockedEmail, signInWithGoogle, signOut }
}
