import { useState, useRef, useEffect } from 'react'
import {
  CloudCheck,
  CloudOff,
  CloudAlert,
  Loader2,
  LogOut,
  RefreshCw,
  LogIn,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../hooks/useSync'

interface UserMenuProps {
  onOpenAuthModal: () => void
}

export function UserMenu({ onOpenAuthModal }: UserMenuProps) {
  const { user, signOut } = useAuth()
  const { syncStatus, syncError, triggerSync } = useSync()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) {
    return (
      <button
        onClick={onOpenAuthModal}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200/80 rounded transition-colors"
        title="Masuk untuk sinkronisasi cloud antar perangkat"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Masuk</span>
      </button>
    )
  }

  const initial = (user.email || 'U').charAt(0).toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-1 rounded hover:bg-zinc-100 transition-colors"
        title="Menu Akun & Sinkronisasi"
      >
        <div className="w-6 h-6 rounded-full bg-zinc-800 text-white flex items-center justify-center text-xs font-medium">
          {initial}
        </div>
        <div className="flex items-center">
          {syncStatus === 'syncing' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-600" />
          ) : syncStatus === 'error' ? (
            <CloudAlert className="w-3.5 h-3.5 text-red-500" />
          ) : syncStatus === 'offline' ? (
            <CloudOff className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-64 bg-white border border-zinc-200 rounded-lg shadow-lg py-1.5 z-50 text-xs">
          <div className="px-3 py-2 border-b border-zinc-100">
            <p className="font-medium text-zinc-900 truncate">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {syncStatus === 'syncing' ? (
                <span className="text-zinc-500 flex items-center gap-1 text-[11px]">
                  <Loader2 className="w-3 h-3 animate-spin" /> Menyinkronkan...
                </span>
              ) : syncStatus === 'error' ? (
                <span className="text-red-600 flex items-center gap-1 text-[11px]" title={syncError || ''}>
                  <CloudAlert className="w-3 h-3" /> Gagal sync: {syncError?.slice(0, 30)}...
                </span>
              ) : syncStatus === 'offline' ? (
                <span className="text-amber-600 flex items-center gap-1 text-[11px]">
                  <CloudOff className="w-3 h-3" /> Offline (Tersimpan Lokal)
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1 text-[11px]">
                  <CloudCheck className="w-3 h-3" /> Cloud Supabase Aktif
                </span>
              )}
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                triggerSync()
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-zinc-700 hover:bg-zinc-50 text-left transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
              <span>Sinkronkan Sekarang</span>
            </button>
          </div>

          <div className="pt-1 border-t border-zinc-100">
            <button
              onClick={async () => {
                setIsOpen(false)
                await signOut()
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 text-left transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
