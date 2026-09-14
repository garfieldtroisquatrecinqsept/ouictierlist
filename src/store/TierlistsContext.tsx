import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { CategoryId, Tierlist, TierlistMode } from '../types'
import { createTierlist, loadTierlists, saveTierlists } from '../lib/storage'

const MIN_LOADING_MS = 550

interface TierlistsContextValue {
  tierlists: Tierlist[]
  loading: boolean
  addTierlist: (name: string, category: CategoryId, mode: TierlistMode) => Tierlist
  updateTierlist: (id: string, updater: (tierlist: Tierlist) => Tierlist) => void
  deleteTierlists: (ids: string[]) => void
  getTierlist: (id: string) => Tierlist | undefined
}

const TierlistsContext = createContext<TierlistsContextValue | null>(null)

export function TierlistsProvider({ children }: { children: ReactNode }) {
  const [tierlists, setTierlists] = useState<Tierlist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const startedAt = performance.now()
    const stored = loadTierlists().map((item) => ({
      ...item,
      mode: item.mode ?? 'tiers',
      grades: item.grades ?? {},
      validatedTeams: item.validatedTeams ?? [],
    }))
    const remaining = Math.max(0, MIN_LOADING_MS - (performance.now() - startedAt))
    const timer = setTimeout(() => {
      setTierlists(stored)
      setLoading(false)
    }, remaining)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (loading) return
    saveTierlists(tierlists)
  }, [tierlists, loading])

  const addTierlist = useCallback((name: string, category: CategoryId, mode: TierlistMode) => {
    const tierlist = createTierlist(name, category, mode)
    setTierlists((current) => [tierlist, ...current])
    return tierlist
  }, [])

  const updateTierlist = useCallback((id: string, updater: (tierlist: Tierlist) => Tierlist) => {
    setTierlists((current) =>
      current.map((tierlist) =>
        tierlist.id === id ? { ...updater(tierlist), updatedAt: Date.now() } : tierlist,
      ),
    )
  }, [])

  const deleteTierlists = useCallback((ids: string[]) => {
    const removed = new Set(ids)
    setTierlists((current) => current.filter((tierlist) => !removed.has(tierlist.id)))
  }, [])

  const getTierlist = useCallback(
    (id: string) => tierlists.find((tierlist) => tierlist.id === id),
    [tierlists],
  )

  const value = useMemo(
    () => ({ tierlists, loading, addTierlist, updateTierlist, deleteTierlists, getTierlist }),
    [tierlists, loading, addTierlist, updateTierlist, deleteTierlists, getTierlist],
  )

  return <TierlistsContext.Provider value={value}>{children}</TierlistsContext.Provider>
}

export function useTierlists(): TierlistsContextValue {
  const context = useContext(TierlistsContext)
  if (!context) throw new Error('useTierlists must be used inside TierlistsProvider')
  return context
}
