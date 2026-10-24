import 'react-advanced-cropper/dist/style.css'
import { getAbsoluteZoom, getZoomFactor } from 'advanced-cropper/extensions/absolute-zoom'
import { FlipHorizontal2, RotateCcw, RotateCw, Undo2, ZoomIn, ZoomOut } from 'lucide-react'
import { useRef, useState } from 'react'
import {
  CircleStencil,
  FixedCropper,
  ImageRestriction,
  RectangleStencil,
  getTransformedImageSize,
  type CropperState,
  type FixedCropperRef,
} from 'react-advanced-cropper'
import { toast } from 'sonner'
import { Tip } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import type { PhotoCrop } from '@/lib/types'
import { clamp } from '@/lib/utils'

const OUTPUT_SIZE = 480
const ZOOM_STEP = 0.1

/** Older saves stored the area in percentages; current ones use fractions. */
function normalizeArea(crop: PhotoCrop | null) {
  if (!crop) return null
  const a = crop.area
  const k = Math.max(a.x, a.y, a.width, a.height) > 1.001 ? 100 : 1
  return { x: a.x / k, y: a.y / k, width: a.width / k, height: a.height / k }
}

/**
 * Profile photo cropper: a fixed square/circle frame with the photo moved and
 * zoomed underneath (drag, pinch, wheel or slider). The photo always covers
 * the frame, so there are never empty corners. Mount with a `key` per source.
 */
export function PhotoCropDialog({
  source,
  initial,
  round,
  onCancel,
  onApply,
}: {
  source: string
  initial: PhotoCrop | null
  round: boolean
  onCancel: () => void
  onApply: (photo: string, crop: PhotoCrop) => void
}) {
  const cropper = useRef<FixedCropperRef>(null)
  const [zoom, setZoom] = useState(0)
  const [ready, setReady] = useState(false)

  // Restore the previous framing on open (read once, on mount)
  const [restore] = useState(() => {
    const area = normalizeArea(initial)
    if (!area || !initial) return null
    return {
      transforms: { rotate: initial.rotation, flip: { horizontal: !!initial.flip, vertical: false } },
      coordinates: (state: CropperState) => {
        const size = getTransformedImageSize(state)
        return { left: area.x * size.width, top: area.y * size.height, width: area.width * size.width, height: area.height * size.height }
      },
    }
  })

  const syncZoom = (c: FixedCropperRef) => {
    const state = c.getState()
    if (state) setZoom(getAbsoluteZoom(state, c.getSettings()))
  }

  const zoomTo = (value: number, transitions = true) => {
    const c = cropper.current
    const state = c?.getState()
    if (!c || !state) return
    c.zoomImage(getZoomFactor(state, c.getSettings(), clamp(value, 0, 1)), { transitions })
  }

  const apply = () => {
    const c = cropper.current
    const state = c?.getState()
    const coords = c?.getCoordinates()
    if (!c || !state || !coords) return
    const canvas = c.getCanvas({ width: OUTPUT_SIZE, height: OUTPUT_SIZE, fillColor: '#ffffff', imageSmoothingQuality: 'high' })
    if (!canvas) {
      toast.error('Could not crop this photo. Please try another image.')
      return
    }
    const size = getTransformedImageSize(state)
    const t = c.getTransforms()
    onApply(canvas.toDataURL('image/jpeg', 0.9), {
      area: { x: coords.left / size.width, y: coords.top / size.height, width: coords.width / size.width, height: coords.height / size.height },
      rotation: ((t.rotate % 360) + 360) % 360,
      flip: t.flip.horizontal,
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden p-0 sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="px-5 pb-3 pt-5">
          <DialogTitle className="text-base font-semibold tracking-tight">Adjust photo</DialogTitle>
          <DialogDescription>Drag to position. Pinch, scroll or use the slider to zoom.</DialogDescription>
        </DialogHeader>

        <div className="relative h-[min(58dvh,380px)] touch-none select-none bg-neutral-950">
          <FixedCropper
            ref={cropper}
            src={source}
            className="size-full bg-neutral-950!"
            imageRestriction={ImageRestriction.stencil}
            stencilSize={(state: CropperState) => {
              const side = Math.round(Math.min(state.boundary.width, state.boundary.height) * 0.8)
              return { width: side, height: side }
            }}
            stencilComponent={round ? CircleStencil : RectangleStencil}
            stencilProps={{ handlers: false, lines: false, movable: false, resizable: false, grid: !round }}
            defaultTransforms={restore?.transforms}
            defaultCoordinates={restore?.coordinates}
            transitions={{ duration: 220, timingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
            onReady={(c) => {
              setReady(true)
              syncZoom(c)
            }}
            onUpdate={syncZoom}
            onError={() => toast.error('This image could not be loaded.')}
          />
        </div>

        <div className="flex flex-col gap-3 px-5 py-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Zoom out" disabled={!ready || zoom <= 0.001} onClick={() => zoomTo(zoom - ZOOM_STEP)}>
              <ZoomOut />
            </Button>
            <Slider
              aria-label="Zoom"
              value={[Math.round(zoom * 1000)]}
              min={0}
              max={1000}
              step={1}
              disabled={!ready}
              onValueChange={(v) => zoomTo((Array.isArray(v) ? (v as readonly number[])[0] : (v as number)) / 1000, false)}
              className="flex-1 py-2"
            />
            <Button variant="ghost" size="icon" aria-label="Zoom in" disabled={!ready || zoom >= 0.999} onClick={() => zoomTo(zoom + ZOOM_STEP)}>
              <ZoomIn />
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              <Tip content="Rotate left" side="top">
                <Button variant="outline" size="icon" aria-label="Rotate left" disabled={!ready} onClick={() => cropper.current?.rotateImage(-90)}>
                  <RotateCcw />
                </Button>
              </Tip>
              <Tip content="Rotate right" side="top">
                <Button variant="outline" size="icon" aria-label="Rotate right" disabled={!ready} onClick={() => cropper.current?.rotateImage(90)}>
                  <RotateCw />
                </Button>
              </Tip>
              <Tip content="Mirror" side="top">
                <Button variant="outline" size="icon" aria-label="Mirror" disabled={!ready} onClick={() => cropper.current?.flipImage(true, false)}>
                  <FlipHorizontal2 />
                </Button>
              </Tip>
            </div>
            <Button variant="ghost" disabled={!ready} onClick={() => cropper.current?.reset()}>
              <Undo2 /> Reset
            </Button>
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 px-5 py-3">
          <Button variant="outline" size="lg" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="lg" onClick={apply} disabled={!ready}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
