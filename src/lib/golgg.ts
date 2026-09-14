import type { ChampionStat, PlayerStats } from './players'

const BLOCKS: Record<string, [string, Record<string, string>]> = {
  general: [
    'General stats',
    {
      record: 'Record',
      winrate: 'Win Rate',
      kda: 'KDA',
      csPerMin: 'CS per Minute',
      goldPerMin: 'Gold Per Minute',
      goldShare: 'Gold%',
      killParticipation: 'Kill Participation',
    },
  ],
  earlyGame: [
    'Early game',
    {
      csDiff15: 'CS Differential at 15 min',
      goldDiff15: 'Gold Differential at 15 min',
      xpDiff15: 'XP Differential at 15 min',
      aheadInCs15: 'Ahead in CS at 15 min',
      firstBloodParticipation: 'First Blood Participation',
      firstBloodVictim: 'First Blood Victim',
    },
  ],
  aggression: [
    'Aggression',
    {
      damagePerMin: 'Damage Per Minute',
      damageShare: 'Damage%',
      kaPerMin: 'K+A Per Minute',
      soloKills: 'Solo kills',
      pentakills: 'Pentakills',
    },
  ],
  vision: [
    'Vision',
    {
      visionScorePerMin: 'Vision score Per Minute',
      wardsPerMin: 'Ward Per Minute',
      controlWardsPerMin: 'Vision Ward Per Minute',
      wardsClearedPerMin: 'Ward Cleared Per Minute',
    },
  ],
}

// gol.gg ne renvoie aucun en-tete CORS : on lit la page via le rendu texte de r.jina.ai.
const READER = 'https://r.jina.ai/'

export function golggId(input: string): string | null {
  const match = input.match(/player-(?:stats|history|matchlist|bestplays|champstats)\/(\d+)/)
  if (match) return match[1]
  return /^\d+$/.test(input.trim()) ? input.trim() : null
}

export function championSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function clean(value: string | undefined): string | null {
  if (!value) return null
  const text = value.replace(/\s+/g, ' ').trim()
  return text === '' || text === '-' ? null : text
}

/** Les blocs arrivent en tableaux Markdown : « | Label: | valeur | » sous « | Titre | ». */
function readBlock(lines: string[], title: string): Record<string, string> {
  const start = lines.findIndex((line) => line.trim() === `| ${title} |`)
  if (start < 0) return {}
  const pairs: Record<string, string> = {}
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i].trim()
    if (line === '' || (!line.startsWith('|') && line !== '')) break
    if (/^\|\s*-+/.test(line)) continue
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim())
    if (cells.length < 2) break
    if (!cells[0].endsWith(':')) continue
    pairs[cells[0].slice(0, -1).trim()] = cells[1]
  }
  return pairs
}

function readChampions(lines: string[]): ChampionStat[] {
  const start = lines.findIndex((line) => line.trim().startsWith('| Champion | Nb games'))
  if (start < 0) return []
  const champions: ChampionStat[] = []
  for (let i = start + 2; i < lines.length; i += 1) {
    const line = lines[i].trim()
    if (!line.startsWith('|')) break
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim())
    if (cells.length < 4) break
    const name = cells[0].match(/!\[[^\]]*\]\([^)]*\)\s*([^\]]+)\]/)?.[1]?.trim() ?? cells[0]
    const icon = cells[0].match(/\((https:\/\/gol\.gg\/_img\/champions_icon\/[^)]+)\)/)?.[1]
    if (!/^\d+$/.test(cells[1])) continue
    champions.push({
      name,
      slug: championSlug(name),
      games: Number(cells[1]),
      winrate: cells[2],
      kda: cells[3],
      icon,
    })
    if (champions.length === 10) break
  }
  return champions
}

export function parseGolggMarkdown(markdown: string, id: string): PlayerStats | null {
  const lines = markdown.split('\n')
  const blocks: Record<string, Record<string, string | null>> = {}

  Object.entries(BLOCKS).forEach(([key, [title, fields]]) => {
    const pairs = readBlock(lines, title)
    if (Object.keys(pairs).length === 0) return
    blocks[key] = Object.fromEntries(
      Object.entries(fields).map(([out, src]) => [out, clean(pairs[src])]),
    )
  })

  if (!blocks.general) return null
  return {
    golggId: id,
    general: blocks.general,
    earlyGame: blocks.earlyGame ?? {},
    aggression: blocks.aggression ?? {},
    vision: blocks.vision ?? {},
    champions: readChampions(lines),
  }
}

export async function fetchGolggStats(
  input: string,
  season = 'S16',
): Promise<{ stats: PlayerStats | null; error: string | null }> {
  const id = golggId(input)
  if (!id) return { stats: null, error: "lien invalide, il doit contenir /player-stats/<id>/" }

  const url = `https://gol.gg/players/player-stats/${id}/season-${season}/split-ALL/tournament-ALL/`
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 20000)

  try {
    const response = await fetch(READER + url, {
      signal: controller.signal,
      headers: { Accept: 'text/plain' },
    })
    if (!response.ok) return { stats: null, error: `lecture gol.gg refusée (${response.status})` }
    const markdown = await response.text()
    const stats = parseGolggMarkdown(markdown, id)
    return stats
      ? { stats, error: null }
      : { stats: null, error: 'page gol.gg illisible (aucune statistique trouvée)' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'requête bloquée'
    return { stats: null, error: message === 'The user aborted a request.' ? 'délai dépassé' : message }
  } finally {
    window.clearTimeout(timer)
  }
}
