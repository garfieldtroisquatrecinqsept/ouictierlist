import { forwardRef, useMemo } from 'react'
import { SheetHeader } from './SheetHeader'
import { isDarkBackground, sheetStyle } from '../lib/exportImage'
import type { ExportChoice } from '../lib/exportImage'
import { gradeColor } from '../lib/grades'
import { asset, roleIcon, teamByShort } from '../lib/players'
import type { Tierlist } from '../types'
import { rostersOf, teamKey } from './GradeBoard'

interface Props {
  tierlist: Tierlist
  background: ExportChoice
}

/** Equipes ayant au moins une note : les validees d'abord, dans l'ordre de validation. */
export function gradedRosters(tierlist: Tierlist) {
  const order = (short: string) => {
    const index = tierlist.validatedTeams.indexOf(short)
    return index < 0 ? Number.MAX_SAFE_INTEGER : index
  }
  return rostersOf(tierlist)
    .filter(
      (r) =>
        Boolean(tierlist.grades[teamKey(r.short)]) ||
        r.players.some((player) => tierlist.grades[player.id]),
    )
    .sort((a, b) => order(a.short) - order(b.short))
}

/** Image exportee d'une tierlist de notation, montree en apercu avant le telechargement. */
export const GradeRecap = forwardRef<HTMLDivElement, Props>(function GradeRecap(
  { tierlist, background },
  ref,
) {
  const rosters = useMemo(() => gradedRosters(tierlist), [tierlist])

  const columns = rosters.length <= 3 ? 1 : rosters.length <= 12 ? 2 : 3
  const onDark = isDarkBackground(background)

  return (
    <div
      className={onDark ? 'recap-sheet on-dark' : 'recap-sheet'}
      ref={ref}
      style={sheetStyle(background)}
    >
      <SheetHeader title={tierlist.name} onDark={onDark} />

      <div className={`recap-grid cols-${columns}`}>
        {rosters.map((roster) => {
          const team = teamByShort(roster.short)
          return (
            <article key={roster.short} className="grade-strip recap-strip">
              <div className="strip-team">
                {team?.logo ? <img src={asset(team.logo) ?? ''} alt="" /> : null}
                <span>{team?.name ?? roster.short}</span>
              </div>
              <div className="strip-cells">
                {roster.players.map((player) => {
                  const grade = tierlist.grades[player.id]
                  return (
                    <div key={player.id} className="strip-col">
                      <span className="strip-face">
                        {player.image ? (
                          <img src={asset(player.image) ?? ''} alt={player.name} />
                        ) : null}
                        <img className="strip-role" src={roleIcon(player.role)} alt="" />
                      </span>
                      <span className="strip-label">{player.name}</span>
                      <span
                        className="gcell-box filled"
                        style={{ color: gradeColor(grade ?? ''), borderColor: gradeColor(grade ?? '') }}
                      >
                        {grade ?? '—'}
                      </span>
                    </div>
                  )
                })}
                <div className="strip-col strip-col-team">
                  <span className="strip-face team">
                    {team?.logo ? <img src={asset(team.logo) ?? ''} alt="" /> : null}
                  </span>
                  <span className="strip-label">Team</span>
                  <span
                    className="gcell-box filled"
                    style={{
                      color: gradeColor(tierlist.grades[teamKey(roster.short)] ?? ''),
                      borderColor: gradeColor(tierlist.grades[teamKey(roster.short)] ?? ''),
                    }}
                  >
                    {tierlist.grades[teamKey(roster.short)] ?? '—'}
                  </span>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
})
