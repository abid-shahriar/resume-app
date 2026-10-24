import { Fragment, type ReactNode } from 'react'

/**
 * A tiny, safe markdown subset for resume descriptions:
 *   **bold**, *italic* / _italic_, [text](url), bare URLs,
 *   "- " / "* " / "• " bullet lists, "1. " numbered lists, paragraphs.
 * Produces React nodes only (no innerHTML).
 */

type Block =
  | { kind: 'p'; lines: string[] }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }

const BULLET = /^\s*[-*•–]\s+(.*)$/
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/

export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = []
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  for (const raw of lines) {
    const line = raw.trimEnd()
    const last = blocks[blocks.length - 1]
    let m: RegExpMatchArray | null
    if (!line.trim()) {
      blocks.push({ kind: 'p', lines: [] })
      continue
    }
    if ((m = line.match(BULLET))) {
      if (last?.kind === 'ul') last.items.push(m[1])
      else blocks.push({ kind: 'ul', items: [m[1]] })
    } else if ((m = line.match(NUMBERED))) {
      if (last?.kind === 'ol') last.items.push(m[1])
      else blocks.push({ kind: 'ol', items: [m[1]] })
    } else if (last?.kind === 'p' && last.lines.length) {
      last.lines.push(line.trim())
    } else {
      blocks.push({ kind: 'p', lines: [line.trim()] })
    }
  }
  return blocks.filter((b) => (b.kind === 'p' ? b.lines.length > 0 : b.items.length > 0))
}

const INLINE = /(\*\*([^*]+?)\*\*)|(__([^_]+?)__)|(\[([^\]]+)\]\(([^)\s]+)\))|(\*([^*\s][^*]*?)\*)|(\b_([^_\s][^_]*?)_\b)|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g

export function safeUrl(url: string): string | undefined {
  const u = url.trim()
  if (!u) return undefined
  if (/^(https?:|mailto:|tel:)/i.test(u)) return u
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return undefined // block javascript: and friends
  if (u.includes('@') && !u.includes('/')) return `mailto:${u}`
  return `https://${u.replace(/^\/+/, '')}`
}

export function renderInline(text: string, keyPrefix = 'i'): ReactNode[] {
  const out: ReactNode[] = []
  let lastIndex = 0
  let i = 0
  for (const m of text.matchAll(INLINE)) {
    const start = m.index ?? 0
    if (start > lastIndex) out.push(text.slice(lastIndex, start))
    const key = `${keyPrefix}-${i++}`
    if (m[2] !== undefined || m[4] !== undefined) {
      out.push(<strong key={key}>{renderInline(m[2] ?? m[4], key)}</strong>)
    } else if (m[6] !== undefined) {
      const href = safeUrl(m[7])
      out.push(
        href ? (
          <a key={key} href={href} target="_blank" rel="noreferrer">
            {renderInline(m[6], key)}
          </a>
        ) : (
          <Fragment key={key}>{m[6]}</Fragment>
        ),
      )
    } else if (m[9] !== undefined || m[11] !== undefined) {
      out.push(<em key={key}>{renderInline(m[9] ?? m[11], key)}</em>)
    } else if (m[12] !== undefined) {
      out.push(
        <a key={key} href={m[12]} target="_blank" rel="noreferrer">
          {m[12].replace(/^https?:\/\/(www\.)?/, '')}
        </a>,
      )
    }
    lastIndex = start + m[0].length
  }
  if (lastIndex < text.length) out.push(text.slice(lastIndex))
  return out
}

export function RichText({ text, className }: { text: string; className?: string }) {
  if (!text?.trim()) return null
  const blocks = parseBlocks(text)
  return (
    <div className={className ? `rs-rich ${className}` : 'rs-rich'}>
      {blocks.map((b, bi) => {
        if (b.kind === 'p') {
          return (
            <p key={bi}>
              {b.lines.map((l, li) => (
                <Fragment key={li}>
                  {li > 0 && <br />}
                  {renderInline(l, `${bi}-${li}`)}
                </Fragment>
              ))}
            </p>
          )
        }
        const Tag = b.kind
        return (
          <Tag key={bi}>
            {b.items.map((it, ii) => (
              <li key={ii}>{renderInline(it, `${bi}-${ii}`)}</li>
            ))}
          </Tag>
        )
      })}
    </div>
  )
}

/** Plain text version (for previews / search). */
export function stripMarkdown(text: string) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_]/g, '')
    .replace(/^\s*[-*•–]\s+/gm, '• ')
}
