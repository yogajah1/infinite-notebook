import { useState } from 'react'
import { NotebookCanvas } from './components/NotebookCanvas'

export default function App() {
  const [activeNotebook, setActiveNotebook] = useState({
    id: 'default-board',
    title: 'Catatan Belajar Utama',
  })

  return (
    <div className="w-full h-full">
      <NotebookCanvas
        notebookId={activeNotebook.id}
        title={activeNotebook.title}
        onTitleChange={(newTitle) =>
          setActiveNotebook((prev) => ({ ...prev, title: newTitle }))
        }
      />
    </div>
  )
}
