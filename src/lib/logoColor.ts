const FALLBACK = '#8b8b95'

/** Couleur dominante d'un logo : pixels opaques, extremes clairs et sombres ecartes. */
export async function dominantColor(src: string): Promise<string> {
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.crossOrigin = 'anonymous'
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('image illisible'))
      element.src = src
    })

    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return FALLBACK
    context.drawImage(image, 0, 0, 64, 64)

    const { data } = context.getImageData(0, 0, 64, 64)
    let red = 0
    let green = 0
    let blue = 0
    let count = 0
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 180) continue
      const luminance = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      if (luminance < 28 || luminance > 232) continue
      red += data[i]
      green += data[i + 1]
      blue += data[i + 2]
      count += 1
    }
    if (count === 0) return FALLBACK

    const hex = (value: number) => Math.round(value / count).toString(16).padStart(2, '0')
    return `#${hex(red)}${hex(green)}${hex(blue)}`
  } catch {
    return FALLBACK
  }
}
