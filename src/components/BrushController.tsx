import { useState, useEffect } from 'react'
import {
  Editor,
  DefaultColorStyle,
  TLShapePartial,
  TLDefaultColorStyle,
} from 'tldraw'
import { Sliders, X } from 'lucide-react'

interface BrushControllerProps {
  editor: Editor | null
  isOpen: boolean
  onClose: () => void
  thickness: number
  opacity: number
  selectedColor: string
  onThicknessChange: (thickness: number) => void
  onOpacityChange: (opacity: number) => void
  onColorChange: (color: string) => void
}

const COLOR_PALETTE: { name: TLDefaultColorStyle; hex: string; label: string }[] = [
  { name: 'black', hex: '#1e1e1e', label: 'Hitam' },
  { name: 'grey', hex: '#71717a', label: 'Abu-abu' },
  { name: 'blue', hex: '#2563eb', label: 'Biru' },
  { name: 'light-blue', hex: '#38bdf8', label: 'Biru Muda' },
  { name: 'green', hex: '#16a34a', label: 'Hijau' },
  { name: 'light-green', hex: '#4ade80', label: 'Hijau Muda' },
  { name: 'yellow', hex: '#eab308', label: 'Kuning' },
  { name: 'orange', hex: '#f97316', label: 'Oranye' },
  { name: 'red', hex: '#dc2626', label: 'Merah' },
  { name: 'light-red', hex: '#f87171', label: 'Merah Muda' },
  { name: 'violet', hex: '#7c3aed', label: 'Ungu' },
  { name: 'white', hex: '#ffffff', label: 'Putih' },
]

export function BrushController({
  editor,
  isOpen,
  onClose,
  thickness,
  opacity,
  selectedColor,
  onThicknessChange,
  onOpacityChange,
  onColorChange,
}: BrushControllerProps) {
  const [localThickness, setLocalThickness] = useState(thickness)
  const [localOpacity, setLocalOpacity] = useState(opacity)

  useEffect(() => {
    setLocalThickness(thickness)
  }, [thickness])

  useEffect(() => {
    setLocalOpacity(opacity)
  }, [opacity])

  if (!isOpen) return null

  const handleThicknessChange = (val: number) => {
    const clamped = Math.max(1, Math.min(100, Math.round(val)))
    setLocalThickness(clamped)
    onThicknessChange(clamped)

    if (editor) {
      // Calculate continuous scale for tldraw shapes (1 maps to 0.25, 100 maps to 8.0)
      const scale = 0.2 + (clamped / 100) * 7.8
      const selected = editor.getSelectedShapes()
      if (selected.length > 0) {
        const updates: TLShapePartial[] = selected
          .filter((s) => s.props && 'scale' in s.props)
          .map(
            (s) =>
              ({
                id: s.id,
                type: s.type,
                props: { scale },
              } as TLShapePartial)
          )
        if (updates.length > 0) {
          editor.updateShapes(updates)
        }
      }
    }
  }

  const handleOpacityChange = (val: number) => {
    const clamped = Math.max(1, Math.min(100, Math.round(val)))
    setLocalOpacity(clamped)
    onOpacityChange(clamped)

    if (editor) {
      const opacityFloat = clamped / 100
      editor.setOpacityForNextShapes(opacityFloat)
      const selected = editor.getSelectedShapes()
      if (selected.length > 0) {
        editor.setOpacityForSelectedShapes(opacityFloat)
      }
    }
  }

  const handleColorSelect = (colorName: TLDefaultColorStyle) => {
    onColorChange(colorName)
    if (editor) {
      editor.setStyleForNextShapes(DefaultColorStyle, colorName)
      const selected = editor.getSelectedShapes()
      if (selected.length > 0) {
        editor.setStyleForSelectedShapes(DefaultColorStyle, colorName)
      }
    }
  }

  const activeColorObj =
    COLOR_PALETTE.find((c) => c.name === selectedColor) || COLOR_PALETTE[0]

  return (
    <div className="absolute top-14 left-3 sm:left-4 z-30 bg-white border border-zinc-200 rounded-lg shadow-md p-4 w-72 sm:w-80 text-zinc-900 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-zinc-700" />
          <span className="text-xs font-semibold text-zinc-800">
            Pengaturan Kuas & Warna
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded"
          title="Tutup"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-3 space-y-4">
        {/* Visual Preview */}
        <div className="flex items-center justify-between p-2.5 bg-zinc-50 border border-zinc-100 rounded-md">
          <span className="text-[11px] font-medium text-zinc-500">Preview Kuas:</span>
          <div className="flex items-center justify-center w-16 h-10 bg-white border border-zinc-200 rounded overflow-hidden">
            <div
              style={{
                width: `${Math.max(2, Math.min(36, localThickness * 0.38))}px`,
                height: `${Math.max(2, Math.min(36, localThickness * 0.38))}px`,
                backgroundColor: activeColorObj.hex,
                opacity: localOpacity / 100,
                borderRadius: '50%',
              }}
            />
          </div>
        </div>

        {/* 1. Ketebalan (1 - 100%) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-zinc-700">
              Ketebalan Garis / Kuas
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max="100"
                value={localThickness}
                onChange={(e) => handleThicknessChange(Number(e.target.value))}
                className="w-12 text-center text-xs font-semibold px-1 py-0.5 border border-zinc-200 rounded bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <span className="text-xs text-zinc-500 font-medium">%</span>
            </div>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={localThickness}
            onChange={(e) => handleThicknessChange(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
            <span>1% (Halus)</span>
            <span>50%</span>
            <span>100% (Tebal)</span>
          </div>
        </div>

        {/* 2. Kepekatan / Opacity Warna (1% - 100%) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-zinc-700">
              Kepekatan Warna (Opacity)
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max="100"
                value={localOpacity}
                onChange={(e) => handleOpacityChange(Number(e.target.value))}
                className="w-12 text-center text-xs font-semibold px-1 py-0.5 border border-zinc-200 rounded bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <span className="text-xs text-zinc-500 font-medium">%</span>
            </div>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={localOpacity}
            onChange={(e) => handleOpacityChange(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
            <span>1% (Transparan)</span>
            <span>50%</span>
            <span>100% (Penuh)</span>
          </div>
        </div>

        {/* 3. Pilihan Warna */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-2">
            Pilihan Warna
          </label>
          <div className="grid grid-cols-6 gap-2">
            {COLOR_PALETTE.map((c) => {
              const isSelected = selectedColor === c.name
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleColorSelect(c.name)}
                  title={`${c.label} (${c.name})`}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-transform ${
                    isSelected
                      ? 'border-zinc-900 ring-2 ring-zinc-900/20 scale-105'
                      : 'border-zinc-200 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {isSelected && (
                    <div
                      className={`w-2 h-2 rounded-full ${
                        c.name === 'white' || c.name === 'yellow'
                          ? 'bg-zinc-900'
                          : 'bg-white'
                      }`}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
