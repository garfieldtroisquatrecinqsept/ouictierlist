import { useState } from 'react'
import { TopNav } from '../components/TopNav'
import {
  PLAYERS,
  ROLE_LABELS,
  ROLE_ORDER,
  asset,
  roleIcon,
  teamByShort,
} from '../lib/players'
import { useTheme } from '../store/ThemeContext'
import type { Player } from '../lib/players'

const SLOTS = ['left', 'right'] as const
type Slot = (typeof SLOTS)[number]

export function ComparePage() {
  const { theme } = useTheme()
  const uiVariant = theme === 'dark' ? 'dark' : 'light'
  const [picked, setPicked] = useState<Record<Slot, string>>({ left: '', right: '' })

  const sorted = [...PLAYERS].sort((a, b) => {
    const byRole = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)
    if (byRole !== 0) return byRole
    return a.name.localeCompare(b.name)
  })

  const left = PLAYERS.find((p) => p.id === picked.left) ?? null
  const right = PLAYERS.find((p) => p.id === picked.right) ?? null

  const rows: { label: string; get: (p: Player) => string }[] = [
    { label: 'Poste', get: (p) => ROLE_LABELS[p.role] },
    { label: 'Équipe', get: (p) => teamByShort(p.team)?.name ?? p.team },
    { label: 'Ligue', get: (p) => p.league },
    { label: 'Région', get: (p) => p.region },
    { label: 'Pays', get: (p) => p.country },
  ]

  function slot(side: Slot, player: Player | null) {
    const team = player ? teamByShort(player.team) : null
    return (
      <div className="compare-slot">
        <select
          value={picked[side]}
          onChange={(event) => setPicked((c) => ({ ...c, [side]: event.target.value }))}
        >
          <option value="">Choisir un joueur…</option>
          {sorted.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.team} · {ROLE_LABELS[p.role]}
            </option>
          ))}
        </select>

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
                {team?.name ?? player.team} · {player.league}
              </p>
            </>
          ) : (
            <p className="hint">Aucun joueur sélectionné</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <TopNav />

      <header className="masthead">
        <div>
          <h1 className="wordmark">
            Face à <em>face</em>
          </h1>
          <p className="tagline">Choisis deux joueurs pour les mettre côte à côte</p>
        </div>
      </header>

      <div className="compare-grid">
        {slot('left', left)}
        {slot('right', right)}
      </div>

      {left && right ? (
        <table className="compare-table">
          <tbody>
            {rows.map((row) => {
              const a = row.get(left)
              const b = row.get(right)
              const same = a === b
              return (
                <tr key={row.label} className={same ? 'same' : ''}>
                  <td className="compare-value">{a}</td>
                  <th>{row.label}</th>
                  <td className="compare-value">{b}</td>
                </tr>
              )
            })}
            <tr className="same">
              <td className="compare-value">
                <img src={roleIcon(left.role, uiVariant)} alt="" width={20} height={20} />
              </td>
              <th>Picto</th>
              <td className="compare-value">
                <img src={roleIcon(right.role, uiVariant)} alt="" width={20} height={20} />
              </td>
            </tr>
          </tbody>
        </table>
      ) : null}

      <p className="compare-note">
        Les statistiques de jeu (KDA, winrate, CS par minute…) ne sont pas encore dans la base :
        elle ne contient aujourd'hui que l'identité des joueurs. Il faut une seconde collecte sur
        Leaguepedia pour les ajouter.
      </p>
    </div>
  )
}
