import { useEffect, useRef, useState } from 'react'
import {
  EXPORT_BACKGROUNDS,
  backgroundCss,
  loadChoice,
  saveChoice,
} from '../lib/exportImage'
import type { ExportChoice } from '../lib/exportImage'

interface Props {
  onExport: (choice: ExportChoice) => void
  busy?: boolean
  label?: string
}

export function ExportControls({ onExport, busy = false, label = 'Exporter en image' }: Props) {
  const [choice, setChoice] = useState<ExportChoice>(() => loadChoice())
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    saveChoice(choice)
  }, [choice])

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
        title="Fond de l'image exportée"
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
            <button
              type="button"
              className={choice.id === 'custom' ? 'bg-swatch on' : 'bg-swatch'}
              onClick={() => fileRef.current?.click()}
              title="Image personnalisée"
            >
              <span
                style={
                  choice.id === 'custom' && preview ? { background: preview } : undefined
                }
              />
              Image
            </button>
          </div>

          <label className="bg-custom">
            <span>Couleur perso</span>
            <input
              type="color"
              value={
                choice.id === 'custom' && choice.custom?.startsWith('#') ? choice.custom : '#1d3a63'
              }
              onChange={(event) => setChoice({ id: 'custom', custom: event.target.value })}
            />
          </label>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => pickImage(event.target.files?.[0])}
          />
        </div>
      ) : null}

      <button type="button" onClick={() => onExport(choice)} disabled={busy}>
        {busy ? <span className="spinner" /> : null}
        {busy ? 'Export…' : label}
      </button>
    </div>
  )
}
