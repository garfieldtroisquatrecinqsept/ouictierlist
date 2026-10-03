import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface Props {
  width: number
  children: ReactNode
}

/**
 * Reduit un contenu de largeur fixe pour qu'il tienne dans son conteneur.
 * La mise a l'echelle porte sur un wrapper : l'element exporte garde sa vraie taille.
 */
export function ScaledPreview({ width, children }: Props) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState<number | undefined>(undefined)

  useLayoutEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return
    const update = () => {
      const next = Math.min(1, outer.clientWidth / width)
      setScale(next)
      setHeight(inner.offsetHeight * next)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(outer)
    observer.observe(inner)
    return () => observer.disconnect()
  }, [width])

  return (
    <div className="scaled-preview" ref={outerRef} style={{ height }}>
      <div
        ref={innerRef}
        style={{ width, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        {children}
      </div>
    </div>
  )
}
