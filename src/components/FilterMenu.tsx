import { useEffect, useRef, useState } from 'react'
import { CATEGORIES } from '../lib/categories'
import type { CategoryId } from '../types'

export type SortId = 'recent' | 'name' | 'size'

const SORTS: { id: SortId; label: string }[] = [
  { id: 'recent', label: 'Modifiées récemment' },
  { id: 'name', label: 'Nom (A → Z)' },
  { id: 'size', label: "Nombre d'éléments" },
]

interface Props {
  categories: CategoryId[]
  sort: SortId
  onCategoriesChange: (next: CategoryId[]) => void
  onSortChange: (next: SortId) => void
}

export function FilterMenu({ categories, sort, onCategoriesChange, onSortChange }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const activeCount = categories.length + (sort === 'recent' ? 0 : 1)

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

  function toggleCategory(id: CategoryId) {
    onCategoriesChange(
      categories.includes(id) ? categories.filter((value) => value !== id) : [...categories, id],
    )
  }

  function reset() {
    onCategoriesChange([])
    onSortChange('recent')
  }

  return (
    <div className="filter-root" ref={rootRef}>
      <button
        type="button"
        className={open || activeCount > 0 ? 'filter-trigger active' : 'filter-trigger'}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
          <path d="M3 5h18M6 12h12M10 19h4" />
        </svg>
        Filtres
        {activeCount > 0 ? <span className="filter-count">{activeCount}</span> : null}
      </button>

      {open ? (
        <div className="filter-panel">
          <div className="filter-section">
            <div className="filter-section-head">
              <span>Catégories</span>
              {categories.length > 0 ? (
                <button type="button" className="link" onClick={() => onCategoriesChange([])}>
                  Effacer
                </button>
              ) : null}
            </div>
            <div className="filter-options">
              {CATEGORIES.map((category) => {
                const checked = categories.includes(category.id)
                return (
                  <button
                    key={category.id}
                    type="button"
                    className={checked ? 'filter-option checked' : 'filter-option'}
                    onClick={() => toggleCategory(category.id)}
                    aria-pressed={checked}
                  >
                    <span className="filter-box">
                      {checked ? (
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                    </span>
                    <span className="filter-option-label">
                      <strong>{category.label}</strong>
                      <small>{category.fullName}</small>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-section-head">
              <span>Trier par</span>
            </div>
            <div className="filter-options">
              {SORTS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={sort === option.id ? 'filter-option checked' : 'filter-option'}
                  onClick={() => onSortChange(option.id)}
                  aria-pressed={sort === option.id}
                >
                  <span className="filter-radio">{sort === option.id ? <i /> : null}</span>
                  <span className="filter-option-label">
                    <strong>{option.label}</strong>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="filter-footer">
            <button type="button" className="link" onClick={reset} disabled={activeCount === 0}>
              Tout réinitialiser
            </button>
            <button type="button" className="primary" onClick={() => setOpen(false)}>
              Fermer
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
