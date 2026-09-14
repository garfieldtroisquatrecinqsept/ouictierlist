import { useMemo, useRef, useState } from 'react'
import { ExportControls } from './ExportControls'
import { SheetHeader } from './SheetHeader'
import { exportNode, isDarkBackground, loadChoice, sheetStyle } from '../lib/exportImage'
import type { ExportChoice } from '../lib/exportImage'
import { gradeColor } from '../lib/grades'
import { asset, roleIcon, teamByShort } from '../lib/players'
import { useTheme } from '../store/ThemeContext'
import type { Tierlist } from '../types'
import { rostersOf, teamKey } from './GradeBoard'

interface Props {
  tierlist: Tierlist
}

export function GradeRecap({ tierlist }: Props) {
  const { theme } = useTheme()
  const sheetRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [open, setOpen] = useState(false)
  const [background, setBackground] = useState<ExportChoice>(() => loadChoice())
  const [error, setError] = useState('')

  const rosters = useMemo(
    () =>
      rostersOf(tierlist)
        .filter((r) => tierlist.validatedTeams.includes(r.short))
        .sort(
          (a, b) =>
            tierlist.validatedTeams.indexOf(a.short) - tierlist.validatedTeams.indexOf(b.short),
        ),
    [tierlist],
  )

  async function exportImage() {
    if (!sheetRef.current) return
    setExporting(true)
    setError('')
    try {
      await exportNode(sheetRef.current, tierlist.name)
    } catch {
      setError("L'export a échoué. Fais une capture d'écran du tableau ci-dessous.")
    } finally {
      setExporting(false)
    }
  }

  const columns = rosters.length <= 3 ? 1 : rosters.length <= 12 ? 2 : 3

  if (rosters.length === 0) {
    return (
      <section className="recap">
        <p className="hint">Valide au moins une équipe pour voir le récapitulatif.</p>
      </section>
    )
  }

  return (
    <section className="recap">
      <header className="recap-head">
        <button type="button" className="ghost recap-toggle" onClick={() => setOpen((v) => !v)}>
          <span className={open ? 'recap-caret open' : 'recap-caret'}>▸</span>
          Récapitulatif
        </button>
        <span className="meta">{rosters.length} équipes notées</span>
        <ExportControls
          choice={background}
          onChoose={setBackground}
          onExport={exportImage}
          busy={exporting}
        />
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className={open ? 'recap-clip open' : 'recap-clip'}>
      <div
        className={isDarkBackground(background) ? 'recap-sheet on-dark' : 'recap-sheet'}
        ref={sheetRef}
        style={sheetStyle(background)}
      >
        <SheetHeader title={tierlist.name} onDark={isDarkBackground(background)} />

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
      </div>
    </section>
  )
}
