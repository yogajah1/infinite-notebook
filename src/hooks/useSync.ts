import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { syncNotebooksWithCloud, type SyncStatus } from '../db/sync'

export function useSync() {
  const { user, isConfigured } = useAuth()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('guest')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)
  const isSyncingRef = useRef(false)

  const triggerSync = useCallback(async () => {
    if (!user) {
      setSyncStatus('guest')
      return
    }

    if (!navigator.onLine) {
      setSyncStatus('offline')
      return
    }

    if (isSyncingRef.current) return
    isSyncingRef.current = true
    setSyncStatus('syncing')
    setSyncError(null)

    try {
      const res = await syncNotebooksWithCloud(user.id)
      if (res.success) {
        setSyncStatus('idle')
        setLastSyncTime(Date.now())
        setSyncError(null)
      } else {
        setSyncStatus('error')
        setSyncError(res.error || 'Gagal sinkronisasi')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      setSyncStatus('error')
      setSyncError(msg)
    } finally {
      isSyncingRef.current = false
    }
  }, [user])

  // Sync on user change or online event
  useEffect(() => {
    if (!isConfigured || !user) {
      setSyncStatus('guest')
      return
    }

    triggerSync()

    const handleOnline = () => triggerSync()
    const handleOffline = () => setSyncStatus('offline')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Periodic sync every 2 minutes
    const interval = setInterval(() => {
      if (navigator.onLine && user) {
        triggerSync()
      }
    }, 120000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [user, isConfigured, triggerSync])

  return {
    syncStatus,
    syncError,
    lastSyncTime,
    triggerSync,
  }
}
