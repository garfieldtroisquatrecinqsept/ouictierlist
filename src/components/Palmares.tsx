import { palmaresFor, trophyColor } from '../lib/players'

interface Props {
  playerId: string
  compact?: boolean
}

export function Palmares({ playerId, compact = false }: Props) {
  const sections = palmaresFor(playerId)

  if (sections.length === 0) {
    return (
      <div className={compact ? 'palmares compact empty' : 'palmares empty'}>
        <span>Aucun titre</span>
      </div>
    )
  }

  return (
    <div className={compact ? 'palmares compact' : 'palmares'}>
      {sections.map((section) => (
        <section key={section.code} className="palmares-sec">
          <h4 style={{ color: trophyColor(section.code) }}>{section.label}</h4>
          {section.lines.map((line) => (
            <p
              key={`${line.y}-${line.t}`}
              className={line.w === 1 ? 'palmares-line win' : 'palmares-line'}
            >
              <span className="pl-when">{[line.y, line.t].filter(Boolean).join(' ')}</span>{' '}
              <strong>{line.w === 1 ? 'Champion' : 'Runner-Up'}</strong>
            </p>
          ))}
        </section>
      ))}
    </div>
  )
}
