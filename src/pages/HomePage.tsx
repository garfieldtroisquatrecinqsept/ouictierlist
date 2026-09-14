import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreateTierlistModal } from '../components/CreateTierlistModal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CATEGORIES, getCategory } from '../lib/categories'
import { useTierlists } from '../store/TierlistsContext'
import type { CategoryId } from '../types'

export function HomePage() {
  const { tierlists, addTierlist, deleteTierlists } = useTierlists()
  const navigate = useNavigate()

  const [createOpen, setCreateOpen] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [filter, setFilter] = useState<CategoryId | 'all'>('all')

  const visible = useMemo(
    () => (filter === 'all' ? tierlists : tierlists.filter((item) => item.category === filter)),
    [tierlists, filter],
  )

  function toggleSelection(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    )
  }

  function exitSelection() {
    setSelectionMode(false)
    setSelected([])
  }

  function handleCardClick(id: string) {
    if (selectionMode) {
      toggleSelection(id)
      return
    }
    navigate(`/tierlist/${id}`)
  }

  function handleCreate(name: string, category: CategoryId) {
    const created = addTierlist(name, category)
    setCreateOpen(false)
    navigate(`/tierlist/${created.id}`)
  }

  function handleDelete() {
    deleteTierlists(selected)
    setConfirmOpen(false)
    exitSelection()
  }

  const allVisibleSelected = visible.length > 0 && visible.every((item) => selected.includes(item.id))

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Tierlists</h1>
          <p className="subtitle">{tierlists.length} tierlist(s) enregistrée(s)</p>
        </div>
        <div className="header-actions">
          {selectionMode ? (
            <>
              <button
                type="button"
                onClick={() =>
                  setSelected(allVisibleSelected ? [] : visible.map((item) => item.id))
                }
              >
                {allVisibleSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
              <button
                type="button"
                className="danger"
                disabled={selected.length === 0}
                onClick={() => setConfirmOpen(true)}
              >
                Supprimer ({selected.length})
              </button>
              <button type="button" onClick={exitSelection}>
                Annuler
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={tierlists.length === 0}
                onClick={() => setSelectionMode(true)}
              >
                Sélectionner
              </button>
              <button type="button" className="primary" onClick={() => setCreateOpen(true)}>
                Créer une tierlist
              </button>
            </>
          )}
        </div>
      </header>

      <nav className="filters">
        <button
          type="button"
          className={filter === 'all' ? 'chip selected' : 'chip'}
          onClick={() => setFilter('all')}
        >
          Toutes
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            className={filter === category.id ? 'chip selected' : 'chip'}
            onClick={() => setFilter(category.id)}
          >
            {category.label}
          </button>
        ))}
      </nav>

      {visible.length === 0 ? (
        <div className="empty">
          <p>Aucune tierlist ici.</p>
          <button type="button" className="primary" onClick={() => setCreateOpen(true)}>
            Créer la première
          </button>
        </div>
      ) : (
        <ul className="tierlist-grid">
          {visible.map((tierlist) => {
            const category = getCategory(tierlist.category)
            const isSelected = selected.includes(tierlist.id)
            return (
              <li key={tierlist.id}>
                <article
                  className={isSelected ? 'tierlist-card selected' : 'tierlist-card'}
                  onClick={() => handleCardClick(tierlist.id)}
                >
                  {selectionMode ? (
                    <input
                      type="checkbox"
                      className="card-check"
                      checked={isSelected}
                      onChange={() => toggleSelection(tierlist.id)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  ) : null}
                  <span className="badge">{category ? category.label : tierlist.category}</span>
                  <h2>{tierlist.name}</h2>
                  <p className="meta">
                    {tierlist.items.length} élément(s) ·{' '}
                    {new Date(tierlist.updatedAt).toLocaleDateString('fr-FR')}
                  </p>
                </article>
              </li>
            )
          })}
        </ul>
      )}

      <CreateTierlistModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Supprimer les tierlists"
        message={`${selected.length} tierlist(s) vont être supprimées définitivement.`}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
