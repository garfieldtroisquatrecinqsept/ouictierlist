import { useState } from 'react'
import type { DragEvent, FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getCategory } from '../lib/categories'
import { createId } from '../lib/storage'
import { useTierlists } from '../store/TierlistsContext'
import type { Tierlist } from '../types'

const POOL_ID = 'pool'

export function TierlistPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { getTierlist, updateTierlist, loading } = useTierlists()
  const [label, setLabel] = useState('')
  const [overId, setOverId] = useState<string | null>(null)

  const tierlist = getTierlist(id)

  if (loading) {
    return (
      <div className="page">
        <div className="page-loader">
          <span />
          <span />
          <span />
        </div>
      </div>
    )
  }

  if (!tierlist) {
    return (
      <div className="page">
        <h1 className="sheet-title">Introuvable</h1>
        <p className="tagline">Cette tierlist n'existe plus.</p>
        <p>
          <Link to="/">Retour à l'accueil</Link>
        </p>
      </div>
    )
  }

  const category = getCategory(tierlist.category)

  function itemById(current: Tierlist, itemId: string) {
    return current.items.find((item) => item.id === itemId)
  }

  function handleAddItem(event: FormEvent) {
    event.preventDefault()
    const trimmed = label.trim()
    if (!trimmed) return
    updateTierlist(id, (current) => {
      const item = { id: createId(), label: trimmed, image: null }
      return {
        ...current,
        items: [...current.items, item],
        poolItemIds: [...current.poolItemIds, item.id],
      }
    })
    setLabel('')
  }

  function moveItem(itemId: string, targetId: string) {
    updateTierlist(id, (current) => {
      const tiers = current.tiers.map((tier) => ({
        ...tier,
        itemIds: tier.itemIds.filter((value) => value !== itemId),
      }))
      const poolItemIds = current.poolItemIds.filter((value) => value !== itemId)

      if (targetId === POOL_ID) {
        return { ...current, tiers, poolItemIds: [...poolItemIds, itemId] }
      }

      return {
        ...current,
        poolItemIds,
        tiers: tiers.map((tier) =>
          tier.id === targetId ? { ...tier, itemIds: [...tier.itemIds, itemId] } : tier,
        ),
      }
    })
  }

  function removeItem(itemId: string) {
    updateTierlist(id, (current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== itemId),
      poolItemIds: current.poolItemIds.filter((value) => value !== itemId),
      tiers: current.tiers.map((tier) => ({
        ...tier,
        itemIds: tier.itemIds.filter((value) => value !== itemId),
      })),
    }))
  }

  function renderItem(itemId: string) {
    const item = itemById(tierlist!, itemId)
    if (!item) return null
    return (
      <div
        key={item.id}
        className="item"
        draggable
        onDragStart={(event) => event.dataTransfer.setData('text/plain', item.id)}
        onDoubleClick={() => removeItem(item.id)}
        title="Double-clic pour supprimer"
      >
        {item.label}
      </div>
    )
  }

  function dropZoneClass(base: string, targetId: string) {
    return overId === targetId ? `${base} over` : base
  }

  function dropHandlers(targetId: string) {
    return {
      onDragOver: (event: DragEvent) => {
        event.preventDefault()
        setOverId(targetId)
      },
      onDragLeave: () => setOverId((current) => (current === targetId ? null : current)),
      onDrop: (event: DragEvent) => {
        event.preventDefault()
        setOverId(null)
        const itemId = event.dataTransfer.getData('text/plain')
        if (itemId) moveItem(itemId, targetId)
      },
    }
  }

  return (
    <div className="page">
      <header className="sheet-header">
        <div>
          <button type="button" className="ghost" onClick={() => navigate('/')}>
            ← Toutes les tierlists
          </button>
          <h1 className="sheet-title">{tierlist.name}</h1>
          <p className="tagline">{category ? category.fullName : tierlist.category}</p>
        </div>
      </header>

      <section className="tiers">
        {tierlist.tiers.map((tier, index) => (
          <div
            key={tier.id}
            className="tier-row"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="tier-label">{tier.label}</div>
            <div className={dropZoneClass('tier-drop', tier.id)} {...dropHandlers(tier.id)}>
              {tier.itemIds.map(renderItem)}
            </div>
          </div>
        ))}
      </section>

      <section className="pool">
        <form onSubmit={handleAddItem} className="pool-form">
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Ajouter un joueur ou une équipe"
          />
          <button type="submit" className="primary">
            Ajouter
          </button>
        </form>
        <div className={dropZoneClass('pool-drop', POOL_ID)} {...dropHandlers(POOL_ID)}>
          {tierlist.poolItemIds.length === 0 ? (
            <p className="hint">Glisse un élément ici pour le retirer des tiers.</p>
          ) : (
            tierlist.poolItemIds.map(renderItem)
          )}
        </div>
      </section>
    </div>
  )
}
