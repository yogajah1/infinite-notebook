import { useState, useRef } from 'react'
import {
  X,
  Image,
  FileCode,
  FileImage,
  Printer,
  Download,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import type { Editor } from 'tldraw'
import {
  exportCanvasAsImage,
  exportNotebookAsJson,
  importNotebookFromJson,
  printCanvasDocument,
} from '../utils/export'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  editor: Editor | null
  notebook: {
    id: string
    title: string
    tags: string[]
    description?: string
  }
  onTitleChange?: (newTitle: string) => void
}

export function ExportModal({
  isOpen,
  onClose,
  editor,
  notebook,
  onTitleChange,
}: ExportModalProps) {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen || !editor) return null

  const handleExportImage = async (format: 'png' | 'svg' | 'jpeg') => {
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const res = await exportCanvasAsImage(editor, format, notebook.title)
    setLoading(false)

    if (res.success) {
      setSuccessMsg(`Berhasil mengekspor gambar ${format.toUpperCase()}`)
      setTimeout(() => onClose(), 1200)
    } else {
      setErrorMsg(res.error || `Gagal mengekspor ${format}`)
    }
  }

  const handleExportJson = () => {
    setErrorMsg(null)
    setSuccessMsg(null)
    const res = exportNotebookAsJson(editor, notebook)
    if (res.success) {
      setSuccessMsg('File backup JSON berhasil diunduh')
      setTimeout(() => onClose(), 1200)
    } else {
      setErrorMsg(res.error || 'Gagal membuat backup')
    }
  }

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const res = await importNotebookFromJson(file, editor)
    setLoading(false)

    if (res.success) {
      setSuccessMsg('Catatan berhasil dipulihkan dari backup')
      if (res.metadata?.title && onTitleChange) {
        onTitleChange(res.metadata.title)
      }
      setTimeout(() => onClose(), 1500)
    } else {
      setErrorMsg(res.error || 'Gagal mengimpor file backup')
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePrint = () => {
    onClose()
    setTimeout(() => {
      printCanvasDocument()
    }, 250)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs no-print">
      <div className="bg-white border border-zinc-200 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">
              Ekspor & Backup Catatan
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Simpan catatan &ldquo;{notebook.title}&rdquo; ke format lain
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mx-5 mt-4 flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-5 mt-4 flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-700 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Options List */}
        <div className="p-5 space-y-2">
          {/* Section: Format Gambar */}
          <p className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase mb-2">
            Format Gambar
          </p>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleExportImage('png')}
              disabled={loading}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50/80 active:bg-zinc-100 text-center transition-all disabled:opacity-50 group"
            >
              <Image className="w-5 h-5 text-zinc-600 group-hover:text-zinc-900 mb-1.5" />
              <span className="text-xs font-semibold text-zinc-800">PNG</span>
              <span className="text-[10px] text-zinc-400">Transparan</span>
            </button>

            <button
              onClick={() => handleExportImage('svg')}
              disabled={loading}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50/80 active:bg-zinc-100 text-center transition-all disabled:opacity-50 group"
            >
              <FileCode className="w-5 h-5 text-zinc-600 group-hover:text-zinc-900 mb-1.5" />
              <span className="text-xs font-semibold text-zinc-800">SVG</span>
              <span className="text-[10px] text-zinc-400">Vektor Tajam</span>
            </button>

            <button
              onClick={() => handleExportImage('jpeg')}
              disabled={loading}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50/80 active:bg-zinc-100 text-center transition-all disabled:opacity-50 group"
            >
              <FileImage className="w-5 h-5 text-zinc-600 group-hover:text-zinc-900 mb-1.5" />
              <span className="text-xs font-semibold text-zinc-800">JPEG</span>
              <span className="text-[10px] text-zinc-400">Ukuran Ringkas</span>
            </button>
          </div>

          {/* Section: Dokumen Cetak & Backup */}
          <p className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase pt-3 mb-2">
            Dokumen & Backup Data
          </p>

          <button
            onClick={handlePrint}
            disabled={loading}
            className="w-full flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Printer className="w-4 h-4 text-zinc-600 shrink-0" />
              <div>
                <p className="text-xs font-medium text-zinc-900">Cetak / Simpan PDF</p>
                <p className="text-[11px] text-zinc-500">Dialog cetak browser untuk print dokumen atau simpan PDF</p>
              </div>
            </div>
            <span className="text-[11px] font-medium text-zinc-400">Print</span>
          </button>

          <button
            onClick={handleExportJson}
            disabled={loading}
            className="w-full flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Download className="w-4 h-4 text-zinc-600 shrink-0" />
              <div>
                <p className="text-xs font-medium text-zinc-900">Cadangkan File JSON (.notebook.json)</p>
                <p className="text-[11px] text-zinc-500">Unduh seluruh isi kanvas dan coretan untuk backup mandiri</p>
              </div>
            </div>
            <span className="text-[11px] font-medium text-zinc-400">Unduh</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full flex items-center justify-between p-2.5 rounded-lg border border-dashed border-zinc-300 hover:border-zinc-900 hover:bg-zinc-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Upload className="w-4 h-4 text-zinc-600 shrink-0" />
              <div>
                <p className="text-xs font-medium text-zinc-900">Impor / Pulihkan dari File Backup</p>
                <p className="text-[11px] text-zinc-500">Muat file *.notebook.json yang telah dicadangkan sebelumnya</p>
              </div>
            </div>
            <span className="text-[11px] font-medium text-zinc-500">Pilih File</span>
          </button>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJson}
            accept=".json,.notebook.json"
            className="hidden"
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-700" />}
            <span className="text-[11px]">
              {loading ? 'Sedang memproses dokumen...' : 'Pilih format yang diinginkan'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded text-xs font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
