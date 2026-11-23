import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Notebook } from '../db'
import {
  createNotebook,
  updateNotebook,
  deleteNotebook,
  getNotebookById,
  ensureDefaultNotebook,
} from '../db/notebooks'

export type { Notebook }

export function useNotebooks() {
  const notebooks = useLiveQuery(
    () => db.notebooks.orderBy('updatedAt').reverse().toArray(),
    []
  )

  return {
    notebooks: notebooks ?? [],
    isLoading: notebooks === undefined,
    createNotebook,
    updateNotebook,
    deleteNotebook,
    getNotebookById,
    ensureDefaultNotebook,
  }
}
