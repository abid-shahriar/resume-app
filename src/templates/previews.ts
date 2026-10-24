import { sampleResume } from '@/lib/defaults'
import type { Resume } from '@/lib/types'
import { CUSTOM_TEMPLATE_ID, customFromTemplate, DEFAULT_CUSTOM_LAYOUT, getTemplate, templateDesign } from './registry'

const cache = new Map<string, Resume>()
let base: ReturnType<typeof sampleResume> | null = null

/** A stable sample resume rendered with the given template's default design. */
export function templatePreview(templateId: string): Resume {
  let r = cache.get(templateId)
  if (!r) {
    base ??= sampleResume()
    r = {
      id: `preview-${templateId}`,
      title: 'Preview',
      templateId,
      createdAt: 0,
      updatedAt: 0,
      ...base,
      design: templateDesign(templateId),
      customLayout: { ...DEFAULT_CUSTOM_LAYOUT },
    }
    cache.set(templateId, r)
  }
  return r
}

/** The user's own resume rendered with another template (for the in-editor picker). */
export function withTemplate(resume: Resume, templateId: string, keepStyle: boolean): Resume {
  if (templateId === CUSTOM_TEMPLATE_ID) return toCustom(resume)
  const d = templateDesign(templateId)
  const keep = { pageSize: resume.design.pageSize, presentLabel: resume.design.presentLabel }
  return {
    ...resume,
    templateId,
    design: keepStyle
      ? { ...d, ...keep, accent: resume.design.accent, textColor: resume.design.textColor, headingFont: resume.design.headingFont, bodyFont: resume.design.bodyFont }
      : { ...d, ...keep },
  }
}

/** Converts a resume to a custom layout that looks exactly like it does now. */
export function toCustom(resume: Resume): Resume {
  if (resume.templateId === CUSTOM_TEMPLATE_ID) return resume
  return {
    ...resume,
    templateId: CUSTOM_TEMPLATE_ID,
    customLayout: customFromTemplate(getTemplate(resume.templateId), resume.design),
  }
}
