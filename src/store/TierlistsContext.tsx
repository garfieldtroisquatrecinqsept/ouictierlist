import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { CategoryId, Tierlist } from '../types'
import { createTierlist, loadTierlists, saveTierlists } from '../lib/storage'

interface TierlistsContextValue {
  tierlists: Tierlist[]
  addTierlist: (name: string, category: CategoryId) => Tierlist
  updateTierlist: (id: string, updater: (tierlist: Tierlist) => Tierlist) => void
  deleteTierlists: (ids: string[]) => void
  getTierlist: (id: string) => Tierlist | undefined
}

const TierlistsContext = createContext<TierlistsContextValue | null>(null)

export function TierlistsProvider({ children }: { children: ReactNode }) {
  const [tierlists, setTierlists] = useState<Tierlist[]>(() => loadTierlists())

  useEffect(() => {
    saveTierlists(tierlists)
  }, [tierlists])

  const addTierlist = useCallback((name: string, category: CategoryId) => {
    const tierlist = createTierlist(name, category)
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
    () => ({ tierlists, addTierlist, updateTierlist, deleteTierlists, getTierlist }),
    [tierlists, addTierlist, updateTierlist, deleteTierlists, getTierlist],
  )

  return <TierlistsContext.Provider value={value}>{children}</TierlistsContext.Provider>
}

export function useTierlists(): TierlistsContextValue {
  const context = useContext(TierlistsContext)
  if (!context) throw new Error('useTierlists must be used inside TierlistsProvider')
  return context
}
