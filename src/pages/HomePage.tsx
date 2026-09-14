import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreateTierlistModal } from '../components/CreateTierlistModal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { FilterMenu } from '../components/FilterMenu'
import type { SortId } from '../components/FilterMenu'
import { Logo } from '../components/Logo'
import { SkeletonGrid } from '../components/SkeletonGrid'
import { ThemeToggle } from '../components/ThemeToggle'
import { getCategory } from '../lib/categories'
import { useTierlists } from '../store/TierlistsContext'
import type { CategoryId } from '../types'

export function HomePage() {
  const { tierlists, loading, addTierlist, deleteTierlists } = useTierlists()
  const navigate = useNavigate()

  const [createOpen, setCreateOpen] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [categories, setCategories] = useState<CategoryId[]>([])
  const [sort, setSort] = useState<SortId>('recent')

  const visible = useMemo(() => {
    const filtered =
      categories.length === 0
        ? tierlists
        : tierlists.filter((item) => categories.includes(item.category))
    const sorted = [...filtered]
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    else if (sort === 'size') sorted.sort((a, b) => b.items.length - a.items.length)
    else sorted.sort((a, b) => b.updatedAt - a.updatedAt)
    return sorted
  }, [tierlists, categories, sort])

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
    setDeleting(true)
    window.setTimeout(() => {
      deleteTierlists(selected)
      setDeleting(false)
      setConfirmOpen(false)
      exitSelection()
    }, 420)
  }

  const allVisibleSelected =
    visible.length > 0 && visible.every((item) => selected.includes(item.id))

  return (
    <div className="page">
      <div className="topbar">
        <Logo compact />
        <ThemeToggle />
      </div>

      <header className="masthead">
        <div>
          <h1 className="wordmark">
            Tier<em>lists</em>
          </h1>
          <p className="tagline">
            {loading
              ? 'Chargement de la collection…'
              : `${tierlists.length} tierlist${tierlists.length > 1 ? 's' : ''} · LCK, LEC, LPL, LCP, Worlds, MSI`}
          </p>
        </div>
        <div className="masthead-actions">
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
              <button type="button" className="ghost" onClick={exitSelection}>
                Annuler
              </button>
            </>
          ) : (
            <>
              <FilterMenu
                categories={categories}
                sort={sort}
                onCategoriesChange={setCategories}
                onSortChange={setSort}
              />
              <button
                type="button"
                disabled={loading || tierlists.length === 0}
                onClick={() => setSelectionMode(true)}
              >
                Sélectionner
              </button>
              <button
                type="button"
                className="primary"
                disabled={loading}
                onClick={() => setCreateOpen(true)}
              >
                Créer une tierlist
              </button>
            </>
          )}
        </div>
      </header>

      {loading ? (
        <SkeletonGrid />
      ) : visible.length === 0 ? (
        <div className="empty reveal">
          <p>
            {tierlists.length === 0
              ? "Rien à classer pour l'instant."
              : 'Aucune tierlist ne correspond à ces filtres.'}
          </p>
          {tierlists.length === 0 ? (
            <button type="button" className="primary" onClick={() => setCreateOpen(true)}>
              Créer la première
            </button>
          ) : (
            <button type="button" onClick={() => setCategories([])}>
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <ul className="tierlist-grid">
          {visible.map((tierlist, index) => {
            const category = getCategory(tierlist.category)
            const isSelected = selected.includes(tierlist.id)
            return (
              <li
                key={tierlist.id}
                className="reveal"
                style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
              >
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
                    {tierlist.items.length} élément{tierlist.items.length > 1 ? 's' : ''} ·{' '}
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
        busy={deleting}
        title="Supprimer la sélection"
        message={`${selected.length} tierlist${selected.length > 1 ? 's seront supprimées' : ' sera supprimée'} définitivement.`}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
