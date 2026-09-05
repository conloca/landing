/**
 * The two audiences the product pitches itself to. Rendered as a segmented
 * control in the hero and on each feature card.
 *
 * Kept here rather than inside the segmented-control primitive: that component
 * should only know how to render two labels, not which two. It is also not
 * inlined into either calling section, because both render the same pair and
 * they must not drift apart.
 *
 * `Audience` is the data key the content model (`src/lib/content/*`) is keyed
 * by; `AUDIENCE_OPTIONS` is only the pair of display labels, in the same
 * order — index 0 is `'developer'`, index 1 is `'content-editor'`.
 */
export const AUDIENCES = ['developer', 'content-editor'] as const
export type Audience = (typeof AUDIENCES)[number]

export const AUDIENCE_OPTIONS: [string, string] = ['Developers', 'Content editors']

/**
 * `SegmentedControl`'s index type inlined as `0 | 1` rather than imported
 * (that component's own `SegmentIndex`) — this module stays free of any
 * import from the components layer. An exhaustive `Record`, not a cast: if
 * `AUDIENCES` ever grew a third entry, this literal would fail to compile
 * (missing key) right here, rather than silently mapping the new value to
 * index 1 alongside `'content-editor'`.
 */
export const AUDIENCE_INDEX: Record<Audience, 0 | 1> = {
  developer: 0,
  'content-editor': 1,
}
