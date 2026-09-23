import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { fetchGolggStats, golggId } from '../lib/golgg'
import { dominantColor } from '../lib/logoColor'
import {
  LEAGUES,
  LEAGUE_LABELS,
  ROLE_LABELS,
  ROLE_ORDER,
  TEAMS,
  addCustomPlayer,
  asset,
  roleIcon,
} from '../lib/players'
import type { CustomPlayer, LeagueId } from '../lib/players'
import type { RoleId } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  onAdded: (player: CustomPlayer, warning: string | null) => void
}

const NEW_TEAM = '__new__'
const MAX_WIDTH = 320

async function shrink(file: File): Promise<string> {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('lecture impossible'))
    reader.readAsDataURL(file)
  })
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error('image illisible'))
    element.src = source
  })
  if (image.width <= MAX_WIDTH) return source
  const canvas = document.createElement('canvas')
  canvas.width = MAX_WIDTH
  canvas.height = Math.round((image.height / image.width) * MAX_WIDTH)
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/webp', 0.86)
}

export function AddPlayerModal({ open, onClose, onAdded }: Props) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<RoleId>('top')
  const [teamShort, setTeamShort] = useState(TEAMS[0]?.short ?? NEW_TEAM)
  const [newTeamShort, setNewTeamShort] = useState('')
  const [newTeamName, setNewTeamName] = useState('')
  const [league, setLeague] = useState<LeagueId>('LEC')
  const [country, setCountry] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [teamLogo, setTeamLogo] = useState<string | null>(null)
  const [teamColor, setTeamColor] = useState<string | null>(null)
  const [golgg, setGolgg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const photoInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setName('')
    setRole('top')
    setTeamShort(TEAMS[0]?.short ?? NEW_TEAM)
    setNewTeamShort('')
    setNewTeamName('')
    setLeague('LEC')
    setCountry('')
    setPhoto(null)
    setTeamLogo(null)
    setTeamColor(null)
    setGolgg('')
    setError('')
    setBusy('')
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, busy])

  if (!open) return null

  const creatingTeam = teamShort === NEW_TEAM
  const existing = TEAMS.find((team) => team.short === teamShort)

  async function pickPhoto(file: File | undefined, target: 'photo' | 'logo') {
    if (!file) return
    try {
      const data = await shrink(file)
      if (target === 'photo') {
        setPhoto(data)
        return
      }
      setTeamLogo(data)
      setTeamColor(await dominantColor(data))
    } catch {
      setError("Cette image n'a pas pu être lue.")
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Donne le pseudo du joueur.')
      return
    }
    const short = creatingTeam ? newTeamShort.trim().toUpperCase() : teamShort
    if (!short) {
      setError("Donne le trigramme de l'équipe (T1, G2…).")
      return
    }
    if (golgg.trim() && !golggId(golgg.trim())) {
      setError('Le lien gol.gg doit ressembler à gol.gg/players/player-stats/1629/…')
      return
    }
    setError('')

    let stats = null
    let warning: string | null = null
    if (golgg.trim()) {
      setBusy('Récupération des stats gol.gg…')
      const result = await fetchGolggStats(golgg.trim())
      stats = result.stats
      if (!stats) {
        warning = `Stats gol.gg non récupérées (${result.error}). Le joueur est ajouté sans statistiques.`
      }
    }

    setBusy('Ajout du joueur…')
    const chosenLeague = creatingTeam ? league : ((existing?.league as LeagueId) ?? league)
    const entry: CustomPlayer = {
      id: `${short}-${trimmed}`,
      name: trimmed,
      team: short,
      league: chosenLeague,
      region: existing?.region ?? LEAGUE_LABELS[chosenLeague],
      role,
      country: country.trim() || '—',
      image: photo,
      custom: true,
      teamName: creatingTeam ? newTeamName.trim() || short : existing?.name,
      teamLogo: creatingTeam ? teamLogo : (existing?.logo ?? null),
      teamColor: creatingTeam
        ? teamColor
        : (existing?.color ?? (existing?.logo ? await dominantColor(asset(existing.logo) ?? '') : null)),
      golgg: golgg.trim() || null,
      stats,
    }
    addCustomPlayer(entry)
    setBusy('')
    onAdded(entry, warning)
  }

  return (
    <div className="modal-backdrop" onMouseDown={busy ? undefined : onClose}>
      <div className="modal modal-add" onMouseDown={(event) => event.stopPropagation()}>
        <h2>Ajouter un joueur</h2>
        <form onSubmit={handleSubmit}>
          <div className="add-row">
            <label className="field">
              <span>Pseudo</span>
              <input
                autoFocus
                value={name}
                disabled={Boolean(busy)}
                onChange={(event) => setName(event.target.value)}
                placeholder="Caps"
              />
            </label>
            <label className="field">
              <span>Pays</span>
              <input
                value={country}
                disabled={Boolean(busy)}
                onChange={(event) => setCountry(event.target.value)}
                placeholder="Denmark"
              />
            </label>
          </div>

          <fieldset className="field">
            <legend>Poste</legend>
            <div className="add-roles">
              {ROLE_ORDER.map((id) => (
                <button
                  key={id}
                  type="button"
                  disabled={Boolean(busy)}
                  className={role === id ? 'role-toggle on' : 'role-toggle'}
                  onClick={() => setRole(id)}
                  title={ROLE_LABELS[id]}
                >
                  <img src={roleIcon(id)} alt={ROLE_LABELS[id]} />
                </button>
              ))}
            </div>
          </fieldset>

          <label className="field">
            <span>Équipe</span>
            <select
              value={teamShort}
              disabled={Boolean(busy)}
              onChange={(event) => setTeamShort(event.target.value)}
            >
              {TEAMS.map((team) => (
                <option key={team.short} value={team.short}>
                  {team.short} · {team.name}
                </option>
              ))}
              <option value={NEW_TEAM}>+ Nouvelle équipe</option>
            </select>
          </label>

          {creatingTeam ? (
            <>
              <div className="add-row">
                <label className="field">
                  <span>Trigramme</span>
                  <input
                    value={newTeamShort}
                    disabled={Boolean(busy)}
                    onChange={(event) => setNewTeamShort(event.target.value)}
                    placeholder="KC"
                  />
                </label>
                <label className="field">
                  <span>Nom complet</span>
                  <input
                    value={newTeamName}
                    disabled={Boolean(busy)}
                    onChange={(event) => setNewTeamName(event.target.value)}
                    placeholder="Karmine Corp"
                  />
                </label>
              </div>
              <fieldset className="field">
                <legend>Ligue</legend>
                <div className="add-leagues">
                  {LEAGUES.map((id) => (
                    <button
                      key={id}
                      type="button"
                      disabled={Boolean(busy)}
                      className={league === id ? 'league-tab on' : 'league-tab'}
                      onClick={() => setLeague(id)}
                    >
                      {id} <small>{LEAGUE_LABELS[id]}</small>
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          ) : null}

          <div className="add-row">
            <div className="field">
              <span>Photo du joueur</span>
              <div className="add-file">
                <span className="add-preview">
                  {photo ? <img src={photo} alt="" /> : <em>aucune</em>}
                </span>
                <input
                  ref={photoInput}
                  type="file"
                  accept="image/*"
                  disabled={Boolean(busy)}
                  onChange={(event) => pickPhoto(event.target.files?.[0], 'photo')}
                />
              </div>
            </div>
            {creatingTeam ? (
              <div className="field">
                <span>Logo de l'équipe</span>
                <div className="add-file">
                  <span className="add-preview logo">
                    {teamLogo ? <img src={teamLogo} alt="" /> : <em>aucun</em>}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={Boolean(busy)}
                    onChange={(event) => pickPhoto(event.target.files?.[0], 'logo')}
                  />
                </div>
              </div>
            ) : existing?.logo ? (
              <div className="field">
                <span>Logo de l'équipe</span>
                <div className="add-file">
                  <span className="add-preview logo">
                    <img src={asset(existing.logo) ?? ''} alt="" />
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <label className="field">
            <span>Lien gol.gg (facultatif)</span>
            <input
              value={golgg}
              disabled={Boolean(busy)}
              onChange={(event) => setGolgg(event.target.value)}
              placeholder="https://gol.gg/players/player-stats/1629/season-S16/split-ALL/tournament-ALL/"
            />
          </label>
          <p className="create-note">
            Les stats et les 10 champions les plus joués sont récupérés depuis gol.gg au moment de
            l'ajout. Le joueur rejoint sa ligue, son équipe et son poste dans toute l'appli.
          </p>

          {error ? <p className="error">{error}</p> : null}

          <div className="modal-actions">
            <button type="button" className="ghost" disabled={Boolean(busy)} onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="primary" disabled={Boolean(busy)}>
              {busy ? <span className="spinner" /> : null}
              {busy || 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
