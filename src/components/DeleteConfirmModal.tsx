import { AlertTriangle, X } from 'lucide-react'

interface DeleteConfirmModalProps {
  isOpen: boolean
  title: string
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function DeleteConfirmModal({
  isOpen,
  title,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-[1px]">
      <div className="bg-white border border-zinc-200 rounded-lg shadow-md max-w-sm w-full p-5 text-zinc-900">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-50 text-red-600 rounded-md shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Hapus Notebook?</h3>
            <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
              Notebook <strong className="text-zinc-900 font-medium">"{title}"</strong> beserta seluruh coretan dan catatan di dalamnya akan dihapus secara permanen.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium border border-zinc-200 rounded-md text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Hapus Permanen
          </button>
        </div>
      </div>
    </div>
  )
}
