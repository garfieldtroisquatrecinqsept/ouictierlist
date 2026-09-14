import { useEffect, useRef, useState } from 'react'
import { EXPORT_BACKGROUNDS, backgroundCss, saveChoice } from '../lib/exportImage'
import type { ExportChoice } from '../lib/exportImage'

interface Props {
  choice: ExportChoice
  onChoose: (choice: ExportChoice) => void
  onExport: () => void
  busy?: boolean
  label?: string
}

export function ExportControls({
  choice,
  onChoose,
  onExport,
  busy = false,
  label = 'Exporter en image',
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function setChoice(next: ExportChoice) {
    saveChoice(next)
    onChoose(next)
  }

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function pickImage(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setChoice({ id: 'custom', custom: String(reader.result) })
    reader.readAsDataURL(file)
  }

  const preview = backgroundCss(choice)

  return (
    <div className="export-controls" ref={rootRef}>
      <button
        type="button"
        className="bg-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        title="Fond du plateau et de l'image exportée"
      >
        <span className="bg-dot" style={preview ? { background: preview } : undefined} />
        Fond
      </button>

      {open ? (
        <div className="bg-menu">
          <div className="bg-grid">
            {EXPORT_BACKGROUNDS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={choice.id === entry.id ? 'bg-swatch on' : 'bg-swatch'}
                onClick={() => setChoice({ id: entry.id })}
                title={entry.label}
              >
                <span style={entry.css ? { background: entry.css } : undefined} />
                {entry.label}
              </button>
            ))}
          </div>

          <button type="button" className="bg-import" onClick={() => fileRef.current?.click()}>
            {choice.id === 'custom' && preview ? (
              <span className="bg-import-thumb" style={{ background: preview }} />
            ) : null}
            {choice.id === 'custom' ? 'Changer mon image de fond' : 'Ouvrir une image de mon PC'}
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => pickImage(event.target.files?.[0])}
          />
        </div>
      ) : null}

      <button type="button" onClick={onExport} disabled={busy}>
        {busy ? <span className="spinner" /> : null}
        {busy ? 'Export…' : label}
      </button>
    </div>
  )
}
