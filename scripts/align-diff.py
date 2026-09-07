"""Diff a live mobile capture against the Figma 393px frame, aligned at the card.

The Figma mobile frame renders iPhone chrome the page does not have (a 62px
status bar above a 66px header), so the reference hero begins at y=128 while
the live one begins below our own header. Rather than hardcode that offset —
which silently goes stale the moment the header's height changes — this scans
for the alignment that minimises difference, reports it, and diffs there. A
drifting offset is itself a signal: it means the header moved.

Usage: python3 scripts/align-diff.py <live.png> <reference.png> <diff-out.png>

Only the 393px breakpoint. The constants below are that frame's, and feeding
a capture from another width is rejected rather than silently cropped — a
wrong-breakpoint diff that still prints a number is worse than an error.
"""

import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

REF_CARD_TOP = 128
HERO_HEIGHT = 884
WIDTH = 393
MAX_OFFSET = 140

# The scan compares downscaled copies: a 1-in-6 sample of a 393x884 region is
# ~9.8k pixels, and doing that in a Python loop for each of 141 candidate
# offsets is ~1.4M interpreter iterations — seconds of CPU. Resizing once and
# differencing in Pillow's C path is the same statistic for a fraction of it.
SCALE = 6


def score(ref_small: Image.Image, live_small: Image.Image) -> float:
    return sum(ImageStat.Stat(ImageChops.difference(ref_small, live_small)).mean)


def fail(message: str) -> None:
    print(f"align-diff: {message}", file=sys.stderr)
    raise SystemExit(2)


def main() -> None:
    if len(sys.argv) != 4:
        fail("usage: align-diff.py <live.png> <reference.png> <diff-out.png>")

    shot, ref_path, out = sys.argv[1], sys.argv[2], sys.argv[3]
    live_full = Image.open(shot).convert("RGB")
    reference = Image.open(ref_path).convert("RGB")

    if live_full.width != WIDTH:
        fail(f"live capture is {live_full.width}px wide; this compares the {WIDTH}px frame")
    if reference.width != WIDTH:
        fail(f"reference is {reference.width}px wide; this compares the {WIDTH}px frame")
    if live_full.height < HERO_HEIGHT:
        fail(
            f"live capture is {live_full.height}px tall, shorter than the {HERO_HEIGHT}px "
            "hero — capture a taller viewport so the whole section is in frame"
        )
    if reference.height < REF_CARD_TOP + HERO_HEIGHT:
        fail(
            f"reference is {reference.height}px tall, shorter than the "
            f"{REF_CARD_TOP + HERO_HEIGHT}px this frame needs"
        )

    workdir = Path(out).parent
    workdir.mkdir(parents=True, exist_ok=True)

    ref = reference.crop((0, REF_CARD_TOP, WIDTH, REF_CARD_TOP + HERO_HEIGHT))
    small = (WIDTH // SCALE, HERO_HEIGHT // SCALE)
    ref_small = ref.resize(small, Image.BOX)

    limit = min(MAX_OFFSET, live_full.height - HERO_HEIGHT)
    best_offset = min(
        range(limit + 1),
        key=lambda offset: score(
            ref_small,
            live_full.crop((0, offset, WIDTH, offset + HERO_HEIGHT)).resize(small, Image.BOX),
        ),
    )
    print(f"aligned at live y={best_offset} (reference card top y={REF_CARD_TOP})")

    ref_crop = workdir / "ref-hero.png"
    live_crop = workdir / "live-hero.png"
    ref.save(ref_crop)
    live_full.crop((0, best_offset, WIDTH, best_offset + HERO_HEIGHT)).save(live_crop)
    subprocess.run(
        ["bun", "run", "visual-diff", str(ref_crop), str(live_crop), out],
        check=True,
    )


if __name__ == "__main__":
    main()
