import { useMemo, useState } from 'react'
import { GRADES, gradeColor } from '../lib/grades'
import { PLAYERS, ROLE_LABELS, ROLE_ORDER, asset, roleIcon, teamByShort } from '../lib/players'
import type { Player } from '../lib/players'
import type { Tierlist } from '../types'

interface Props {
  tierlist: Tierlist
  onGrade: (key: string, grade: string | null) => void
  onValidate: (teamShort: string) => void
  onSelectPlayer: (playerId: string) => void
  selectedPlayerId: string | null
}

export function teamKey(short: string) {
  return `team:${short}`
}

export function GradeBoard({
  tierlist,
  onGrade,
  onValidate,
  onSelectPlayer,
  selectedPlayerId,
}: Props) {
  const rosters = useMemo(() => {
    const byTeam = new Map<string, Player[]>()
    tierlist.items.forEach((item) => {
      const player = item.playerId ? PLAYERS.find((p) => p.id === item.playerId) : undefined
      if (!player) return
      const list = byTeam.get(player.team) ?? []
      list.push(player)
      byTeam.set(player.team, list)
    })
    return [...byTeam.entries()]
      .map(([short, players]) => ({
        short,
        players: players.sort(
          (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role),
        ),
      }))
      .sort((a, b) => a.short.localeCompare(b.short))
  }, [tierlist.items])

  const firstPending = rosters.find((r) => !tierlist.validatedTeams.includes(r.short))
  const [current, setCurrent] = useState(firstPending?.short ?? rosters[0]?.short ?? '')
  const active = rosters.find((r) => r.short === current) ?? rosters[0]

  if (!active) {
    return <p className="hint">Aucun joueur de la base sur cette tierlist.</p>
  }

  const team = teamByShort(active.short)
  const done = tierlist.validatedTeams.length
  const complete =
    active.players.every((p) => tierlist.grades[p.id]) && Boolean(tierlist.grades[teamKey(active.short)])

  function GradePicker({ value, onPick }: { value?: string; onPick: (g: string | null) => void }) {
    return (
      <div className="grade-picker">
        {GRADES.map((grade) => (
          <button
            key={grade}
            type="button"
            className={value === grade ? 'grade-chip on' : 'grade-chip'}
            style={value === grade ? { background: gradeColor(grade), borderColor: gradeColor(grade) } : { color: gradeColor(grade) }}
            onClick={() => onPick(value === grade ? null : grade)}
          >
            {grade}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="grade-board">
      <nav className="grade-steps" aria-label="Progression">
        {rosters.map((roster) => {
          const validated = tierlist.validatedTeams.includes(roster.short)
          const classes = ['grade-step', roster.short === current ? 'on' : '', validated ? 'done' : '']
          const logo = teamByShort(roster.short)?.logo
          return (
            <button
              key={roster.short}
              type="button"
              className={classes.filter(Boolean).join(' ')}
              onClick={() => setCurrent(roster.short)}
              title={teamByShort(roster.short)?.name ?? roster.short}
            >
              {logo ? <img src={asset(logo) ?? ''} alt="" /> : null}
              {roster.short}
            </button>
          )
        })}
        <span className="grade-progress">
          {done}/{rosters.length} validées
        </span>
      </nav>

      <section className="grade-team">
        <header className="grade-team-head">
          {team?.logo ? <img src={asset(team.logo) ?? ''} alt="" /> : null}
          <div>
            <h2>{team?.name ?? active.short}</h2>
            <p className="meta">
              {active.players.length} joueurs · {team?.league}
            </p>
          </div>
          <button
            type="button"
            className="primary"
            disabled={!complete}
            onClick={() => {
              onValidate(active.short)
              const next = rosters.find(
                (r) => r.short !== active.short && !tierlist.validatedTeams.includes(r.short),
              )
              if (next) setCurrent(next.short)
            }}
          >
            {tierlist.validatedTeams.includes(active.short) ? 'Mettre à jour' : 'Valider'}
          </button>
        </header>

        <ul className="grade-rows">
          {active.players.map((player) => (
            <li key={player.id} className={player.id === selectedPlayerId ? 'on' : ''}>
              <button
                type="button"
                className="grade-player"
                onClick={() => onSelectPlayer(player.id)}
                title="Voir les statistiques"
              >
                <span className="grade-face">
                  {player.image ? <img src={asset(player.image) ?? ''} alt="" /> : null}
                </span>
                <span className="grade-names">
                  <strong>{player.name}</strong>
                  <small>
                    <img src={roleIcon(player.role, 'light')} alt="" />
                    {ROLE_LABELS[player.role]}
                  </small>
                </span>
              </button>
              <GradePicker
                value={tierlist.grades[player.id]}
                onPick={(g) => onGrade(player.id, g)}
              />
            </li>
          ))}

          <li className="grade-team-row">
            <span className="grade-player">
              <span className="grade-face team">
                {team?.logo ? <img src={asset(team.logo) ?? ''} alt="" /> : null}
              </span>
              <span className="grade-names">
                <strong>Note d'équipe</strong>
                <small>{team?.name ?? active.short}</small>
              </span>
            </span>
            <GradePicker
              value={tierlist.grades[teamKey(active.short)]}
              onPick={(g) => onGrade(teamKey(active.short), g)}
            />
          </li>
        </ul>

        {!complete ? (
          <p className="hint grade-hint">
            Note les {active.players.length} joueurs et l'équipe pour pouvoir valider.
          </p>
        ) : null}
      </section>
    </div>
  )
}
