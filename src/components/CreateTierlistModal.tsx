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

  useEffect(() => {
    if (!open) return
    setName('')
    setCategory(null)
    setError('')
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
    onCreate(trimmed, category)
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <h2>Nouvelle tierlist</h2>
        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Nom</span>
            <input
              autoFocus
              value={name}
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
            <button type="button" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="primary">
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
