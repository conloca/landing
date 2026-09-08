/**
 * The single source of truth for each RASTER bento illustration's committed
 * file name, its intrinsic pixel size, and the Figma card node it was
 * cropped from. Deliberately has no image imports of its own —
 * `illustrations.tsx` still needs one static `import … from
 * '@/assets/.../*.webp'` per file for Vite to bundle it as an asset, but
 * every *number* here is written once.
 *
 * "Scheduled Publishing" is NOT here: its Figma source is a photo/device-
 * screenshot composite (no vector layer exists to export), and the raster
 * crop of it used to clip against the card's fade before reaching the
 * title. It's now a hand-authored inline SVG living directly in
 * `illustrations.tsx`, matching the flat line-art convention the other six
 * illustrations already use — see that file's
 * `ScheduledPublishingIllustration` for the rationale and the artwork.
 *
 * Being import-free also makes this file safe to import from a `bun:test`
 * file: bun has no Vite-style loader for `.webp`, so a test that imported
 * `illustrations.tsx` directly would fail before it ran a single assertion.
 * See `webp-dimensions.test.ts`, which reads the real files on disk and
 * checks them against these numbers.
 */
export interface BentoAssetSpec {
  readonly file: string
  readonly width: number
  readonly height: number
  /** Figma node id the crop was exported from, for re-export lookups. */
  readonly node: string
}

export const BENTO_ASSETS = {
  branch: { file: 'git-branch.webp', width: 682, height: 192, node: '40002427:16815' },
  markdown: { file: 'markdown.webp', width: 682, height: 192, node: '40002427:16949' },
  mediaLibrary: { file: 'media-library.webp', width: 335, height: 192, node: '40002427:17031' },
  dataCollections: {
    file: 'data-collections.webp',
    width: 335,
    height: 192,
    node: '40002427:16845',
  },
  fragments: { file: 'fragments.webp', width: 335, height: 192, node: '40002427:16934' },
  versionHistory: {
    file: 'version-history.webp',
    width: 335,
    height: 192,
    node: '40002427:17049',
  },
} as const satisfies Record<string, BentoAssetSpec>
