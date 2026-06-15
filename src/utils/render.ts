import { PRESETS } from "../data/themes";

export const escAttr = (s: string | number) => String(s)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

/** Accept a preset name or a {cssVar:value} object; return the value map. */
export function resolveTheme(theme: string | Record<string, string> = "blueprint") {
  if (theme && typeof theme === "object") return theme;
  const t = PRESETS[theme as string];
  if (!t) throw new Error(`unknown theme "${theme}" (try: ${Object.keys(PRESETS).join(", ")})`);
  return t;
}

/** Themed, self-contained SVG from bundled province GeoJSON. */
export async function renderSVG({ theme = "blueprint" as string | Record<string, string> } = {}) {
  const { fetchNationalMap } = await import("./mapData");
  const mapData = await fetchNationalMap();
  const t = resolveTheme(theme);
  const sea = escAttr(t["--sea"]);
  const land = escAttr(t["--land"]);
  const strokeC = escAttr(t["--stroke"]);
  const strokeW = escAttr(t["--stroke-w"]);

  const paths = mapData.paths.map((loc) =>
    `<path id="${escAttr(loc.id)}" data-name="${escAttr(loc.title)}" d="${loc.d}" fill="${land}" stroke="${strokeC}" stroke-width="${strokeW}" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`
  ).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${mapData.viewBox}" preserveAspectRatio="xMidYMid meet">\n` +
    `<rect x="0" y="0" width="1000" height="369" fill="${sea}"/>\n` +
    `<g id="provinces">${paths}</g>\n</svg>\n`;
}
