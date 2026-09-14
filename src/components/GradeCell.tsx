import { useEffect, useRef, useState } from 'react'
import { GRADES, gradeColor } from '../lib/grades'

interface Props {
  value?: string
  label: string
  onPick: (grade: string | null) => void
}

export function GradeCell({ value, label, onPick }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className="gcell" ref={rootRef}>
      <button
        type="button"
        className={value ? 'gcell-box filled' : 'gcell-box'}
        style={value ? { color: gradeColor(value), borderColor: gradeColor(value) } : undefined}
        onClick={() => setOpen((current) => !current)}
        aria-label={`Note de ${label}`}
        aria-expanded={open}
      >
        {value ?? <span className="gcell-empty">—</span>}
      </button>

      {open ? (
        <div className="gcell-menu">
          <div className="gcell-menu-head">{label}</div>
          <div className="gcell-options">
            {GRADES.map((grade) => (
              <button
                key={grade}
                type="button"
                className={grade === value ? 'gcell-option on' : 'gcell-option'}
                style={
                  grade === value
                    ? { background: gradeColor(grade), borderColor: gradeColor(grade) }
                    : { color: gradeColor(grade) }
                }
                onClick={() => {
                  onPick(grade)
                  setOpen(false)
                }}
              >
                {grade}
              </button>
            ))}
          </div>
          {value ? (
            <button
              type="button"
              className="link gcell-clear"
              onClick={() => {
                onPick(null)
                setOpen(false)
              }}
            >
              Effacer
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
