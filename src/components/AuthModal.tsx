import React, { useState } from 'react'
import { X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    const { error } = await signInWithGoogle()
    if (error) {
      setErrorMessage(error.message || 'Gagal login dengan Google. Periksa konfigurasi provider Supabase.')
      setLoading(false)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setErrorMessage('Harap isi email dan kata sandi')
      return
    }

    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    if (tab === 'signin') {
      const { error } = await signInWithEmail(email, password)
      if (error) {
        setErrorMessage(error.message)
        setLoading(false)
      } else {
        onClose()
      }
    } else {
      const { error } = await signUpWithEmail(email, password)
      if (error) {
        setErrorMessage(error.message)
        setLoading(false)
      } else {
        setSuccessMessage('Pendaftaran berhasil! Silakan periksa email Anda untuk verifikasi atau masuk.')
        setLoading(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
      <div className="bg-white border border-zinc-200 rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">
              {tab === 'signin' ? 'Masuk ke Akun' : 'Buat Akun Baru'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Sinkronkan catatan Anda antara Ubuntu & Android
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2 border border-zinc-300 rounded-md text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 active:bg-zinc-100 transition-colors shadow-2xs disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Lanjutkan dengan Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-200 w-full" />
            <span className="bg-white px-2 text-[11px] uppercase tracking-wider text-zinc-400 absolute">
              atau email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Alamat Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Kata Sandi
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
              />
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-start gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-700 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-zinc-900 hover:bg-zinc-800 active:bg-black text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{tab === 'signin' ? 'Masuk' : 'Daftar Akun'}</span>
            </button>
          </form>

          {/* Toggle Tab */}
          <div className="pt-2 text-center text-xs text-zinc-500">
            {tab === 'signin' ? (
              <p>
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('signup')
                    setErrorMessage(null)
                  }}
                  className="font-medium text-zinc-900 hover:underline"
                >
                  Daftar sekarang
                </button>
              </p>
            ) : (
              <p>
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('signin')
                    setErrorMessage(null)
                  }}
                  className="font-medium text-zinc-900 hover:underline"
                >
                  Masuk di sini
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
          <span>Mode Offline selalu aktif</span>
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-zinc-900 font-medium"
          >
            Lanjut sebagai Tamu
          </button>
        </div>
      </div>
    </div>
  )
}
