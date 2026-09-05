import dataCollectionsUrl from '@/assets/figma/bento/data-collections.webp'
import fragmentsUrl from '@/assets/figma/bento/fragments.webp'
import gitBranchUrl from '@/assets/figma/bento/git-branch.webp'
import markdownUrl from '@/assets/figma/bento/markdown.webp'
import mediaLibraryUrl from '@/assets/figma/bento/media-library.webp'
import scheduledPublishingUrl from '@/assets/figma/bento/scheduled-publishing.webp'
import versionHistoryUrl from '@/assets/figma/bento/version-history.webp'
import { BENTO_ASSETS } from './bento-assets'

interface IllustrationProps {
  src: string
  width: number
  height: number
}

/**
 * One bento card's illustration, exported from the S3 bento grid
 * (`40002427:16814`) via the Figma MCP `get_screenshot` tool. Each source PNG
 * is the full card render, cropped down to the region above the card's title
 * background rectangle (`Rectangle 20` in the node tree) — that rectangle
 * paints over the illustration to seat the title/body text, so the crop line
 * matches what a viewer actually sees, not an arbitrary trim.
 *
 * `width`/`height` come from `bento-assets.ts`, and must stay in sync with
 * the actual file — they set the `<img>`'s `aspect-ratio` (via the
 * `width`/`height` attributes, which the browser uses for exactly this even
 * though nothing sets an explicit CSS size) so the image's own crop
 * proportions — not `.bento-grid`'s row height — decide how tall the
 * illustration renders at the card's actual width. The grid's
 * `minmax(..., auto)` row tracks then grow to fit that, the same way they
 * grow to fit the title/body text below it. Sizing off the container instead
 * (e.g. `absolute inset-0 size-full`) previously showed only the top
 * fraction of each crop, because the row height a `flex-1` child actually
 * gets from an auto-sized grid track is its own min-height, not the full
 * design height.
 *
 * Deliberately no `object-fit`: with only a CSS width set, the box's height
 * is derived from the `width`/`height` attributes' ratio via Tailwind
 * preflight's `img { height: auto }` (which overrides the attributes' own
 * presentational `height: 440px` hint with a proportional one) — a load-
 * bearing dependency on that global reset applying to these images. So a
 * future re-export whose real dimensions drift from a stale literal here
 * renders as a visibly stretched image — a bug that is obvious on sight —
 * rather than `object-cover` silently cropping the mismatch into something
 * that still looks plausible. `webp-dimensions.test.ts` checks the
 * `bento-assets.ts` literals against the committed files, so a drift fails
 * that test instead of shipping.
 *
 * `alt=""` is a deliberate decorative marking, not an oversight: each card's
 * title and body already state what the illustration shows in words (e.g.
 * the media-library card's body — "Upload assets once and reference them
 * anywhere" — covers what its `.PNG`/`.JPEG`/`.GIF`/`.MP4` tiles depict), so
 * the illustration adds visual interest without carrying information a
 * screen-reader user would otherwise miss.
 */
function Illustration({ src, width, height }: IllustrationProps) {
  return <img src={src} alt="" width={width} height={height} loading="lazy" className="w-full" />
}

/**
 * Maps each `bento-assets.ts` key to its bundled URL. Kept separate from
 * `BENTO_ASSETS` itself (rather than adding a `url` field there) because
 * Vite only bundles a `@/assets/...webp` import when the specifier is a
 * static string literal — it can't be built from a variable — so the seven
 * imports above have to stay written out by hand regardless.
 */
const URLS: Record<keyof typeof BENTO_ASSETS, string> = {
  scheduledPublishing: scheduledPublishingUrl,
  branch: gitBranchUrl,
  markdown: markdownUrl,
  mediaLibrary: mediaLibraryUrl,
  dataCollections: dataCollectionsUrl,
  fragments: fragmentsUrl,
  versionHistory: versionHistoryUrl,
}

function illustrationFor(key: keyof typeof BENTO_ASSETS) {
  const { width, height } = BENTO_ASSETS[key]
  return <Illustration src={URLS[key]} width={width} height={height} />
}

/**
 * "Sceduled Publishing" card. Node id lives in `bento-assets.ts` (single
 * source of truth), not restated here.
 */
export function ScheduledPublishingIllustration() {
  return illustrationFor('scheduledPublishing')
}

/** "Git-native workflow" card. */
export function BranchIllustration() {
  return illustrationFor('branch')
}

/** "Type content in Markdown" card. */
export function MarkdownIllustration() {
  return illustrationFor('markdown')
}

/** "Media library" card. */
export function MediaLibraryIllustration() {
  return illustrationFor('mediaLibrary')
}

/** "Data collections" card. */
export function DataCollectionsIllustration() {
  return illustrationFor('dataCollections')
}

/** "Reusable fragments" card. */
export function FragmentsIllustration() {
  return illustrationFor('fragments')
}

/** "Full version history" card. */
export function VersionHistoryIllustration() {
  return illustrationFor('versionHistory')
}
