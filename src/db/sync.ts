import { supabase, isSupabaseConfigured, type CloudNotebook } from '../lib/supabase'
import { db, type Notebook } from './index'

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error' | 'guest'

export async function syncNotebooksWithCloud(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !navigator.onLine) {
    return { success: false, error: 'Offline atau Supabase belum dikonfigurasi' }
  }

  try {
    // 1. Ambil daftar cloud notebooks
    const { data: cloudNotebooks, error: fetchError } = await supabase
      .from('notebooks')
      .select('*')
      .eq('user_id', userId)

    if (fetchError) {
      // Jika tabel belum dibuat di Supabase
      if (fetchError.code === 'PGRST205') {
        return { success: false, error: 'Tabel database Supabase belum dibuat. Jalankan schema.sql.' }
      }
      return { success: false, error: fetchError.message }
    }

    const cloudMap = new Map<string, CloudNotebook>()
    for (const c of cloudNotebooks || []) {
      cloudMap.set(c.id, c)
    }

    // 2. Ambil local notebooks
    const localNotebooks = await db.notebooks.toArray()
    const localMap = new Map<string, Notebook>()
    for (const l of localNotebooks) {
      localMap.set(l.id, l)
    }

    // 3. Rekonsiliasi: Cloud -> Local & Local -> Cloud
    // a. Cloud notebook yang belum ada di local atau lebih baru
    for (const cloud of cloudNotebooks || []) {
      const local = localMap.get(cloud.id)
      if (!local) {
        // Tambah ke local
        await db.notebooks.put({
          id: cloud.id,
          title: cloud.title,
          description: cloud.description || '',
          tags: cloud.tags || ['Belajar'],
          isPinned: cloud.is_pinned || false,
          createdAt: Number(cloud.created_at),
          updatedAt: Number(cloud.updated_at),
        })
      } else if (Number(cloud.updated_at) > local.updatedAt) {
        // Cloud lebih baru, perbarui local
        await db.notebooks.update(cloud.id, {
          title: cloud.title,
          description: cloud.description || '',
          tags: cloud.tags || ['Belajar'],
          isPinned: cloud.is_pinned || false,
          updatedAt: Number(cloud.updated_at),
        })
      }
    }

    // b. Local notebook yang belum ada di cloud atau lebih baru
    for (const local of localNotebooks) {
      const cloud = cloudMap.get(local.id)
      if (!cloud) {
        // Upload notebook local ke cloud
        await supabase.from('notebooks').insert({
          id: local.id,
          user_id: userId,
          title: local.title,
          description: local.description || '',
          tags: local.tags || ['Belajar'],
          is_pinned: local.isPinned || false,
          created_at: local.createdAt,
          updated_at: local.updatedAt,
        })
      } else if (local.updatedAt > Number(cloud.updated_at)) {
        // Local lebih baru, perbarui cloud
        await supabase.from('notebooks').update({
          title: local.title,
          description: local.description || '',
          tags: local.tags || ['Belajar'],
          is_pinned: local.isPinned || false,
          updated_at: local.updatedAt,
        }).eq('id', local.id)
      }
    }

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sinkronisasi'
    return { success: false, error: message }
  }
}

export async function syncCanvasSnapshotToCloud(
  userId: string,
  notebookId: string,
  snapshot: unknown,
  updatedAt: number
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !navigator.onLine) {
    return { success: false, error: 'Offline' }
  }

  try {
    const { error } = await supabase.from('canvas_records').upsert({
      notebook_id: notebookId,
      user_id: userId,
      snapshot: snapshot,
      updated_at: updatedAt,
    }, {
      onConflict: 'notebook_id',
    })

    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal simpan kanvas ke cloud'
    return { success: false, error: message }
  }
}

export async function fetchCanvasSnapshotFromCloud(
  userId: string,
  notebookId: string
): Promise<{ snapshot: unknown | null; updatedAt: number }> {
  if (!isSupabaseConfigured || !navigator.onLine) {
    return { snapshot: null, updatedAt: 0 }
  }

  try {
    const { data, error } = await supabase
      .from('canvas_records')
      .select('snapshot, updated_at')
      .eq('notebook_id', notebookId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) {
      return { snapshot: null, updatedAt: 0 }
    }
    return { snapshot: data.snapshot, updatedAt: Number(data.updated_at) }
  } catch {
    return { snapshot: null, updatedAt: 0 }
  }
}

export async function deleteNotebookFromCloud(notebookId: string): Promise<void> {
  if (!isSupabaseConfigured || !navigator.onLine) return
  try {
    await supabase.from('notebooks').delete().eq('id', notebookId)
  } catch (err) {
    console.error('Failed to delete notebook from cloud:', err)
  }
}
