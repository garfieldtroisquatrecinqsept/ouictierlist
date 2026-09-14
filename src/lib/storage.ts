import type { CategoryId, Tier, Tierlist } from '../types'

const STORAGE_KEY = 'tierlists.v1'

export const DEFAULT_TIER_LABELS = ['S', 'A', 'B', 'C', 'D']

export function createId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function createDefaultTiers(): Tier[] {
  return DEFAULT_TIER_LABELS.map((label) => ({
    id: createId(),
    label,
    itemIds: [],
  }))
}

export function createTierlist(name: string, category: CategoryId): Tierlist {
  const now = Date.now()
  return {
    id: createId(),
    name,
    category,
    tiers: createDefaultTiers(),
    items: [],
    poolItemIds: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function loadTierlists(): Tierlist[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as Tierlist[]
  } catch {
    return []
  }
}

export function saveTierlists(tierlists: Tierlist[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tierlists))
  } catch {
    return
  }
}
