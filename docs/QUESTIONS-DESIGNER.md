# Questions for the designer

This tracks every place where the design file or the supplied assets don't give a single
correct answer. Questions are split into three groups:

- **Open questions** — only the designer actually knows the answer: missing content,
  missing assets, or a question of original creative intent. These can't be skipped.
- **We built it this way — please confirm** — places with no single right answer, where
  we made a call ourselves rather than stop the build. The decision is already live on
  the site; the question is "is this what you meant, or should we change it?" A yes/no
  answer is enough.
- **Already resolved, no need to answer** — plain facts: things the design already made
  clear, or an unambiguous typo, with no real fork in the decision.

You can answer directly in this file — one line under each question.

---

## Localization banner animation

This is about `Banner 2 animation.lottie` — an animated panel showing the product's
language-management screen (header "Locales", rows for English / Deutsch / Français /
Español / 日本語, a "2 locales update needed" line at the bottom, and a colleague's
cursor labeled "Kyle" at the top).

### Open questions

1. The name "Banner 2" implies a series. Is there a "Banner 1" and others that will also
   go on the landing page? If so, please send them all at once so we don't have to rework
   the layout for each one separately.

2. The clip runs exactly two seconds, but the actual motion takes only 0.62 seconds: the
   first 0.6 seconds hold still, and so do the last 0.78 seconds. Is that opening pause
   an intentional "breath" before the action, or a side effect of the export that can be
   trimmed next time?

3. The "+ Button" at the bottom of the panel is visible for exactly one frame out of a
   hundred and twenty, then disappears entirely. Is that an export mistake, or intended?

4. That same button is literally labeled "Button". Is that placeholder text? What should
   the real label say?

5. The Spanish row is labeled "Español (en)", even though the language code for Spanish
   is `es`. Is that a typo?

6. Pure red (`#FF0000`) shows up five times in the fills, invisible anywhere in the
   frame. It looks like a forgotten guide or a marker layer. Can it be cleaned up in the
   next export?

7. The colleague's cursor in blue (`#00BFFF`) and the "Up to date" status dot in lime
   (`#C3F13C`) fall outside the clip's gray-beige-and-amber palette. Are these
   intentional accents? If so, what are they called in your system, so we can add them
   as real design tokens instead of one-off values in the code? For now we're using
   these exact values with no name attached.

8. All the text inside the animation has been converted to vector outlines — there are
   zero real text layers in the file. For a product about translating interfaces, that
   means the banner itself can't be translated into another language without
   re-exporting it from Figma. Is the landing page English-only for now, or will there
   be localized versions?

9. Is the cursor labeled "Kyle" advertising real-time collaboration on translations as
   an actual product feature, or is it just decoration? The answer decides whether we
   need supporting copy near the banner to back up that claim.

### We built it this way — please confirm

10. **The clip physically doesn't loop** — its last frame doesn't match its first (the
    card column in the background ends up 224 pixels higher than it started and never
    comes back, and the highlighting on the Français and Deutsch rows swaps). Here's what
    we did: the banner plays once when it scrolls into view and freezes on its final
    frame — which matches the clip's own intent, since it's built to settle on "2 locales
    update needed". Keep it that way, or do you need a real repeat — in which case we'd
    need either a re-export that returns to its starting state, or a several-second pause
    between plays?

11. **With the system's "reduce motion" setting turned on**, we chose to immediately show
    the same final frame that a normal playthrough ends on — not the first frame, and not
    the animation in motion. Does that work?

12. **Screen-reader label.** The panel is essentially a screenshot of the product's
    interface, so the image alone means nothing to a blind user. We wrote a short
    description of what it shows: "Locales panel showing sync status across five
    languages". Does that wording work, or would you rather have something else?

13. **We shrank the five flags inside the banner** to 64×64 pixels (they were as large as
    1200×600 for a visible size of about 22 pixels) — the clip's weight dropped from
    145 KB to 42 KB with no visible difference. Leave it as is, or will you send a
    re-export with properly small flags to begin with?

---

## Landing page layout

Now that we have access to the design file, here are the questions about Conloca's main
page (the product keeps a site's content directly in the customer's Git repository;
developers edit it in their IDE, non-technical editors use a visual interface, and both
write to the same files). The file shows the developer-facing variant at four screen
widths — 1440, 1024, 640, and 393 pixels.

### Open questions

1. Judging by the toggle in the hero section's header, the product has two entry points
   — one for developers, one for non-technical content editors. The editor screen exists
   in the file, but only at one width, without the other three. Is that needed in this
   same landing-page release, or are we shipping only the developer version for now?

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

3. The landing page footer currently has only the logo, four links, and a "Get Started"
   button — no privacy policy or terms of service links, no copyright, no social links.
   Is that the final footer, or is more coming?

4. Next to the text in the hero section there's a three-bar indicator — a clear hint at a
   three-slide carousel — but copy exists for only one of the three. Will you send text
   for the other two, or should there actually be fewer bars? For now the indicator is
   shown static, with no invented text for slides that don't exist.

5. There's a play button over the video preview in the hero section, but what happens
   after clicking it isn't specified in the design, and we weren't given the actual
   video. Is that an inline video embedded in the page, a link to an external service
   like YouTube, or does it open in a separate overlay window? For now the button is
   decorative and doesn't go anywhere.

6. Below the three pricing cards there's a "Compare plans" button with no indication of
   where it leads. Does it open a separate plan-comparison page, expand a table in
   place, or something else?

7. At a screen width of 1024 pixels, the video in the hero section is deliberately
   cropped off the right edge of the screen instead of shrinking along with everything
   else. This doesn't apply yet, since we don't have the actual video and built that
   block as a static reconstruction of the product's interface. The question matters
   once a real video exists: is that frame crop at this width intentional, or is the
   design at this width simply unfinished?

8. In the "Full version history" feature card, the body copy actually describes reusable
   content blocks, not version history — "Build a block once, reuse it across every
   page". The neighboring "Reusable fragments" card correctly describes itself, so this
   isn't a clean swap of two labels — it looks like the design file just has the wrong
   text under that one heading. Can you send the copy that should actually describe
   version history?

9. The product seems to have a separate brand palette — eleven warm, sandy-olive tones —
   for the feature-card block and some of the illustrations inside it. None of them are
   part of the site's main palette (grays and a lime accent color). Is that a deliberate,
   separate palette for this section? If so, what is it called in your system, so we can
   set it up as a proper set of colors? For now these cards use the site's main
   gray-and-lime palette, without the sandy tones — if a separate palette is needed,
   we'll add it in a follow-up pass once we know the real color names.

10. About that same "Kyle" colleague cursor, which appears in this layout with the same
    blue color `#00BFFF` — is that a brand color specifically identifying this person, or
    can we use any free shade from the site's palette? Same question as in the banner
    section above (banner, open question 7) — both places in the layout and the banner
    use the exact same color, so this only needs answering once.

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

12. There's no color anywhere in the design for an error state — the message that appears
    under a form field when something has been filled in wrong, and anything like it. The
    only red in the whole file (`#fe3434`) is content inside the version-comparison
    mockup: a deleted line of code, not an interface color. We deliberately didn't reuse
    it, because against a white background it's too faint to read comfortably — its
    measured contrast is 3.65 to 1, where the accessibility standard asks for at least
    4.5 to 1 for regular text. Nothing on the page needs an error color today, but the
    first form we add — a signup, a contact form — will. What should that color be?

13. Your design file has a page called "Colors", which almost certainly holds your own
    names for the palette. We weren't able to read it: the design service kept refusing
    our requests, and the separate route for reading design variables needs a permission
    our access token doesn't currently have. So the color *values* we're using are right
    — we counted them directly in the design file — but the *names* we gave them are our
    own invention. Could you either send us your names for these colors, or confirm ours
    are fine to keep? We may be able to fix the permission on our side by reissuing the
    token, so this one may resolve without you.

### We built it this way — please confirm

14. **The "for developers / for editors" toggle disappears entirely below a 640-pixel
    screen width in the design.** We did it differently — showing it at every screen
    width, since a working control that disappears on mobile looks more like an
    oversight than a deliberate choice. Keep it that way, or does it genuinely need to
    be hidden on mobile?

15. **There's no content at all for the mobile hamburger menu, at any width, in the
    design.** We built a standard dropdown menu with the same links as the desktop
    header — an ordinary engineering default for this pattern, not your actual design.
    Is that look acceptable, or will you send a dedicated screen showing the menu open?

16. **There was about 270 pixels of empty space in the design**, between the "Built for
    Astro" badge and the carousel text in the hero section. Our build doesn't reproduce
    that large a gap — we used normal spacing instead. If that space was meant as
    breathing room for future content, it's moot in our version; if a specific element
    was meant to go there, let us know what's missing.

17. **The background of the three large feature-block cards in the design is heavy,
    blurred photographs spanning the card's full width.** We replaced them with a CSS
    gradient plus noise — visually similar effect, with almost none of the loading
    weight. Does that swap work, or are the photographs important to keep?

18. **When someone moves through the page with the keyboard instead of a mouse**, the
    button or field they're currently on needs a visible outline so they can see where
    they are. The design doesn't show that state anywhere. We used the lime accent color
    (`#9AE600`) for that outline. Does that work, or should it be a different color?

19. **The design has no dark version of the page.** We built one anyway, taking its
    colors from the dark product panel in the hero section. It's currently switched off
    — nothing on the live site uses it, so dropping it costs nothing. Do you want a dark
    theme at all? And if you do, is borrowing the hero panel's colors a reasonable
    starting point?

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

## Pricing plans

These come from the new plan proposal rather than from the design file, so they're for
whoever owns pricing rather than for the designer — they're collected here so that every
open question lives in one place. The three plans on the page (Simple, Pro, Business) are
built from one shared rule: a year is charged as ten months, so two months come free.
Each plan stores only its monthly price, and the site works the yearly price out from it.

### Open questions

1. **The yearly discount is now the same on every plan — is that what you want?** Under
   the ten-month rule every plan saves the same 16.7%, so the earlier concern about
   Business getting a smaller discount than Pro no longer applies: there is no longer a
   ladder to be uneven. Flagging it only because the original proposal deliberately gave
   Pro the largest discount to make it look like the best value for the money, and a
   single shared rate removes that lever. If you still want Pro to stand out on price
   rather than only on what's included, that needs a per-plan rate instead.

### We built it this way — please confirm

2. **On the yearly option we show the price per month, noting that it's billed yearly** —
   so "$12.50 / month, billed annually" as the large number rather than "$150 / year".
   That keeps the two states of the switch directly comparable at a glance. Would you
   rather lead with the yearly total instead?

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

---

## Decisions made on the designer's behalf — summary

A pointer to every "we built it this way — please confirm" item from all three sections,
so you don't have to scroll through them in full. The complete wording for each lives at
its actual entry; this list gives only the topic, without repeating the wording (so we
don't end up having to edit the same thing in two places later).

1. Banner plays once, no loop (banner, question 10).
2. The frame shown under "reduce motion" (banner, question 11).
3. Screen-reader text (banner, question 12).
4. Compressed flags (banner, question 13).
5. "For developers / for editors" toggle shown at every width (layout, question 14).
6. Mobile menu content (layout, question 15).
7. The layout's empty gap isn't reproduced (layout, question 16).
8. CSS gradient instead of photos behind the cards (layout, question 17).
9. Lime accent used for the keyboard focus outline (layout, question 18).
10. A dark theme built but switched off (layout, question 19).
11. The yearly price shown as a per-month figure (pricing, question 2).

Separately, not a confirmation item but a fact: the site's main UI palette — grays plus
a lime accent color — comes from the landing page design and is used to color every
section. That is not the same thing as the gray-beige-and-amber palette inside the
banner's own Lottie animation — two different sets of colors, not one.

And one more fact, a technical constraint of the platform rather than a discretionary
choice: all of the landing page's text is present in the static HTML and visible without
JavaScript; entrance animations only get applied once the scripts have loaded — otherwise
the page would appear blank to search crawlers and to anyone whose script failed to run.
