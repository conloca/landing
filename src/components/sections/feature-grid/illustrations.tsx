import dataCollectionsUrl from '@/assets/figma/bento/data-collections.webp'
import fragmentsUrl from '@/assets/figma/bento/fragments.webp'
import gitBranchUrl from '@/assets/figma/bento/git-branch.webp'
import markdownUrl from '@/assets/figma/bento/markdown.webp'
import mediaLibraryUrl from '@/assets/figma/bento/media-library.webp'
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
 * presentational `height: 533px` hint with a proportional one) — a load-
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
 * static string literal — it can't be built from a variable — so the six
 * imports above have to stay written out by hand regardless. (Scheduled
 * Publishing isn't here at all — see `ScheduledPublishingIllustration`.)
 */
const URLS: Record<keyof typeof BENTO_ASSETS, string> = {
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
 * "Sceduled Publishing" card (typo is the Figma source's, kept verbatim
 * elsewhere per `FeatureGrid.tsx`'s note — this comment spells it correctly).
 *
 * Unlike the other six cards, this one is a hand-authored inline SVG, not a
 * `get_screenshot` raster crop. Figma node `40002427:17071`'s content is a
 * photo/device-screenshot composite (the same "blurred backdrop + app
 * screenshot" family as the Hero and S1 sections use) — there is no vector
 * layer underneath it to export, confirmed against the file's own node tree.
 * A raster crop of a photo can only fade to the card background by being
 * cropped generously enough above the true edge (see this file's git
 * history for the version that got that budget wrong and hard-clipped
 * instead of fading), which is fragile in a way flat vector art isn't.
 *
 * So this redraws the same scene — the editor chrome, the Publish button,
 * the calendar action the card's copy is actually about, a collaborator
 * avatar — as flat shapes, reusing conventions the other six illustrations
 * already established: the lime (`#9ae600`) accent dot/pointer from
 * `BranchIllustration`'s graph nodes, the sand-toned placeholder bars from
 * `DataCollectionsIllustration`, and the floating status pill from
 * `VersionHistoryIllustration`'s "Edited homepage.mdx" chip — here reading
 * "Scheduled · Sep 12, 9:00 AM" to tie directly to the card's own title.
 *
 * Sizing needs no `width`/`height` attribute trick the way the raster
 * illustrations do: an SVG root sized via `className="w-full"` with no
 * explicit height already resolves its rendered height from the
 * `viewBox`'s intrinsic aspect ratio, the same replaced-element behavior
 * `Illustration` leans on `height: auto` for. The device group's bottom
 * ~38% fades to transparent via `#scheduled-fade-mask`, so it blends into
 * `bg-sand-200` (the card's own fill) at any card width instead of
 * depending on a raster crop's baked-in fade reaching far enough. The
 * "Scheduled" chip sits outside that mask, at full opacity — same as
 * `VersionHistoryIllustration`'s "Edited homepage.mdx" chip, which is
 * never faded either.
 */
export function ScheduledPublishingIllustration() {
  return (
    <svg viewBox="0 0 682 533" fill="none" className="w-full" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="scheduled-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.62" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id="scheduled-fade-mask">
          <rect x="0" y="0" width="682" height="533" fill="url(#scheduled-fade)" />
        </mask>
        <linearGradient id="scheduled-avatar" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d5dabc" />
          <stop offset="1" stopColor="#9fab70" />
        </linearGradient>
        <filter id="scheduled-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="16" floodColor="#40472d" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* editor chrome — this is the group that fades into the card background.
          The fade mask is applied to an axis-aligned OUTER group (its coordinate
          space matches the mask rect's unrotated 682x533 userSpaceOnUse box
          unambiguously), and the -1.6deg tilt lives on a separate INNER group
          nested inside it. Stacking `mask` + `transform` (and the drop-shadow
          `filter` further down) on the *same* <g> renders fine in headless
          Chromium but is a known WebKit/Safari trouble spot — real iPhone
          Safari was seen producing a visibly crooked crop boundary and
          corrupted shadow compositing around the toolbar icons from exactly
          this combination. Splitting mask / transform / filter onto separate
          nested nodes (mask outer, transform inner, filter on the single rect
          that needs it) avoids ever asking one element to reconcile a
          rotated coordinate system against an unrotated mask crop. */}
      <g mask="url(#scheduled-fade-mask)">
        <g transform="rotate(-1.6 341 220)">
          <rect
            x="-32"
            y="-28"
            width="700"
            height="452"
            rx="26"
            fill="#fefefe"
            stroke="#e7e5e4"
            strokeWidth="1.5"
            filter="url(#scheduled-shadow)"
          />
          <line x1="-32" y1="108" x2="668" y2="108" stroke="#f5f5f4" strokeWidth="1.5" />

          {/* preview / device toggle */}
          <rect x="16" y="44" width="56" height="40" rx="12" fill="#fff" stroke="#e7e5e4" strokeWidth="1.5" />
          <rect x="34" y="54" width="20" height="20" rx="4" fill="none" stroke="#a8a29e" strokeWidth="1.5" />
          <line x1="40" y1="58" x2="48" y2="58" stroke="#a8a29e" strokeWidth="1.5" strokeLinecap="round" />

          {/* undo / redo */}
          <path d="M323 47 a13 13 0 1 1 -9 22" fill="none" stroke="#a8a29e" strokeWidth="2" strokeLinecap="round" />
          <path d="M328 41 l-7 5 6 6z" fill="#a8a29e" />
          <path d="M363 47 a13 13 0 1 0 9 22" fill="none" stroke="#a8a29e" strokeWidth="2" strokeLinecap="round" />
          <path d="M358 41 l7 5 -6 6z" fill="#a8a29e" />

          {/* publish button */}
          <rect x="418" y="42" width="118" height="44" rx="22" fill="#292524" />
          <text
            x="477"
            y="70"
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
            fontSize="18"
            fill="#fafaf9"
          >
            Publish
          </text>

          {/* schedule (calendar) action, with the click-cursor accent from the source composition */}
          <rect x="552" y="42" width="52" height="44" rx="12" fill="#fff" stroke="#e7e5e4" strokeWidth="1.5" />
          <rect x="568" y="56" width="20" height="18" rx="3" fill="none" stroke="#78716c" strokeWidth="1.5" />
          <line x1="568" y1="61" x2="588" y2="61" stroke="#78716c" strokeWidth="1.5" />
          <line x1="573" y1="53" x2="573" y2="59" stroke="#78716c" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="583" y1="53" x2="583" y2="59" stroke="#78716c" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M600 80 l15 15 -17 4z" fill="#9ae600" stroke="#fefefe" strokeWidth="1.5" strokeLinejoin="round" />

          {/* collaborator avatar */}
          <circle cx="634" cy="106" r="27" fill="url(#scheduled-avatar)" stroke="#9ae600" strokeWidth="4" />

          {/* sidebar placeholder lines */}
          <rect x="16" y="140" width="176" height="13" rx="6.5" fill="#eaecdb" />
          <rect x="16" y="167" width="116" height="13" rx="6.5" fill="#eaecdb" />

          {/* content canvas blocks */}
          <rect x="16" y="206" width="276" height="150" rx="16" fill="#f6f7f1" />
          <rect x="308" y="206" width="276" height="150" rx="16" fill="#f6f7f1" />
        </g>
      </g>

      {/* floating "scheduled" status chip, echoing VersionHistoryIllustration's
          activity pill — kept OUTSIDE the fade mask, at full opacity, same as
          that sibling's chip is never faded either */}
      <g transform="rotate(1.2 495 430)">
        <rect
          x="380"
          y="404"
          width="230"
          height="46"
          rx="23"
          fill="#fff"
          stroke="#e7e5e4"
          strokeWidth="1.5"
          filter="url(#scheduled-shadow)"
        />
        <circle cx="404" cy="427" r="5" fill="#9ae600" />
        <text x="420" y="433" fontFamily="Inter, sans-serif" fontWeight="600" fontSize="15" fill="#1c1917">
          Scheduled
        </text>
        <text x="500" y="433" fontFamily="Inter, sans-serif" fontSize="15" fill="#78716c">
          &#183; Sep 12, 9:00 AM
        </text>
      </g>
    </svg>
  )
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
