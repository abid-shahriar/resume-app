import { Camera, ChevronDown, Crop, Ellipsis, Eye, EyeOff, ImageUp, Link2, Plus, Trash2, UserRound } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { memo, useRef, useState, type DragEvent } from 'react'
import { toast } from 'sonner'
import {
  Field,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
  ResponsiveDialog,
  SwitchRow,
  Tip,
} from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createContact } from '@/lib/defaults'
import { prepareImageSource } from '@/lib/image'
import type { ContactField, ContactKind, PhotoCrop } from '@/lib/types'
import { arrayMove, cn } from '@/lib/utils'
import { CONTACT_KINDS, CONTACT_META, contactHref } from '@/templates/icons'
import { resolveTemplate } from '@/templates/registry'
import { initials } from '@/templates/shared'
import { useEditor, useEditorSelect } from './context'
import { DragHandle, SortableList, useSortableItem } from './dnd'
import { PhotoCropDialog } from './PhotoCropDialog'

const ContactRow = memo(function ContactRow({ contact, onEditLink }: { contact: ContactField; onEditLink: (c: ContactField) => void }) {
  const { update } = useEditor()
  const { setNodeRef, style, handleProps, isDragging } = useSortableItem(contact.id)
  const meta = CONTACT_META[contact.kind] ?? CONTACT_META.custom
  const Icon = meta.icon

  const patch = (p: Partial<ContactField>) =>
    update((d) => {
      const c = d.basics.contacts.find((x) => x.id === contact.id)
      if (c) Object.assign(c, p)
    })

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-1 rounded-lg border bg-card p-1 transition-[box-shadow,border-color]',
        isDragging ? 'border-primary shadow-lg' : 'border-border',
        !contact.visible && 'opacity-60',
      )}
    >
      <DragHandle {...handleProps} />
      <Menu>
        <MenuTrigger
          className="flex h-9 shrink-0 items-center gap-1 rounded-md px-2 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 md:h-8"
          aria-label={`Field type: ${meta.label}. Change type`}
        >
          <Icon className="size-4" size={16} />
          <ChevronDown className="size-3" />
        </MenuTrigger>
        <MenuContent align="start" className="max-h-80">
          <MenuLabel>Field type</MenuLabel>
          {CONTACT_KINDS.map((k) => {
            const M = CONTACT_META[k]
            return (
              <MenuItem key={k} icon={<M.icon className="size-4" size={16} />} onSelect={() => patch({ kind: k })}>
                {M.label}
              </MenuItem>
            )
          })}
        </MenuContent>
      </Menu>
      <input
        value={contact.value}
        onChange={(e) => patch({ value: e.target.value })}
        placeholder={meta.placeholder}
        aria-label={meta.label}
        type={contact.kind === 'email' ? 'email' : contact.kind === 'phone' ? 'tel' : 'text'}
        autoComplete={contact.kind === 'email' ? 'email' : contact.kind === 'phone' ? 'tel' : 'off'}
        className="h-9 min-w-0 flex-1 rounded-md bg-transparent px-2 outline-none placeholder:text-subtle focus:bg-muted md:h-8 md:text-sm"
      />
      <Button variant="subtle" size="icon-sm" onClick={() => patch({ visible: !contact.visible })} aria-label={contact.visible ? 'Hide field' : 'Show field'}>
        {contact.visible ? <Eye /> : <EyeOff />}
      </Button>
      <Menu>
        <MenuTrigger render={<Button variant="subtle" size="icon-sm" aria-label="Field actions" />}>
          <Ellipsis />
        </MenuTrigger>
        <MenuContent>
          <MenuItem icon={<Link2 />} onSelect={() => onEditLink(contact)}>
            {contact.url ? 'Edit link' : 'Set custom link'}
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            icon={<Trash2 />}
            danger
            onSelect={() =>
              update((d) => {
                d.basics.contacts = d.basics.contacts.filter((x) => x.id !== contact.id)
              })
            }
          >
            Remove
          </MenuItem>
        </MenuContent>
      </Menu>
    </div>
  )
})

function PhotoPicker() {
  const { update } = useEditor()
  const photo = useEditorSelect((r) => r.basics.photo)
  const photoSource = useEditorSelect((r) => r.basics.photoSource)
  const photoCrop = useEditorSelect((r) => r.basics.photoCrop)
  const name = useEditorSelect((r) => r.basics.name)
  const photoVisible = useEditorSelect((r) => r.basics.photoVisible)
  const round = useEditorSelect((r) => r.design.photoShape === 'circle')
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [crop, setCrop] = useState<{ source: string; initial: PhotoCrop | null } | null>(null)

  const onFile = async (file?: File) => {
    if (!file) return
    setBusy(true)
    try {
      setCrop({ source: await prepareImageSource(file), initial: null })
    } catch (err) {
      toast.error('Could not use this photo', { description: (err as Error).message })
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    void onFile(e.dataTransfer.files?.[0])
  }

  const adjust = () => {
    const source = photoSource || photo
    if (source) setCrop({ source, initial: photoSource ? photoCrop : null })
  }

  const remove = () =>
    update((d) => {
      d.basics.photo = ''
      d.basics.photoSource = ''
      d.basics.photoCrop = null
    })

  const hint = photo ? 'Click the photo to crop. Stored only on this device.' : 'JPG, PNG or WebP. Without a photo, your initials are shown.'

  return (
    <>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => (photo ? adjust() : inputRef.current?.click())}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            'group relative grid size-16 shrink-0 place-items-center overflow-hidden bg-muted text-muted-foreground ring-1 ring-border transition-[box-shadow,border-radius] hover:ring-2 hover:ring-primary',
            round ? 'rounded-full' : 'rounded-2xl',
            dragOver && 'ring-2 ring-primary',
          )}
          aria-label={photo ? 'Crop or reposition photo' : 'Upload photo'}
        >
          {photo ? (
            <img src={photo} alt="" className="size-full object-cover" />
          ) : name.trim() ? (
            <span className="text-lg font-semibold">{initials(name)}</span>
          ) : (
            <UserRound className="size-6" />
          )}
          <span className="absolute inset-0 grid place-items-center bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            {busy ? (
              <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : photo ? (
              <Crop className="size-5" />
            ) : (
              <Camera className="size-5" />
            )}
          </span>
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
              <ImageUp /> {photo ? 'Replace' : 'Upload photo'}
            </Button>
            {photo && (
              <>
                <Button variant="outline" onClick={adjust}>
                  <Crop /> Crop
                </Button>
                <Tip content="Remove photo">
                  <Button variant="destructive" size="icon" onClick={remove} aria-label="Remove photo">
                    <Trash2 />
                  </Button>
                </Tip>
              </>
            )}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
      <SwitchRow
        label={photo ? 'Show photo on resume' : 'Show initials on resume'}
        checked={photoVisible}
        onCheckedChange={(v) => update((d) => void (d.basics.photoVisible = v))}
        className="-mt-2"
      />
      {crop && (
        <PhotoCropDialog
          key={crop.source}
          source={crop.source}
          initial={crop.initial}
          round={round}
          onCancel={() => setCrop(null)}
          onApply={(cropped, settings) => {
            const source = crop.source
            update((d) => {
              d.basics.photo = cropped
              d.basics.photoSource = source
              d.basics.photoCrop = settings
              d.basics.photoVisible = true
            })
            setCrop(null)
          }}
        />
      )}
    </>
  )
}

export function BasicsCard() {
  const { update } = useEditor()
  const name = useEditorSelect((r) => r.basics.name)
  const headline = useEditorSelect((r) => r.basics.headline)
  const contacts = useEditorSelect((r) => r.basics.contacts)
  // Layouts without a photo slot hide the uploader entirely
  const hasPhotoSlot = useEditorSelect((r) => resolveTemplate(r).photo)
  const [open, setOpen] = useState(true)
  const [linkEdit, setLinkEdit] = useState<ContactField | null>(null)
  const [linkDraft, setLinkDraft] = useState('')

  const addContact = (kind: ContactKind) =>
    update((d) => {
      d.basics.contacts.push(createContact(kind))
    })

  const saveLink = () => {
    const target = linkEdit
    if (target) {
      const auto = contactHref(target.kind, target.value, '') || ''
      update((d) => {
        const c = d.basics.contacts.find((x) => x.id === target.id)
        if (c) c.url = linkDraft.trim() === auto ? '' : linkDraft.trim()
      })
    }
    setLinkEdit(null)
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 p-1.5 pr-2 text-left" aria-expanded={open}>
        <span className="ml-1 grid size-8 place-items-center rounded-lg bg-primary-soft text-primary-soft-foreground">
          <UserRound className="size-4" />
        </span>
        <span className="flex-1 py-1.5 font-medium">Personal details</span>
        <span className="grid size-8 place-items-center text-muted-foreground">
          <ChevronDown className={cn('size-4 transition-transform duration-300', open && 'rotate-180')} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-5 border-t border-border p-4">
              {hasPhotoSlot && <PhotoPicker />}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name">
                  {(id) => (
                    <Input
                      id={id}
                      value={name}
                      autoComplete="name"
                      placeholder="Jane Doe"
                      className="h-10 md:h-9"
                      onChange={(e) => update((d) => void (d.basics.name = e.target.value))}
                    />
                  )}
                </Field>
                <Field label="Job title / Headline">
                  {(id) => (
                    <Input
                      id={id}
                      value={headline}
                      placeholder="Product Designer"
                      className="h-10 md:h-9"
                      onChange={(e) => update((d) => void (d.basics.headline = e.target.value))}
                    />
                  )}
                </Field>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[13px] font-medium text-foreground/80">Contact & links</span>
                  <span className="text-xs text-muted-foreground">Drag to reorder</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <SortableList
                    ids={contacts.map((c) => c.id)}
                    onMove={(from, to) => update((d) => void (d.basics.contacts = arrayMove(d.basics.contacts, from, to)))}
                  >
                    {contacts.map((c) => (
                      <ContactRow
                        key={c.id}
                        contact={c}
                        onEditLink={(contact) => {
                          setLinkDraft(contact.url || contactHref(contact.kind, contact.value, '') || '')
                          setLinkEdit(contact)
                        }}
                      />
                    ))}
                  </SortableList>
                </div>
                <Menu>
                  <MenuTrigger render={<Button variant="outline" size="lg" className="mt-2 w-full border-dashed" />}>
                    <Plus /> Add field
                  </MenuTrigger>
                  <MenuContent align="center" className="max-h-80 w-56">
                    {CONTACT_KINDS.map((k) => {
                      const M = CONTACT_META[k]
                      return (
                        <MenuItem key={k} icon={<M.icon className="size-4" size={16} />} onSelect={() => addContact(k)}>
                          {M.label}
                        </MenuItem>
                      )
                    })}
                  </MenuContent>
                </Menu>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ResponsiveDialog
        open={!!linkEdit}
        onOpenChange={(o) => !o && setLinkEdit(null)}
        size="sm"
        title="Link for this field"
        description="Leave empty to generate the link automatically from the value."
        footer={
          <>
            <Button variant="outline" size="lg" onClick={() => setLinkEdit(null)}>
              Cancel
            </Button>
            <Button size="lg" type="submit" form="contact-link-form">
              Save link
            </Button>
          </>
        }
      >
        <form
          id="contact-link-form"
          onSubmit={(e) => {
            e.preventDefault()
            saveLink()
          }}
        >
          <Input
            autoFocus
            type="text"
            inputMode="url"
            autoCapitalize="none"
            spellCheck={false}
            className="h-10"
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            placeholder="https://"
            aria-label="Link URL"
          />
        </form>
      </ResponsiveDialog>
    </div>
  )
}
