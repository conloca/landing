/**
 * Prerendered `/docs/` page.
 *
 * Accessed via: App when `pageFromPath` resolves to `docs`.
 *
 * Assumptions: no Figma frame exists for docs (nav has always carried the
 * label with no destination behind it — see nav.ts). This is a docs landing
 * page introducing the product's core concepts and linking out to the
 * sections of the site that already cover them in depth, not a complete
 * documentation product. Layout mirrors HowItWorksPage's typographic
 * conventions (font-display headings, stone/lime palette) for consistency
 * with the rest of the static site.
 */

import { CtaButton } from '@/components/CtaButton'
import { CTA_LINKS } from '@/lib/nav'
import { publicUrl } from '@/lib/publicUrl'

interface DocsTopic {
  title: string
  body: string
  href: string
  linkLabel: string
}

const TOPICS: DocsTopic[] = [
  {
    title: 'Visual editing',
    body: 'Open a real page in the visual editor, change text, images, or metadata, and see the result as you go — no staging environment that is only roughly similar to production.',
    href: publicUrl('blog/one-change-shouldnt-get-lost/'),
    linkLabel: 'Read how it fits together',
  },
  {
    title: 'Content in Git',
    body: 'Every change is saved to the same Git repository that holds the site\'s code and structure, so copy, components, and the published result never drift apart.',
    href: `${publicUrl('blog/one-change-shouldnt-get-lost/')}#git-safety-net`,
    linkLabel: 'See the technical walkthrough',
  },
  {
    title: 'Structure defined in code',
    body: 'Developers define the schema in the IDE. Conloca enforces those structure and content rules in the editor, so a marketer can never save a page into an invalid shape.',
    href: publicUrl('how-it-works/'),
    linkLabel: 'See how it works',
  },
  {
    title: 'Fast by default',
    body: 'Astro builds the published page and keeps the JavaScript shipped to visitors to a minimum, so editing visually never costs the site its speed.',
    href: `${publicUrl('#pricing')}`,
    linkLabel: 'Compare plans',
  },
]

export function DocsPage() {
  return (
    <main id="main-content">
      <section className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 pt-24 pb-4 sm:px-6 sm:pt-14 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-wide text-stone-500">Documentation</p>
        <h1 className="font-display max-w-[20ch] text-[32px] leading-[38px] font-bold text-stone-900 sm:text-[40px] sm:leading-[1.2] lg:text-5xl lg:leading-none">
          Start here
        </h1>
        <p className="max-w-[36rem] text-base leading-[1.7] text-stone-500 italic">
          Conloca keeps content in Git, lets developers define the structure in the IDE, and gives
          editors a real visual editor for the page itself. These are the concepts worth knowing
          before your first edit.
        </p>
      </section>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-4 px-4 pb-16 sm:grid-cols-2 sm:px-6 lg:px-8">
        {TOPICS.map((topic) => (
          <article
            key={topic.title}
            className="flex flex-col gap-4 rounded-[20px] border border-stone-200 p-6 sm:rounded-[24px] sm:p-8"
          >
            <h2 className="font-display text-2xl font-bold text-stone-900">{topic.title}</h2>
            <p className="text-base leading-[1.7] text-stone-600">{topic.body}</p>
            <a className="mt-auto text-sm font-medium text-stone-900 underline underline-offset-4 hover:text-stone-600" href={topic.href}>
              {topic.linkLabel}
            </a>
          </article>
        ))}
      </div>

      <div className="mx-auto flex max-w-[1440px] flex-wrap gap-3 px-4 pb-16 sm:px-6 lg:px-8">
        <CtaButton href={CTA_LINKS.getStarted}>Get started</CtaButton>
        <CtaButton variant="outline" href={CTA_LINKS.tryDemo}>
          Try editor
        </CtaButton>
      </div>
    </main>
  )
}
