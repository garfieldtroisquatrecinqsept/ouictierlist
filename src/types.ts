export type CategoryId = 'lck' | 'lec' | 'lpl' | 'lcp' | 'worlds' | 'msi'

export interface Category {
  id: CategoryId
  label: string
  fullName: string
}

export type RoleId = 'top' | 'jungle' | 'mid' | 'bot' | 'support'

export interface TierItem {
  id: string
  label: string
  image: string | null
  role: RoleId | null
  teamLogo: string | null
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
