import { useMemo, useRef, useState } from 'react'
import { gradeColor } from '../lib/grades'
import { PLAYERS, ROLE_ORDER, asset, teamByShort } from '../lib/players'
import type { Player } from '../lib/players'
import type { Tierlist } from '../types'
import { teamKey } from './GradeBoard'

interface Props {
  tierlist: Tierlist
}

export function GradeRecap({ tierlist }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

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
        players: players.sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)),
      }))
      .filter((r) => tierlist.validatedTeams.includes(r.short))
      .sort(
        (a, b) =>
          tierlist.validatedTeams.indexOf(a.short) - tierlist.validatedTeams.indexOf(b.short),
      )
  }, [tierlist.items, tierlist.validatedTeams])

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
          <span>OuicTierlist</span>
        </div>

        <div className="recap-grid">
          {rosters.map((roster) => {
            const team = teamByShort(roster.short)
            return (
              <article key={roster.short} className="recap-team">
                <header>
                  {team?.logo ? <img src={asset(team.logo) ?? ''} alt="" /> : null}
                  <h3>{team?.name ?? roster.short}</h3>
                </header>
                <table>
                  <thead>
                    <tr>
                      {roster.players.map((player) => (
                        <th key={player.id}>{player.name}</th>
                      ))}
                      <th>Équipe</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {roster.players.map((player) => {
                        const grade = tierlist.grades[player.id]
                        return (
                          <td key={player.id}>
                            <span style={{ color: gradeColor(grade ?? '') }}>{grade ?? '—'}</span>
                          </td>
                        )
                      })}
                      <td>
                        <span style={{ color: gradeColor(tierlist.grades[teamKey(roster.short)] ?? '') }}>
                          {tierlist.grades[teamKey(roster.short)] ?? '—'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
