import { useState } from 'react'
import {
  Plus,
  Search,
  BookOpen,
  Calendar,
  Trash2,
  Tag,
  ArrowRight,
} from 'lucide-react'
import type { Notebook } from '../db'
import { formatRelativeTime } from '../utils/date'

interface DashboardProps {
  notebooks: Notebook[]
  onSelectNotebook: (id: string) => void
  onOpenCreateModal: () => void
  onDeleteNotebook: (notebook: Notebook) => void
}

export function Dashboard({
  notebooks,
  onSelectNotebook,
  onOpenCreateModal,
  onDeleteNotebook,
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('all')

  const allTags = Array.from(
    new Set(notebooks.flatMap((nb) => nb.tags || []))
  ).filter(Boolean)

  const filteredNotebooks = notebooks.filter((nb) => {
    const matchesSearch =
      nb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (nb.description && nb.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesTag = selectedTag === 'all' || (nb.tags && nb.tags.includes(selectedTag))
    return matchesSearch && matchesTag
  })

  return (
    <div className="flex-1 h-full overflow-y-auto bg-zinc-50 p-4 sm:p-6 lg:p-8 select-none">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              Dashboard Catatan & Target Belajar
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Kelola kanvas papan tulis dan target materi belajar Anda di satu tempat.
            </p>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-md transition-colors shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Notebook Baru</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan judul atau deskripsi..."
              className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
            />
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedTag('all')}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                selectedTag === 'all'
                  ? 'bg-zinc-900 text-white font-medium'
                  : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              Semua ({notebooks.length})
            </button>
            {allTags.map((tag) => {
              const count = notebooks.filter((n) => n.tags?.includes(tag)).length
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                    selectedTag === tag
                      ? 'bg-zinc-900 text-white font-medium'
                      : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {tag} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Notebooks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotebooks.map((nb) => (
            <div
              key={nb.id}
              onClick={() => onSelectNotebook(nb.id)}
              className="group bg-white border border-zinc-200 rounded-lg p-4 flex flex-col justify-between hover:border-zinc-300 hover:shadow-sm transition-all cursor-pointer text-left"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-zinc-100 text-zinc-700 rounded">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-zinc-700 transition-colors line-clamp-1">
                      {nb.title}
                    </h3>
                  </div>

                  {notebooks.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteNotebook(nb)
                      }}
                      className="p-1 text-zinc-400 hover:text-red-600 hover:bg-zinc-100 rounded transition-colors"
                      title="Hapus Notebook"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {nb.description && (
                  <p className="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed">
                    {nb.description}
                  </p>
                )}

                {/* Tags */}
                {nb.tags && nb.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {nb.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-[10px] font-medium bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded border border-zinc-200"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatRelativeTime(nb.updatedAt)}
                </span>
                <span className="inline-flex items-center gap-1 text-zinc-700 font-medium group-hover:translate-x-0.5 transition-transform">
                  Buka Kanvas
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}

          {/* New Notebook Dotted Card */}
          <div
            onClick={onOpenCreateModal}
            className="border border-dashed border-zinc-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-zinc-400 hover:bg-zinc-100/50 transition-colors cursor-pointer min-h-[160px]"
          >
            <div className="p-2.5 bg-zinc-100 text-zinc-600 rounded-full mb-2">
              <Plus className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-zinc-800">Tambah Notebook Baru</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Mulai topik belajar atau kanvas baru</p>
          </div>
        </div>
      </div>
    </div>
  )
}
