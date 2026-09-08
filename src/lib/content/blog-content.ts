import contentSystemsUrl from '@/assets/blog/content-systems.webp'
import editControlUrl from '@/assets/blog/edit-control.webp'

/**
 * Blog listing copy and images.
 *
 * Accessed via: `/blog/` (BlogPage). Ported from landing-saba `src/blog-content.ts`
 * because the homepage Figma file has no Blog canvas — only the nav label.
 *
 * Assumptions: individual article routes are not built yet, so cards are
 * not links. Images are the saba raster exports, recompressed to WebP.
 *
 * Only 2 real articles exist (see article-content.ts) — the listing
 * renders exactly those 2, it does not pad the feed with repeats.
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
  /** Slug of the article's detail page under `/blog/<slug>/` — see article-content.ts. */
  slug: string
  title: string
}

export interface BlogHeroContent {
  badgeLabel: string
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
  badgeLabel: 'Conloca dispatch',
  compactBreadcrumbs: ['Stories', 'Insights', 'Updates'],
  description:
    'Field notes, practical guides, and honest conversations about building visual editing into modern developer workflows.',
  largeBreadcrumbs: ['Home', 'Stories', 'Updates'],
  mobileHeading: 'Notes on content, code, and the space between',
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
      slug: 'one-change-shouldnt-get-lost',
      title: "One change shouldn't get lost across three systems",
    },
    {
      compactDescription: visualEditingDescription,
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
      slug: 'edit-what-you-see',
      title: 'Edit what you see, without losing control of your code',
    },
  ],
}
