import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, Mail, Lock, UserPlus, LogIn, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authAttempts, setAuthAttempts] = useState(0)
  const navigate = useNavigate()

  // Clear any potentially invalid session data on component mount
  useEffect(() => {
    const clearInvalidSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error || !data.session) {
          // Clear any potentially corrupted session data
          localStorage.removeItem('supabase.auth.token')
        }
      } catch (e) {
        console.error('Error checking session:', e)
        localStorage.removeItem('supabase.auth.token')
      }
    }
    
    clearInvalidSession()
  }, [])

  // Add a counter to prevent infinite auth loops
  useEffect(() => {
    if (authAttempts > 5) {
      toast.error("Trop de tentatives de connexion. Veuillez rafraîchir la page.")
      localStorage.removeItem('supabase.auth.token')
    }
  }, [authAttempts])

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setAuthAttempts(prev => prev + 1)

    try {
      if (!validateEmail(email)) {
        throw new Error("Format d'email invalide")
      }

      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error("Les mots de passe ne correspondent pas")
        }

        if (password.length < 6) {
          throw new Error("Le mot de passe doit contenir au moins 6 caractères")
        }

        if (!username.trim()) {
          throw new Error("Nom d'utilisateur requis")
        }

        // Vérifie si le username est unique
        const { data: existingUsername } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)

        if (existingUsername && existingUsername.length > 0) {
          throw new Error("Ce nom d'utilisateur est déjà utilisé")
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/confirm-email`
          }
        })

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            throw new Error("Un compte existe déjà avec cet email")
          }
          throw signUpError
        }

        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              username,
              role: 'user',
              xp: 0,
              chapters_completed: [],
              avatar_url: 'https://vmjdzgxrprnhhcffuwmz.supabase.co/storage/v1/object/public/avatars/default-avatar.png'
            })

          if (profileError) {
            console.error('Profile creation error:', profileError)
            throw new Error("Erreur lors de la création du profil")
          }

          toast.success('Compte créé ! Vérifiez votre boîte mail.')
          navigate('/confirm-email')
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            throw new Error("Email ou mot de passe incorrect")
          }
          throw signInError
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single()

          toast.success('Connexion réussie !')
          navigate(profile?.role === 'admin' ? '/admin' : '/')
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      setError(error.message)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-zinc-900/95 rounded-2xl border border-emerald-600/30 shadow-xl backdrop-blur-sm">
      <h2 className="text-2xl font-bold text-emerald-400 mb-6">
        {isSignUp ? 'Créer un compte' : 'Connexion'}
      </h2>

      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-emerald-200 mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2 bg-black/50 border border-emerald-500/30 rounded-xl text-emerald-100 placeholder-emerald-700 focus:outline-none focus:border-emerald-500"
              placeholder="votre@email.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-emerald-200 mb-1">Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2 bg-black/50 border border-emerald-500/30 rounded-xl text-emerald-100 placeholder-emerald-700 focus:outline-none focus:border-emerald-500"
              placeholder="••••••••"
            />
          </div>
        </div>

        {isSignUp && (
          <>
            <div>
              <label className="block text-sm font-medium text-emerald-200 mb-1">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 bg-black/50 border border-emerald-500/30 rounded-xl text-emerald-100 placeholder-emerald-700 focus:outline-none focus:border-emerald-500"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-emerald-200 mb-1">Nom d'utilisateur</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 bg-black/50 border border-emerald-500/30 rounded-xl text-emerald-100 placeholder-emerald-700 focus:outline-none focus:border-emerald-500"
                  placeholder="ex. TheRaven123"
                />
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isSignUp ? (
            <>
              <UserPlus className="w-5 h-5" />
              Créer un compte
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Se connecter
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError(null)
          }}
          className="w-full text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire'}
        </button>
      </form>
    </div>
  )
}