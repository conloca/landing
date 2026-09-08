# Questions for the designer

This tracks every place where the design file or the supplied assets don't give a single
correct answer. Questions are split into three groups:

- **Open questions — answered by us** — originally waiting on the designer: missing
  content, missing assets, or original creative intent. We filled the most probable
  answers so the build is not blocked. A later designer pass can still override them.
- **We built it this way — please confirm** — places with no single right answer, where
  we made a call ourselves rather than stop the build. The decision is already live on
  the site; the question is "is this what you meant, or should we change it?" We have
  now confirmed those calls below.
- **Already resolved, no need to answer** — plain facts: things the design already made
  clear, or an unambiguous typo, with no real fork in the decision.

You can answer directly in this file — one short paragraph under each question.

---

## Localization banner animation

This is about `Banner 2 animation.lottie` — an animated panel showing the product's
language-management screen (header "Locales", rows for English / Deutsch / Français /
Español / 日本語, a "2 locales update needed" line at the bottom, and a colleague's
cursor labeled "Kyle" at the top).

### Open questions — answered by us

1. The name "Banner 2" implies a series. Is there a "Banner 1" and others that will also
   go on the landing page? If so, please send them all at once so we don't have to rework
   the layout for each one separately.

   **Answered by us:** No Banner 1 or Banner 3 files were delivered. Keep the existing
   HTML mockups for those slots and do not invent replacement Lottie clips.

2. The clip runs exactly two seconds, but the actual motion takes only 0.62 seconds: the
   first 0.6 seconds hold still, and so do the last 0.78 seconds. Is that opening pause
   an intentional "breath" before the action, or a side effect of the export that can be
   trimmed next time?

   **Answered by us:** Keep the exported timing. The opening pause is in the file, so we
   treat it as part of the clip rather than trimming it.

3. The "+ Button" at the bottom of the panel is visible for exactly one frame out of a
   hundred and twenty, then disappears entirely. Is that an export mistake, or intended?

   **Answered by us:** The one-frame Button is an export glitch. Ignore it until a clean
   re-export exists.

4. That same button is literally labeled "Button". Is that placeholder text? What should
   the real label say?

   **Answered by us:** "Button" is placeholder text inside the Lottie. Ignore it until a
   re-export ships the real label.

5. The Spanish row is labeled "Español (en)", even though the language code for Spanish
   is `es`. Is that a typo?

   **Answered by us:** "Español (en)" is a Lottie typo. We cannot fix it without a
   re-export, so the clip stays as-is.

6. Pure red (`#FF0000`) shows up five times in the fills, invisible anywhere in the
   frame. It looks like a forgotten guide or a marker layer. Can it be cleaned up in the
   next export?

   **Answered by us:** The `#FF0000` fills are export leftovers. Ignore them; they are
   not part of the UI.

7. The colleague's cursor in blue (`#00BFFF`) and the "Up to date" status dot in lime
   (`#C3F13C`) fall outside the clip's gray-beige-and-amber palette. Are these
   intentional accents? If so, what are they called in your system, so we can add them
   as real design tokens instead of one-off values in the code? For now we're using
   these exact values with no name attached.

   **Answered by us:** Kyle's `#00BFFF` and the lime status dot are identity and accent
   colours. Keep the hex values. Pull request 119 already added cursor tokens, including
   `color.cursor.kyle`.

8. All the text inside the animation has been converted to vector outlines — there are
   zero real text layers in the file. For a product about translating interfaces, that
   means the banner itself can't be translated into another language without
   re-exporting it from Figma. Is the landing page English-only for now, or will there
   be localized versions?

   **Answered by us:** The landing page is English-only for now. Outlined Lottie text
   does not need to be translatable.

9. Is the cursor labeled "Kyle" advertising real-time collaboration on translations as
   an actual product feature, or is it just decoration? The answer decides whether we
   need supporting copy near the banner to back up that claim.

   **Answered by us:** The Kyle cursor is decoration, not a product claim. Do not add
   extra copy near the banner.

### We built it this way — please confirm

10. **The clip physically doesn't loop** — its last frame doesn't match its first (the
    card column in the background ends up 224 pixels higher than it started and never
    comes back, and the highlighting on the Français and Deutsch rows swaps). Here's what
    we did: the banner plays once when it scrolls into view and freezes on its final
    frame — which matches the clip's own intent, since it's built to settle on "2 locales
    update needed". Keep it that way, or do you need a real repeat — in which case we'd
    need either a re-export that returns to its starting state, or a several-second pause
    between plays?

    **Answered by us:** Keep play-once and freeze on the final frame.

11. **With the system's "reduce motion" setting turned on**, we chose to immediately show
    the same final frame that a normal playthrough ends on — not the first frame, and not
    the animation in motion. Does that work?

    **Answered by us:** Keep showing the final frame immediately when reduced motion is
    on.

12. **Screen-reader label.** The panel is essentially a screenshot of the product's
    interface, so the image alone means nothing to a blind user. We wrote a short
    description of what it shows: "Locales panel showing sync status across five
    languages". Does that wording work, or would you rather have something else?

    **Answered by us:** Keep the current alt text: "Locales panel showing sync status
    across five languages".

13. **We shrank the five flags inside the banner** to 64×64 pixels (they were as large as
    1200×600 for a visible size of about 22 pixels) — the clip's weight dropped from
    145 KB to 42 KB with no visible difference. Leave it as is, or will you send a
    re-export with properly small flags to begin with?

    **Answered by us:** Keep the 64×64 flags. Do not wait for a re-export.

---

## Landing page layout

Now that we have access to the design file, here are the questions about Conloca's main
page (the product keeps a site's content directly in the customer's Git repository;
developers edit it in their IDE, non-technical editors use a visual interface, and both
write to the same files). The file shows the developer-facing variant at four screen
widths — 1440, 1024, 640, and 393 pixels.

### Open questions — answered by us

1. Judging by the toggle in the hero section's header, the product has two entry points
   — one for developers, one for non-technical content editors. The editor screen exists
   in the file, but only at one width, without the other three. Is that needed in this
   same landing-page release, or are we shipping only the developer version for now?

   **Answered by us:** Ship both audiences. The toggle is already built. The editors
   frame existed at only one width, so reuse the developer breakpoints.

2. In the "One source of truth" feature card, one of the blocks is a stand-in mockup the
   size of an entire second animation — a JSON schema editor next to a visual page
   builder — and we weren't given the actual file for that animation. Same question for
   every other mockup image inside the feature cards (a Git version-comparison panel, a
   publishing scheduler, a branch diagram, and the rest): which of these will be a
   separate Lottie clip like the banner we already have, which will be a static image,
   and which should be built as a real, working HTML interface? For now we've built all
   of these as generic, site-styled HTML mockups rather than real assets — that's a
   placeholder, not the final look. (Near this same heading, four small decorative
   elements float in the design — status chips, Git and Astro icons; once we get to
   building them, the default will be to keep them static, with no scroll-parallax
   effect, unless you specifically ask for that.)

   **Answered by us:** Missing Lotties stay HTML mockups. Decorative chips stay static,
   with no parallax. Do not invent replacement Lottie files.

3. The landing page footer currently has only the logo, four links, and a "Get Started"
   button — no privacy policy or terms of service links, no copyright, no social links.
   Is that the final footer, or is more coming?

   **Answered by us:** The sparse footer is the final footer.

4. Next to the text in the hero section there's a three-bar indicator — a clear hint at a
   three-slide carousel — but copy exists for only one of the three. Will you send text
   for the other two, or should there actually be fewer bars? For now the indicator is
   shown static, with no invented text for slides that don't exist.

   **Answered by us:** The three bars are carousel _items_, not slides. Slides are the
   S1 ThreeFeatures cards, whose first title is "One source of truth, two ways to work".
   Keep three carousel items and keep rotation. The designer never sent items 2–3;
   landing-saba copy is the stand-in.

5. There's a play button over the video preview in the hero section, but what happens
   after clicking it isn't specified in the design, and we weren't given the actual
   video. Is that an inline video embedded in the page, a link to an external service
   like YouTube, or does it open in a separate overlay window? For now the button is
   decorative and doesn't go anywhere.

   **Answered by us:** The play control stays decorative until a real video file exists.

6. Below the three pricing cards there's a "Compare plans" button with no indication of
   where it leads. Does it open a separate plan-comparison page, expand a table in
   place, or something else?

   **Answered by us:** "Compare plans" goes to `#pricing`.

7. At a screen width of 1024 pixels, the video in the hero section is deliberately
   cropped off the right edge of the screen instead of shrinking along with everything
   else. This doesn't apply yet, since we don't have the actual video and built that
   block as a static reconstruction of the product's interface. The question matters
   once a real video exists: is that frame crop at this width intentional, or is the
   design at this width simply unfinished?

   **Answered by us:** The 1024-wide hero crop is intentional once a real video exists.
   The current image fill is fine.

8. In the "Full version history" feature card, the body copy actually describes reusable
   content blocks, not version history — "Build a block once, reuse it across every
   page". The neighboring "Reusable fragments" card correctly describes itself, so this
   isn't a clean swap of two labels — it looks like the design file just has the wrong
   text under that one heading. Can you send the copy that should actually describe
   version history?

   **Answered by us:** Keep Figma's version-history card text as drawn. Do not invent
   replacement copy.

9. The product seems to have a separate brand palette — eleven warm, sandy-olive tones —
   for the feature-card block and some of the illustrations inside it. None of them are
   part of the site's main palette (grays and a lime accent color). Is that a deliberate,
   separate palette for this section? If so, what is it called in your system, so we can
   set it up as a proper set of colors? For now these cards use the site's main
   gray-and-lime palette, without the sandy tones — if a separate palette is needed,
   we'll add it in a follow-up pass once we know the real color names.

   **Answered by us:** The sand palette is real. Bento cards use the sand tokens from
   pull request 119 (`bg-sand-200` and the rest of `color.sand.*`) rather than stone
   placeholders.

10. About that same "Kyle" colleague cursor, which appears in this layout with the same
    blue color `#00BFFF` — is that a brand color specifically identifying this person, or
    can we use any free shade from the site's palette? Same question as in the banner
    section above (banner, open question 7) — both places in the layout and the banner
    use the exact same color, so this only needs answering once.

    **Answered by us:** Kyle blue is identity. Keep `#00BFFF` / `cursor-kyle`.

11. The product dashboard panel in the hero section couldn't be exported as an image or
    video — the design file's image-export service was rate-limited during our
    extraction, so we never received the actual screenshot or video thumbnail, only the
    layout around them. We rebuilt the panel as plain HTML at a narrower width, with a
    color-gradient placeholder standing in for the video. Three specific things we
    weren't able to reproduce without the real assets: (a) in the design, the panel is
    much wider than ours and is deliberately cropped by the edge of the screen rather
    than shrinking to fit; (b) the design has a left sidebar with Dashboard, Pages,
    Media, Fragments, and Data links that our version doesn't have at all; (c) the
    design's activity list has seven two-line entries (a title plus a file path
    underneath, like `/saba-test`), sitting beside the video thumbnail rather than above
    it — our narrower version only fits four single-line entries stacked above the
    placeholder. Could you send the actual panel screenshot and video thumbnail (or
    confirm the plain-HTML rebuild is fine as a placeholder), tell us whether the panel
    should crop off the screen edge the way it does in the design, and let us know
    whether the sidebar and the fuller seven-entry list should be built out?

    **Answered by us:** Stale. The hero now uses Figma image fills, so the HTML-rebuild
    question no longer applies.

12. There's no color anywhere in the design for an error state — the message that appears
    under a form field when something has been filled in wrong, and anything like it. The
    only red in the whole file (`#fe3434`) is content inside the version-comparison
    mockup: a deleted line of code, not an interface color. We deliberately didn't reuse
    it, because against a white background it's too faint to read comfortably — its
    measured contrast is 3.65 to 1, where the accessibility standard asks for at least
    4.5 to 1 for regular text. Nothing on the page needs an error color today, but the
    first form we add — a signup, a contact form — will. What should that color be?

    **Answered by us:** This page has no error colour. If one is needed later, use a red
    that meets 4.5:1 contrast, not `#fe3434`.

13. Your design file has a page called "Colors", which almost certainly holds your own
    names for the palette. We weren't able to read it: the design service kept refusing
    our requests, and the separate route for reading design variables needs a permission
    our access token doesn't currently have. So the color _values_ we're using are right
    — we counted them directly in the design file — but the _names_ we gave them are our
    own invention. Could you either send us your names for these colors, or confirm ours
    are fine to keep? We may be able to fix the permission on our side by reissuing the
    token, so this one may resolve without you.

    **Answered by us:** The Colors page is now readable -- fetched via a
    files-endpoint batching workaround once the per-node endpoint's quota
    reset (see `docs/figma/COLOR-TOKENS.md` for the full designer-token
    table and `docs/figma/COLORS-RECONCILIATION-46.md` for the line-by-line
    check against `tokens/tokens.json`). Every one of our token names that
    has a designer counterpart already matches: our `foreground` is their
    `color.fg.strong.default`, our `primary` is their `color.bg.accent.initial`,
    our `muted-foreground` is their `color.fg.softer.default`, our `border`/
    `input` is their `color.stroke.strong`. One real mismatch turned up in
    the process and is *not* silently fixed here: our `destructive` token is
    `#fe3434`, the exact red this document already says not to use as a UI
    error colour (see Colors-page question 12 above) because it fails the
    4.5:1 contrast minimum. That still needs a deliberate fix.

### We built it this way — please confirm

14. **The "for developers / for editors" toggle disappears entirely below a 640-pixel
    screen width in the design.** We did it differently — showing it at every screen
    width, since a working control that disappears on mobile looks more like an
    oversight than a deliberate choice. Keep it that way, or does it genuinely need to
    be hidden on mobile?

    **Answered by us:** Keep the audience toggle at all widths.

15. **There's no content at all for the mobile hamburger menu, at any width, in the
    design.** We built a standard dropdown menu with the same links as the desktop
    header — an ordinary engineering default for this pattern, not your actual design.
    Is that look acceptable, or will you send a dedicated screen showing the menu open?

    **Answered by us:** Keep the standard hamburger.

16. **There was about 270 pixels of empty space in the design**, between the "Built for
    Astro" badge and the carousel text in the hero section. Our build doesn't reproduce
    that large a gap — we used normal spacing instead. If that space was meant as
    breathing room for future content, it's moot in our version; if a specific element
    was meant to go there, let us know what's missing.

    **Answered by us:** Do not restore the 270px gap.

17. **The background of the three large feature-block cards in the design is heavy,
    blurred photographs spanning the card's full width.** We replaced them with a CSS
    gradient plus noise — visually similar effect, with almost none of the loading
    weight. Does that swap work, or are the photographs important to keep?

    **Answered by us:** Stale. Photographs are on the S1 cards (pull request 205). Keep
    the photos, not CSS gradients.

18. **When someone moves through the page with the keyboard instead of a mouse**, the
    button or field they're currently on needs a visible outline so they can see where
    they are. The design doesn't show that state anywhere. We used the lime accent color
    (`#9AE600`) for that outline. Does that work, or should it be a different color?

    **Answered by us:** Keep the lime focus ring.

19. **The design has no dark version of the page.** We built one anyway, taking its
    colors from the dark product panel in the hero section. It's currently switched off
    — nothing on the live site uses it, so dropping it costs nothing. Do you want a dark
    theme at all? And if you do, is borrowing the hero panel's colors a reasonable
    starting point?

    **Answered by us:** No dark theme on the marketing page. Keep the unused dark tokens
    as they are.

### Already resolved, no need to answer

- **Typos in the feature-block card copy.** "Sceduled Publishing" and "Makrdown" have
  been corrected to "Scheduled Publishing" and "Markdown" — unambiguous typos that don't
  need confirmation.
- **A typo in the hero section copy.** We separately found another one: "MDS blocks" has
  been corrected to "MDX blocks" — MDX is a real file format the product itself works
  with (see the product description at the start of the "Landing page layout" section);
  "MDS" doesn't appear
  anywhere else.
- **Inter vs. Inter Variable.** These really are the same typeface — the variable font
  file covers both the regular and display cuts through its optical-size axis. The code
  uses a single font file for every case; the distinction in the design file doesn't
  affect the build.
- **Where the localization banner lives on the page.** Already clear from the design
  itself, with no real fork in the decision: it's the visual inside the "Localization
  without manual syncing" feature card (card 2 in the three-feature block), not a
  standalone full-width banner. The card's container is 687×721 pixels, the clip's own
  canvas is 849×1334 — meaning the clip is inherently larger than its container and gets
  cropped on all four sides, shifted slightly upward so the "Locales" panel itself lands
  in the visible window — which is exactly how it's built.

---

## How It Works page

The dedicated `/how-it-works/` page (pull request 215) predates any Figma canvas for
this page — the extraction that produced `DESIGN-SPEC.md` and `nodes.json` only ever
found "How it works" as a nav-bar link label, never a page frame, and the code says so
directly: `HowItWorksPage.tsx` was built by reusing the existing three developer
feature-card copy (`FEATURE_CARDS_COPY.developer` from the S1 `ThreeFeatures` section)
behind a hero and a "Get started / Read docs" pair, on the stated assumption that no
dedicated design existed to follow.

That assumption is now out of date. Five reference exports for a page literally named
"How it works" now exist in the Figma export set, and they contradict both the current
page and each other:

- **`How it works - _1280.png`** (a full page, 1440×6448 at 1x) — hero "The content
  engineering workflow" with a single wide pipeline diagram (Define → Connect →
  Orchestrate), then four more sections: "Transparent by default. Versioned from the
  start." (three cards), "Three content layers. Zero structural drift." (three cards),
  "Two interfaces. Exactly the same state." (a marketer/developer split panel), "The
  same review path as your code." (four steps: Branch, Review, Merge, Deploy), and a
  closing "Bridge engineering and marketing." banner.
- **`How it works - _1280-1.png`** and **`How it works - _1280-2.png`** — identical to
  each other (1440×5124 at 1x), and a different design from the one above: hero titled
  plainly "How it Works", then "The Git-Native Pipeline" (three separate step cards
  instead of one wide diagram), "The Three Layers of Content" (a numbered I/II/III list:
  MDX Blocks, Page Builder, Structured Data), "The 'No Forked Logic' Engine" (a
  marketer/developer split panel, differently styled from the split panel in the design
  above), "Merge & Deploy" (three steps this time — Branching, Review, Deployment, not
  four), and a closing "Ready to Initialize Your Pipeline?" banner.
- **`How it works - Minimal - _1280.png`** — a third, shorter design (1440×4592 at 1x)
  with yet another hero ("A visual edit. A Git commit. The same change."), "One simple
  loop." (a four-circle Define/Edit/Review/Deploy diagram), "One source. Two ways to
  work." (a third differently-styled split panel), "Your stack stays yours." (a
  four-column 01–04 list: Branch, Review, Merge, Deploy), and a closing "Start with Git.
  Keep moving visually." banner.
- **`How it works - image.png`** — a high-resolution crop (2880×2165, i.e. a 1440-wide
  section at 2x) of a fourth treatment of the "three content types" idea: dark
  full-bleed background, eyebrow "THREE CONTENT LAYERS / ONE REPOSITORY", heading
  "Different shapes. The same foundation.", with the same three sub-labels as the
  `_1280-1`/`_1280-2` design (MDX Blocks, Page Builder, Structured Data) but different
  heading copy and a completely different visual layout (dark full-bleed vs. that
  design's light two-column grid).

None of these four designs agree with each other on hero copy, section count, section
order, card count within a section (three vs. four review/deploy steps), or visual
treatment of the repeated "split panel" and "three content types" motifs, and none of
them are reachable from the main Figma extraction (`nodes.json`, `DESIGN-SPEC.md`) that
every other page on this site was built from — they appear to be separate, mutually
exclusive exploratory frames rather than one settled design with revisions layered on
top. None of them resembles the current live page's structure (a hero plus one list of
three cards) at all.

We did not attempt to rebuild the page against any one of these, for two reasons this
time, not one: first, we cannot tell which (if any) is the canonical direction — picking
one and building it risks throwing the work away if a different one is actually final;
second, every one of the four needs several custom illustrated mockups that don't exist
as exportable assets anywhere in the export set (an animated three-node pipeline
diagram, a code-editor/git-diff split panel, a "no forked logic" marketer/developer
comparison panel, and a branch/review/merge/deploy status strip) — these are screenshots
of finished compositions, not components we can extract and re-lay-out the way the rest
of the site's assets work.

**Answered by us, for now:** leave the current minimal page in place rather than
guessing at one of the four conflicting directions. It is internally consistent, reuses
already-approved copy and the site's existing header/footer/CTA components, and renders
correctly with no bugs at 393/640/1024/1440 (verified during this pass). Please tell us
which of the four designs — if any — is the current direction, and send the underlying
components/screenshots for the custom mockups (the pipeline diagram, all three
split-panel treatments, and the branch/review/merge/deploy strip) so a real rebuild has
something to extract instead of hand-redrawing screenshots.

---

## Pricing plans

These come from the new plan proposal rather than from the design file, so they're for
whoever owns pricing rather than for the designer — they're collected here so that every
open question lives in one place. The three plans on the page (Simple, Pro, Business) are
built from one shared rule: a year is charged as ten months, so two months come free.
Each plan stores only its monthly price, and the site works the yearly price out from it.

### Open questions — answered by us

1. **The yearly discount is now the same on every plan — is that what you want?** Under
   the ten-month rule every plan saves the same 16.7%, so the earlier concern about
   Business getting a smaller discount than Pro no longer applies: there is no longer a
   ladder to be uneven. Flagging it only because the original proposal deliberately gave
   Pro the largest discount to make it look like the best value for the money, and a
   single shared rate removes that lever. If you still want Pro to stand out on price
   rather than only on what's included, that needs a per-plan rate instead.

   **Answered by us:** Keep the shared 16.7% discount and the ten-month year.

### We built it this way — please confirm

2. **On the yearly option we show the price per month, noting that it's billed yearly** —
   so "$12.50 / month, billed annually" as the large number rather than "$150 / year".
   That keeps the two states of the switch directly comparable at a glance. Would you
   rather lead with the yearly total instead?

   **Answered by us:** The large figure is the per-month price. Never show "Billed
   annually — $X per year".

### Already resolved, no need to answer

- **Pro's yearly price is $150, and the per-month figure is $12.50.** The proposal listed
  $144 a year beside "$12.5 Month", and the two didn't agree. Denny settled it: a year is
  ten months' payment, so $15 a month makes $150 a year, which divides out to exactly
  $12.50. The $144 was the slip, not the $12.50 — the site had it the other way round
  until this was confirmed. The same rule moved Simple to $80 a year (from $84) and
  Business to $2,000 (from $2,220).
- **There is one shared discount rate, not a separate yearly price per plan.** Ten months
  charged per year, on every plan. The site stores the rule once and derives each yearly
  price from the monthly one, so the two can't drift apart — which is exactly how the
  $144-versus-$12.50 disagreement arose in the first place.
- **Plan features now distinguish what's included from what isn't.** Every line in a
  plan's feature list used to be drawn with a green tick, so a limitation like "no access
  control" read as though it were a feature. Lines that aren't included now show a muted
  dash instead, and a screen reader announces "not included" before the item.
- **The buttons on the pricing cards don't lead anywhere yet.** That isn't a pricing
  question — no destinations exist for any of the page's buttons yet, and it's tracked
  separately as issue #1.
- **The exact seat counts, overage pricing, and support-tier wording per plan are
  business figures, not Figma's.** The rest of this section documents the annual-vs-
  monthly price math (the ten-month year, the shared discount rate) but never itemized
  the seat/overage/support numbers Denny gave us, so here they are, confirmed and
  current as of this pass:
  - **Pro:** 15 seats included, $9 per additional seat, 25 seats max, "Priority
    support" (Figma's stale frame shows 10 seats, $7 per additional seat, 20 seats
    max, and a "Support" label instead).
  - **Business:** $12 per additional seat (Figma's stale frame shows $10 per seat).

  These, and every other plan figure, live in one place —
  `src/lib/content/pricing-plans.ts` — which is the single source of truth per
  "Pricing figures come from the business, not the design file" in `AGENTS.md`. A
  fidelity pass should read figures from that file, not from Figma or from this doc,
  and should not "correct" a mismatch between the two back toward Figma.

---

## Decisions made on the designer's behalf — summary

A pointer to every answered item from all three sections, so you don't have to scroll
through them in full. The complete wording for each lives at its actual entry; this list
gives only the topic, without repeating the wording (so we don't end up having to edit
the same thing in two places later).

1. Banner plays once, no loop (banner, question 10).
2. The frame shown under "reduce motion" (banner, question 11).
3. Screen-reader text (banner, question 12).
4. Compressed flags (banner, question 13).
5. "For developers / for editors" toggle shown at every width (layout, question 14).
6. Mobile menu content (layout, question 15).
7. The layout's empty gap isn't reproduced (layout, question 16).
8. Photographs on the S1 cards, not CSS gradients (layout, question 17; stale gradient
   swap).
9. Lime accent used for the keyboard focus outline (layout, question 18).
10. No dark theme on the marketing page; unused dark tokens stay (layout, question 19).
11. The yearly price shown as a per-month figure, with no "Billed annually" subtitle
    (pricing, question 2).
12. The `/how-it-works/` page keeps its current minimal build rather than guessing among
    four conflicting, unreachable-from-extraction Figma designs (How It Works page,
    "Answered by us, for now").

Separately, not a confirmation item but a fact: the site's main UI palette — grays plus
a lime accent color — comes from the landing page design and is used to color every
section. That is not the same thing as the gray-beige-and-amber palette inside the
banner's own Lottie animation — two different sets of colors, not one. The sand family
on the S3 bento cards is a third, real palette.

And one more fact, a technical constraint of the platform rather than a discretionary
choice: all of the landing page's text is present in the static HTML and visible without
JavaScript; entrance animations only get applied once the scripts have loaded — otherwise
the page would appear blank to search crawlers and to anyone whose script failed to run.
