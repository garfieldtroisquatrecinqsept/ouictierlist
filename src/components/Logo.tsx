import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../store/ThemeContext'

const SOURCES = {
  light: `${import.meta.env.BASE_URL}raphcorp-light.png`,
  dark: `${import.meta.env.BASE_URL}raphcorp-dark.png`,
}

export function Logo({ compact = false }: { compact?: boolean }) {
  const { theme } = useTheme()
  const [failed, setFailed] = useState(false)
  const src = SOURCES[theme]

  useEffect(() => {
    setFailed(false)
  }, [src])

  return (
    <Link to="/" className={compact ? 'logo logo-compact' : 'logo'} aria-label="RaphCorp">
      {failed ? (
        <span className="logo-fallback">
          Raph<em>Corp</em>
        </span>
      ) : (
        <img src={src} alt="RaphCorp" onError={() => setFailed(true)} draggable={false} />
      )}
    </Link>
  )
}
