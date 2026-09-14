import { useEffect, useMemo, useRef, useState } from 'react'
import { PLAYERS, ROLE_LABELS, ROLE_ORDER, asset, roleIcon, teamByShort } from '../lib/players'
import type { Player } from '../lib/players'

interface Props {
  value: string
  exclude?: string
  onChange: (id: string) => void
}

export function PlayerSelect({ value, exclude, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = PLAYERS.find((player) => player.id === value) ?? null

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (open) setSearch('')
  }, [open])

  const options = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return PLAYERS.filter((player) => {
      if (player.id === exclude) return false
      if (!needle) return true
      const teamName = teamByShort(player.team)?.name ?? ''
      return (
        player.name.toLowerCase().includes(needle) ||
        player.team.toLowerCase().includes(needle) ||
        teamName.toLowerCase().includes(needle)
      )
    }).sort((a, b) => {
      const byRole = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)
      if (byRole !== 0) return byRole
      if (a.team !== b.team) return a.team.localeCompare(b.team)
      return a.name.localeCompare(b.name)
    })
  }, [search, exclude])

  function label(player: Player) {
    return `${player.name} · ${player.team} · ${ROLE_LABELS[player.role]}`
  }

  return (
    <div className="pselect" ref={rootRef}>
      <button
        type="button"
        className={open ? 'pselect-trigger open' : 'pselect-trigger'}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        {selected ? (
          <>
            <span className="pselect-face">
              {selected.image ? <img src={asset(selected.image) ?? ''} alt="" /> : null}
            </span>
            <span className="pselect-text">
              <strong>{selected.name}</strong>
              <small>
                {teamByShort(selected.team)?.name ?? selected.team} · {ROLE_LABELS[selected.role]}
              </small>
            </span>
          </>
        ) : (
          <span className="pselect-text">
            <strong>Choisir un joueur</strong>
            <small>{PLAYERS.length} joueurs</small>
          </span>
        )}
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className="pselect-panel">
          <input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher"
          />
          <div className="pselect-grid">
            {options.length === 0 ? (
              <p className="hint">Aucun joueur.</p>
            ) : (
              options.map((player) => {
                const team = teamByShort(player.team)
                return (
                  <button
                    key={player.id}
                    type="button"
                    className={player.id === value ? 'pselect-option on' : 'pselect-option'}
                    onClick={() => {
                      onChange(player.id)
                      setOpen(false)
                    }}
                    title={label(player)}
                  >
                    <span className="pselect-thumb">
                      {player.image ? <img src={asset(player.image) ?? ''} alt="" /> : null}
                      {team?.logo ? (
                        <img className="pselect-badge" src={asset(team.logo) ?? ''} alt="" />
                      ) : null}
                      <img className="pselect-role" src={roleIcon(player.role)} alt="" />
                    </span>
                    <span className="pselect-name">{player.name}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
