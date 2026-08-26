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

/**
 * Document order matches `.bento-grid`'s nth-child grid-area mapping in
 * index.css, so document order is the single thing that decides layout —
 * including which card is the large one. `tall` is therefore derived from
 * position below rather than stored here: as a data field it was a second,
 * independent answer to the same question, and reordering this array moved
 * one without the other, leaving the wrong card enlarged.
 */
const CARDS = [
  {
    title: 'Scheduled Publishing',
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
    body: 'Just type the page contents in Markdown. Conloca will render it',
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
 * The first card is the large one, because `.bento-grid > :nth-child(1)` is
 * what claims the `big` grid area. Move a card to the front to enlarge it;
 * there is nothing else to update.
 */
const LARGE_CARD_INDEX = 0

/**
 * "Full version history"'s body ("Build a block once, reuse it across every
 * page") describes reusable blocks, not version history — a content bug in
 * the Figma source, not a build error. Kept verbatim pending real copy from
 * the designer, see docs/QUESTIONS-DESIGNER.md.
 */
export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-[1440px] px-8 py-16">
      <div className="bento-grid">
        {CARDS.map((card, index) => (
          <BentoCard key={card.title} {...card} tall={index === LARGE_CARD_INDEX} />
        ))}
      </div>
    </section>
  )
}
