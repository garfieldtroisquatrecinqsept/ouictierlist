import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { CATEGORIES } from '../lib/categories'
import type { CategoryId } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  onCreate: (name: string, category: CategoryId) => void
}

export function CreateTierlistModal({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<CategoryId | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setName('')
    setCategory(null)
    setError('')
    setSubmitting(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Donne un nom à la tierlist.')
      return
    }
    if (!category) {
      setError('Choisis une catégorie.')
      return
    }
    setError('')
    setSubmitting(true)
    window.setTimeout(() => onCreate(trimmed, category), 420)
  }

  return (
    <div className="modal-backdrop" onMouseDown={submitting ? undefined : onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <h2>Nouvelle tierlist</h2>
        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Nom</span>
            <input
              autoFocus
              value={name}
              disabled={submitting}
              onChange={(event) => setName(event.target.value)}
              placeholder="Top laners 2026"
            />
          </label>

          <fieldset className="field">
            <legend>Catégorie</legend>
            <div className="category-grid">
              {CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={submitting}
                  className={category === item.id ? 'category-option selected' : 'category-option'}
                  onClick={() => setCategory(item.id)}
                >
                  <strong>{item.label}</strong>
                  <span>{item.fullName}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {error ? <p className="error">{error}</p> : null}

          <div className="modal-actions">
            <button type="button" className="ghost" disabled={submitting} onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? <span className="spinner" /> : null}
              {submitting ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
