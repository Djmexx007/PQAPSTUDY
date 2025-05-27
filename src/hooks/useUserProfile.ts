import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function useUserProfile() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    setLoading(true)

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session?.user) {
      setLoading(false)
      return
    }

    setSession(session)

    const userId = session.user.id
    const email = session.user.email ?? ''
    const defaultUsername = email.split('@')[0]

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !profileData) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: defaultUsername,
            avatar_url: '',
            role: 'user',
            xp: 0,
            chapters_completed: [],
            email,
          })
          .select()
          .single()

        setProfile(newProfile)
      } else {
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const setupAuth = async () => {
      await loadProfile()

      // Set up auth state change listener
      const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) {
          setSession(session)
          if (session) loadProfile()
          else setProfile(null)
        }
      })

      return () => {
        mounted = false
        subscription?.subscription?.unsubscribe?.()
      }
    }

    const cleanup = setupAuth()
    return () => {
      cleanup.then(unsub => unsub && unsub())
    }
  }, [loadProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }, [])

  return {
    session,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    signOut,
    refreshProfile: loadProfile
  }
}