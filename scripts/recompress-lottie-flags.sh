#!/usr/bin/env bash
# Recompresses the oversized flag PNGs inside public/banner-2.lottie in
# place, and compensates for it in the animation JSON so the flags render
# at the same on-screen size as before.
#
# Why compensation is required, not optional: each flag image is drawn by a
# layer with its own `ks.s` (scale) transform, individually calibrated so
# that five very differently-sized source PNGs (250x150 up to 1200x600) all
# render at roughly the same final size — e.g. the 1200x600 UK flag has
# ks.s = 4.53%, the 250x150 Germany flag has ks.s = 18.12%, and
# 4.53% * 1200 ~= 18.12% * 250. The renderer scales the LOADED BITMAP's
# actual pixel size by that transform, not some declared metadata value —
# so shrinking the PNG's pixel dimensions without inversely growing the
# layer's scale renders the flag ~19x too small (for the UK flag: 64px at
# the original 4.53% is ~2.9px instead of the intended ~54px). This exact
# mistake shipped once already in this repo's history and was only caught
# by an AI reviewer doing the transform-chain math by hand, not by looking
# at a screenshot — screenshot tooling was unavailable when this script was
# written. Re-verify visually the next time this runs somewhere screenshots
# work, and do not remove the compensation step because "it looks fine
# without it" — a five-times-too-small flag inside a 22px circle is exactly
# the kind of regression that doesn't jump out in a quick look.
#
# The supplied export renders five country flags (largest: 1200x600) into
# ~22px circular avatars — they account for 137 KB of the file's 142 KB.
# Downsizing the PNG pixels to a 64px max dimension (still ~3x the rendered
# size, for retina) while compensating the layer scale drops the whole
# banner from 145 KB to ~42 KB with the same on-screen result. See
# docs/QUESTIONS-DESIGNER.md, animation section.
#
# Not wired into `bun run build`: this is a one-off transform of a supplied
# design asset, not a generated artifact. Re-run this manually whenever the
# designer re-exports the .lottie (the doc asks them to, for unrelated
# defects), so the recompression isn't silently lost.
#
# Usage: scripts/recompress-lottie-flags.sh [path-to-source.lottie]
# Defaults to public/banner-2.lottie in place; pass a path to recompress a
# fresh export before copying it into public/.

set -euo pipefail

TARGET="${1:-$(dirname "$0")/../public/banner-2.lottie}"
TARGET="$(cd "$(dirname "$TARGET")" && pwd)/$(basename "$TARGET")"

if [ ! -f "$TARGET" ]; then
  echo "error: $TARGET not found" >&2
  exit 1
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

cd "$WORK"
unzip -q "$TARGET"

if [ ! -d i ]; then
  echo "error: no i/ (image assets) directory inside the archive — nothing to recompress" >&2
  exit 1
fi

before=$(du -sk i | cut -f1)

# Capture original pixel dimensions BEFORE resizing — the JSON surgery below
# needs both the before and after size of every image to compute how much
# to inversely grow each referencing layer's scale.
python3 - "$WORK" <<'PYEOF' > "$WORK/orig-dims.json"
import json, os, struct, sys

work = sys.argv[1]
img_dir = os.path.join(work, "i")
dims = {}
for name in os.listdir(img_dir):
    if not name.endswith(".png"):
        continue
    with open(os.path.join(img_dir, name), "rb") as fh:
        data = fh.read(33)
    w, h = struct.unpack(">II", data[16:24])
    dims[name] = [w, h]
json.dump(dims, sys.stdout)
PYEOF

shopt -s nullglob
PNGS=(i/*.png)
shopt -u nullglob
if [ "${#PNGS[@]}" -eq 0 ]; then
  echo "error: i/ contains no .png files — this script only handles PNG image assets; a re-export using another image format needs a different transform, not silent no-op success" >&2
  exit 1
fi
if ! command -v sips >/dev/null 2>&1; then
  echo "error: sips not found — this script only runs on macOS" >&2
  exit 1
fi
for f in "${PNGS[@]}"; do
  sips -Z 64 "$f" >/dev/null
done
after=$(du -sk i | cut -f1)

# For every image asset that shrank: sync the asset's declared w/h to match
# the new PNG (keeps the manifest internally consistent even though the
# renderer doesn't appear to use it for scaling — see header comment), and
# multiply the scale (`ks.s`) of every layer that references it by
# original/new, in every "layers" array in the document (root layers and
# every precomp asset's layers — a referencing layer can live in either).
python3 - "$WORK" <<'PYEOF'
import json, os, struct, sys

work = sys.argv[1]
img_dir = os.path.join(work, "i")

with open(os.path.join(work, "orig-dims.json"), encoding="utf-8") as fh:
    orig_dims = json.load(fh)

def png_dims(path):
    with open(path, "rb") as fh:
        data = fh.read(33)
    w, h = struct.unpack(">II", data[16:24])
    return w, h

def scale_pair(pair, fx, fy):
    return [pair[0] * fx, pair[1] * fy] + list(pair[2:])

def scale_layer(layer, fx, fy):
    """Returns True if a scale value was actually rewritten."""
    s = layer.get("ks", {}).get("s")
    if s is None:
        return False
    if s.get("a") == 0:
        k = s.get("k")
        if isinstance(k, list) and len(k) >= 2 and all(isinstance(v, (int, float)) for v in k[:2]):
            s["k"] = scale_pair(k, fx, fy)
            return True
        return False
    touched = False
    for keyframe in s.get("k", []):
        for key in ("s", "e"):  # both the start AND end value of every
            # segment need compensating, or an animated scale interpolates
            # from a correct start toward an uncompensated end (or vice
            # versa) and the flag visibly snaps size mid-animation.
            v = keyframe.get(key)
            if isinstance(v, list) and len(v) >= 2:
                keyframe[key] = scale_pair(v, fx, fy)
                touched = True
    return touched

# Ground truth for the safety check below: which files ON DISK actually
# shrank, independent of whether any JSON asset entry ever claims them.
# Keying the check off "assets we matched in the JSON" (an earlier version
# of this script did exactly that) makes it structurally blind to a
# resized-but-unmatched file — a renamed path, a subpath in `p`, anything
# that fails the `fname in orig_dims` / `isfile` checks below — since a
# file that's never matched can't be evaluated for compensation at all,
# and the JSON is still written out with valid-looking (but geometrically
# wrong) scale values elsewhere. Starting from disk truth and shrinking a
# `claimed` set as files are actually matched-and-compensated is the only
# way an unmatched file has somewhere to show up as still-unclaimed.
resized_on_disk = set()
for fname, (orig_w, orig_h) in orig_dims.items():
    png_path = os.path.join(img_dir, fname)
    if os.path.isfile(png_path) and png_dims(png_path) != (orig_w, orig_h):
        resized_on_disk.add(fname)
claimed = set()

updated_files = 0
for root, _dirs, files in os.walk(os.path.join(work, "a")):
    for name in files:
        if not name.endswith(".json"):
            continue
        path = os.path.join(root, name)
        with open(path, "r", encoding="utf-8") as fh:
            doc = json.load(fh)
        changed = False

        # id -> (factor_x, factor_y, compensated_layer_count). Two separate
        # factors, not one: `sips -Z` rounds each dimension independently
        # when scaling to a max size, so a flag's width and height ratios
        # differ slightly (e.g. 800x534 -> 64x42 is 12.500x vs 12.714x) —
        # applying one factor to both axes leaves a small but real vertical
        # squash.
        image_factors = {}
        for asset in doc.get("assets", []):
            if "u" not in asset or "p" not in asset:
                continue
            fname = asset["p"]
            if fname not in orig_dims:
                continue
            png_path = os.path.join(img_dir, fname)
            if not os.path.isfile(png_path):
                continue
            new_w, new_h = png_dims(png_path)
            orig_w, orig_h = orig_dims[fname]
            if (orig_w, orig_h) == (new_w, new_h):
                continue
            image_factors[asset["id"]] = [orig_w / new_w, orig_h / new_h, 0, fname]
            asset["w"] = new_w
            asset["h"] = new_h
            changed = True

        if image_factors:
            layer_lists = [doc.get("layers", [])]
            for asset in doc.get("assets", []):
                if "layers" in asset:
                    layer_lists.append(asset["layers"])
            for layers in layer_lists:
                for layer in layers:
                    entry = image_factors.get(layer.get("refId"))
                    if entry is not None and scale_layer(layer, entry[0], entry[1]):
                        entry[2] += 1
                        changed = True

        if changed:
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(doc, fh, separators=(",", ":"))
            updated_files += 1

        for _fx, _fy, count, fname in image_factors.values():
            if count > 0:
                claimed.add(fname)

# This check is the entire point of the script existing: a resized image
# that never got a compensated referencing layer will render at the wrong
# size. See the file header for the regression this already caused once,
# caught only by hand math, not by this check (which didn't exist yet).
unclaimed = resized_on_disk - claimed
if unclaimed:
    print(
        "error: resized image(s) with NO compensated referencing layer — "
        f"would ship at the wrong on-screen size: {sorted(unclaimed)}",
        file=sys.stderr,
    )
    sys.exit(1)

print(f"compensated layer scale for resized images across {updated_files} animation file(s)")
PYEOF

OUT="$WORK/recompressed.lottie"
rm -f "$OUT"
# Repack every top-level entry the archive actually contains — not a fixed
# allowlist — so a future export with an extra directory (fonts, a state
# machine, a theme) survives the round-trip instead of being silently
# dropped. -D: no directory entries, matching the original export's layout.
ENTRIES=()
for entry in *; do
  [ "$entry" = "orig-dims.json" ] && continue
  ENTRIES+=("$entry")
done
zip -q -X -D -r "$OUT" "${ENTRIES[@]}"

cp "$OUT" "$TARGET"
echo "recompressed flags: ${before}K -> ${after}K inside i/, final archive: $(du -k "$TARGET" | cut -f1)K"
