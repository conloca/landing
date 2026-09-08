import contentSystemsUrl from '@/assets/blog/content-systems.webp'
import editControlUrl from '@/assets/blog/edit-control.webp'
import editRepeatUrl from '@/assets/blog/edit-repeat.webp'
import systemsRepeatUrl from '@/assets/blog/systems-repeat.webp'

/**
 * Blog listing copy and images.
 *
 * Accessed via: `/blog/` (BlogPage). Ported from landing-saba `src/blog-content.ts`
 * because the homepage Figma file has no Blog canvas — only the nav label.
 *
 * Assumptions: individual article routes are not built yet, so cards are
 * not links. Images are the saba raster exports, recompressed to WebP.
 */

export interface BlogDescription {
  emphasis: string
  emphasisFirst?: boolean
  supporting: string
}

export interface BlogArticle {
  compactDescription?: BlogDescription
  date: string
  description: BlogDescription
  id: string
  image: {
    height: number
    src: string
    width: number
  }
  layout: 'full' | 'split'
  readTime: string
  title: string
}

export interface BlogHeroContent {
  compactBreadcrumbs: readonly string[]
  description: string
  largeBreadcrumbs: readonly string[]
  mobileHeading: string
  heading: string
}

export interface BlogListingContent {
  articles: readonly BlogArticle[]
  navigationLabel: string
}

export const blogMetadata = {
  title: 'Conloca Blog — Notes on content, code, and the space between',
  description:
    'Field notes, practical guides, and honest conversations about building visual editing into modern developer workflows.',
}

export const blogHeroContent: BlogHeroContent = {
  compactBreadcrumbs: ['Stories', 'Insights', 'Updates'],
  description:
    'Field notes, practical guides, and honest conversations about building visual editing into modern developer workflows.',
  largeBreadcrumbs: ['Home', 'Stories', 'Updates'],
  mobileHeading: 'Notes from space between code and content',
  heading: 'Notes on content, code, and the space between',
}

const systemsDescription: BlogDescription = {
  supporting:
    'Talking about modern content workflows, why they fall apart across CMSs, docs, chats, and code. ',
  emphasis:
    'And how bringing content into Git creates a faster, safer, more connected way to publish.',
}

const visualEditingDescription: BlogDescription = {
  emphasis:
    'Exploring how visual editing can give marketers the freedom to move faster without sacrificing developer control.',
  supporting:
    ' Keeping code, components, design systems, Git history, and Astro performance intact while giving teams a simpler path from idea to published page.',
  emphasisFirst: true,
}

export const blogListingContent: BlogListingContent = {
  navigationLabel: 'Blog articles',
  articles: [
    {
      date: 'September 2026',
      description: systemsDescription,
      id: 'content-systems',
      image: {
        height: 810,
        src: contentSystemsUrl,
        width: 1440,
      },
      layout: 'full',
      readTime: '4 min read',
      title: "One change shouldn't get lost across three systems",
    },
    {
      compactDescription: systemsDescription,
      date: 'September 2026',
      description: visualEditingDescription,
      id: 'edit-control',
      image: {
        height: 810,
        src: editControlUrl,
        width: 1440,
      },
      layout: 'split',
      readTime: '4 min read',
      title: 'Edit what you see, without losing control of your code',
    },
    {
      date: 'September 2026',
      description: systemsDescription,
      id: 'systems-repeat',
      image: {
        height: 810,
        src: systemsRepeatUrl,
        width: 1440,
      },
      layout: 'full',
      readTime: '4 min read',
      title: "One change shouldn't get lost across three systems",
    },
    {
      compactDescription: systemsDescription,
      date: 'September 2026',
      description: visualEditingDescription,
      id: 'edit-repeat',
      image: {
        height: 810,
        src: editRepeatUrl,
        width: 1440,
      },
      layout: 'split',
      readTime: '4 min read',
      title: 'Edit what you see, without losing control of your code',
    },
  ],
}
