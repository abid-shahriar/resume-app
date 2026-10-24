export interface FontDef {
  family: string
  category: 'sans' | 'serif' | 'mono'
  /** Google Fonts CSS2 axis spec */
  spec: string
  fallback: string
}

const FULL = 'ital,wght@0,400;0,500;0,600;0,700;1,400'
const SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
const SERIF = 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

export const FONTS: FontDef[] = [
  { family: 'Inter', category: 'sans', spec: FULL, fallback: SANS },
  { family: 'Roboto', category: 'sans', spec: FULL, fallback: SANS },
  { family: 'Lato', category: 'sans', spec: 'ital,wght@0,400;0,700;1,400;1,700', fallback: SANS },
  { family: 'Open Sans', category: 'sans', spec: FULL, fallback: SANS },
  { family: 'Source Sans 3', category: 'sans', spec: FULL, fallback: SANS },
  { family: 'IBM Plex Sans', category: 'sans', spec: FULL, fallback: SANS },
  { family: 'Nunito Sans', category: 'sans', spec: FULL, fallback: SANS },
  { family: 'Work Sans', category: 'sans', spec: FULL, fallback: SANS },
  { family: 'DM Sans', category: 'sans', spec: FULL, fallback: SANS },
  { family: 'Manrope', category: 'sans', spec: 'wght@400;500;600;700', fallback: SANS },
  { family: 'Poppins', category: 'sans', spec: FULL, fallback: SANS },
  { family: 'Montserrat', category: 'sans', spec: FULL, fallback: SANS },
  { family: 'Raleway', category: 'sans', spec: FULL, fallback: SANS },
  { family: 'Outfit', category: 'sans', spec: 'wght@400;500;600;700', fallback: SANS },
  { family: 'Space Grotesk', category: 'sans', spec: 'wght@400;500;600;700', fallback: SANS },
  { family: 'Archivo', category: 'sans', spec: FULL, fallback: SANS },
  { family: 'Rubik', category: 'sans', spec: FULL, fallback: SANS },
  { family: 'Merriweather', category: 'serif', spec: FULL, fallback: SERIF },
  { family: 'Lora', category: 'serif', spec: FULL, fallback: SERIF },
  { family: 'Playfair Display', category: 'serif', spec: FULL, fallback: SERIF },
  { family: 'EB Garamond', category: 'serif', spec: FULL, fallback: SERIF },
  { family: 'Libre Baskerville', category: 'serif', spec: 'ital,wght@0,400;0,700;1,400', fallback: SERIF },
  { family: 'Crimson Pro', category: 'serif', spec: FULL, fallback: SERIF },
  { family: 'Source Serif 4', category: 'serif', spec: FULL, fallback: SERIF },
  { family: 'PT Serif', category: 'serif', spec: 'ital,wght@0,400;0,700;1,400;1,700', fallback: SERIF },
  { family: 'Cormorant Garamond', category: 'serif', spec: FULL, fallback: SERIF },
  { family: 'JetBrains Mono', category: 'mono', spec: FULL, fallback: MONO },
  { family: 'IBM Plex Mono', category: 'mono', spec: FULL, fallback: MONO },
]

const BY_FAMILY = new Map(FONTS.map((f) => [f.family, f]))

export function fontStack(family: string): string {
  const def = BY_FAMILY.get(family)
  return def ? `"${def.family}", ${def.fallback}` : `"${family}", ${SANS}`
}

const loaded = new Set<string>()

/** Injects the Google Fonts stylesheet for the given families (deduplicated). */
export function loadFonts(families: string[]) {
  if (typeof document === 'undefined') return
  const missing = [...new Set(families)].filter((f) => f && BY_FAMILY.has(f) && !loaded.has(f))
  if (!missing.length) return
  missing.forEach((f) => loaded.add(f))
  const params = missing
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:${BY_FAMILY.get(f)!.spec}`)
    .join('&')
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${params}&display=swap`
  document.head.appendChild(link)
}

/** Resolves once the given families are usable (or after a timeout). */
export async function waitForFonts(families: string[], timeout = 4000) {
  if (typeof document === 'undefined' || !document.fonts) return
  const loads = families.flatMap((f) => [
    document.fonts.load(`400 12px "${f}"`),
    document.fonts.load(`700 12px "${f}"`),
  ])
  await Promise.race([
    Promise.allSettled(loads).then(() => document.fonts.ready),
    new Promise((r) => setTimeout(r, timeout)),
  ])
}
