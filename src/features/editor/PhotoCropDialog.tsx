import { RotateCcw, RotateCw, Undo2, ZoomIn, ZoomOut } from 'lucide-react'
import { useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { renderCroppedImage } from '@/lib/image'
import type { PhotoCrop } from '@/lib/types'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 4

/**
 * Crop / zoom / rotate a photo into a square. Mount with a `key` per source so
 * the cropper state starts fresh each time it opens.
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
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(initial?.rotation ?? 0)
  const [busy, setBusy] = useState(false)
  // Re-applying the saved crop only makes sense until the user changes rotation
  const [restore, setRestore] = useState(initial?.area)
  const areaPct = useRef<Area | null>(null)
  const areaPx = useRef<Area | null>(null)

  const rotate = (delta: number) => {
    setRestore(undefined)
    setRotation((r) => (((r + delta) % 360) + 360) % 360)
  }

  const reset = () => {
    setRestore(undefined)
    setRotation(0)
    setZoom(1)
    setCrop({ x: 0, y: 0 })
  }

  const apply = async () => {
    if (!areaPx.current || !areaPct.current) return
    setBusy(true)
    try {
      const photo = await renderCroppedImage(source, areaPx.current, rotation)
      onApply(photo, { area: { ...areaPct.current }, rotation })
    } catch (err) {
      toast.error('Could not crop this photo', { description: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onCancel()}>
      <DialogContent className="max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden p-0 sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="px-5 pb-3 pt-5">
          <DialogTitle className="text-base font-semibold tracking-tight">Crop photo</DialogTitle>
          <DialogDescription>Drag to reposition. Pinch, scroll or use the slider to zoom.</DialogDescription>
        </DialogHeader>

        <div className="relative h-[min(56dvh,360px)] touch-none bg-neutral-900">
          <Cropper
            image={source}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            zoomSpeed={0.12}
            cropShape={round ? 'round' : 'rect'}
            showGrid={!round}
            objectFit="contain"
            restrictPosition={zoom >= 1}
            initialCroppedAreaPercentages={restore}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            // onCropAreaChange also fires after a saved crop is restored (onCropComplete may not)
            onCropAreaChange={(pct, px) => {
              areaPct.current = pct
              areaPx.current = px
            }}
            onCropComplete={(pct, px) => {
              areaPct.current = pct
              areaPx.current = px
            }}
          />
        </div>

        <div className="flex flex-col gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <Button variant="subtle" size="icon" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.2).toFixed(2)))}>
              <ZoomOut />
            </Button>
            <Slider
              aria-label="Zoom"
              value={[zoom]}
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              onValueChange={(v) => setZoom(Array.isArray(v) ? (v as readonly number[])[0] : (v as number))}
              className="flex-1 py-2"
            />
            <Button variant="subtle" size="icon" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.2).toFixed(2)))}>
              <ZoomIn />
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              <Button variant="outline" onClick={() => rotate(-90)} aria-label="Rotate left">
                <RotateCcw /> <span className="hidden min-[380px]:inline">Rotate</span>
              </Button>
              <Button variant="outline" size="icon" onClick={() => rotate(90)} aria-label="Rotate right">
                <RotateCw />
              </Button>
            </div>
            <Button variant="ghost" onClick={reset}>
              <Undo2 /> Reset
            </Button>
          </div>
          {zoom < 1 && <p className="-mt-1 text-xs text-muted-foreground">Empty areas are filled with white.</p>}
        </div>

        <DialogFooter className="mx-0 mb-0 px-5 py-3">
          <Button variant="outline" size="lg" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button size="lg" onClick={apply} disabled={busy}>
            {busy ? 'Saving…' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
