# Known issues — deferred engineering findings

Non-blocking findings from the pre-commit review of the landing-section build
(`dc6a24e`), deliberately deferred rather than fixed inline. Tracked here
because this repository has no ticket backend yet (see item 11) — once one
exists, migrate each item into a real ticket and delete this file.

1. **CTA buttons have no shared destination config.** "Get Started", "Try
   Demo", and similar buttons hardcode their target inline rather than
   pointing at a single source of truth. Suggest: a small `src/lib/nav.ts`
   -style constant map once real destinations exist.

2. **Domain copy lives inside a generic UI primitive.** Plan names and
   feature lists are defined inside `src/components/ui/segmented-control.tsx`,
   which should only know about generic segmented-control behavior, not
   product content. Suggest: lift the copy up to the calling section.

3. **`FeatureGrid` has two sources of truth for its "big" card.** Which
   bento card renders large is determined both by a CSS `nth-child` selector
   and by a `tall` prop, and the two can drift out of sync. Suggest: pick one
   mechanism and remove the other.

4. **Decorative mockups are exposed to the accessibility tree and to
   crawlers as real content.** `HeroVisual`, `JsonEditorMockup`, and
   `DiffMockup` render fake headings and text that a screen reader or search
   engine will read as genuine page content. This is a real accessibility
   and SEO correctness gap, not a style nit. Suggest: mark the decorative
   containers `aria-hidden="true"`, or use `role="presentation"` where
   appropriate.

5. **Nested scroll inside the pinned `ScrollStack` cards risks trapping
   mobile scroll.** The cards use `overflow-y-auto` internally; on a short
   mobile viewport, the inner scroll can absorb the user's scroll gesture
   instead of letting it continue to the next section. Suggest: verify on an
   actual short mobile viewport and consider `overscroll-behavior: contain`.

6. **`ScrollStack`'s `count` prop is duplicated across `Root` and `Card`.**
   Not a live bug today, but a future-refactor footgun if the two values are
   ever changed independently and disagree. Suggest: derive one from the
   other, or pass children directly and compute the count internally.

7. **`LottieBanner` is reused without an explicit `src` in at least one
   call site.** It currently works because of a default value, but that
   makes the call site fragile to change. Suggest: make `src` a required
   prop, or pass it explicitly everywhere.

8. **The Lottie banner's WASM player mounts eagerly instead of lazily.**
   The banner sits below the fold, but the player initializes on page load
   rather than waiting until it scrolls into view, spending bandwidth and
   CPU on content the user may never reach. Suggest: gate the mount behind
   an `IntersectionObserver`, consistent with how `Reveal` already gates
   entrance animations.

9. **Unused Roboto Mono 500 CSS declaration.** Present in the stylesheet
   with no current caller.

10. **Mobile and tablet breakpoints were only spot-checked, not
    exhaustively verified.** The build was checked visually against the
    640px, 1024px, and 393px frames extracted from Figma, but not verified
    section-by-section the way the desktop breakpoint was. Suggest: a
    dedicated `agent-browser` pass at each of the three breakpoints before
    shipping.

11. **No ticket backend or git remote is configured for this repository.**
    That absence is why this file exists instead of real tickets. Once
    GitHub Issues, Linear, or another backend is wired up, migrate every
    item above into a real ticket and delete this file.
