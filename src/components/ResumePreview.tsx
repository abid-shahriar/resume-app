import { memo, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import type { Resume } from '@/lib/types'
import { cn } from '@/lib/utils'
import { PAGE_SIZES_PX, ResumeDocument } from '@/templates/ResumeDocument'

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

export type Zoom = 'fit' | number

/**
 * Live, scaled preview of a resume with page-break guides.
 */
export const ResumePreview = memo(function ResumePreview({
  resume,
  zoom = 'fit',
  padding = 32,
  maxFitScale = 1.15,
  onLayout,
  className,
  sheetName,
}: {
  resume: Resume
  zoom?: Zoom
  padding?: number
  maxFitScale?: number
  onLayout?: (info: { pages: number; scale: number }) => void
  className?: string
  /** CSS view-transition-name for the sheet */
  sheetName?: string
}) {
  // Note: intentionally not using useDeferredValue here; deferred (transition)
  // updates would activate the route-level <ViewTransition> on every keystroke.
  const deferred = resume
  const [containerRef, container] = useElementSize<HTMLDivElement>()
  const innerRef = useRef<HTMLDivElement | null>(null)
  const [contentHeight, setContentHeight] = useState(0)

  const page = PAGE_SIZES_PX[deferred.design.pageSize] ?? PAGE_SIZES_PX.a4
  const available = Math.max(0, container.width - padding * 2)
  const fitScale = available > 0 ? Math.min(maxFitScale, available / page.width) : 0
  const scale = zoom === 'fit' ? fitScale : zoom
  const pages = Math.max(1, Math.ceil((contentHeight - 1) / page.height))
  const ready = scale > 0

  useLayoutEffect(() => {
    const el = innerRef.current
    if (!el) return
    const update = () => setContentHeight(el.offsetHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ready])

  useEffect(() => {
    if (scale > 0) onLayout?.({ pages, scale })
  }, [pages, scale, onLayout])

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {scale > 0 && (
        <div
          className="relative mx-auto"
          style={{ width: page.width * scale, height: pages * page.height * scale, paddingTop: 0 }}
        >
          <div
            className="absolute left-0 top-0 origin-top-left overflow-hidden bg-white shadow-[var(--shadow-paper)]"
            style={
              {
                width: page.width,
                height: pages * page.height,
                transform: `scale(${scale})`,
                borderRadius: 2 / scale,
                viewTransitionName: sheetName,
              } as CSSProperties
            }
          >
            <ResumeDocument resume={deferred} pages={pages} innerRef={innerRef} />
          </div>
          {Array.from({ length: pages - 1 }, (_, i) => (
            <div
              key={i}
              className="pointer-events-none absolute inset-x-0 flex items-center"
              style={{ top: (i + 1) * page.height * scale }}
              aria-hidden
            >
              <div className="h-0 w-full border-t border-dashed border-accent/50" />
              <span className="absolute right-0 top-0 -translate-y-1/2 translate-x-[calc(100%+8px)] whitespace-nowrap rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm max-[900px]:right-2 max-[900px]:translate-x-0">
                Page {i + 2}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

/**
 * Static, lazily rendered thumbnail of a resume (used in galleries and lists).
 */
export const ResumeThumb = memo(function ResumeThumb({
  resume,
  className,
  eager,
}: {
  resume: Resume
  className?: string
  /** Render during browser idle time even before scrolled into view */
  eager?: boolean
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)
  const [visible, setVisible] = useState(false)
  const page = PAGE_SIZES_PX[resume.design.pageSize] ?? PAGE_SIZES_PX.a4

  useEffect(() => {
    if (!eager || visible) return
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void }
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setVisible(true), { timeout: 2000 })
      return () => w.cancelIdleCallback?.(id)
    }
    const t = setTimeout(() => setVisible(true), 300)
    return () => clearTimeout(t)
  }, [eager, visible])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // Ignore zero widths (element hidden with display:none) so the rendered
    // document stays mounted and re-appears instantly.
    const measure = () => {
      if (el.clientWidth > 0) setWidth(el.clientWidth)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '300px' },
    )
    io.observe(el)
    return () => {
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  const scale = width / page.width
  return (
    <div
      ref={ref}
      className={cn('relative w-full overflow-hidden bg-white [contain:strict]', className)}
      style={{ aspectRatio: `${page.width} / ${page.height}` }}
    >
      {visible && width > 0 && (
        <div
          inert
          className="pointer-events-none absolute left-0 top-0 origin-top-left select-none"
          style={{ width: page.width, transform: `scale(${scale})` }}
        >
          <ResumeDocument resume={resume} />
        </div>
      )}
    </div>
  )
})
