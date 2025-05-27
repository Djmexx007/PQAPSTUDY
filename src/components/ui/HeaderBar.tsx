import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserProfile } from '@/hooks/useUserProfile'
import {
  ChevronDown,
  LogOut,
  Settings,
  ShieldCheck,
  Loader2,
  User,
  Home,
  BookOpen
} from 'lucide-react'
import Auth from '@/components/Auth'

interface HeaderBarProps {
  title?: string
  rightElement?: React.ReactNode
}

export default function HeaderBar({ title = 'PQAP Study', rightElement }: HeaderBarProps) {
  const [open, setOpen] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const { profile, loading, signOut, refreshProfile } = useUserProfile()
  const navigate = useNavigate()

  // Force refresh profile data every 10 seconds to ensure XP updates are visible
  // But only if we're not already loading and we have a profile
  useEffect(() => {
    const interval = setInterval(() => {
      if (profile && !loading) {
        console.log('Auto-refreshing profile data...');
        refreshProfile();
      }
    }, 10000); // Increased to 10 seconds to reduce load
    
    return () => clearInterval(interval);
  }, [refreshProfile, profile, loading]);

  // Memoize username and avatar to prevent unnecessary re-renders
  const username = profile?.username?.trim() || 'Utilisateur'
  const avatar = profile?.avatar_url?.trim() && !profile.avatar_url.includes('null')
    ? profile.avatar_url
    : 'https://vmjdzgxrprnhhcffuwmz.supabase.co/storage/v1/object/public/avatars/default-avatar.png'

  // Calculate level from XP
  const level = Math.floor((profile?.xp ?? 0) / 1000) + 1;

  // Memoize the toggle function
  const toggleOpen = useCallback(() => {
    setOpen(prev => !prev);
  }, []);

  if (loading) {
    return (
      <div className="w-full bg-zinc-900 border-b border-emerald-700/50 text-white px-4 py-3 flex items-center justify-between">
        <div className="font-bold text-lg flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-emerald-500" />
          {title}
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Loader2 className="animate-spin w-4 h-4" />
          Chargement...
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <>
        <div className="w-full bg-zinc-900 border-b border-emerald-700/50 text-white px-4 py-3 flex items-center justify-between">
          <div className="font-bold text-lg flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-500" />
            {title}
          </div>
          <button
            onClick={() => setShowAuth(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm transition-colors"
          >
            <User className="w-4 h-4" />
            Se connecter
          </button>
        </div>

        {showAuth && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-md w-full">
              <button
                onClick={() => setShowAuth(false)}
                className="absolute -top-4 -right-4 w-8 h-8 bg-zinc-800 rounded-full border border-emerald-500 text-emerald-500 hover:bg-zinc-700 transition-colors"
              >
                ×
              </button>
              <Auth />
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="w-full bg-zinc-900 border-b border-emerald-700/50 text-white px-4 py-3 flex items-center justify-between relative z-50">
      <button
        onClick={() => navigate('/')}
        className="font-bold text-lg flex items-center gap-2 hover:text-emerald-400 transition-colors"
      >
        <BookOpen className="w-6 h-6 text-emerald-500" />
        {title}
      </button>

      <div className="flex items-center gap-4 relative">
        {rightElement}
        
        <button
          onClick={toggleOpen}
          className="flex items-center gap-2 px-3 py-1 bg-emerald-800/60 hover:bg-emerald-700 rounded-full text-sm transition-colors"
        >
          <img
            src={avatar}
            alt="Avatar"
            className="w-6 h-6 rounded-full border border-emerald-500/50 object-cover"
          />
          <span className="max-w-[120px] truncate">{username}</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {open && (
          <div className="absolute right-0 top-12 w-64 bg-zinc-900 border border-emerald-700/50 rounded-xl shadow-xl p-4 space-y-3 z-50">
            <div className="flex items-center gap-3 pb-3 border-b border-emerald-700/30">
              <img
                src={avatar}
                alt="Avatar"
                className="w-10 h-10 rounded-full border border-emerald-500/50 object-cover"
              />
              <div>
                <div className="font-medium text-emerald-100">
                  {username}
                  <span className="text-xs text-emerald-500 ml-1">
                    ({profile.role || 'user'})
                  </span>
                </div>
                <div className="text-xs text-emerald-400">
                  Niveau {level}
                </div>
                <div className="text-xs text-emerald-400/80">
                  {profile.xp ?? 0} XP
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setOpen(false)
                navigate('/')
              }}
              className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-emerald-800/30 rounded text-sm transition-colors"
            >
              <Home className="w-4 h-4" />
              Accueil
            </button>

            <button
              onClick={() => {
                setOpen(false)
                navigate('/settings')
              }}
              className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-emerald-800/30 rounded text-sm transition-colors"
            >
              <Settings className="w-4 h-4" />
              Paramètres
            </button>

            {profile.role === 'admin' && (
              <button
                onClick={() => {
                  setOpen(false)
                  navigate('/admin')
                }}
                className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-yellow-600/20 text-yellow-300 rounded text-sm transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Administration
              </button>
            )}

            <button
              onClick={() => {
                setOpen(false)
                signOut()
              }}
              className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-red-600/20 text-red-400 rounded text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </div>
  )
}