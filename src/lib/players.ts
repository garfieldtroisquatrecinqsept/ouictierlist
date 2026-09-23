import data from '../data/players.json'
import type { RoleId } from '../types'
import statsData from '../data/stats.json'
import palmaresData from '../data/palmares.json'

export interface PlayerTeam {
  short: string
  name: string
  region: string
  league: string
  logo: string | null
  color?: string
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
  if (!path) return null
  if (/^(data:|blob:|https?:)/.test(path)) return path
  return `${import.meta.env.BASE_URL}${path}`
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
  icon?: string
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

export function championIcon(slug: string, fallback?: string): string {
  return fallback ?? `${import.meta.env.BASE_URL}champions/${slug}.png`
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


const TROPHY_COLORS: Record<string, string> = {
  WORLDS: '#c9a227',
  MSI: '#4a8fd0',
  EWC: '#2a9d8f',
  FS: '#8a6fd1',
  CUP: '#dd8c3c',
  DC: '#dd8c3c',
  AG: '#c9a227',
  LCK: '#d1495b',
  LPL: '#dd8c3c',
  LEC: '#4a8fd0',
  LCS: '#57a05a',
  LCP: '#8a6fd1',
  PCS: '#8a6fd1',
  LMS: '#8a6fd1',
  VCS: '#2a9d8f',
  LTA: '#57a05a',
  TCL: '#57a05a',
  GPL: '#2a9d8f',
}

export interface PalmaresLine {
  y: string
  t: string
  w: number
}

export interface PalmaresSection {
  code: string
  label: string
  lines: PalmaresLine[]
}

const PALMARES = palmaresData.players as unknown as Record<string, PalmaresSection[]>

export const PALMARES_SOURCE = palmaresData.source as string

export function palmaresFor(playerId: string): PalmaresSection[] {
  return PALMARES[playerId] ?? []
}

export function titleCount(playerId: string): number {
  return palmaresFor(playerId).reduce(
    (total, section) => total + section.lines.filter((line) => line.w === 1).length,
    0,
  )
}

export function trophyColor(code: string): string {
  return TROPHY_COLORS[code] ?? '#8a8a92'
}


const LOWER_IS_BETTER = new Set(['firstBloodVictim'])
const UNRANKED = new Set(['record'])

export function parseStat(value: string | null | undefined): number | null {
  if (!value) return null
  const cleaned = value.replace(/\s/g, '').replace('%', '').replace(',', '.')
  return /^[+-]?\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : null
}

export interface StatRank {
  rank: number
  total: number
}

const RANK_CACHE = new Map<string, Map<string, StatRank>>()

function rankTable(role: RoleId, block: keyof PlayerStats, field: string) {
  const key = `${role}|${String(block)}|${field}`
  const cached = RANK_CACHE.get(key)
  if (cached) return cached

  const scored: { id: string; value: number }[] = []
  PLAYERS.filter((player) => player.role === role).forEach((player) => {
    const stats = statsFor(player.id)
    if (!stats) return
    const value = parseStat((stats[block] as Record<string, string | null>)?.[field])
    if (value !== null) scored.push({ id: player.id, value })
  })
  scored.sort((a, b) =>
    LOWER_IS_BETTER.has(field) ? a.value - b.value : b.value - a.value,
  )

  const table = new Map<string, StatRank>()
  scored.forEach((entry) => {
    const tie = scored.findIndex((other) => other.value === entry.value)
    table.set(entry.id, { rank: tie + 1, total: scored.length })
  })
  RANK_CACHE.set(key, table)
  return table
}

export function statRank(
  playerId: string,
  block: keyof PlayerStats,
  field: string,
): StatRank | null {
  if (UNRANKED.has(field)) return null
  const player = PLAYERS.find((entry) => entry.id === playerId)
  if (!player) return null
  return rankTable(player.role, block, field).get(playerId) ?? null
}

export function rankLabel(rank: number): string {
  return rank === 1 ? '1er' : `${rank}e`
}

const CUSTOM_KEY = 'players.custom.v1'

export interface CustomPlayer extends Player {
  custom: true
  teamName?: string | null
  teamLogo?: string | null
  teamColor?: string | null
  golgg?: string | null
  stats?: PlayerStats | null
}

function readCustom(): CustomPlayer[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as CustomPlayer[]) : []
  } catch {
    return []
  }
}

function applyCustom(entry: CustomPlayer) {
  const { stats, teamName, teamLogo, teamColor, ...player } = entry
  const index = PLAYERS.findIndex((existing) => existing.id === entry.id)
  if (index >= 0) PLAYERS[index] = player as Player
  else PLAYERS.push(player as Player)

  if (!TEAMS.some((team) => team.short === entry.team)) {
    TEAMS.push({
      short: entry.team,
      name: teamName || entry.team,
      region: entry.region,
      league: entry.league,
      logo: teamLogo ?? null,
      color: teamColor ?? undefined,
    })
  }
  if (stats) STATS[entry.id] = stats
}

export function customPlayers(): CustomPlayer[] {
  return readCustom()
}

export function addCustomPlayer(entry: CustomPlayer) {
  const all = readCustom().filter((existing) => existing.id !== entry.id)
  all.push(entry)
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(all))
  applyCustom(entry)
}

export function removeCustomPlayer(id: string) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(readCustom().filter((e) => e.id !== id)))
  const index = PLAYERS.findIndex((player) => player.id === id)
  if (index >= 0) PLAYERS.splice(index, 1)
  delete STATS[id]
}

export function isCustomPlayer(id: string): boolean {
  return readCustom().some((entry) => entry.id === id)
}

readCustom().forEach(applyCustom)
