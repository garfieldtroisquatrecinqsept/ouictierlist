import { NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { SOCIAL } from '../lib/links'

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const ICONS = {
  tierlists: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...stroke}>
      <rect x="3" y="4" width="18" height="5" rx="1.2" />
      <rect x="3" y="12" width="18" height="5" rx="1.2" />
      <path d="M7 4v5M7 12v5" />
    </svg>
  ),
  players: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...stroke}>
      <ellipse cx="12" cy="6" rx="7.5" ry="2.8" />
      <path d="M4.5 6v6c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8V6" />
      <path d="M4.5 12v6c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8v-6" />
    </svg>
  ),
  compare: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...stroke}>
      <path d="M4 7h11M4 7l3-3M4 7l3 3" />
      <path d="M20 17H9M20 17l-3-3M20 17l-3 3" />
    </svg>
  ),
  teams: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...stroke}>
      <path d="M12 3l7.5 2.6v5.2c0 4.6-3 8.3-7.5 10.2-4.5-1.9-7.5-5.6-7.5-10.2V5.6z" />
      <path d="M9.4 12.1l1.9 1.9 3.5-3.7" />
    </svg>
  ),
  discord: (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor">
      <path d="M19.27 5.33A16.4 16.4 0 0 0 15.2 4l-.25.46c1.35.32 2.6.87 3.76 1.64a13.1 13.1 0 0 0-11.4 0A12.5 12.5 0 0 1 11.08 4.5L10.82 4a16.4 16.4 0 0 0-4.09 1.33C4.14 9.24 3.44 13.05 3.79 16.8a16.6 16.6 0 0 0 5.03 2.55l.65-1.1a10.7 10.7 0 0 1-1.7-.82l.42-.32a11.8 11.8 0 0 0 10.05 0l.42.32c-.54.32-1.11.6-1.7.82l.65 1.1c1.8-.55 3.5-1.42 5.03-2.55.4-4.34-.71-8.12-2.37-11.47zM9.68 14.62c-.98 0-1.79-.9-1.79-2s.79-2.01 1.79-2.01 1.8.9 1.79 2.01c0 1.1-.8 2-1.79 2zm4.64 0c-.98 0-1.79-.9-1.79-2s.79-2.01 1.79-2.01 1.8.9 1.79 2.01c0 1.1-.79 2-1.79 2z" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M17.53 3h3.06l-6.69 7.64L21.75 21h-6.16l-4.83-6.3L5.24 21H2.18l7.15-8.17L2.25 3h6.32l4.36 5.77L17.53 3zm-1.07 16.17h1.69L7.62 4.74H5.8l10.66 14.43z" />
    </svg>
  ),
}

interface NavItem {
  to: string
  label: string
  icon: keyof typeof ICONS
  end?: boolean
}

const NAV: NavItem[] = [
  { to: '/', label: 'Tierlists', icon: 'tierlists', end: true },
  { to: '/joueurs', label: 'Base de données des joueurs', icon: 'players' },
  { to: '/comparer', label: 'Comparer deux joueurs', icon: 'compare' },
  { to: '/equipes', label: 'Équipes', icon: 'teams' },
]

export function TopNav() {
  return (
    <div className="topnav">
      <Logo compact />

      <nav className="topnav-links" aria-label="Navigation principale">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'nav-icon on' : 'nav-icon')}
            title={item.label}
            aria-label={item.label}
          >
            {ICONS[item.icon]}
          </NavLink>
        ))}

        <span className="topnav-sep" aria-hidden />

        {SOCIAL.discord ? (
          <a
            className="nav-icon"
            href={SOCIAL.discord}
            target="_blank"
            rel="noreferrer noopener"
            title="Discord"
            aria-label="Discord"
          >
            {ICONS.discord}
          </a>
        ) : null}

        {SOCIAL.twitter ? (
          <a
            className="nav-icon"
            href={SOCIAL.twitter}
            target="_blank"
            rel="noreferrer noopener"
            title="X"
            aria-label="X"
          >
            {ICONS.twitter}
          </a>
        ) : null}
      </nav>

      <ThemeToggle />
    </div>
  )
}
