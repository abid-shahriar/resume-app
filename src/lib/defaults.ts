import { SECTION_CONFIG } from './sections'
import type { ContactField, ContactKind, Design, Resume, Section, SectionItem, SectionType } from './types'
import { uid } from './utils'

export const BASE_DESIGN: Design = {
  accent: '#2563eb',
  textColor: '#1f2937',
  pageColor: '#ffffff',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  fontSize: 10,
  lineHeight: 1.45,
  nameScale: 2.6,
  pageSize: 'a4',
  marginX: 16,
  marginY: 14,
  sectionGap: 14,
  itemGap: 9,
  headingStyle: 'line',
  headingUppercase: true,
  headingAlign: 'left',
  headerAlign: 'left',
  skillStyle: 'tags',
  sidebarTone: 'tint',
  sidebarSide: 'left',
  sidebarWidth: 32,
  showIcons: true,
  photoShape: 'circle',
  photoSize: 30,
  underlineLinks: false,
  inlineLists: true,
  presentLabel: 'Present',
}

export function createItem(partial: Partial<SectionItem> = {}): SectionItem {
  return {
    id: uid(),
    visible: true,
    title: '',
    subtitle: '',
    meta: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    url: '',
    description: '',
    level: 0,
    keywords: [],
    ...partial,
  }
}

export function createSection(type: SectionType, partial: Partial<Section> = {}): Section {
  const cfg = SECTION_CONFIG[type]
  return {
    id: uid(),
    type,
    title: type === 'custom' ? 'Custom section' : cfg.label,
    visible: true,
    column: cfg.defaultColumn,
    content: '',
    items: [],
    ...partial,
  }
}

export function createContact(kind: ContactKind, value = '', url = ''): ContactField {
  return { id: uid(), kind, value, url, visible: true }
}

export function sampleResume(): Pick<Resume, 'basics' | 'sections'> {
  return {
    basics: {
      name: 'Sophia Bennett',
      headline: 'Senior Product Designer',
      photo: '',
      photoSource: '',
      photoCrop: null,
      photoVisible: true,
      contacts: [
        createContact('email', 'sophia.bennett@email.com'),
        createContact('phone', '+1 (415) 555-0132'),
        createContact('location', 'San Francisco, CA'),
        createContact('website', 'sophiabennett.design'),
        createContact('linkedin', 'in/sophiabennett', 'https://linkedin.com/in/sophiabennett'),
      ],
    },
    sections: [
      createSection('summary', {
        content:
          'Product designer with 8+ years of experience shaping digital products used by millions. I blend **systems thinking** with craft to turn complex problems into simple, delightful experiences.',
      }),
      createSection('experience', {
        items: [
          createItem({
            title: 'Senior Product Designer',
            subtitle: 'Lumen Health',
            location: 'San Francisco, CA',
            startDate: 'Mar 2021',
            current: true,
            description:
              '- Led end-to-end redesign of the patient app, lifting weekly active users by **34%**\n- Built and scaled a cross-platform design system adopted by 6 product teams\n- Mentored 4 designers and introduced a weekly critique ritual',
          }),
          createItem({
            title: 'Product Designer',
            subtitle: 'Northwind Labs',
            location: 'Remote',
            startDate: 'Jun 2018',
            endDate: 'Feb 2021',
            description:
              '- Designed the onboarding flow that cut time-to-value from 3 days to 20 minutes\n- Ran 40+ usability studies and turned insights into a prioritized roadmap',
          }),
          createItem({
            title: 'UX Designer',
            subtitle: 'Brightside Agency',
            location: 'Austin, TX',
            startDate: 'Aug 2016',
            endDate: 'May 2018',
            description: '- Delivered web and mobile experiences for clients in fintech and retail',
          }),
        ],
      }),
      createSection('education', {
        items: [
          createItem({
            title: 'B.A. Interaction Design',
            subtitle: 'California College of the Arts',
            location: 'San Francisco, CA',
            startDate: '2012',
            endDate: '2016',
            meta: 'Magna Cum Laude',
          }),
        ],
      }),
      createSection('projects', {
        items: [
          createItem({
            title: 'Open Canvas',
            subtitle: 'Open-source Figma plugin',
            startDate: '2023',
            url: 'https://github.com',
            description: 'A plugin that audits color contrast across entire files. 12k+ installs and featured by Figma.',
          }),
        ],
      }),
      createSection('skills', {
        items: [
          createItem({ title: 'Product Design', level: 5, keywords: ['UX Strategy', 'Interaction', 'Prototyping'] }),
          createItem({ title: 'Design Systems', level: 5, keywords: ['Tokens', 'Components', 'Documentation'] }),
          createItem({ title: 'Research', level: 4, keywords: ['Usability Testing', 'Interviews'] }),
          createItem({ title: 'Tools', level: 4, keywords: ['Figma', 'Framer', 'HTML/CSS'] }),
        ],
      }),
      createSection('languages', {
        items: [
          createItem({ title: 'English', subtitle: 'Native', level: 5 }),
          createItem({ title: 'Spanish', subtitle: 'Professional', level: 4 }),
          createItem({ title: 'French', subtitle: 'Conversational', level: 2 }),
        ],
      }),
      createSection('interests', {
        items: [
          createItem({ title: 'Film photography' }),
          createItem({ title: 'Trail running' }),
          createItem({ title: 'Ceramics' }),
        ],
      }),
    ],
  }
}

export function blankResume(): Pick<Resume, 'basics' | 'sections'> {
  return {
    basics: {
      name: '',
      headline: '',
      photo: '',
      photoSource: '',
      photoCrop: null,
      photoVisible: true,
      contacts: [createContact('email'), createContact('phone'), createContact('location')],
    },
    sections: [
      createSection('summary'),
      createSection('experience'),
      createSection('education'),
      createSection('skills'),
      createSection('languages'),
    ],
  }
}
