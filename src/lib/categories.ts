import type { Category, CategoryId } from '../types'

export const CATEGORIES: Category[] = [
  { id: 'lck', label: 'LCK', fullName: 'LoL Champions Korea' },
  { id: 'lec', label: 'LEC', fullName: 'LoL EMEA Championship' },
  { id: 'lpl', label: 'LPL', fullName: 'LoL Pro League' },
  { id: 'lcp', label: 'LCP', fullName: 'LoL Championship Pacific' },
  { id: 'worlds', label: 'Worlds', fullName: 'World Championship' },
  { id: 'msi', label: 'MSI', fullName: 'Mid-Season Invitational' },
]

export function getCategory(id: CategoryId): Category | undefined {
  return CATEGORIES.find((category) => category.id === id)
}
