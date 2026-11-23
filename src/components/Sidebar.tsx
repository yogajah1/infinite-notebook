import { useState } from 'react'
import {
  BookOpen,
  Plus,
  Search,
  LayoutGrid,
  X,
  Trash2,
} from 'lucide-react'
import type { Notebook } from '../db'
import { formatRelativeTime } from '../utils/date'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  notebooks: Notebook[]
  activeId: string | null
  onSelectNotebook: (id: string) => void
  onOpenCreateModal: () => void
  onOpenDashboard: () => void
  onDeleteNotebook: (notebook: Notebook) => void
}

export function Sidebar({
  isOpen,
  onClose,
  notebooks,
  activeId,
  onSelectNotebook,
  onOpenCreateModal,
  onOpenDashboard,
  onDeleteNotebook,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('all')

  // Extract all unique tags
  const allTags = Array.from(
    new Set(notebooks.flatMap((nb) => nb.tags || []))
  ).filter(Boolean)

  // Filter notebooks based on search and tag
  const filteredNotebooks = notebooks.filter((nb) => {
    const matchesSearch =
      nb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (nb.description && nb.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesTag = selectedTag === 'all' || (nb.tags && nb.tags.includes(selectedTag))
    return matchesSearch && matchesTag
  })

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-zinc-900/30 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-zinc-50 border-r border-zinc-200 flex flex-col transition-transform duration-150 ease-in-out shrink-0 select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* App Title & Close on Mobile */}
        <div className="h-12 px-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-zinc-900" />
            <span className="text-sm font-semibold text-zinc-900 tracking-tight">
              Notebook Belajar
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 rounded md:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Button: Buat Catatan Baru */}
        <div className="p-3 border-b border-zinc-200/80">
          <button
            onClick={() => {
              onOpenCreateModal()
              if (window.innerWidth < 768) onClose()
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catatan Baru</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari catatan..."
              className="w-full text-xs pl-7 pr-2 py-1.5 bg-white border border-zinc-200 rounded-md text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
            />
          </div>
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="px-3 py-2 flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedTag('all')}
              className={`text-[11px] px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                selectedTag === 'all'
                  ? 'bg-zinc-900 text-white font-medium'
                  : 'bg-zinc-200/60 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              Semua
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`text-[11px] px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                  selectedTag === tag
                    ? 'bg-zinc-900 text-white font-medium'
                    : 'bg-zinc-200/60 hover:bg-zinc-200 text-zinc-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Notebooks List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {filteredNotebooks.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 text-xs">
              Tidak ada catatan
            </div>
          ) : (
            filteredNotebooks.map((nb) => {
              const isActive = nb.id === activeId
              return (
                <div
                  key={nb.id}
                  onClick={() => {
                    onSelectNotebook(nb.id)
                    if (window.innerWidth < 768) onClose()
                  }}
                  className={`group relative flex items-start justify-between p-2 rounded-md cursor-pointer text-left transition-colors ${
                    isActive
                      ? 'bg-white border border-zinc-200 text-zinc-900 shadow-sm'
                      : 'hover:bg-zinc-200/50 text-zinc-700 border border-transparent'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-1">
                    <p className="text-xs font-medium truncate">{nb.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-500">
                      <span>{formatRelativeTime(nb.updatedAt)}</span>
                      {nb.tags && nb.tags[0] && (
                        <>
                          <span>•</span>
                          <span className="truncate">{nb.tags[0]}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Delete button (only show on hover or active) */}
                  {notebooks.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteNotebook(nb)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-600 rounded transition-opacity"
                      title="Hapus Notebook"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Bottom Nav: Buka Grid Dashboard */}
        <div className="p-2 border-t border-zinc-200 bg-zinc-50">
          <button
            onClick={() => {
              onOpenDashboard()
              if (window.innerWidth < 768) onClose()
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/60 rounded-md transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Lihat Semua di Dashboard</span>
          </button>
        </div>
      </aside>
    </>
  )
}
