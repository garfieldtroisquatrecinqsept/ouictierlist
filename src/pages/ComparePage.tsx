import { useState } from 'react'
import { PlayerSelect } from '../components/PlayerSelect'
import { TopNav } from '../components/TopNav'
import {
  PLAYERS,
  ROLE_LABELS,
  STATS_SEASON,
  STAT_BLOCKS,
  asset,
  championIcon,
  roleIcon,
  statsFor,
  teamByShort,
} from '../lib/players'
import type { Player, PlayerStats } from '../lib/players'

const SLOTS = ['left', 'right'] as const
type Slot = (typeof SLOTS)[number]

const HIGHER_IS_WORSE = new Set(['firstBloodVictim'])

function numeric(value: string | null | undefined): number | null {
  if (!value) return null
  const cleaned = value.replace(/\s/g, '').replace('%', '').replace(',', '.')
  const match = cleaned.match(/^[+-]?\d+(\.\d+)?$/)
  return match ? Number(cleaned) : null
}

export function ComparePage() {
  const [picked, setPicked] = useState<Record<Slot, string>>({ left: '', right: '' })

  const left = PLAYERS.find((p) => p.id === picked.left) ?? null
  const right = PLAYERS.find((p) => p.id === picked.right) ?? null
  const leftStats = left ? statsFor(left.id) : undefined
  const rightStats = right ? statsFor(right.id) : undefined

  function slot(side: Slot, player: Player | null) {
    const team = player ? teamByShort(player.team) : null
    const other = side === 'left' ? picked.right : picked.left
    return (
      <div className="compare-slot">
        <PlayerSelect
          value={picked[side]}
          exclude={other || undefined}
          onChange={(id) => setPicked((c) => ({ ...c, [side]: id }))}
        />

        <div className={player ? 'compare-card filled' : 'compare-card'}>
          {player ? (
            <>
              <div className="compare-photo">
                {player.image ? <img src={asset(player.image) ?? ''} alt="" /> : null}
                {team?.logo ? (
                  <img className="compare-logo" src={asset(team.logo) ?? ''} alt="" />
                ) : null}
                <img className="compare-role" src={roleIcon(player.role)} alt="" />
              </div>
              <h2>{player.name}</h2>
              <p className="meta">
                {team?.name ?? player.team} · {ROLE_LABELS[player.role]} · {player.league}
              </p>
            </>
          ) : (
            <p className="hint">Aucun joueur sélectionné</p>
          )}
        </div>
      </div>
    )
  }

  function statRow(field: string, label: string, blockKey: keyof PlayerStats) {
    const a = (leftStats?.[blockKey] as Record<string, string | null>)?.[field] ?? null
    const b = (rightStats?.[blockKey] as Record<string, string | null>)?.[field] ?? null
    const na = numeric(a)
    const nb = numeric(b)
    let lead: 'left' | 'right' | null = null
    if (na !== null && nb !== null && na !== nb) {
      const leftBetter = HIGHER_IS_WORSE.has(field) ? na < nb : na > nb
      lead = leftBetter ? 'left' : 'right'
    }
    return (
      <tr key={field}>
        <td className={lead === 'left' ? 'compare-value lead' : 'compare-value'}>{a ?? '—'}</td>
        <th>{label}</th>
        <td className={lead === 'right' ? 'compare-value lead' : 'compare-value'}>{b ?? '—'}</td>
      </tr>
    )
  }

  function champColumn(stats: PlayerStats | undefined) {
    if (!stats) return null
    return (
      <ul className="champ-list">
        {stats.champions.map((champ) => (
          <li key={champ.slug}>
            <img src={championIcon(champ.slug)} alt="" />
            <span className="champ-name">{champ.name}</span>
            <span className="champ-meta">
              {champ.games} parties · {champ.winrate} · KDA {champ.kda}
            </span>
          </li>
        ))}
      </ul>
    )
  }

  const both = left && right

  return (
    <div className="page">
      <TopNav />

      <header className="masthead">
        <div>
          <h1 className="wordmark">
            Face à <em>face</em>
          </h1>
          <p className="tagline">
            Statistiques {STATS_SEASON} (2026), tous splits et tous tournois · source gol.gg
          </p>
        </div>
      </header>

      <div className="compare-grid">
        {slot('left', left)}
        {slot('right', right)}
      </div>

      {both ? (
        <div className="compare-table-wrap">
          {STAT_BLOCKS.map((block) => (
            <section key={block.key as string} className="compare-block">
              <h3>{block.title}</h3>
              <table className="compare-table">
                <tbody>
                  {block.fields.map(([field, label]) => statRow(field, label, block.key))}
                </tbody>
              </table>
            </section>
          ))}

          <section className="compare-block">
            <h3>Champions les plus joués</h3>
            <div className="champ-grid">
              {champColumn(leftStats)}
              {champColumn(rightStats)}
            </div>
          </section>
        </div>
      ) : (
        <p className="compare-note">
          Choisis deux joueurs pour comparer leurs statistiques de la saison {STATS_SEASON}.
        </p>
      )}
    </div>
  )
}
