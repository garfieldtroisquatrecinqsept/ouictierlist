import { useEffect, useState } from 'react'
import { useTheme } from '../store/ThemeContext'

const HOLD = 620
const FADE = 320

export function BootScreen() {
  const { theme } = useTheme()
  const [leaving, setLeaving] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hold = window.setTimeout(() => setLeaving(true), reduced ? 0 : HOLD)
    const done = window.setTimeout(() => setGone(true), reduced ? 0 : HOLD + FADE)
    return () => {
      window.clearTimeout(hold)
      window.clearTimeout(done)
    }
  }, [])

  if (gone) return null

  return (
    <div className={leaving ? 'boot leaving' : 'boot'} aria-hidden="true">
      <img
        className="boot-logo"
        src={`${import.meta.env.BASE_URL}raphcorp-${theme}.png`}
        alt=""
        draggable={false}
      />
      <span className="boot-word">
        Ouic<em>Tierlist</em>
      </span>
      <span className="boot-bar">
        <span />
      </span>
    </div>
  )
}
