import { useMemo, useState } from 'react'
import { AddPlayerModal } from '../components/AddPlayerModal'
import { TopNav } from '../components/TopNav'
import {
  LEAGUES,
  PLAYERS,
  ROLE_LABELS,
  ROLE_ORDER,
  TEAMS,
  asset,
  isCustomPlayer,
  removeCustomPlayer,
  roleIcon,
  statsFor,
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
  const [addOpen, setAddOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [revision, setRevision] = useState(0)

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
  }, [search, league, role, revision])

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
        <div className="masthead-actions">
          <button type="button" className="primary" onClick={() => setAddOpen(true)}>
            Ajouter un joueur
          </button>
        </div>
      </header>

      {notice ? <p className="db-notice">{notice}</p> : null}

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
              <th className="num">Winrate</th>
              <th className="num">KDA</th>
              <th className="num">CS/min</th>
              <th>Pays</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((player) => {
              const team = teamByShort(player.team)
              const stats = statsFor(player.id)?.general
              return (
                <tr key={player.id}>
                  <td className="db-photo">
                    {player.image ? <img src={asset(player.image) ?? ''} alt="" /> : null}
                  </td>
                  <td className="db-name">
                    {player.name}
                    {isCustomPlayer(player.id) ? (
                      <button
                        type="button"
                        className="db-remove"
                        title="Retirer ce joueur ajouté à la main"
                        onClick={() => {
                          removeCustomPlayer(player.id)
                          setNotice(`${player.name} a été retiré de la base.`)
                          setRevision((value) => value + 1)
                        }}
                      >
                        ×
                      </button>
                    ) : null}
                  </td>
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
                  <td className="num">{stats?.winrate ?? '—'}</td>
                  <td className="num">{stats?.kda ?? '—'}</td>
                  <td className="num">{stats?.csPerMin ?? '—'}</td>
                  <td className="db-muted">{player.country}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <AddPlayerModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={(player, warning) => {
          setAddOpen(false)
          setNotice(warning ?? `${player.name} a été ajouté à la base et aux tierlists ${player.league}.`)
          setRevision((value) => value + 1)
        }}
      />
    </div>
  )
}
