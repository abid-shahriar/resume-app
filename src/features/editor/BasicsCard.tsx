import { Camera, ChevronDown, Ellipsis, Eye, EyeOff, Link2, Plus, Trash2, UserRound } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { memo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SwitchRow } from '@/components/ui/controls'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '@/components/ui/menu'
import { createContact } from '@/lib/defaults'
import { imageFileToDataUrl } from '@/lib/image'
import type { ContactField, ContactKind } from '@/lib/types'
import { arrayMove, cn } from '@/lib/utils'
import { CONTACT_KINDS, CONTACT_META, contactHref } from '@/templates/icons'
import { getTemplate } from '@/templates/registry'
import { initials } from '@/templates/shared'
import { useEditor, useEditorSelect } from './context'
import { DragHandle, SortableList, useSortableItem } from './dnd'

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
        'flex items-center gap-1 rounded-lg border bg-surface p-1 transition-[box-shadow,border-color]',
        isDragging ? 'border-accent shadow-lg' : 'border-border',
        !contact.visible && 'opacity-60',
      )}
    >
      <DragHandle {...handleProps} />
      <Menu>
        <MenuTrigger asChild>
          <button
            type="button"
            className="flex h-9 shrink-0 items-center gap-1 rounded-md px-2 text-muted transition-colors hover:bg-surface-2 hover:text-foreground md:h-8"
            aria-label={`Field type: ${meta.label}. Change type`}
          >
            <Icon className="size-4" size={16} />
            <ChevronDown className="size-3" />
          </button>
        </MenuTrigger>
        <MenuContent align="start" className="max-h-80 overflow-y-auto">
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
        inputMode={contact.kind === 'email' ? 'email' : contact.kind === 'phone' ? 'tel' : undefined}
        className="h-9 min-w-0 flex-1 rounded-md bg-transparent px-2 outline-none placeholder:text-subtle focus:bg-surface-2 md:h-8 md:text-sm"
      />
      <Button variant="subtle" size="icon-xs" onClick={() => patch({ visible: !contact.visible })} aria-label={contact.visible ? 'Hide field' : 'Show field'}>
        {contact.visible ? <Eye /> : <EyeOff />}
      </Button>
      <Menu>
        <MenuTrigger asChild>
          <Button variant="subtle" size="icon-xs" aria-label="Field actions">
            <Ellipsis />
          </Button>
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
  const name = useEditorSelect((r) => r.basics.name)
  const photoVisible = useEditorSelect((r) => r.basics.photoVisible)
  const supportsPhoto = useEditorSelect((r) => getTemplate(r.templateId).photo)
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const onFile = async (file?: File) => {
    if (!file) return
    setBusy(true)
    try {
      const url = await imageFileToDataUrl(file)
      update((d) => {
        d.basics.photo = url
        d.basics.photoVisible = true
      })
    } catch (err) {
      toast.error('Could not use this photo', { description: (err as Error).message })
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-2 text-muted ring-1 ring-border transition-shadow hover:ring-2 hover:ring-accent"
        aria-label={photo ? 'Change photo' : 'Upload photo'}
      >
        {photo ? (
          <img src={photo} alt="" className="size-full object-cover" />
        ) : name.trim() ? (
          <span className="text-lg font-semibold">{initials(name)}</span>
        ) : (
          <UserRound className="size-6" />
        )}
        <span className="absolute inset-0 grid place-items-center bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100">
          {busy ? <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Camera className="size-5" />}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
            {photo ? 'Change photo' : 'Upload photo'}
          </Button>
          {photo && (
            <Button variant="danger-ghost" size="sm" onClick={() => update((d) => void (d.basics.photo = ''))}>
              Remove
            </Button>
          )}
        </div>
        <p className="mt-1.5 text-xs text-muted">
          {supportsPhoto
            ? photo
              ? 'Stored only on this device.'
              : 'Without a photo, your initials are shown.'
            : 'The current template does not display photos.'}
        </p>
      </div>
      {supportsPhoto && (
        <div className="hidden sm:block">
          <SwitchRow label="Show" checked={photoVisible} onCheckedChange={(v) => update((d) => void (d.basics.photoVisible = v))} />
        </div>
      )}
    </div>
  )
}

export function BasicsCard() {
  const { update } = useEditor()
  const name = useEditorSelect((r) => r.basics.name)
  const headline = useEditorSelect((r) => r.basics.headline)
  const contacts = useEditorSelect((r) => r.basics.contacts)
  const supportsPhoto = useEditorSelect((r) => getTemplate(r.templateId).photo)
  const photoVisible = useEditorSelect((r) => r.basics.photoVisible)
  const [open, setOpen] = useState(true)
  const [linkEdit, setLinkEdit] = useState<ContactField | null>(null)
  const [linkDraft, setLinkDraft] = useState('')

  const addContact = (kind: ContactKind) =>
    update((d) => {
      d.basics.contacts.push(createContact(kind))
    })

  return (
    <div className="rounded-xl border border-border bg-surface shadow-xs">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 p-1.5 pr-2 text-left" aria-expanded={open}>
        <span className="ml-1 grid size-8 place-items-center rounded-lg bg-accent-soft text-accent-foreground">
          <UserRound className="size-4" />
        </span>
        <span className="flex-1 py-1.5 font-medium">Personal details</span>
        <span className="grid size-8 place-items-center text-muted">
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
              <PhotoPicker />
              {supportsPhoto && (
                <div className="-mt-2 sm:hidden">
                  <SwitchRow label="Show photo on resume" checked={photoVisible} onCheckedChange={(v) => update((d) => void (d.basics.photoVisible = v))} />
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name">
                  {(id) => (
                    <Input id={id} value={name} autoComplete="name" placeholder="Jane Doe" onChange={(e) => update((d) => void (d.basics.name = e.target.value))} />
                  )}
                </Field>
                <Field label="Job title / Headline">
                  {(id) => (
                    <Input
                      id={id}
                      value={headline}
                      placeholder="Product Designer"
                      onChange={(e) => update((d) => void (d.basics.headline = e.target.value))}
                    />
                  )}
                </Field>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[13px] font-medium text-foreground/80">Contact & links</span>
                  <span className="text-xs text-muted">Drag to reorder</span>
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
                  <MenuTrigger asChild>
                    <Button variant="outline" className="mt-2 w-full border-dashed">
                      <Plus /> Add field
                    </Button>
                  </MenuTrigger>
                  <MenuContent align="center" className="max-h-80 w-56 overflow-y-auto">
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

      <Dialog
        open={!!linkEdit}
        onOpenChange={(o) => !o && setLinkEdit(null)}
        size="sm"
        title="Link for this field"
        description="Leave empty to generate the link automatically from the value."
        footer={
          <>
            <Button variant="outline" onClick={() => setLinkEdit(null)}>
              Cancel
            </Button>
            <Button type="submit" form="contact-link-form">
              Save link
            </Button>
          </>
        }
      >
        <form
          id="contact-link-form"
          onSubmit={(e) => {
            e.preventDefault()
            const target = linkEdit
            if (target) {
              const auto = contactHref(target.kind, target.value, '') || ''
              update((d) => {
                const c = d.basics.contacts.find((x) => x.id === target.id)
                if (c) c.url = linkDraft.trim() === auto ? '' : linkDraft.trim()
              })
            }
            setLinkEdit(null)
          }}
        >
          <Input autoFocus type="url" inputMode="url" value={linkDraft} onChange={(e) => setLinkDraft(e.target.value)} placeholder="https://" aria-label="Link URL" />
        </form>
      </Dialog>
    </div>
  )
}
