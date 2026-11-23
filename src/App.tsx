import { useState, useEffect } from 'react'
import { NotebookCanvas } from './components/NotebookCanvas'
import { useNotebooks } from './hooks/useNotebooks'
import { Loader2 } from 'lucide-react'

export default function App() {
  const { notebooks, isLoading, updateNotebook, ensureDefaultNotebook } = useNotebooks()
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null)

  // Initialize with the most recent or default notebook
  useEffect(() => {
    async function init() {
      if (!isLoading && notebooks.length === 0) {
        const defaultNb = await ensureDefaultNotebook()
        setActiveNotebookId(defaultNb.id)
      } else if (!isLoading && notebooks.length > 0 && !activeNotebookId) {
        setActiveNotebookId(notebooks[0].id)
      }
    }
    init()
  }, [isLoading, notebooks, activeNotebookId, ensureDefaultNotebook])

  const activeNotebook = notebooks.find((nb) => nb.id === activeNotebookId)

  if (isLoading || !activeNotebook) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-white text-zinc-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-800" />
        <span className="text-sm">Menyiapkan buku catatan...</span>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen overflow-hidden">
      <NotebookCanvas
        notebookId={activeNotebook.id}
        title={activeNotebook.title}
        tags={activeNotebook.tags}
        onTitleChange={(newTitle) =>
          updateNotebook(activeNotebook.id, { title: newTitle })
        }
      />
    </div>
  )
}
