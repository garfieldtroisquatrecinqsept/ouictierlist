import { TIER_COLORS } from './TierList'
import { gradeColor } from '../lib/grades'
import { asset, teamByShort } from '../lib/players'
import { rostersOf, teamKey } from './GradeBoard'
import type { Tierlist } from '../types'

const MAX_ROWS = 4
const MAX_FACES = 8

function GradesPreview({ tierlist }: { tierlist: Tierlist }) {
  const rosters = rostersOf(tierlist)
  const started = rosters.filter((roster) =>
    roster.players.some((player) => tierlist.grades[player.id]),
  )
  const rows = [...started, ...rosters.filter((roster) => !started.includes(roster))]

  if (started.length === 0) {
    return (
      <div className="preview empty">
        <div className="preview-logos">
          {rosters.slice(0, 9).map((roster) => {
            const logo = teamByShort(roster.short)?.logo
            return logo ? (
              <img key={roster.short} src={asset(logo) ?? ''} alt="" />
            ) : (
              <span key={roster.short} className="preview-chip">
                {roster.short}
              </span>
            )
          })}
        </div>
        <span className="preview-hint">{rosters.length} équipes à noter</span>
      </div>
    )
  }

  return (
    <div className="preview">
      {rows.slice(0, MAX_ROWS).map((roster) => {
        const logo = teamByShort(roster.short)?.logo
        const team = tierlist.grades[teamKey(roster.short)]
        return (
          <div key={roster.short} className="preview-row grades">
            {logo ? <img className="preview-team" src={asset(logo) ?? ''} alt="" /> : null}
            <span className="preview-marks">
              {roster.players.map((player) => {
                const grade = tierlist.grades[player.id]
                return (
                  <span
                    key={player.id}
                    className={grade ? 'preview-grade' : 'preview-grade off'}
                    style={grade ? { color: gradeColor(grade) } : undefined}
                  >
                    {grade ?? '·'}
                  </span>
                )
              })}
            </span>
            {team ? (
              <span className="preview-grade team" style={{ color: gradeColor(team) }}>
                {team}
              </span>
            ) : null}
          </div>
        )
      })}
      {rows.length > MAX_ROWS ? (
        <span className="preview-hint">
          {started.length}/{rosters.length} équipes notées
        </span>
      ) : null}
    </div>
  )
}

function TiersPreview({ tierlist }: { tierlist: Tierlist }) {
  const byId = new Map(tierlist.items.map((item) => [item.id, item]))
  const filled = tierlist.tiers.filter((tier) => tier.itemIds.length > 0)
  const ranked = tierlist.tiers.reduce((total, tier) => total + tier.itemIds.length, 0)

  if (filled.length === 0) {
    return (
      <div className="preview empty">
        <div className="preview-faces">
          {tierlist.items.slice(0, 9).map((item) =>
            item.image ? (
              <img key={item.id} src={item.image} alt="" />
            ) : (
              <span key={item.id} className="preview-chip">
                {item.label.slice(0, 3)}
              </span>
            ),
          )}
        </div>
        <span className="preview-hint">{tierlist.items.length} joueurs au banc</span>
      </div>
    )
  }

  return (
    <div className="preview">
      {tierlist.tiers.slice(0, MAX_ROWS).map((tier) => {
        const index = tierlist.tiers.indexOf(tier)
        const items = tier.itemIds.map((id) => byId.get(id)).filter(Boolean)
        return (
          <div key={tier.id} className="preview-row">
            <span
              className="preview-tier"
              style={{ background: TIER_COLORS[index % TIER_COLORS.length] }}
            >
              {tier.label}
            </span>
            <span className="preview-faces">
              {items.slice(0, MAX_FACES).map((item) =>
                item!.image ? (
                  <img key={item!.id} src={item!.image} alt="" />
                ) : (
                  <span key={item!.id} className="preview-chip">
                    {item!.label.slice(0, 3)}
                  </span>
                ),
              )}
              {items.length > MAX_FACES ? (
                <span className="preview-more">+{items.length - MAX_FACES}</span>
              ) : null}
              {items.length === 0 ? <span className="preview-more">vide</span> : null}
            </span>
          </div>
        )
      })}
      {tierlist.tiers.length > MAX_ROWS ? (
        <span className="preview-hint">
          {ranked} joueur{ranked > 1 ? 's' : ''} classé{ranked > 1 ? 's' : ''}
        </span>
      ) : null}
    </div>
  )
}

export function TierlistPreview({ tierlist }: { tierlist: Tierlist }) {
  return tierlist.mode === 'grades' ? (
    <GradesPreview tierlist={tierlist} />
  ) : (
    <TiersPreview tierlist={tierlist} />
  )
}
