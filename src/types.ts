export type CategoryId = 'lck' | 'lec' | 'lpl' | 'lcp' | 'worlds' | 'msi'

export interface Category {
  id: CategoryId
  label: string
  fullName: string
}

export interface TierItem {
  id: string
  label: string
  image: string | null
}

export interface Tier {
  id: string
  label: string
  itemIds: string[]
}

export interface Tierlist {
  id: string
  name: string
  category: CategoryId
  tiers: Tier[]
  items: TierItem[]
  poolItemIds: string[]
  createdAt: number
  updatedAt: number
}
