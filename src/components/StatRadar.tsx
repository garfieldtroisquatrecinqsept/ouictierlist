import { useMemo } from 'react'
import { PLAYERS, rankLabel, statRank, statsFor } from '../lib/players'
import type { Player, PlayerStats } from '../lib/players'

export const RADAR_AXES: { key: string; block: keyof PlayerStats; label: string }[] = [
  { key: 'kda', block: 'general', label: 'KDA' },
  { key: 'csPerMin', block: 'general', label: 'CS/min' },
  { key: 'goldPerMin', block: 'general', label: 'Or/min' },
  { key: 'damagePerMin', block: 'aggression', label: 'Dégâts/min' },
  { key: 'killParticipation', block: 'general', label: 'Kills' },
  { key: 'visionScorePerMin', block: 'vision', label: 'Vision' },
]

export function numeric(value: string | null | undefined): number | null {
  if (!value) return null
  const cleaned = value.replace(/\s/g, '').replace('%', '').replace(',', '.')
  return /^[+-]?\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : null
}

function valueFor(player: Player, axis: (typeof RADAR_AXES)[number]): number | null {
  const stats = statsFor(player.id)
  if (!stats) return null
  const block = stats[axis.block] as Record<string, string | null>
  return numeric(block?.[axis.key])
}

interface Props {
  players: Player[]
  scope?: 'all' | 'role'
  size?: number
}

const COLORS = ['#3f5fd0', '#c0446a']

export function StatRadar({ players, scope = 'all', size = 260 }: Props) {
  const maxima = useMemo(() => {
    const reference =
      scope === 'role' && players.length > 0
        ? PLAYERS.filter((p) => players.some((sel) => sel.role === p.role))
        : PLAYERS
    return RADAR_AXES.map((axis) => {
      let max = 0
      reference.forEach((p) => {
        const v = valueFor(p, axis)
        if (v !== null && v > max) max = v
      })
      return max || 1
    })
  }, [players, scope])

  const single = players.length === 1 ? players[0] : null
  const showRanks = players.length <= 2
  const width = size
  const height = size * (showRanks ? 0.95 : 0.88)
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width / 2 - 46, height / 2 - 20)
  const rings = [0.25, 0.5, 0.75, 1]

  function angleOf(index: number) {
    return (Math.PI / 3) * index - Math.PI / 2
  }

  function point(index: number, ratio: number) {
    const a = angleOf(index)
    return [cx + Math.cos(a) * radius * ratio, cy + Math.sin(a) * radius * ratio]
  }

  function labelPoint(index: number) {
    const a = angleOf(index)
    return [cx + Math.cos(a) * (radius + 16), cy + Math.sin(a) * (radius + 13)]
  }

  function polygon(ratio: number) {
    return RADAR_AXES.map((_, i) => point(i, ratio).join(',')).join(' ')
  }

  return (
    <div className="radar">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Profil statistique">
        {rings.map((r) => (
          <polygon key={r} className="radar-ring" points={polygon(r)} />
        ))}
        {RADAR_AXES.map((_, i) => {
          const [x, y] = point(i, 1)
          return <line key={i} className="radar-spoke" x1={cx} y1={cy} x2={x} y2={y} />
        })}

        {players.map((player, pi) => {
          const points = RADAR_AXES.map((axis, i) => {
            const v = valueFor(player, axis)
            const ratio = v === null ? 0 : Math.min(1, v / maxima[i])
            return point(i, ratio).join(',')
          }).join(' ')
          return (
            <polygon
              key={player.id}
              points={points}
              fill={COLORS[pi % COLORS.length]}
              fillOpacity={players.length > 1 ? 0.34 : 0.42}
              stroke={COLORS[pi % COLORS.length]}
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
          )
        })}

        {RADAR_AXES.map((axis, i) => {
          const [x, y] = labelPoint(i)
          const ranks = showRanks
            ? players.map((player) => statRank(player.id, axis.block, axis.key))
            : []
          const hasRank = ranks.some(Boolean)
          const anchor = x > cx + 4 ? 'start' : x < cx - 4 ? 'end' : 'middle'
          return (
            <text
              key={axis.key}
              className="radar-label"
              x={x}
              y={hasRank ? y - 5 : y}
              textAnchor={anchor}
              dominantBaseline="middle"
            >
              <tspan x={x}>{axis.label}</tspan>
              {hasRank ? (
                <tspan x={x} dy="1.25em">
                  {ranks.map((rank, ri) =>
                    rank ? (
                      <tspan
                        key={players[ri].id}
                        className={
                          single && rank.rank <= 3 ? `radar-rank top${rank.rank}` : 'radar-rank'
                        }
                        fill={single ? undefined : COLORS[ri % COLORS.length]}
                      >
                        {(ri > 0 ? ' · ' : '') + rankLabel(rank.rank)}
                      </tspan>
                    ) : null,
                  )}
                </tspan>
              ) : null}
            </text>
          )
        })}
      </svg>

      {players.length > 1 ? (
        <ul className="radar-legend">
          {players.map((player, pi) => (
            <li key={player.id}>
              <span style={{ background: COLORS[pi % COLORS.length] }} />
              {player.name}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
