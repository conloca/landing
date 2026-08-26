// One-off authoring helper: emits tokens/tokens.json in DTCG 2025.10 form.
// Kept out of the build; regenerate only when hand-editing the source lists below
// would be more error-prone than re-running it (hex -> sRGB component arrays).
import { writeFileSync, mkdirSync } from "node:fs";

const srgb = (hex, $description) => {
  const h = hex.replace("#", "");
  const components = [0, 2, 4].map((i) =>
    Number((Number.parseInt(h.slice(i, i + 2), 16) / 255).toFixed(4)),
  );
  return {
    $value: { colorSpace: "srgb", components, hex: hex.toLowerCase() },
    ...($description ? { $description } : {}),
  };
};

const oklch = (l, c, h, alpha, $description) => ({
  $value: {
    colorSpace: "oklch",
    components: [l, c, h],
    ...(alpha === undefined ? {} : { alpha }),
  },
  ...($description ? { $description } : {}),
});

const alias = ($value, $description) => ({
  $value,
  ...($description ? { $description } : {}),
});

const sand = {
  50: "#F8F8F5",
  100: "#F6F7F1",
  200: "#F5F6EF",
  300: "#F5F4EE",
  400: "#EAECDB",
  500: "#D6DBBD",
  600: "#D5DABC",
  700: "#9FAB70",
  800: "#4F5833",
  900: "#40472D",
  950: "#1C2013",
};
const lime = {
  50: "#F7FEE7",
  100: "#ECFCCA",
  300: "#BBF451",
  400: "#9AE600",
  500: "#7CCF00",
  600: "#5EA500",
  700: "#497D00",
};
const stone = {
  50: "#FAFAF9",
  100: "#F5F5F4",
  200: "#E7E5E4",
  400: "#A8A29E",
  500: "#78716C",
  700: "#44403C",
  800: "#292524",
  900: "#1C1917",
};
const cursor = {
  niko: "#F24835",
  mariam: "#A259FE",
  danny: "#FBBF24",
  kyle: "#00BFFF",
};

const group = (map, fn) =>
  Object.fromEntries(Object.entries(map).map(([k, v]) => [k, fn(v)]));

// The neutral ramp the semantic scheme resolves to, in oklch exactly as authored
// by shadcn. Kept in oklch rather than converted to sRGB so the generated CSS is
// byte-identical to what ships today.
const scheme = (m) => group(m, ([l, c, h, a]) => oklch(l, c, h, a));

const tokens = {
  $description:
    "Conloca landing design tokens. W3C DTCG format (2025.10). Source of truth for src/tokens.generated.css — see DESIGN.md.",
  color: {
    $type: "color",
    sand: {
      $description:
        "Warm off-white family from the Figma frame. Not a Tailwind default, so these are the tokens that must exist.",
      ...group(sand, (h) => srgb(h)),
    },
    lime: {
      $description:
        "Brand accent. Matches Tailwind lime exactly; listed for reference, not emitted (emitting would shadow Tailwind own scale).",
      ...group(lime, (h) => srgb(h)),
    },
    stone: {
      $description:
        "Neutrals. Matches Tailwind stone exactly; reference only, not emitted.",
      ...group(stone, (h) => srgb(h)),
    },
    cursor: {
      $description:
        "Collaborator identity colours used inside the product mockups.",
      ...group(cursor, (h) => srgb(h)),
    },
  },
  scheme: {
    $type: "color",
    $description:
      "Semantic surface/text roles. Two modes; each emits a CSS custom property consumed by Tailwind through @theme inline.",
    light: scheme({
      background: [1, 0, 0],
      foreground: [0.145, 0, 0],
      card: [1, 0, 0],
      "card-foreground": [0.145, 0, 0],
      popover: [1, 0, 0],
      "popover-foreground": [0.145, 0, 0],
      primary: [0.205, 0, 0],
      "primary-foreground": [0.985, 0, 0],
      secondary: [0.97, 0, 0],
      "secondary-foreground": [0.205, 0, 0],
      muted: [0.97, 0, 0],
      "muted-foreground": [0.556, 0, 0],
      accent: [0.97, 0, 0],
      "accent-foreground": [0.205, 0, 0],
      destructive: [0.577, 0.245, 27.325],
      border: [0.922, 0, 0],
      input: [0.922, 0, 0],
      ring: [0.708, 0, 0],
      "chart-1": [0.87, 0, 0],
      "chart-2": [0.556, 0, 0],
      "chart-3": [0.439, 0, 0],
      "chart-4": [0.371, 0, 0],
      "chart-5": [0.269, 0, 0],
      sidebar: [0.985, 0, 0],
      "sidebar-foreground": [0.145, 0, 0],
      "sidebar-primary": [0.205, 0, 0],
      "sidebar-primary-foreground": [0.985, 0, 0],
      "sidebar-accent": [0.97, 0, 0],
      "sidebar-accent-foreground": [0.205, 0, 0],
      "sidebar-border": [0.922, 0, 0],
      "sidebar-ring": [0.708, 0, 0],
    }),
    dark: scheme({
      background: [0.145, 0, 0],
      foreground: [0.985, 0, 0],
      card: [0.205, 0, 0],
      "card-foreground": [0.985, 0, 0],
      popover: [0.205, 0, 0],
      "popover-foreground": [0.985, 0, 0],
      primary: [0.922, 0, 0],
      "primary-foreground": [0.205, 0, 0],
      secondary: [0.269, 0, 0],
      "secondary-foreground": [0.985, 0, 0],
      muted: [0.269, 0, 0],
      "muted-foreground": [0.708, 0, 0],
      accent: [0.269, 0, 0],
      "accent-foreground": [0.985, 0, 0],
      destructive: [0.704, 0.191, 22.216],
      border: [1, 0, 0, 0.1],
      input: [1, 0, 0, 0.15],
      ring: [0.556, 0, 0],
      "chart-1": [0.87, 0, 0],
      "chart-2": [0.556, 0, 0],
      "chart-3": [0.439, 0, 0],
      "chart-4": [0.371, 0, 0],
      "chart-5": [0.269, 0, 0],
      sidebar: [0.205, 0, 0],
      "sidebar-foreground": [0.985, 0, 0],
      "sidebar-primary": [0.488, 0.243, 264.376],
      "sidebar-primary-foreground": [0.985, 0, 0],
      "sidebar-accent": [0.269, 0, 0],
      "sidebar-accent-foreground": [0.985, 0, 0],
      "sidebar-border": [1, 0, 0, 0.1],
      "sidebar-ring": [0.556, 0, 0],
    }),
  },
  font: {
    family: {
      $type: "fontFamily",
      sans: alias(
        ["Inter Variable", "ui-sans-serif", "system-ui", "sans-serif"],
        'Inter v4 exposes the Display cut through the opsz axis, so "Inter Display" in the design is this same family at a high optical size, not a second font.',
      ),
      mono: alias(
        ["Roboto Mono", "ui-monospace", "monospace"],
        "File names, code snippets, diffs, line numbers.",
      ),
    },
    weight: {
      $type: "fontWeight",
      regular: alias(400),
      medium: alias(500),
      bold: alias(700),
      black: alias(900),
    },
  },
  radius: {
    $type: "dimension",
    base: alias(
      { value: 0.625, unit: "rem" },
      "The single knob the shadcn radius scale derives from; sm/md/lg/xl/2xl/3xl/4xl are calc() expressions off this in src/index.css.",
    ),
  },
  layout: {
    $type: "dimension",
    $description:
      "Geometry read off the 1440 Figma frame. Reference values; the page expresses them through Tailwind utilities.",
    "content-max-width": alias({ value: 1376, unit: "px" }),
    "page-padding-x": alias({ value: 32, unit: "px" }),
  },
};

mkdirSync("tokens", { recursive: true });
writeFileSync("tokens/tokens.json", `${JSON.stringify(tokens, null, 2)}\n`);
console.log("wrote tokens/tokens.json");
