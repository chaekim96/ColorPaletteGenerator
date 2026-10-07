// Turn color samples read from a live website into a small palette in our slot order.
// Used by scripts/scan-palettes.ts; kept pure so it can be unit-tested.
import { differenceEuclidean, formatHex, parse } from 'culori';
import { contrast } from './roles';
import { hexToOklch } from './palette';

export interface Sample {
  color: string; // any CSS color string, e.g. 'rgb(10, 20, 30)' or 'oklch(...)'
  weight: number; // pixel area for fills, characters x font size for text
  kind: 'bg' | 'text' | 'cta'; // cta = buttons and links
}

export interface ExtractedPalette {
  colors: string[]; // dark, primary, accents..., light (3-5 colors)
  mode: 'light' | 'dark'; // whether the site's page background is light or dark
}

const distance = differenceEuclidean('oklab');
const SAME_COLOR = 0.035; // OKLab distance below which two samples count as one color
const DISTINCT = 0.08; // accents must differ at least this much from colors already chosen
const CHROMATIC = 0.05; // OKLCH chroma above which a color counts as a brand color, not a neutral
const MIN_BRAND_L = 0.25; // darker than this reads as "another black", not an accent
// Browser default link colors come from unstyled (often hidden) links, not the brand
const BROWSER_DEFAULTS = new Set(['#0000ee', '#551a8b', '#ee0000']);

interface Cluster { hex: string; bg: number; text: number; cta: number }

/** Normalize a CSS color to #rrggbb, dropping transparent and translucent ones. */
export function opaqueHex(css: string): string | null {
  const parsed = parse(css);
  if (!parsed || (parsed.alpha ?? 1) < 0.9) return null;
  return formatHex(parsed);
}

/**
 * Drop middle colors that add nothing: near-copies of the dark or light end (brand tints must
 * differ a little, neutrals a lot, e.g. #040404 next to black or #dddddd next to white).
 */
export function tidyColors(colors: string[]): string[] {
  if (colors.length < 3) return colors;
  const [dark, light] = [colors[0], colors[colors.length - 1]];
  const middle = colors.slice(1, -1).filter(hex => {
    const minGap = hexToOklch(hex).c < 0.03 ? 0.15 : 0.06;
    return distance(hex, dark) >= minGap && distance(hex, light) >= minGap;
  });
  return [dark, ...middle, light];
}

export function buildPalette(samples: Sample[]): ExtractedPalette | null {
  const clusters: Cluster[] = [];
  for (const s of [...samples].sort((a, b) => b.weight - a.weight)) {
    const hex = opaqueHex(s.color);
    if (!hex || s.weight <= 0 || BROWSER_DEFAULTS.has(hex)) continue;
    let cluster = clusters.find(c => distance(c.hex, hex) < SAME_COLOR);
    if (!cluster) clusters.push((cluster = { hex, bg: 0, text: 0, cta: 0 }));
    cluster[s.kind] += s.weight;
  }
  if (clusters.length < 2) return null;

  const totals = { bg: 0, text: 0, cta: 0 };
  clusters.forEach(c => { totals.bg += c.bg; totals.text += c.text; totals.cta += c.cta; });
  const share = (c: Cluster, kind: keyof typeof totals) => (totals[kind] ? c[kind] / totals[kind] : 0);

  const background = [...clusters].sort((a, b) => b.bg - a.bg)[0];
  // Main text: among colors used substantially for text, the most readable one (headings and body
  // usually beat the gray secondary text, even when there is more of the gray)
  const others = clusters.filter(c => c !== background);
  const maxText = Math.max(0, ...others.map(c => c.text));
  const textual = others.filter(c => c.text >= maxText * 0.15 && c.text > 0);
  const text = (textual.length ? textual : others)
    .sort((a, b) => contrast(b.hex, background.hex) - contrast(a.hex, background.hex))[0];
  if (!text) return null;

  // Brand colors: saturated clusters, ranked mostly by how much buttons and links use them
  const score = (c: Cluster) => 3 * share(c, 'cta') + share(c, 'bg') + 0.5 * share(c, 'text');
  const candidates = clusters
    .filter(c => c !== background && c !== text && hexToOklch(c.hex).c >= CHROMATIC && hexToOklch(c.hex).l >= MIN_BRAND_L)
    .sort((a, b) => score(b) - score(a));

  const chosen: Cluster[] = [];
  for (const c of candidates) {
    if (chosen.length === 3 || score(c) < 0.02) break;
    if (chosen.every(o => distance(o.hex, c.hex) >= DISTINCT)) chosen.push(c);
  }
  // Minimal sites have no brand color: use their strongest remaining neutral as the "primary"
  if (chosen.length === 0) {
    const neutral = clusters
      .filter(c => c !== background && c !== text && distance(c.hex, background.hex) >= DISTINCT && distance(c.hex, text.hex) >= DISTINCT)
      .sort((a, b) => score(b) - score(a))[0];
    if (neutral) chosen.push(neutral);
  }

  const bgL = hexToOklch(background.hex).l;
  const [dark, light] = bgL >= hexToOklch(text.hex).l ? [text, background] : [background, text];
  return {
    colors: tidyColors([dark.hex, ...chosen.map(c => c.hex), light.hex]),
    mode: bgL >= 0.5 ? 'light' : 'dark',
  };
}
