# Questions for the designer

This is where every spot accumulates where the mockup or the assets don't give an
unambiguous answer, forcing development to either guess or make a design decision
itself. This file is living: it grows as the landing page gets built, so it's worth
revisiting rather than treating it as closed after one pass.

You can answer directly in this file — one line under each question. Every question is
phrased so that one sentence is enough to answer it.

---

## Banner animation

This is about the file `Banner 2 animation.lottie` — an animated panel showing the
product's language-management UI (title "Locales", rows English / Deutsch / Français /
Español / 日本語, a caption at the bottom reading "2 locales need updates", a colleague's
cursor labeled "Kyle" at the top). Below is everything we worked out about it by
inspecting the file, and what we couldn't resolve without you.

### Where the banner lives on the page

1. The animation canvas is 849 by 1334 pixels — a **vertical rectangle**, not a wide
   strip. Is this a side image inside a section, the mobile first screen, or something
   else entirely?

2. What's the banner's maximum width on a large screen? Should it fit entirely within
   the window's height, or is it fine for it to extend past the bottom edge on scroll?

3. What happens with it on a phone? At a 375px screen width, this aspect ratio gives a
   height of about 590 pixels — almost the whole screen taken up by one image. Do we
   shrink it, crop it at the edges, or do you have a separate mobile variant?

4. The name "Banner 2" hints at a series. Is there a "Banner 1" and others that are
   also going on the landing page? If so, please send all of them at once so we don't
   have to rework the layout for each one separately.

### Playback and looping

5. The animation **does not loop**: the last frame doesn't match the first. The column
   of cards in the background shifts 224 pixels upward over the course of the clip and
   never returns, and the highlighting on the Français and Deutsch rows swaps places.
   If it's set to repeat, the viewer will see a jarring jump-cut.
   **Our recommendation:** play it once when the banner enters the visible part of the
   screen, then freeze on the final frame — this matches the clip's own intent, since it
   deliberately settles on the "2 locales need updates" caption. Do you agree?

6. If a repeat is needed after all — will you re-export the clip so it returns to its
   starting state, or should we insert a three-to-four-second pause between plays?

7. The clip runs exactly two seconds, but the motion only occupies 0.62 seconds of
   that: the first 0.6 seconds the frame is static, and so are the last 0.78 seconds.
   Is the starting pause meant as a "breath" before the action, or is it a side effect
   of the export that can be trimmed?

8. Should playback start the moment the banner enters the viewport, or immediately when
   the page loads, even if the user hasn't scrolled down to it yet?

### Accessibility and low-powered devices

9. What should we show people who have "reduce motion" enabled in their system
   settings? **Our recommendation:** show the final frame immediately, with no motion.
   Does that work?

10. The panel in the banner is essentially a screenshot of the product's interface.
    Does it need an accompanying text caption, and what should a screen-reader user
    hear instead of the image?

### Defects found inside the file

11. The "+ Button" at the bottom of the panel is visible for **exactly one frame out of
    one hundred twenty** and then disappears entirely. Is this an export error or is it
    intentional?

12. That same button is literally labeled "Button". Is that placeholder text? What
    should the actual label be?

13. The Spanish-language row is labeled "Español (en)", even though Spanish's language
    code is `es`. Is that a typo?

14. The fills contain pure red `#FF0000` five times, and it's not visible anywhere in
    the frame. It looks like a forgotten guide or an internal marker. Can it be cleaned
    up on the next export?

### Colors

15. Almost the entire palette of the clip falls within grey-beige and amber tones, but
    two colors stand out: the colleague's cursor in light blue `#00BFFF` and the
    "Up to date" status dot in lime green `#C3F13C`. Are these deliberate accents or
    arbitrarily chosen values? If deliberate — what are they called in your palette, so
    we can register them as proper system colors instead of one-off numbers in the
    code.

### Text and file weight

16. All the text inside the animation has been converted to vector outlines — there are
    zero text layers in the file. For a product about translating interfaces, that
    means the banner itself can't be translated into another language without
    re-exporting from Figma. Is the landing page planned to be English-only, or will
    there be localized versions?

17. Five flags inside the clip are embedded as huge images — the British flag, for
    example, is 1200 by 600 pixels — but they're drawn as circles roughly 22 pixels
    across. Because of this, 137 of the file's 142 kilobytes are spent on the flags. Can
    we compress them down to 64 by 64? There would be no visible difference, and the
    weight would drop roughly fivefold. Or will you send a re-export with reasonable
    sizes?

18. Is the cursor labeled "Kyle" advertising real-time collaborative translation as an
    existing product feature, or is it just decorative flourish? The answer determines
    whether we need to back up that promise with text next to the banner.

---

## Landing page mockup

We now have access to the mockup — below are the questions about Conloca's main page
itself (the product stores the site's content directly in the client's Git repository;
developers edit it in an IDE, non-technical editors use a visual interface, and both
write to the same files). The developer variant is drawn at four screen widths — 1440,
1024, 640, and 393 pixels. The questions below are what the static screens don't
explain on their own.

### What's missing from the mockup

1. Judging by the switcher in the hero section's header, the product has two entry
   points — for developers and for non-technical content editors. The editors' screen
   exists in the file, but it's only drawn at one width, not the other three. Is it
   needed in this same landing-page release, or are we only building the developer
   version for now?

2. In the "Single source of truth" feature card, one of the blocks is a placeholder the
   size of an entire second animation — a JSON-schema editor next to a visual page
   builder — but we weren't given the actual file for that animation. Same question for
   all the other mockup images inside the cards (the Git version-comparison panel, the
   publishing scheduler, the branch diagram, and the rest): which of these will be a
   separate Lottie clip like the banner we already have, which will be a static image,
   and which should be built as a real, working HTML interface?

3. On narrow screens, the header collapses into a hamburger button, but the dropdown
   menu's contents aren't drawn at any width. Can you send a separate screen showing
   the open mobile menu?

4. The landing page's footer currently only has the logo, four links, and a "Get
   Started" button — no privacy policy or terms-of-use links, no copyright notice, no
   social links. Is this the final footer, or will you still be adding to it?

### Switches, states, and behavior that a static screen doesn't show

5. The "for developers / for editors" switcher in the hero section's header disappears
   at screen widths below 1024 pixels (it used to be below 640 — the range widened when
   the mobile hero was rebuilt in #86, but the question wasn't discussed or resolved as
   part of that task). The question remains open: is it a deliberate decision to only
   show the developer version on phone and tablet, or has the switcher simply not been
   carried over to those screens yet?

6. Next to the text in the hero section there's a three-bar indicator — a clear hint at
   a three-slide carousel — but text has only been written for one of them. Will you
   send text for the other two, or should there actually be fewer bars?

7. There's a play button on top of the video preview in the hero section, but what
   happens after it's clicked isn't drawn anywhere. Is it a video embedded directly in
   the page, a link to an external service like YouTube, or does it open a separate
   overlay window?

8. Below the three pricing cards there's a "Compare plans" button with no indication of
   where it leads. Does it open a separate plan-comparison page, expand a table in
   place, or something else?

9. At a 1024px screen width, the video in the hero section deliberately extends past
   the right edge of the screen instead of shrinking along with the rest of the
   content. Is this frame-cropping at this width a deliberate technique, or is the
   mockup at this width not yet finished?

### Typos and text inconsistencies in the mockup itself

10. Two feature-block cards have typos in their text: "Sceduled Publishing" instead of
    "Scheduled Publishing", and "Makrdown" instead of "Markdown". Do we carry the text
    into the build exactly as it is in the mockup, or are these mistakes that should be
    corrected along the way?

11. Two neighboring cards in the same block appear to have their text swapped: the
    "Reusable fragments" card (about reusable content fragments) describes version
    history, while the "Full version history" card describes reusable fragments. Should
    the labels be swapped?

12. There's about 270 pixels of empty space with no element in it between the "Built
    for Astro" badge and the carousel text in the hero section. Is this deliberate
    breathing room for future content, or should something else be there?

### Typography and color

13. The same visual text style (bold, 16 pixels) is labeled in different places in the
    mockup as either the "Inter" font or its separately named "Inter Variable" weight —
    effectively the same typeface under two different names. Is this a deliberate
    distinction, or should the same font be used everywhere?

14. The colleague cursor labeled "Kyle" in the localization banner we already received
    is drawn in `#00BFFF` — the standard web color "deepskyblue" — rather than one of
    the site's other palette colors. Is this a brand color specifically representing
    this person, or can any free shade from the site's palette be used?

15. The feature-block cards and some of the illustrations inside them are colored in a
    warm sandy-olive tone — eleven different values, none of which belong to the site's
    main palette (grey shades and the lime accent color). What is this color range
    called in your system, so we can register it as a proper set of system colors
    rather than one-off numbers in the layout code?

16. In the section headed "Everything you need, nothing you don't", four small elements
    float around the text — status badges, Git and Astro icons — each rotated a few
    degrees. Should they move on page scroll (a parallax effect), or is this a static
    decoration?

17. The feature block's three large cards use full-width blurred photographs as
    backgrounds — heavy files to load on the landing page. **Our recommendation:**
    replace them with a CSS gradient plus light noise, which visually gives a similar
    effect at almost no weight. Would that substitution work, or are the photographs
    non-negotiable for you?

---

## Open decisions made on the designer's behalf

To avoid stalling the build, we made the call ourselves on a few points. Each one is
easy to reverse — but better to reverse it now than to discover it on the finished
page.

1. **The banner plays once** when it enters the viewport and stays on its final frame.
   Reason: the clip physically can't loop without a jump-cut (see question 5).

2. **When the system's "reduce motion" setting is enabled**, animations don't play at
   all — the final frame is shown immediately instead of the banner.

3. **The palette was taken from the animation itself** — grey-beige and amber tones —
   and set up as a set of color tokens. Once the mockup is available, the palette will
   be checked against it, and any discrepancies will be listed here separately.

4. **All of the landing page's text is present in the static HTML and visible without
   JavaScript.** Entrance animations only attach once the scripts have loaded. That
   means a section designed to "slide in" is already in its final position at the very
   first paint — otherwise the page would be blank for search-engine crawlers and for
   users whose scripts failed to load.

5. **We plan to compress the flags inside the banner** down to a reasonable size (see
   question 17). Until we get an answer, we're working with the original file as is.
