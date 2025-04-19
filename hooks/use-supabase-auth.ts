import { useState, useEffect } from 'react'
import { supabaseAuth } from '@/lib/supabase-auth'
import { User, Session } from '@supabase/supabase-js'

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get the current session
    const getSession = async () => {
      setLoading(true)
      const { data: { session } } = await supabaseAuth.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Listen for auth changes
      const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session)
          setUser(session?.user ?? null)
        }
      )

      return () => {
        subscription.unsubscribe()
      }
    }

    getSession()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, userData?: any) => {
    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    })
    
    return { data, error }
  }

  const signOut = async () => {
    return await supabaseAuth.auth.signOut()
  }

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  }
} 