import { Palmares } from './Palmares'
import { StatRadar } from './StatRadar'
import {
  ROLE_LABELS,
  palmaresFor,
  rankLabel,
  statRank,
  STATS_SEASON,
  STAT_BLOCKS,
  asset,
  championIcon,
  roleIcon,
  statsFor,
  teamByShort,
} from '../lib/players'
import type { Player } from '../lib/players'

interface Props {
  player: Player | null
  fallbackLabel?: string | null
  className?: string
  onClose: () => void
}

export function PlayerPanel({ player, fallbackLabel, className = '', onClose }: Props) {
  if (!player) {
    return (
      <aside className={`player-panel empty ${className}`.trim()}>
        <p className="hint">
          {fallbackLabel
            ? `« ${fallbackLabel} » n'est pas un joueur de la base.`
            : 'Clique sur un joueur du plateau pour voir ses statistiques.'}
        </p>
      </aside>
    )
  }

  const team = teamByShort(player.team)
  const stats = statsFor(player.id)

  return (
    <aside className={`player-panel ${className}`.trim()}>
      <header className="panel-head">
        <span className="panel-face">
          {player.image ? <img src={asset(player.image) ?? ''} alt="" /> : null}
        </span>
        <div className="panel-id">
          <h2>{player.name}</h2>
          <p className="meta">
            {team?.name ?? player.team} · {ROLE_LABELS[player.role]} · {player.league}
          </p>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Fermer">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>

      {stats ? (
        <>
          <div className="panel-left">
          <StatRadar players={[player]} scope="role" size={240} />
          <p className="panel-scope-note">Classement parmi les {ROLE_LABELS[player.role]}</p>

          </div>

          <div className="panel-right">
          <div className="panel-blocks">
          {STAT_BLOCKS.map((block) => (
            <section key={block.key as string} className="panel-block">
              <h3>{block.title}</h3>
              <dl className="panel-stats">
                {block.fields.map(([field, label]) => {
                  const value = (stats[block.key] as Record<string, string | null>)?.[field]
                  const rank = value ? statRank(player.id, block.key, field) : null
                  return (
                    <div key={field}>
                      <dt>{label}</dt>
                      <dd>
                        {value ?? '—'}
                        {rank ? (
                          <span className={`stat-rank${rank.rank <= 3 ? ` top${rank.rank}` : ''}`}>
                            {rankLabel(rank.rank)}
                          </span>
                        ) : null}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </section>
          ))}
          </div>

          </div>

          <div className="panel-palmares">
          {palmaresFor(player.id).length > 0 ? (
            <section className="panel-block">
              <h3>Palmarès</h3>
              <Palmares playerId={player.id} />
            </section>
          ) : null}
          </div>

          <div className="panel-side">
          <section className="panel-block">
            <h3>Champions les plus joués</h3>
            <ul className="champ-list">
              {stats.champions.map((champ) => (
                <li key={champ.slug}>
                  <img src={championIcon(champ.slug)} alt="" />
                  <span className="champ-name">{champ.name}</span>
                  <span className="champ-meta">
                    {champ.games} parties · {champ.winrate} · KDA {champ.kda}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <p className="panel-source">
            Saison {STATS_SEASON} (2026), tous splits et tournois · gol.gg
          </p>
          </div>
        </>
      ) : (
        <p className="hint">Aucune statistique pour ce joueur.</p>
      )}

      <img className="panel-role-watermark" src={roleIcon(player.role, 'light')} alt="" />
    </aside>
  )
}
