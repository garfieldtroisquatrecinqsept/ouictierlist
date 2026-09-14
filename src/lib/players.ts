import data from '../data/players.json'
import type { RoleId } from '../types'

export interface PlayerTeam {
  short: string
  name: string
  region: string
  league: string
  logo: string | null
}

export interface Player {
  id: string
  name: string
  team: string
  role: RoleId
  country: string
  image: string | null
}

export const TOURNAMENT: string = data.tournament
export const UPDATED: string = data.updated
export const TEAMS = data.teams as PlayerTeam[]
export const PLAYERS = data.players as Player[]

export const ROLE_LABELS: Record<RoleId, string> = {
  top: 'Top',
  jungle: 'Jungle',
  mid: 'Mid',
  bot: 'Bot',
  support: 'Support',
}

export const ROLE_ORDER: RoleId[] = ['top', 'jungle', 'mid', 'bot', 'support']

export function asset(path: string | null | undefined): string | null {
  return path ? `${import.meta.env.BASE_URL}${path}` : null
}

export function roleIcon(role: RoleId, variant: 'light' | 'dark' = 'dark'): string {
  return `${import.meta.env.BASE_URL}roles/${role}-${variant}.webp`
}

export function teamByShort(short: string): PlayerTeam | undefined {
  return TEAMS.find((team) => team.short === short)
}
