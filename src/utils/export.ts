import { Editor, exportAs, type TLExportType, type TLShapeId } from 'tldraw'

export interface ExportResult {
  success: boolean
  error?: string
}

export async function exportCanvasAsImage(
  editor: Editor,
  format: TLExportType,
  title: string
): Promise<ExportResult> {
  try {
    const selectedIds = editor.getSelectedShapeIds()
    let shapeIds: TLShapeId[] = []

    if (selectedIds.length > 0) {
      shapeIds = [...selectedIds]
    } else {
      shapeIds = Array.from(editor.getCurrentPageShapeIds())
    }

    if (shapeIds.length === 0) {
      return {
        success: false,
        error: 'Kanvas masih kosong. Buat coretan atau teks terlebih dahulu.',
      }
    }

    const cleanTitle = title.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'catatan'
    const fileName = `${cleanTitle}-${Date.now()}`

    await exportAs(editor, shapeIds, {
      format,
      name: fileName,
    })

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengekspor gambar'
    return { success: false, error: message }
  }
}

export function exportNotebookAsJson(
  editor: Editor,
  notebook: { id: string; title: string; tags: string[]; description?: string }
): ExportResult {
  try {
    const snapshot = editor.store.getStoreSnapshot()
    const payload = {
      app: 'InfiniteNotebook',
      version: 1,
      exportedAt: new Date().toISOString(),
      notebook: {
        id: notebook.id,
        title: notebook.title,
        tags: notebook.tags,
        description: notebook.description,
      },
      snapshot,
    }

    const jsonString = JSON.stringify(payload, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const cleanTitle = notebook.title.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'catatan'
    const a = document.createElement('a')
    a.href = url
    a.download = `${cleanTitle}-backup.notebook.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membuat file backup JSON'
    return { success: false, error: message }
  }
}

export async function importNotebookFromJson(
  file: File,
  editor: Editor
): Promise<{ success: boolean; error?: string; metadata?: { title?: string; tags?: string[] } }> {
  try {
    const text = await file.text()
    const data = JSON.parse(text)

    if (!data.snapshot || !data.snapshot.schema) {
      return {
        success: false,
        error: 'Format file tidak valid. Pastikan file adalah hasil backup Infinite Notebook (*.notebook.json).',
      }
    }

    editor.store.loadStoreSnapshot(data.snapshot)

    return {
      success: true,
      metadata: {
        title: data.notebook?.title,
        tags: data.notebook?.tags,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membaca file backup'
    return { success: false, error: message }
  }
}

export function printCanvasDocument(): void {
  window.print()
}
