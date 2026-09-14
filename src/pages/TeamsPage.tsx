import { TopNav } from '../components/TopNav'
import {
  LEAGUES,
  LEAGUE_LABELS,
  PLAYERS,
  ROLE_LABELS,
  ROLE_ORDER,
  TEAMS,
  asset,
  roleIcon,
} from '../lib/players'
import { useTheme } from '../store/ThemeContext'

export function TeamsPage() {
  const { theme } = useTheme()
  const uiVariant = theme === 'dark' ? 'dark' : 'light'

  return (
    <div className="page">
      <TopNav />

      <header className="masthead">
        <div>
          <h1 className="wordmark">
            Les <em>équipes</em>
          </h1>
          <p className="tagline">
            {TEAMS.length} équipes qualifiées pour Worlds 2026 · la qualification n'est pas terminée
          </p>
        </div>
      </header>

      {LEAGUES.map((league) => {
        const teams = TEAMS.filter((team) => team.league === league)
        if (teams.length === 0) return null
        return (
          <section key={league} className="league-block">
            <h2 className="league-heading">
              {league} <span>{LEAGUE_LABELS[league]}</span>
            </h2>
            <div className="team-grid">
              {teams.map((team) => {
                const roster = PLAYERS.filter((player) => player.team === team.short).sort(
                  (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role),
                )
                return (
                  <article key={team.short} className="team-card">
                    <header className="team-card-head">
                      {team.logo ? <img src={asset(team.logo) ?? ''} alt="" /> : null}
                      <div>
                        <h3>{team.name}</h3>
                        <p className="meta">
                          {team.short} · {roster.length} joueurs
                        </p>
                      </div>
                    </header>
                    <ul className="team-roster">
                      {roster.map((player) => (
                        <li key={player.id}>
                          <img
                            className="roster-role"
                            src={roleIcon(player.role, uiVariant)}
                            alt={ROLE_LABELS[player.role]}
                          />
                          {player.image ? (
                            <img className="roster-photo" src={asset(player.image) ?? ''} alt="" />
                          ) : null}
                          <span className="roster-name">{player.name}</span>
                          <span className="roster-country">{player.country}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
