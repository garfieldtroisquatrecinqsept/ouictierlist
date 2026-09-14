import { useMemo, useState } from 'react'
import { GradeCell } from './GradeCell'
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

export function rostersOf(tierlist: Tierlist) {
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
      players: players.sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)),
    }))
    .sort((a, b) => a.short.localeCompare(b.short))
}

export function GradeBoard({
  tierlist,
  onGrade,
  onValidate,
  onSelectPlayer,
  selectedPlayerId,
}: Props) {
  const rosters = useMemo(() => rostersOf(tierlist), [tierlist.items])
  const firstPending = rosters.find((r) => !tierlist.validatedTeams.includes(r.short))
  const [current, setCurrent] = useState(firstPending?.short ?? rosters[0]?.short ?? '')
  const active = rosters.find((r) => r.short === current) ?? rosters[0]

  if (!active) return <p className="hint">Aucun joueur de la base sur cette tierlist.</p>

  const team = teamByShort(active.short)
  const done = tierlist.validatedTeams.length
  const complete =
    active.players.every((p) => tierlist.grades[p.id]) &&
    Boolean(tierlist.grades[teamKey(active.short)])

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

      <section className="grade-strip">
        <div className="strip-team">
          {team?.logo ? <img src={asset(team.logo) ?? ''} alt="" /> : null}
          <span>{team?.name ?? active.short}</span>
        </div>

        <div className="strip-cells">
          {active.players.map((player) => (
            <div
              key={player.id}
              className={player.id === selectedPlayerId ? 'strip-col on' : 'strip-col'}
            >
              <button
                type="button"
                className="strip-name"
                onClick={() => onSelectPlayer(player.id)}
                title={`${player.name} — ${ROLE_LABELS[player.role]} — voir les stats`}
              >
                <img src={roleIcon(player.role, 'light')} alt="" />
                {player.name}
              </button>
              <GradeCell
                value={tierlist.grades[player.id]}
                label={player.name}
                onPick={(grade) => onGrade(player.id, grade)}
              />
            </div>
          ))}

          <div className="strip-col strip-col-team">
            <span className="strip-name">Team</span>
            <GradeCell
              value={tierlist.grades[teamKey(active.short)]}
              label={team?.name ?? active.short}
              onPick={(grade) => onGrade(teamKey(active.short), grade)}
            />
          </div>
        </div>

        <button
          type="button"
          className="primary strip-validate"
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
      </section>
    </div>
  )
}
