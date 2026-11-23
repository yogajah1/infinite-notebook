import React, { useState } from 'react'
import { X, Tag, BookPlus } from 'lucide-react'

interface CreateNotebookModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: { title: string; description?: string; tags: string[] }) => Promise<void>
}

export function CreateNotebookModal({
  isOpen,
  onClose,
  onCreate,
}: CreateNotebookModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(['Belajar'])
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return

    try {
      setIsSubmitting(true)
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        tags: tags.length > 0 ? tags : ['Belajar'],
      })
      setTitle('')
      setDescription('')
      setTags(['Belajar'])
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-[1px]">
      <div className="bg-white border border-zinc-200 rounded-lg shadow-md max-w-md w-full p-5 text-zinc-900">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <BookPlus className="w-5 h-5 text-zinc-700" />
            <h2 className="text-base font-semibold">Buat Notebook Baru</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Judul Catatan / Topik Belajar <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Belajar Python Dasar, Aljabar Linear"
              className="w-full text-sm px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Deskripsi Singkat (Opsional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan target belajar atau cakupan materi..."
              className="w-full text-sm px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Tag / Kategori
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  placeholder="Ketik tag lalu tekan Tambah"
                  className="w-full text-sm pl-8 pr-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                />
              </div>
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 text-xs font-medium border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors text-zinc-700"
              >
                Tambah
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded border border-zinc-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium border border-zinc-200 rounded-md text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Membuat...' : 'Buat Notebook'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
