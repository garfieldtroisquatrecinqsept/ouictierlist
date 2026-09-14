import { useEffect, useMemo, useState } from 'react'
import {
  PLAYERS,
  ROLE_LABELS,
  ROLE_ORDER,
  TEAMS,
  TOURNAMENT,
  asset,
  roleIcon,
  teamByShort,
} from '../lib/players'
import type { Player } from '../lib/players'
import type { RoleId } from '../types'

interface Props {
  open: boolean
  alreadyIn: string[]
  onClose: () => void
  onAdd: (players: Player[]) => void
}

export function PlayerPicker({ open, alreadyIn, onClose, onAdd }: Props) {
  const [search, setSearch] = useState('')
  const [roles, setRoles] = useState<RoleId[]>([])
  const [team, setTeam] = useState<string | 'all'>('all')
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    setSearch('')
    setRoles([])
    setTeam('all')
    setSelected([])
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const present = useMemo(() => new Set(alreadyIn), [alreadyIn])

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return PLAYERS.filter((player) => {
      if (team !== 'all' && player.team !== team) return false
      if (roles.length > 0 && !roles.includes(player.role)) return false
      if (!needle) return true
      const teamName = teamByShort(player.team)?.name ?? ''
      return (
        player.name.toLowerCase().includes(needle) ||
        player.team.toLowerCase().includes(needle) ||
        teamName.toLowerCase().includes(needle)
      )
    })
  }, [search, roles, team])

  if (!open) return null

  function toggle(id: string) {
    if (present.has(id)) return
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    )
  }

  function toggleRole(role: RoleId) {
    setRoles((current) =>
      current.includes(role) ? current.filter((value) => value !== role) : [...current, role],
    )
  }

  function confirm() {
    const chosen = PLAYERS.filter((player) => selected.includes(player.id))
    onAdd(chosen)
  }

  const selectableVisible = visible.filter((player) => !present.has(player.id))
  const allVisibleSelected =
    selectableVisible.length > 0 && selectableVisible.every((p) => selected.includes(p.id))

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal modal-wide" onMouseDown={(event) => event.stopPropagation()}>
        <div className="picker-head">
          <div>
            <h2>Ajouter des joueurs</h2>
            <p className="meta">
              {TOURNAMENT} · {PLAYERS.length} joueurs, {TEAMS.length} équipes qualifiées
            </p>
          </div>
          <button type="button" className="ghost" onClick={onClose}>
            Fermer
          </button>
        </div>

        <div className="picker-filters">
          <input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un joueur ou une équipe"
          />
          <div className="picker-roles">
            {ROLE_ORDER.map((role) => (
              <button
                key={role}
                type="button"
                className={roles.includes(role) ? 'role-toggle on' : 'role-toggle'}
                onClick={() => toggleRole(role)}
                aria-pressed={roles.includes(role)}
                title={ROLE_LABELS[role]}
              >
                <img src={roleIcon(role, 'light')} alt={ROLE_LABELS[role]} />
              </button>
            ))}
          </div>
        </div>

        <div className="picker-teams">
          <button
            type="button"
            className={team === 'all' ? 'team-tab on' : 'team-tab'}
            onClick={() => setTeam('all')}
          >
            Toutes
          </button>
          {TEAMS.map((item) => (
            <button
              key={item.short}
              type="button"
              className={team === item.short ? 'team-tab on' : 'team-tab'}
              onClick={() => setTeam(item.short)}
              title={item.name}
            >
              {item.logo ? <img src={asset(item.logo) ?? ''} alt="" /> : null}
              {item.short}
            </button>
          ))}
        </div>

        <div className="picker-grid">
          {visible.length === 0 ? (
            <p className="hint">Aucun joueur ne correspond.</p>
          ) : (
            visible.map((player) => {
              const inList = present.has(player.id)
              const isSelected = selected.includes(player.id)
              const photo = asset(player.image)
              const logo = asset(teamByShort(player.team)?.logo ?? null)
              const className = ['player-card', inList ? 'used' : '', isSelected ? 'picked' : '']
                .filter(Boolean)
                .join(' ')
              return (
                <button
                  key={player.id}
                  type="button"
                  className={className}
                  onClick={() => toggle(player.id)}
                  disabled={inList}
                  title={inList ? 'Déjà dans la tierlist' : player.name}
                >
                  <span className="player-photo">
                    {photo ? (
                      <img src={photo} alt="" draggable={false} />
                    ) : (
                      <span className="player-initials">{player.name.slice(0, 2)}</span>
                    )}
                    {logo ? <img className="player-logo" src={logo} alt="" /> : null}
                    <img className="player-role" src={roleIcon(player.role)} alt="" />
                  </span>
                  <span className="player-name">{player.name}</span>
                </button>
              )
            })
          )}
        </div>

        <div className="picker-footer">
          <button
            type="button"
            className="link"
            disabled={selectableVisible.length === 0}
            onClick={() =>
              setSelected(allVisibleSelected ? [] : selectableVisible.map((p) => p.id))
            }
          >
            {allVisibleSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
          <button type="button" className="primary" disabled={selected.length === 0} onClick={confirm}>
            Ajouter ({selected.length})
          </button>
        </div>
      </div>
    </div>
  )
}
