import { useState } from 'react'
import { Tldraw, Editor } from 'tldraw'
import { Check, Edit2, Maximize2, Minimize2 } from 'lucide-react'

interface NotebookCanvasProps {
  notebookId: string
  title: string
  onTitleChange?: (newTitle: string) => void
}

export function NotebookCanvas({
  notebookId,
  title,
  onTitleChange,
}: NotebookCanvasProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [currentTitle, setCurrentTitle] = useState(title)
  const [isFullscreen, setIsFullscreen] = useState(false)

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
    // Focus the canvas editor on load
    editor.focus()
  }

  return (
    <div className="flex flex-col w-full h-full bg-white select-none">
      {/* Top Bar - No Slop UI Standard: restrained, crisp borders, solid colors */}
      <header className="h-12 border-b border-zinc-200 px-3 sm:px-4 flex items-center justify-between bg-white z-10 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
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

          <span className="hidden sm:inline-flex text-[11px] font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
            Tersimpan lokal
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="flex-1 w-full relative overflow-hidden">
        <Tldraw
          persistenceKey={`notebook_${notebookId}`}
          onMount={handleMount}
          autoFocus
        />
      </main>
    </div>
  )
}
