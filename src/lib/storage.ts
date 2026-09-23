import type { CategoryId, Tier, TierItem, Tierlist, TierlistMode } from '../types'
import { PLAYERS, ROLE_ORDER, TEAMS, asset, leagueForCategory, teamByShort } from './players'

const STORAGE_KEY = 'tierlists.v1'

export const DEFAULT_TIER_LABELS = ['S', 'A', 'B', 'C', 'D']

export const RUN_TIER_LABELS = ['Play-in', 'Swiss', 'Quarts', 'Demies', 'Finale', 'Winner']

export function createId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function createTiers(labels: string[]): Tier[] {
  return labels.map((label) => ({
    id: createId(),
    label,
    itemIds: [],
  }))
}

export function teamsForCategory(category: CategoryId) {
  const league = leagueForCategory(category)
  return TEAMS.filter((team) => !league || team.league === league)
}

function createTeamItems(category: CategoryId): TierItem[] {
  return teamsForCategory(category).map((team) => ({
    id: createId(),
    label: team.name,
    image: asset(team.logo),
    role: null,
    teamLogo: null,
    playerId: null,
    teamShort: team.short,
  }))
}

export function playersForCategory(category: CategoryId) {
  const league = leagueForCategory(category)
  const selection = league ? PLAYERS.filter((player) => player.league === league) : PLAYERS
  return [...selection].sort((a, b) => {
    const byRole = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)
    if (byRole !== 0) return byRole
    if (a.league !== b.league) return a.league.localeCompare(b.league)
    if (a.team !== b.team) return a.team.localeCompare(b.team)
    return a.name.localeCompare(b.name)
  })
}

function createRoster(category: CategoryId): TierItem[] {
  return playersForCategory(category).map((player) => ({
    id: createId(),
    label: player.name,
    image: asset(player.image),
    role: player.role,
    teamLogo: asset(teamByShort(player.team)?.logo ?? null),
    playerId: player.id,
  }))
}

export function createTierlist(
  name: string,
  category: CategoryId,
  mode: TierlistMode = 'tiers',
): Tierlist {
  const now = Date.now()
  const teamsMode = mode === 'teams'
  const items = teamsMode ? createTeamItems(category) : createRoster(category)
  return {
    id: createId(),
    name,
    category,
    mode,
    grades: {},
    validatedTeams: [],
    tiers: createTiers(teamsMode ? RUN_TIER_LABELS : DEFAULT_TIER_LABELS),
    items,
    poolItemIds: items.map((item) => item.id),
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
