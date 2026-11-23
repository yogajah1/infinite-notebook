import Dexie, { type EntityTable } from 'dexie'

export interface Notebook {
  id: string
  title: string
  description?: string
  tags: string[]
  isPinned?: boolean
  createdAt: number
  updatedAt: number
}

export interface CanvasRecord {
  notebookId: string
  snapshot: unknown
  updatedAt: number
}

const db = new Dexie('InfiniteNotebookDB') as Dexie & {
  notebooks: EntityTable<Notebook, 'id'>
  canvasRecords: EntityTable<CanvasRecord, 'notebookId'>
}

db.version(1).stores({
  notebooks: 'id, title, *tags, createdAt, updatedAt',
  canvasRecords: 'notebookId, updatedAt',
})

export { db }
