import { useMemo, useState } from 'react'
import { TopNav } from '../components/TopNav'
import {
  LEAGUES,
  PLAYERS,
  ROLE_LABELS,
  ROLE_ORDER,
  TEAMS,
  asset,
  roleIcon,
  teamByShort,
} from '../lib/players'
import { useTheme } from '../store/ThemeContext'
import type { LeagueId } from '../lib/players'
import type { RoleId } from '../types'

export function PlayersPage() {
  const { theme } = useTheme()
  const uiVariant = theme === 'dark' ? 'dark' : 'light'
  const [search, setSearch] = useState('')
  const [league, setLeague] = useState<LeagueId | 'all'>('all')
  const [role, setRole] = useState<RoleId | 'all'>('all')

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return PLAYERS.filter((player) => {
      if (league !== 'all' && player.league !== league) return false
      if (role !== 'all' && player.role !== role) return false
      if (!needle) return true
      const teamName = teamByShort(player.team)?.name ?? ''
      return (
        player.name.toLowerCase().includes(needle) ||
        teamName.toLowerCase().includes(needle) ||
        player.team.toLowerCase().includes(needle) ||
        player.country.toLowerCase().includes(needle)
      )
    }).sort((a, b) => {
      const byRole = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)
      if (byRole !== 0) return byRole
      if (a.team !== b.team) return a.team.localeCompare(b.team)
      return a.name.localeCompare(b.name)
    })
  }, [search, league, role])

  return (
    <div className="page">
      <TopNav />

      <header className="masthead">
        <div>
          <h1 className="wordmark">
            Base de <em>données</em>
          </h1>
          <p className="tagline">
            {PLAYERS.length} joueurs · {TEAMS.length} équipes qualifiées pour Worlds 2026
          </p>
        </div>
      </header>

      <div className="db-filters">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher un joueur, une équipe, un pays"
        />
        <div className="picker-leagues">
          <button
            type="button"
            className={league === 'all' ? 'league-tab on' : 'league-tab'}
            onClick={() => setLeague('all')}
          >
            Toutes
          </button>
          {LEAGUES.map((item) => (
            <button
              key={item}
              type="button"
              className={league === item ? 'league-tab on' : 'league-tab'}
              onClick={() => setLeague(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="picker-roles">
          {ROLE_ORDER.map((item) => (
            <button
              key={item}
              type="button"
              className={role === item ? 'role-toggle on' : 'role-toggle'}
              onClick={() => setRole(role === item ? 'all' : item)}
              title={ROLE_LABELS[item]}
            >
              <img src={roleIcon(item, uiVariant)} alt={ROLE_LABELS[item]} />
            </button>
          ))}
        </div>
      </div>

      <p className="meta db-count">{rows.length} résultat{rows.length > 1 ? 's' : ''}</p>

      <div className="db-table-wrap">
        <table className="db-table">
          <thead>
            <tr>
              <th />
              <th>Joueur</th>
              <th>Poste</th>
              <th>Équipe</th>
              <th>Ligue</th>
              <th>Pays</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((player) => {
              const team = teamByShort(player.team)
              return (
                <tr key={player.id}>
                  <td className="db-photo">
                    {player.image ? <img src={asset(player.image) ?? ''} alt="" /> : null}
                  </td>
                  <td className="db-name">{player.name}</td>
                  <td>
                    <span className="db-role">
                      <img src={roleIcon(player.role, uiVariant)} alt="" />
                      {ROLE_LABELS[player.role]}
                    </span>
                  </td>
                  <td>
                    <span className="db-team">
                      {team?.logo ? <img src={asset(team.logo) ?? ''} alt="" /> : null}
                      {team?.name ?? player.team}
                    </span>
                  </td>
                  <td>{player.league}</td>
                  <td className="db-muted">{player.country}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
