import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function useDndSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
}

/** Vertical sortable list. Children should use `useSortableItem`. */
export function SortableList({
  ids,
  onMove,
  children,
}: {
  ids: string[]
  onMove: (from: number, to: number) => void
  children: ReactNode
}) {
  const sensors = useDndSensors()
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from !== -1 && to !== -1) onMove(from, to)
  }
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={onDragEnd}
      accessibility={{
        screenReaderInstructions: {
          draggable: 'To pick up an item, press space or enter. Use the arrow keys to move it, then press space or enter again to drop it.',
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  )
}

export function useSortableItem(id: string) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    position: 'relative',
    zIndex: isDragging ? 20 : undefined,
  }
  return {
    setNodeRef,
    style,
    isDragging,
    handleProps: { ref: setActivatorNodeRef, ...attributes, ...listeners },
  }
}

export const DragHandle = forwardRef<HTMLButtonElement, HTMLAttributes<HTMLButtonElement> & { label?: string }>(
  function DragHandle({ className, label = 'Drag to reorder', ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        className={cn(
          'grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-md text-subtle transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing md:size-7',
          className,
        )}
        {...props}
      >
        <GripVertical className="size-4" />
      </button>
    )
  },
)
