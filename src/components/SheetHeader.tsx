import { useTheme } from '../store/ThemeContext'

interface Props {
  title: string
  onDark: boolean
}

export function SheetHeader({ title, onDark }: Props) {
  const { theme } = useTheme()
  const light = onDark || theme === 'dark'
  const base = import.meta.env.BASE_URL

  return (
    <div className="recap-title">
      <img
        className="recap-worlds"
        src={`${base}worlds-2026-${light ? 'light' : 'dark'}.png`}
        alt="Worlds 2026"
      />
      <strong>{title}</strong>
      <img
        className="recap-brand-logo"
        src={`${base}raphcorp-${light ? 'dark' : 'light'}.png`}
        alt="RaphCorp"
      />
    </div>
  )
}
