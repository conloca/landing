/**
 * The two audiences the product pitches itself to. Rendered as a segmented
 * control in the hero and on each feature card.
 *
 * Kept here rather than inside the segmented-control primitive: that component
 * should only know how to render two labels, not which two. It is also not
 * inlined into either calling section, because both render the same pair and
 * they must not drift apart.
 *
 * Presentational for now — the Figma file has no "Content editors" page behind
 * the second option, so nothing switches when it is clicked. See
 * docs/QUESTIONS-DESIGNER.md.
 */
export const AUDIENCE_OPTIONS: [string, string] = ['Developers', 'Content editors']
