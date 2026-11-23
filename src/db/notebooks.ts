import { db, type Notebook } from './index'

export async function getAllNotebooks(): Promise<Notebook[]> {
  return await db.notebooks.orderBy('updatedAt').reverse().toArray()
}

export async function getNotebookById(id: string): Promise<Notebook | undefined> {
  return await db.notebooks.get(id)
}

export async function createNotebook(data: {
  title: string
  tags?: string[]
  description?: string
}): Promise<Notebook> {
  const now = Date.now()
  const newNotebook: Notebook = {
    id: `nb_${now}_${Math.random().toString(36).substring(2, 7)}`,
    title: data.title.trim() || 'Catatan Baru',
    description: data.description || '',
    tags: data.tags || ['Belajar'],
    createdAt: now,
    updatedAt: now,
  }

  await db.notebooks.add(newNotebook)
  return newNotebook
}

export async function updateNotebook(
  id: string,
  updates: Partial<Omit<Notebook, 'id' | 'createdAt'>>
): Promise<void> {
  await db.notebooks.update(id, {
    ...updates,
    updatedAt: Date.now(),
  })
}

export async function deleteNotebook(id: string): Promise<void> {
  await db.transaction('rw', db.notebooks, db.canvasRecords, async () => {
    await db.notebooks.delete(id)
    await db.canvasRecords.delete(id)
  })
}

export async function getCanvasSnapshot(notebookId: string): Promise<unknown | null> {
  const record = await db.canvasRecords.get(notebookId)
  return record ? record.snapshot : null
}

export async function saveCanvasSnapshot(
  notebookId: string,
  snapshot: unknown
): Promise<void> {
  const now = Date.now()
  await db.transaction('rw', db.canvasRecords, db.notebooks, async () => {
    await db.canvasRecords.put({
      notebookId,
      snapshot,
      updatedAt: now,
    })
    await db.notebooks.update(notebookId, {
      updatedAt: now,
    })
  })
}

export async function ensureDefaultNotebook(): Promise<Notebook> {
  const count = await db.notebooks.count()
  if (count === 0) {
    return await createNotebook({
      title: 'Target Belajar Utama',
      tags: ['Utama', 'Belajar'],
      description: 'Catatan pertama untuk target belajar dan coret-coret.',
    })
  }
  const first = await db.notebooks.orderBy('updatedAt').reverse().first()
  return first!
}
