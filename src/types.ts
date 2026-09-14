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
  playerId: string | null
}

export interface Tier {
  id: string
  label: string
  itemIds: string[]
}

export type TierlistMode = 'tiers' | 'grades'

export interface Tierlist {
  id: string
  name: string
  category: CategoryId
  mode: TierlistMode
  grades: Record<string, string>
  validatedTeams: string[]
  tiers: Tier[]
  items: TierItem[]
  poolItemIds: string[]
  createdAt: number
  updatedAt: number
}
