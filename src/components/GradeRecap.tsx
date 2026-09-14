import { useMemo, useRef, useState } from 'react'
import { gradeColor } from '../lib/grades'
import { asset, teamByShort } from '../lib/players'
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
      const { toPng } = await import('html-to-image')
      const url = await toPng(sheetRef.current, {
        pixelRatio: 2,
        backgroundColor: getComputedStyle(document.body).backgroundColor,
      })
      const link = document.createElement('a')
      link.download = `${tierlist.name.replace(/[^\w-]+/g, '-').toLowerCase()}.png`
      link.href = url
      link.click()
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
        <h2>Récapitulatif</h2>
        <span className="meta">{rosters.length} équipes notées</span>
        <button type="button" onClick={exportImage} disabled={exporting}>
          {exporting ? <span className="spinner" /> : null}
          {exporting ? 'Export…' : 'Exporter en image'}
        </button>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="recap-sheet" ref={sheetRef}>
        <div className="recap-title">
          <strong>{tierlist.name}</strong>
          <span className="recap-brand">
            <img
              src={`${import.meta.env.BASE_URL}raphcorp-${theme}.png`}
              alt="RaphCorp"
              crossOrigin="anonymous"
            />
            OuicTierlist
          </span>
        </div>

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
    </section>
  )
}
