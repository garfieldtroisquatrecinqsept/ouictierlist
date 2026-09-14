import type React from 'react'

export interface ExportBackground {
  id: string
  label: string
  css: string | null
  dark: boolean
}

export const EXPORT_BACKGROUNDS: ExportBackground[] = [
  { id: 'theme', label: 'Thème', css: null, dark: false },
  { id: 'paper', label: 'Papier', css: '#efeeea', dark: false },
  { id: 'slate', label: 'Ardoise', css: '#17171b', dark: true },
  { id: 'ocean', label: 'Océan', css: 'linear-gradient(135deg,#1d3a63,#0d1524)', dark: true },
  { id: 'ember', label: 'Braise', css: 'linear-gradient(135deg,#6d2230,#1b1114)', dark: true },
  { id: 'forest', label: 'Forêt', css: 'linear-gradient(135deg,#1f4b3f,#0d1a16)', dark: true },
  { id: 'gold', label: 'Or', css: 'linear-gradient(135deg,#b08a3e,#3c2d12)', dark: true },
]

const STORAGE_KEY = 'export.background.v1'

export interface ExportChoice {
  id: string
  custom?: string | null
}

export function loadChoice(): ExportChoice {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ExportChoice) : { id: 'theme' }
  } catch {
    return { id: 'theme' }
  }
}

export function saveChoice(choice: ExportChoice) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(choice))
  } catch {
    return
  }
}

export function backgroundCss(choice: ExportChoice): string | null {
  if (choice.id === 'custom') {
    return choice.custom ? `url(${choice.custom}) center / cover no-repeat` : null
  }
  return EXPORT_BACKGROUNDS.find((entry) => entry.id === choice.id)?.css ?? null
}

export function isDarkBackground(choice: ExportChoice): boolean {
  if (choice.id === 'custom') return Boolean(choice.custom)
  return EXPORT_BACKGROUNDS.find((entry) => entry.id === choice.id)?.dark ?? false
}

/** Style applique en direct au plateau : le fond choisi sert aussi de cadre a l'export. */
export function sheetStyle(choice: ExportChoice): React.CSSProperties | undefined {
  const css = backgroundCss(choice)
  return css ? { background: css, padding: '28px', borderRadius: 0 } : undefined
}

export function fileName(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '')
  return `${slug || 'tierlist'}.png`
}

export async function exportNode(node: HTMLElement, name: string): Promise<void> {
  const { toPng } = await import('html-to-image')
  const own = getComputedStyle(node).backgroundColor
  const transparent = own === 'rgba(0, 0, 0, 0)' || own === 'transparent'
  const url = await toPng(node, {
    pixelRatio: 2,
    backgroundColor: transparent ? getComputedStyle(document.body).backgroundColor : undefined,
  })
  const link = document.createElement('a')
  link.download = fileName(name)
  link.href = url
  link.click()
}
