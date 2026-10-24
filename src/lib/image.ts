function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('This image format is not supported by your browser.'))
    img.src = src
  })
}

/**
 * Validates an uploaded image and returns a downscaled JPEG data URL (longest
 * side ≤ maxSide). This is the "source" the cropper works from, small enough
 * for localStorage yet sharp enough to re-crop later.
 */
export async function prepareImageSource(file: File, maxSide = 1200, quality = 0.86): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file (JPG, PNG, WebP…).')
  if (file.size > 20 * 1024 * 1024) throw new Error('That image is too large (max 20 MB).')
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not process image.')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}
