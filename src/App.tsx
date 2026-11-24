import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { NotebookCanvas } from './components/NotebookCanvas'
import { CreateNotebookModal } from './components/CreateNotebookModal'
import { DeleteConfirmModal } from './components/DeleteConfirmModal'
import { AuthModal } from './components/AuthModal'
import { useNotebooks } from './hooks/useNotebooks'
import { useSync } from './hooks/useSync'
import type { Notebook } from './db'
import { Loader2 } from 'lucide-react'

export default function App() {
  const {
    notebooks,
    isLoading,
    createNotebook,
    updateNotebook,
    deleteNotebook,
    ensureDefaultNotebook,
  } = useNotebooks()

  // Background Cloud Sync Engine
  useSync()

  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<'canvas' | 'dashboard'>('canvas')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [notebookToDelete, setNotebookToDelete] = useState<Notebook | null>(null)

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

  const handleSelectNotebook = (id: string) => {
    setActiveNotebookId(id)
    setCurrentView('canvas')
  }

  const handleCreateNotebook = async (data: {
    title: string
    description?: string
    tags: string[]
  }) => {
    const created = await createNotebook(data)
    setActiveNotebookId(created.id)
    setCurrentView('canvas')
  }

  const handleConfirmDelete = async () => {
    if (!notebookToDelete) return
    const idToDelete = notebookToDelete.id
    await deleteNotebook(idToDelete)
    setNotebookToDelete(null)

    // If active notebook was deleted, switch to the first available notebook
    if (activeNotebookId === idToDelete) {
      const remaining = notebooks.filter((n) => n.id !== idToDelete)
      if (remaining.length > 0) {
        setActiveNotebookId(remaining[0].id)
      }
    }
  }

  if (isLoading || (!activeNotebook && notebooks.length > 0)) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-white text-zinc-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-800" />
        <span className="text-sm">Menyiapkan buku catatan...</span>
      </div>
    )
  }

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-white select-none">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        notebooks={notebooks}
        activeId={activeNotebookId}
        onSelectNotebook={handleSelectNotebook}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenDashboard={() => setCurrentView('dashboard')}
        onDeleteNotebook={(nb) => setNotebookToDelete(nb)}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {currentView === 'dashboard' ? (
          <Dashboard
            notebooks={notebooks}
            onSelectNotebook={handleSelectNotebook}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onDeleteNotebook={(nb) => setNotebookToDelete(nb)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        ) : activeNotebook ? (
          <NotebookCanvas
            notebookId={activeNotebook.id}
            title={activeNotebook.title}
            tags={activeNotebook.tags}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onOpenDashboard={() => setCurrentView('dashboard')}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onTitleChange={(newTitle) =>
              updateNotebook(activeNotebook.id, { title: newTitle })
            }
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-sm">
            <p>Belum ada notebook terpilih.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-3 px-3 py-1.5 text-xs font-medium bg-zinc-900 text-white rounded-md"
            >
              Buat Notebook Baru
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateNotebookModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateNotebook}
      />

      <DeleteConfirmModal
        isOpen={!!notebookToDelete}
        title={notebookToDelete?.title || ''}
        onClose={() => setNotebookToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  )
}
