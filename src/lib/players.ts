import data from '../data/players.json'
import type { RoleId } from '../types'
import statsData from '../data/stats.json'
import achievementsData from '../data/achievements.json'

export interface PlayerTeam {
  short: string
  name: string
  region: string
  league: string
  logo: string | null
}

export type LeagueId = 'LCK' | 'LPL' | 'LEC' | 'LCP'

export interface Player {
  id: string
  name: string
  team: string
  league: LeagueId
  region: string
  role: RoleId
  country: string
  image: string | null
}

export const LEAGUES: LeagueId[] = ['LCK', 'LPL', 'LEC', 'LCP']

export const LEAGUE_LABELS: Record<LeagueId, string> = {
  LCK: 'Corée',
  LPL: 'Chine',
  LEC: 'EMEA',
  LCP: 'Asie-Pacifique',
}

const CATEGORY_LEAGUE: Record<string, LeagueId> = {
  lck: 'LCK',
  lpl: 'LPL',
  lec: 'LEC',
  lcp: 'LCP',
}

export function leagueForCategory(category: string): LeagueId | null {
  return CATEGORY_LEAGUE[category] ?? null
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


export interface ChampionStat {
  name: string
  slug: string
  games: number
  winrate: string
  kda: string
}

export interface PlayerStats {
  golggId: string
  general: Record<string, string | null>
  earlyGame: Record<string, string | null>
  aggression: Record<string, string | null>
  vision: Record<string, string | null>
  champions: ChampionStat[]
}

export const STATS_SEASON: string = statsData.season
export const STATS_SOURCE: string = statsData.source
const STATS = statsData.players as unknown as Record<string, PlayerStats>

export function statsFor(playerId: string): PlayerStats | undefined {
  return STATS[playerId]
}

export function championIcon(slug: string): string {
  return `${import.meta.env.BASE_URL}champions/${slug}.png`
}

export const STAT_BLOCKS: { key: keyof PlayerStats; title: string; fields: [string, string][] }[] = [
  [
    'general',
    'Général',
    [
      ['record', 'Bilan'],
      ['winrate', 'Winrate'],
      ['kda', 'KDA'],
      ['csPerMin', 'CS / min'],
      ['goldPerMin', 'Or / min'],
      ['goldShare', "Part d'or"],
      ['killParticipation', 'Participation aux kills'],
    ],
  ],
  [
    'earlyGame',
    'Early game',
    [
      ['csDiff15', 'Diff. CS à 15 min'],
      ['goldDiff15', "Diff. d'or à 15 min"],
      ['xpDiff15', "Diff. d'XP à 15 min"],
      ['aheadInCs15', 'Devant en CS à 15 min'],
      ['firstBloodParticipation', 'Participation au first blood'],
      ['firstBloodVictim', 'Victime du first blood'],
    ],
  ],
  [
    'aggression',
    'Agression',
    [
      ['damagePerMin', 'Dégâts / min'],
      ['damageShare', 'Part des dégâts'],
      ['kaPerMin', 'K+A / min'],
      ['soloKills', 'Solo kills'],
      ['pentakills', 'Pentakills'],
    ],
  ],
  [
    'vision',
    'Vision',
    [
      ['visionScorePerMin', 'Score de vision / min'],
      ['wardsPerMin', 'Wards / min'],
      ['controlWardsPerMin', 'Wards de contrôle / min'],
      ['wardsClearedPerMin', 'Wards nettoyées / min'],
    ],
  ],
].map(([key, title, fields]) => ({
  key: key as keyof PlayerStats,
  title: title as string,
  fields: fields as [string, string][],
}))


export interface Achievements {
  worlds: string[]
  msi: string[]
  ewc: number
  firstStand: number
  cup: number
  leagues: Record<string, number>
}

const ACHIEVEMENTS = achievementsData.players as unknown as Record<string, Achievements>

export function achievementsFor(playerId: string): Achievements | undefined {
  return ACHIEVEMENTS[playerId]
}

export interface Trophy {
  code: string
  label: string
  count: number
  detail?: string
}

export function trophies(playerId: string): Trophy[] {
  const a = achievementsFor(playerId)
  if (!a) return []
  const out: Trophy[] = []
  if (a.worlds.length)
    out.push({ code: 'WORLDS', label: 'Worlds', count: a.worlds.length, detail: a.worlds.join(', ') })
  if (a.msi.length)
    out.push({ code: 'MSI', label: 'MSI', count: a.msi.length, detail: a.msi.join(', ') })
  if (a.ewc) out.push({ code: 'EWC', label: 'Esports World Cup', count: a.ewc })
  if (a.firstStand) out.push({ code: 'FS', label: 'First Stand', count: a.firstStand })
  if (a.cup) out.push({ code: 'CUP', label: 'Coupe de ligue', count: a.cup })
  Object.entries(a.leagues)
    .sort((x, y) => y[1] - x[1])
    .forEach(([league, count]) => out.push({ code: league, label: `Titres ${league}`, count }))
  return out
}
