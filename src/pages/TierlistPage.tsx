import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { TopNav } from '../components/TopNav'
import { PlayerPicker } from '../components/PlayerPicker'
import { TierList } from '../components/TierList'
import type { TierListValue } from '../components/TierList'
import { getCategory } from '../lib/categories'
import {
  LEAGUES,
  LEAGUE_LABELS,
  PLAYERS,
  ROLE_LABELS,
  ROLE_ORDER,
  asset,
  roleIcon,
  teamByShort,
} from '../lib/players'
import type { LeagueId, Player } from '../lib/players'
import { useTheme } from '../store/ThemeContext'
import { createId } from '../lib/storage'
import { useTierlists } from '../store/TierlistsContext'
import type { RoleId, TierItem } from '../types'

const TIER_COLORS = ['#a8574a', '#b97c4e', '#b39a51', '#7d8f6b', '#6d7d8b', '#8a7a6b', '#6f6a63']

export function TierlistPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { getTierlist, updateTierlist, loading } = useTierlists()
  const { theme } = useTheme()
  const [label, setLabel] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [benchRoles, setBenchRoles] = useState<RoleId[]>([])
  const [benchTeams, setBenchTeams] = useState<string[]>([])
  const [benchLeagues, setBenchLeagues] = useState<LeagueId[]>([])

  const tierlist = getTierlist(id)

  const benchIndex = useMemo(() => {
    const byPlayerId = new Map(PLAYERS.map((player) => [player.id, player]))
    const map = new Map<string, { team: string | null; league: LeagueId | null }>()
    tierlist?.items.forEach((item) => {
      const player = item.playerId ? byPlayerId.get(item.playerId) : undefined
      map.set(item.id, { team: player?.team ?? null, league: player?.league ?? null })
    })
    return map
  }, [tierlist])

  const benchTeamOptions = useMemo(() => {
    if (!tierlist) return []
    const shorts = new Set<string>()
    tierlist.poolItemIds.forEach((itemId) => {
      const team = benchIndex.get(itemId)?.team
      if (team) shorts.add(team)
    })
    return [...shorts].sort()
  }, [tierlist, benchIndex])

  const benchLeagueOptions = useMemo(() => {
    if (!tierlist) return []
    const found = new Set<LeagueId>()
    tierlist.poolItemIds.forEach((itemId) => {
      const league = benchIndex.get(itemId)?.league
      if (league) found.add(league)
    })
    return LEAGUES.filter((league) => found.has(league))
  }, [tierlist, benchIndex])

  const hiddenPoolIds = useMemo(() => {
    const active = benchRoles.length > 0 || benchTeams.length > 0 || benchLeagues.length > 0
    if (!tierlist || !active) return new Set<string>()
    const byId = new Map(tierlist.items.map((item) => [item.id, item]))
    return new Set(
      tierlist.poolItemIds.filter((itemId) => {
        const item = byId.get(itemId)
        const meta = benchIndex.get(itemId)
        if (benchRoles.length > 0 && (!item?.role || !benchRoles.includes(item.role))) return true
        if (benchTeams.length > 0 && (!meta?.team || !benchTeams.includes(meta.team))) return true
        if (benchLeagues.length > 0 && (!meta?.league || !benchLeagues.includes(meta.league)))
          return true
        return false
      }),
    )
  }, [tierlist, benchRoles, benchTeams, benchLeagues, benchIndex])

  const board = useMemo<TierListValue | null>(() => {
    if (!tierlist) return null
    const byId = new Map(tierlist.items.map((item) => [item.id, item]))
    const toTile = (itemId: string) => {
      const item = byId.get(itemId)
      if (!item) return null
      return {
        id: item.id,
        label: item.label,
        image: item.image ?? undefined,
        badge: item.teamLogo ?? undefined,
        roleIcon: item.role ? roleIcon(item.role) : undefined,
      }
    }
    return {
      tiers: tierlist.tiers.map((tier, index) => ({
        id: tier.id,
        label: tier.label,
        color: TIER_COLORS[index % TIER_COLORS.length],
        items: tier.itemIds.map(toTile).filter((tile) => tile !== null),
      })),
      pool: tierlist.poolItemIds
        .filter((itemId) => !hiddenPoolIds.has(itemId))
        .map(toTile)
        .filter((tile) => tile !== null),
    }
  }, [tierlist, hiddenPoolIds])

  if (loading) {
    return (
      <div className="page">
        <TopNav />
        <div className="page-loader">
          <span />
          <span />
          <span />
        </div>
      </div>
    )
  }

  if (!tierlist || !board) {
    return (
      <div className="page">
        <TopNav />
        <h1 className="sheet-title">Introuvable</h1>
        <p className="tagline">Cette tierlist n'existe plus.</p>
        <p>
          <Link to="/">Retour à l'accueil</Link>
        </p>
      </div>
    )
  }

  const category = getCategory(tierlist.category)
  const activeFilters = benchRoles.length + benchTeams.length + benchLeagues.length

  function resetBench() {
    setBenchRoles([])
    setBenchTeams([])
    setBenchLeagues([])
  }

  function handleBoardChange(next: TierListValue) {
    updateTierlist(id, (current) => {
      const seen = new Map<string, TierItem>()
      const register = (tile: { id: string; label?: string; image?: string }) => {
        const existing = current.items.find((item) => item.id === tile.id)
        seen.set(tile.id, {
          id: tile.id,
          label: tile.label ?? existing?.label ?? '',
          image: tile.image ?? existing?.image ?? null,
          role: existing?.role ?? null,
          teamLogo: existing?.teamLogo ?? null,
          playerId: existing?.playerId ?? null,
        })
        return tile.id
      }
      const tiers = next.tiers.map((tier) => ({
        id: tier.id,
        label: tier.label,
        itemIds: tier.items.map(register),
      }))
      const hidden = current.poolItemIds.filter((itemId) => hiddenPoolIds.has(itemId))
      const poolItemIds = [...next.pool.map(register), ...hidden]
      const items = [...seen.values()]
      const kept = new Set(items.map((item) => item.id))
      current.items.forEach((item) => {
        if (hidden.includes(item.id) && !kept.has(item.id)) items.push(item)
      })
      return { ...current, tiers, items, poolItemIds }
    })
  }

  function handleRemoveItem(itemId: string) {
    updateTierlist(id, (current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== itemId),
      poolItemIds: current.poolItemIds.filter((value) => value !== itemId),
      tiers: current.tiers.map((tier) => ({
        ...tier,
        itemIds: tier.itemIds.filter((value) => value !== itemId),
      })),
    }))
  }

  function handleAddPlayers(players: Player[]) {
    updateTierlist(id, (current) => {
      const known = new Set(current.items.map((item) => item.playerId).filter(Boolean))
      const fresh = players
        .filter((player) => !known.has(player.id))
        .map((player) => ({
          id: createId(),
          label: player.name,
          image: asset(player.image),
          role: player.role,
          teamLogo: asset(teamByShort(player.team)?.logo ?? null),
          playerId: player.id,
        }))
      if (fresh.length === 0) return current
      return {
        ...current,
        items: [...current.items, ...fresh],
        poolItemIds: [...current.poolItemIds, ...fresh.map((item) => item.id)],
      }
    })
    setPickerOpen(false)
  }

  function handleAddItem(event: FormEvent) {
    event.preventDefault()
    const trimmed = label.trim()
    if (!trimmed) return
    updateTierlist(id, (current) => {
      const item = {
        id: createId(),
        label: trimmed,
        image: null,
        role: null,
        teamLogo: null,
        playerId: null,
      }
      return {
        ...current,
        items: [...current.items, item],
        poolItemIds: [...current.poolItemIds, item.id],
      }
    })
    setLabel('')
  }

  return (
    <div className="page">
      <TopNav />

      <header className="sheet-header">
        <div>
          <button type="button" className="ghost" onClick={() => navigate('/')}>
            ← Toutes les tierlists
          </button>
          <h1 className="sheet-title">{tierlist.name}</h1>
          <p className="tagline">{category ? category.fullName : tierlist.category}</p>
        </div>
      </header>

      <div className="pool-form">
        <button type="button" className="primary" onClick={() => setPickerOpen(true)}>
          Ajouter des joueurs
        </button>
        <form onSubmit={handleAddItem} className="pool-custom">
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="ou une entrée libre"
          />
          <button type="submit">Ajouter</button>
        </form>
      </div>

      <section className="bench-filter">
        <header className="bench-filter-head">
          <h2>Filtrer le banc</h2>
          {activeFilters > 0 ? (
            <>
              <span className="bench-badge">{hiddenPoolIds.size} masqué{hiddenPoolIds.size > 1 ? 's' : ''}</span>
              <button type="button" className="link" onClick={resetBench}>
                Tout afficher
              </button>
            </>
          ) : (
            <span className="hint">aucun filtre actif</span>
          )}
        </header>

        <div className="bench-groups">
          <div className="bench-group">
            <span className="bench-group-label">Poste</span>
            <div className="picker-roles">
              {ROLE_ORDER.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={benchRoles.includes(role) ? 'role-toggle on' : 'role-toggle'}
                  onClick={() =>
                    setBenchRoles((current) =>
                      current.includes(role)
                        ? current.filter((value) => value !== role)
                        : [...current, role],
                    )
                  }
                  aria-pressed={benchRoles.includes(role)}
                  title={ROLE_LABELS[role]}
                >
                  <img
                    src={roleIcon(role, theme === 'dark' ? 'dark' : 'light')}
                    alt={ROLE_LABELS[role]}
                  />
                </button>
              ))}
            </div>
          </div>

          {benchLeagueOptions.length > 1 ? (
            <div className="bench-group">
              <span className="bench-group-label">Région</span>
              <div className="bench-chips">
                {benchLeagueOptions.map((league) => (
                  <button
                    key={league}
                    type="button"
                    className={benchLeagues.includes(league) ? 'league-tab on' : 'league-tab'}
                    onClick={() =>
                      setBenchLeagues((current) =>
                        current.includes(league)
                          ? current.filter((value) => value !== league)
                          : [...current, league],
                      )
                    }
                    aria-pressed={benchLeagues.includes(league)}
                    title={league}
                  >
                    {LEAGUE_LABELS[league]}
                    <small>{league}</small>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {benchTeamOptions.length > 1 ? (
            <div className="bench-group bench-group-wide">
              <span className="bench-group-label">Équipe</span>
              <div className="bench-chips">
                {benchTeamOptions.map((short) => {
                  const team = teamByShort(short)
                  const on = benchTeams.includes(short)
                  return (
                    <button
                      key={short}
                      type="button"
                      className={on ? 'team-tab on' : 'team-tab'}
                      onClick={() =>
                        setBenchTeams((current) =>
                          current.includes(short)
                            ? current.filter((value) => value !== short)
                            : [...current, short],
                        )
                      }
                      aria-pressed={on}
                      title={team?.name ?? short}
                    >
                      {team?.logo ? <img src={asset(team.logo) ?? ''} alt="" /> : null}
                      {short}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <TierList
        className="board"
        value={board}
        onChange={handleBoardChange}
        onRemoveItem={handleRemoveItem}
        tierColors={TIER_COLORS}
        tileSize={96}
      />

      <PlayerPicker
        open={pickerOpen}
        alreadyIn={tierlist.items.map((item) => item.playerId).filter((v): v is string => !!v)}
        category={tierlist.category}
        onClose={() => setPickerOpen(false)}
        onAdd={handleAddPlayers}
      />
    </div>
  )
}
