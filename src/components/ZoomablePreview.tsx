import { Maximize, Minus, Plus } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Resume } from '@/lib/types'
import { clamp, cn } from '@/lib/utils'
import { Tip } from './kit'
import { ResumePreview, type Zoom } from './ResumePreview'
import { Button } from './ui/button'

const STEPS = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3]
const MAX_SCALE = 3
const DOUBLE_TAP_MS = 300

/** A point of the document (unscaled px) that should end up under a screen point. */
interface Anchor {
  x: number
  y: number
  clientX: number
  clientY: number
}

export interface PreviewLayout {
  pages: number
  scale: number
  fitScale: number
}

/**
 * Scrollable resume preview with zoom: pinch and double-tap on touch screens,
 * Ctrl/⌘ + wheel or trackpad pinch on desktop, drag to pan with the mouse, and
 * optional floating controls. Zooming keeps the point under the fingers/cursor
 * in place. The document is re-laid out at each scale, so text stays crisp.
 */
export function ZoomablePreview({
  resume,
  padding = 32,
  maxFitScale = 1.15,
  controls = true,
  className,
  innerClassName,
  onLayout,
}: {
  resume: Resume
  padding?: number
  maxFitScale?: number
  controls?: boolean
  className?: string
  /** Padding around the page inside the scroll area */
  innerClassName?: string
  onLayout?: (info: PreviewLayout) => void
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState<Zoom>('fit')
  const [layout, setLayout] = useState<PreviewLayout>({ pages: 1, scale: 1, fitScale: 1 })
  const scale = zoom === 'fit' ? layout.fitScale : zoom
  const scaleRef = useRef(scale)
  const fitRef = useRef(layout.fitScale)
  const pending = useRef<Anchor | null>(null)

  useLayoutEffect(() => {
    scaleRef.current = scale
    fitRef.current = layout.fitScale
  })

  const handleLayout = useCallback(
    (info: PreviewLayout) => {
      setLayout(info)
      onLayout?.(info)
    },
    [onLayout],
  )

  /** Document point currently under a screen point. */
  const anchorAt = useCallback((clientX: number, clientY: number): Anchor | null => {
    const sheet = scroller.current?.querySelector<HTMLElement>('[data-sheet]')
    if (!sheet) return null
    const r = sheet.getBoundingClientRect()
    return { x: (clientX - r.left) / scaleRef.current, y: (clientY - r.top) / scaleRef.current, clientX, clientY }
  }, [])

  const zoomTo = useCallback(
    (next: number | 'fit', anchor?: Anchor | null) => {
      const el = scroller.current
      if (!el) return
      if (!anchor) {
        const r = el.getBoundingClientRect()
        anchor = anchorAt(r.left + r.width / 2, r.top + r.height / 2)
      }
      pending.current = anchor ?? null
      if (next === 'fit') return setZoom('fit')
      const min = Math.min(0.3, fitRef.current)
      const value = clamp(next, min, MAX_SCALE)
      // Close enough to "fit" counts as fit, so the view re-fits on resize
      setZoom(Math.abs(value - fitRef.current) / fitRef.current < 0.02 ? 'fit' : value)
    },
    [anchorAt],
  )

  // After a zoom renders, scroll so the anchored point is back under the finger/cursor
  useLayoutEffect(() => {
    const p = pending.current
    const el = scroller.current
    const sheet = el?.querySelector<HTMLElement>('[data-sheet]')
    if (!p || !el || !sheet) return
    pending.current = null
    const r = sheet.getBoundingClientRect()
    el.scrollLeft += r.left + p.x * scale - p.clientX
    el.scrollTop += r.top + p.y * scale - p.clientY
  }, [scale])

  // Gestures (native listeners: touch and wheel need passive: false)
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    let pinch: { dist: number; scale: number; anchor: Anchor } | null = null
    let tap: { x: number; y: number; moved: boolean; multi: boolean } | null = null
    let lastTap = { time: 0, x: 0, y: 0 }

    const distance = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
    const midpoint = (t: TouchList) => ({ x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 })

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const m = midpoint(e.touches)
        const anchor = anchorAt(m.x, m.y)
        if (anchor) pinch = { dist: distance(e.touches), scale: scaleRef.current, anchor }
        if (tap) tap.multi = true
      } else if (e.touches.length === 1) {
        tap = { x: e.touches[0].clientX, y: e.touches[0].clientY, moved: false, multi: false }
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (pinch && e.touches.length === 2) {
        e.preventDefault()
        const m = midpoint(e.touches)
        // The point that started under the fingers follows them (zoom + pan in one)
        zoomTo(pinch.scale * (distance(e.touches) / pinch.dist), { x: pinch.anchor.x, y: pinch.anchor.y, clientX: m.x, clientY: m.y })
      } else if (tap && e.touches.length === 1) {
        const t = e.touches[0]
        if (Math.hypot(t.clientX - tap.x, t.clientY - tap.y) > 10) tap.moved = true
      }
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (pinch && e.touches.length < 2) {
        pinch = null
        // Never leave the page smaller than the screen on touch devices
        if (scaleRef.current < fitRef.current) zoomTo('fit')
      }
      if (e.touches.length === 0 && tap) {
        const t = tap
        tap = null
        if (t.moved || t.multi) return
        const now = performance.now()
        if (now - lastTap.time < DOUBLE_TAP_MS && Math.hypot(t.x - lastTap.x, t.y - lastTap.y) < 32) {
          e.preventDefault()
          lastTap.time = 0
          const zoomedIn = scaleRef.current > fitRef.current * 1.2
          zoomTo(zoomedIn ? 'fit' : fitRef.current * 2.2, anchorAt(t.x, t.y))
        } else {
          lastTap = { time: now, x: t.x, y: t.y }
        }
      }
    }
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return // plain wheel scrolls
      e.preventDefault()
      const delta = clamp(e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY, -40, 40)
      zoomTo(scaleRef.current * Math.exp(-delta * 0.01), anchorAt(e.clientX, e.clientY))
    }
    const preventGesture = (e: Event) => e.preventDefault() // Safari's own pinch-zoom

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: false })
    el.addEventListener('touchcancel', onTouchEnd, { passive: false })
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('gesturestart', preventGesture)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('gesturestart', preventGesture)
    }
  }, [anchorAt, zoomTo])

  // Mouse: drag to pan when the page is larger than the view
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const canPan = () => {
    const el = scroller.current
    return !!el && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) && scaleRef.current > fitRef.current
  }

  const step = (dir: 1 | -1) => {
    const next = dir === 1 ? STEPS.find((z) => z > scale + 0.001) : [...STEPS].reverse().find((z) => z < scale - 0.001)
    if (next) zoomTo(next)
  }

  const zoomedIn = scale > layout.fitScale * 1.01

  return (
    <div className={cn('relative', className)}>
      <div
        ref={scroller}
        className={cn(
          'absolute inset-0 touch-pan-x touch-pan-y overflow-auto overscroll-contain scrollbar-thin',
          zoomedIn && (dragging ? 'cursor-grabbing select-none' : 'cursor-grab'),
        )}
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse' || e.button !== 0 || !canPan()) return
          const el = e.currentTarget
          drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop }
          el.setPointerCapture(e.pointerId)
          setDragging(true)
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d) return
          e.currentTarget.scrollLeft = d.left - (e.clientX - d.x)
          e.currentTarget.scrollTop = d.top - (e.clientY - d.y)
        }}
        onPointerUp={() => {
          drag.current = null
          setDragging(false)
        }}
        onPointerCancel={() => {
          drag.current = null
          setDragging(false)
        }}
        onDoubleClick={(e) => {
          // Mouse double-click mirrors double-tap
          zoomTo(zoomedIn ? 'fit' : layout.fitScale * 2, anchorAt(e.clientX, e.clientY))
        }}
      >
        {/* Full width (never max-content): the fit scale is measured from this width. A zoomed page overflows and scrolls. */}
        <div className={cn('min-h-full', innerClassName)}>
          <ResumePreview resume={resume} zoom={zoom} padding={padding} maxFitScale={maxFitScale} onLayout={handleLayout} />
        </div>
      </div>

      {controls && (
        <div className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-border bg-popover/90 p-1 shadow-lg backdrop-blur-xl">
          <Tip content="Zoom out" side="top">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => step(-1)} aria-label="Zoom out">
              <Minus />
            </Button>
          </Tip>
          <Tip content={zoom === 'fit' ? 'Fit to width' : 'Reset to fit'} side="top">
            <button
              type="button"
              onClick={() => zoomTo('fit')}
              className="flex h-8 min-w-14 items-center justify-center gap-1 rounded-full px-2 text-xs font-medium tabular-nums transition-colors hover:bg-muted"
            >
              {zoom === 'fit' && <Maximize className="size-3 text-muted-foreground" />}
              {Math.round(scale * 100)}%
            </button>
          </Tip>
          <Tip content="Zoom in" side="top">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => step(1)} aria-label="Zoom in">
              <Plus />
            </Button>
          </Tip>
          <span className="mx-1 h-4 w-px bg-border" />
          <span className="whitespace-nowrap px-2.5 text-xs font-medium tabular-nums text-muted-foreground">
            {layout.pages} {layout.pages === 1 ? 'page' : 'pages'}
          </span>
        </div>
      )}
    </div>
  )
}
