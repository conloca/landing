import { BentoCard } from '@/components/sections/feature-grid/BentoCard'
import {
  BranchIllustration,
  DataCollectionsIllustration,
  FragmentsIllustration,
  MarkdownIllustration,
  MediaLibraryIllustration,
  ScheduledPublishingIllustration,
  VersionHistoryIllustration,
} from '@/components/sections/feature-grid/illustrations'

const SCHEDULED_ILLUSTRATION = <ScheduledPublishingIllustration />
const BRANCH_ILLUSTRATION = <BranchIllustration />
const MARKDOWN_ILLUSTRATION = <MarkdownIllustration />
const MEDIA_ILLUSTRATION = <MediaLibraryIllustration />
const DATA_ILLUSTRATION = <DataCollectionsIllustration />
const FRAGMENTS_ILLUSTRATION = <FragmentsIllustration />
const VERSION_HISTORY_ILLUSTRATION = <VersionHistoryIllustration />

/** Document order matches `.bento-grid`'s nth-child grid-area mapping in index.css. */
const CARDS = [
  {
    tall: true,
    title: 'Sceduled Publishing', // verbatim Figma copy — likely a typo for "Scheduled", see docs/QUESTIONS-DESIGNER.md
    body: 'Set a date and time for content to go live automatically',
    illustration: SCHEDULED_ILLUSTRATION,
  },
  {
    title: 'Git-native workflow',
    body: 'Every change is a commit. Branch, preview, and merge',
    illustration: BRANCH_ILLUSTRATION,
  },
  {
    title: 'Type content in Markdown',
    body: 'Just type the page contents in Makrdown. Conloca will render it', // verbatim Figma copy — likely a typo for "Markdown", see docs/QUESTIONS-DESIGNER.md
    illustration: MARKDOWN_ILLUSTRATION,
  },
  {
    title: 'Media library',
    body: 'Upload assets once and reference them anywhere',
    illustration: MEDIA_ILLUSTRATION,
  },
  {
    title: 'Data collections',
    body: 'Model and reuse structured data collections',
    illustration: DATA_ILLUSTRATION,
  },
  {
    title: 'Reusable fragments',
    body: 'Define and reuse larger content as fragments',
    illustration: FRAGMENTS_ILLUSTRATION,
  },
  {
    title: 'Full version history',
    body: 'Build a block once, reuse it across every page',
    illustration: VERSION_HISTORY_ILLUSTRATION,
  },
]

/**
 * Card 6/7 body copy looks swapped in the Figma file (card 7's body describes
 * fragments, not version history) — kept verbatim, see docs/QUESTIONS-DESIGNER.md.
 */
export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-[1440px] px-8 py-16">
      <div className="bento-grid">
        {CARDS.map((card) => (
          <BentoCard key={card.title} {...card} />
        ))}
      </div>
    </section>
  )
}
