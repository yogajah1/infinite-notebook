import { useState, useEffect, useRef } from 'react'
import { Tldraw, Editor, TLStoreSnapshot } from 'tldraw'
import {
  Check,
  Edit2,
  Maximize2,
  Minimize2,
  ArrowLeft,
  CloudCheck,
  Loader2,
  AlertCircle,
  Menu,
  LayoutGrid,
} from 'lucide-react'
import { getCanvasSnapshot, saveCanvasSnapshot } from '../db/notebooks'

interface NotebookCanvasProps {
  notebookId: string
  title: string
  tags?: string[]
  onTitleChange?: (newTitle: string) => void
  onBack?: () => void
  onToggleSidebar?: () => void
  onOpenDashboard?: () => void
}

export function NotebookCanvas({
  notebookId,
  title,
  tags = [],
  onTitleChange,
  onBack,
  onToggleSidebar,
  onOpenDashboard,
}: NotebookCanvasProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [currentTitle, setCurrentTitle] = useState(title)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved')
  const [initialSnapshot, setInitialSnapshot] = useState<TLStoreSnapshot | null | undefined>(undefined)

  const editorRef = useRef<Editor | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync internal title when prop changes
  useEffect(() => {
    setCurrentTitle(title)
  }, [title])

  // Load snapshot from IndexedDB when notebookId changes
  useEffect(() => {
    let isMounted = true
    setInitialSnapshot(undefined)
    setSaveStatus('idle')

    async function loadData() {
      try {
        const data = await getCanvasSnapshot(notebookId)
        if (isMounted) {
          setInitialSnapshot((data as TLStoreSnapshot) || null)
          setSaveStatus('saved')
        }
      } catch (err) {
        console.error('Failed to load canvas data from IndexedDB:', err)
        if (isMounted) {
          setInitialSnapshot(null)
          setSaveStatus('error')
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [notebookId])

  const handleTitleSubmit = () => {
    setIsEditingTitle(false)
    if (onTitleChange && currentTitle.trim() !== '') {
      onTitleChange(currentTitle.trim())
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  const handleMount = (editor: Editor) => {
    editorRef.current = editor
    editor.focus()

    // Listen to changes in the store for auto-saving
    const unlisten = editor.store.listen(() => {
      setSaveStatus('saving')
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(async () => {
        try {
          const snapshot = editor.store.getStoreSnapshot()
          await saveCanvasSnapshot(notebookId, snapshot)
          setSaveStatus('saved')
        } catch (err) {
          console.error('Auto-save to IndexedDB failed:', err)
          setSaveStatus('error')
        }
      }, 1000)
    })

    return () => {
      unlisten()
    }
  }

  return (
    <div className="flex flex-col w-full h-full bg-white select-none">
      {/* Top Bar - No Slop UI Standard */}
      <header className="h-12 border-b border-zinc-200 px-3 sm:px-4 flex items-center justify-between bg-white z-10 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors mr-0.5"
              title="Menu Daftar Catatan"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {onOpenDashboard && (
            <button
              onClick={onOpenDashboard}
              className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors mr-1 hidden sm:inline-flex"
              title="Buka Dashboard"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          )}

          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 -ml-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors mr-1"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {isEditingTitle ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit()
                  if (e.key === 'Escape') {
                    setCurrentTitle(title)
                    setIsEditingTitle(false)
                  }
                }}
                autoFocus
                className="text-sm font-medium px-2 py-1 border border-zinc-300 rounded bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white"
              />
              <button
                onClick={handleTitleSubmit}
                className="p-1 rounded text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                title="Simpan Judul"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingTitle(true)}
              className="group flex items-center gap-1.5 cursor-pointer py-1 px-1.5 -ml-1.5 rounded hover:bg-zinc-100 transition-colors max-w-xs sm:max-w-md"
            >
              <h1 className="text-sm font-semibold text-zinc-900 truncate">
                {currentTitle}
              </h1>
              <Edit2 className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 shrink-0" />
            </div>
          )}

          {tags.length > 0 && (
            <div className="hidden md:flex items-center gap-1">
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right side: Save indicator & Actions */}
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-600" />
                <span className="hidden sm:inline">Menyimpan ke IndexedDB...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline text-zinc-600">Tersimpan lokal</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <span className="hidden sm:inline text-red-600">Gagal menyimpan</span>
              </>
            )}
          </div>

          <div className="h-4 w-[1px] bg-zinc-200" />

          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Canvas Area with Key to reload when notebookId changes */}
      <main className="flex-1 w-full relative overflow-hidden bg-zinc-50">
        {initialSnapshot === undefined ? (
          <div className="flex items-center justify-center w-full h-full text-zinc-500 text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-zinc-700" />
            <span>Memuat catatan...</span>
          </div>
        ) : (
          <Tldraw
            key={notebookId}
            snapshot={initialSnapshot ?? undefined}
            onMount={handleMount}
            autoFocus
          />
        )}
      </main>
    </div>
  )
}
