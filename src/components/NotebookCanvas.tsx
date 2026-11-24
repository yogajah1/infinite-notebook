import { useState, useEffect, useRef } from 'react'
import {
  Tldraw,
  Editor,
  TLStoreSnapshot,
  DefaultColorStyle,
  DefaultFontStyle,
  DefaultTextAlignStyle,
  TLDefaultFontStyle,
  TLDefaultTextAlignStyle,
} from 'tldraw'
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
  Paintbrush,
  Type,
  Download,
  ImagePlus,
} from 'lucide-react'
import { getCanvasSnapshot, saveCanvasSnapshot } from '../db/notebooks'
import { syncCanvasSnapshotToCloud, fetchCanvasSnapshotFromCloud } from '../db/sync'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { BrushController } from './BrushController'
import { UserMenu } from './UserMenu'
import { ExportModal } from './ExportModal'

interface NotebookCanvasProps {
  notebookId: string
  title: string
  tags?: string[]
  onTitleChange?: (newTitle: string) => void
  onBack?: () => void
  onToggleSidebar?: () => void
  onOpenDashboard?: () => void
  onOpenAuthModal?: () => void
}

export function NotebookCanvas({
  notebookId,
  title,
  tags = [],
  onTitleChange,
  onBack,
  onToggleSidebar,
  onOpenDashboard,
  onOpenAuthModal,
}: NotebookCanvasProps) {
  const { user } = useAuth()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [currentTitle, setCurrentTitle] = useState(title)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved')
  const [initialSnapshot, setInitialSnapshot] = useState<TLStoreSnapshot | null | undefined>(undefined)

  // Continuous Brush & Color controls (1 - 100%)
  const [isBrushPanelOpen, setIsBrushPanelOpen] = useState(false)
  const [stylePanelTab, setStylePanelTab] = useState<'brush' | 'text'>('brush')
  const [brushThickness, setBrushThickness] = useState(12)
  const [brushOpacity, setBrushOpacity] = useState(100)
  const [brushColor, setBrushColor] = useState('black')
  const [selectedFont, setSelectedFont] = useState<TLDefaultFontStyle>('sans')
  const [selectedAlign, setSelectedAlign] = useState<TLDefaultTextAlignStyle>('start')

  const imageInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<Editor | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const thicknessRef = useRef(brushThickness)
  const opacityRef = useRef(brushOpacity)
  const colorRef = useRef(brushColor)
  const fontRef = useRef(selectedFont)
  const alignRef = useRef(selectedAlign)
  const userRef = useRef(user)

  thicknessRef.current = brushThickness
  opacityRef.current = brushOpacity
  colorRef.current = brushColor
  fontRef.current = selectedFont
  alignRef.current = selectedAlign
  userRef.current = user

  const handleInsertImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !editorRef.current) return

    const fileList = Array.from(files)
    try {
      const centerPoint = editorRef.current.getViewportPageBounds().center
      await editorRef.current.putExternalContent({
        type: 'files',
        files: fileList,
        point: centerPoint,
      })

      // Cadangkan juga ke Supabase Storage jika terhubung akun
      if (userRef.current && isSupabaseConfigured && navigator.onLine) {
        for (const file of fileList) {
          const ext = file.name.split('.').pop() || 'png'
          const path = `${userRef.current.id}/${notebookId}/${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`
          supabase.storage.from('notebook-assets').upload(path, file).catch(console.error)
        }
      }
    } catch (err) {
      console.error('Failed to insert image:', err)
    }

    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

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
        let data = await getCanvasSnapshot(notebookId)

        // Jika online dan terautentikasi, cek apakah cloud memiliki snapshot
        if (user && navigator.onLine) {
          const cloud = await fetchCanvasSnapshotFromCloud(user.id, notebookId)
          if (cloud.snapshot) {
            data = cloud.snapshot
            // Simpan snapshot cloud terbaru ke lokal IndexedDB
            await saveCanvasSnapshot(notebookId, cloud.snapshot)
          }
        }

        if (isMounted) {
          setInitialSnapshot((data as TLStoreSnapshot) || null)
          setSaveStatus('saved')
        }
      } catch (err) {
        console.error('Failed to load canvas data:', err)
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
  }, [notebookId, user])

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

    // 1. Intercept newly created shapes to inject continuous thickness (scale)
    editor.store.sideEffects.registerBeforeCreateHandler('shape', (shape) => {
      if (shape.props && 'scale' in shape.props) {
        const scale = 0.2 + (thicknessRef.current / 100) * 7.8
        shape.props.scale = scale
      }
      return shape
    })

    // 2. Set initial continuous opacity, color, font, and text alignment
    editor.setOpacityForNextShapes(opacityRef.current / 100)
    editor.setStyleForNextShapes(DefaultColorStyle, colorRef.current as any)
    editor.setStyleForNextShapes(DefaultFontStyle, fontRef.current)
    editor.setStyleForNextShapes(DefaultTextAlignStyle, alignRef.current)

    // 3. Listen to selection changes to auto-detect text tool / text selection
    editor.on('change', () => {
      const selected = editor.getSelectedShapes()
      const hasText = selected.some((s) => s.type === 'text')
      const toolId = editor.getCurrentToolId()

      if (hasText || toolId === 'text') {
        const textShape = selected.find((s) => s.type === 'text')
        if (textShape && textShape.props) {
          if ('font' in textShape.props) {
            setSelectedFont(textShape.props.font as TLDefaultFontStyle)
          }
          if ('textAlign' in textShape.props) {
            setSelectedAlign(textShape.props.textAlign as TLDefaultTextAlignStyle)
          }
        }
      }
    })

    // 4. Listen to changes in the store for auto-saving
    const unlisten = editor.store.listen(() => {
      setSaveStatus('saving')
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(async () => {
        try {
          const snapshot = editor.store.getStoreSnapshot()
          const now = Date.now()
          await saveCanvasSnapshot(notebookId, snapshot)
          if (userRef.current && navigator.onLine) {
            syncCanvasSnapshotToCloud(userRef.current.id, notebookId, snapshot, now).catch(console.error)
          }
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

  const openBrushPanel = (tab: 'brush' | 'text') => {
    if (isBrushPanelOpen && stylePanelTab === tab) {
      setIsBrushPanelOpen(false)
    } else {
      setStylePanelTab(tab)
      setIsBrushPanelOpen(true)
    }
  }

  const fontLabel =
    selectedFont === 'sans'
      ? 'Sans'
      : selectedFont === 'serif'
      ? 'Serif'
      : selectedFont === 'mono'
      ? 'Mono'
      : 'Draw'

  return (
    <div className="flex flex-col w-full h-full bg-white select-none relative">
      {/* Top Bar - No Slop UI Standard */}
      <header className="h-12 border-b border-zinc-200 px-3 sm:px-4 flex items-center justify-between bg-white z-20 shrink-0">
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

        {/* Right side: Brush & Font Controls, Save indicator & Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Kuas Controller Toggle */}
          <button
            onClick={() => openBrushPanel('brush')}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
              isBrushPanelOpen && stylePanelTab === 'brush'
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-zinc-200'
            }`}
            title="Atur Ketebalan Kuas & Warna"
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span className="font-semibold">{brushThickness}%</span>
          </button>

          {/* Font & Teks Controller Toggle */}
          <button
            onClick={() => openBrushPanel('text')}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
              isBrushPanelOpen && stylePanelTab === 'text'
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-zinc-200'
            }`}
            title="Ganti Jenis Font & Gaya Teks"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-semibold">{fontLabel}</span>
          </button>

          {/* Sisipkan Gambar (Kamera / Galeri / File) */}
          <button
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md border bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-zinc-200 transition-colors"
            title="Sisipkan Gambar dari Galeri atau Kamera"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-semibold">Gambar</span>
          </button>

          <input
            type="file"
            ref={imageInputRef}
            onChange={handleInsertImage}
            accept="image/*"
            multiple
            className="hidden"
          />

          {/* Status Indicator */}
          <div className="flex items-center gap-1 text-xs text-zinc-500 ml-1">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-600" />
                <span className="hidden md:inline">Menyimpan...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline text-zinc-600">Tersimpan</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <span className="hidden md:inline text-red-600">Gagal simpan</span>
              </>
            )}
          </div>

          <div className="h-4 w-[1px] bg-zinc-200" />

          {/* Ekspor & Backup */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200/80 rounded transition-colors"
            title="Ekspor & Backup Catatan"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ekspor</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <div className="h-4 w-[1px] bg-zinc-200" />

          {/* User Account & Cloud Sync Menu */}
          <UserMenu onOpenAuthModal={onOpenAuthModal || (() => {})} />
        </div>
      </header>

      {/* Floating Brush & Text Style Controller Panel */}
      <BrushController
        editor={editorRef.current}
        isOpen={isBrushPanelOpen}
        onClose={() => setIsBrushPanelOpen(false)}
        initialTab={stylePanelTab}
        thickness={brushThickness}
        opacity={brushOpacity}
        selectedColor={brushColor}
        selectedFont={selectedFont}
        selectedAlign={selectedAlign}
        onThicknessChange={(t) => setBrushThickness(t)}
        onOpacityChange={(o) => setBrushOpacity(o)}
        onColorChange={(c) => setBrushColor(c)}
        onFontChange={(f) => setSelectedFont(f)}
        onAlignChange={(a) => setSelectedAlign(a)}
      />

      {/* Export & Backup Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        editor={editorRef.current}
        notebook={{
          id: notebookId,
          title: currentTitle,
          tags,
        }}
        onTitleChange={(newTitle) => {
          setCurrentTitle(newTitle)
          if (onTitleChange) onTitleChange(newTitle)
        }}
      />

      {/* Main Canvas Area */}
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
            components={{
              // Hide default S/M/L/XL style panel in favor of continuous 1-100% controls and clean font selector
              StylePanel: null,
            }}
            autoFocus
          />
        )}
      </main>
    </div>
  )
}
