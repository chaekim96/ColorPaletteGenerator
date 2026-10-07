// Auto-assign UI roles (background, text, primary...) from any palette.
import { interpolate, formatHex, wcagContrast } from 'culori';
import { hexToOklch, oklchToHex, SLOTS_BY_COUNT } from './palette';

export type Mode = 'light' | 'dark';

export interface Roles {
  background: string;
  surface: string; // cards
  border: string;
  text: string;
  mutedText: string;
  primary: string; // buttons, fills, brand
  onPrimary: string; // text on primary
  primaryText: string; // primary as text (links): the brand color, or a readable shade of it
  accent: string; // badges, icons, highlights
  onAccent: string;
  accentText: string; // accent as large text (headline highlights)
}

export const ROLE_LABELS: Record<keyof Roles, string> = {
  background: 'Background',
  surface: 'Surface',
  border: 'Border',
  text: 'Text',
  mutedText: 'Muted text',
  primary: 'Primary',
  onPrimary: 'On primary',
  primaryText: 'Primary text',
  accent: 'Accent',
  onAccent: 'On accent',
  accentText: 'Accent text',
};

export const contrast = (a: string, b: string) => wcagContrast(a, b);

const mix = (from: string, to: string, amount: number) => formatHex(interpolate([from, to], 'oklch')(amount));

/**
 * Smallest OKLCH lightness change to `hex` (hue and chroma kept) after which it reaches `target`
 * against every entry of `against`. An entry is a color, or a function producing the color to
 * check for a candidate (text on buttons is re-picked as the button changes).
 */
export function adjustForContrast(hex: string, against: (string | ((candidate: string) => string))[], target = 4.5): string | undefined {
  const { l, c, h } = hexToOklch(hex);
  const passes = (candidate: string) =>
    against.every(other => contrast(candidate, typeof other === 'function' ? other(candidate) : other) >= target);
  for (let delta = 0.005; delta <= 1; delta += 0.005) {
    for (const next of [l - delta, l + delta]) {
      if (next < 0 || next > 1) continue;
      const candidate = oklchToHex({ l: next, c, h });
      if (candidate !== hex && passes(candidate)) return candidate;
    }
  }
  return undefined;
}

/**
 * Like design systems' brand-500 (fills) vs brand-700 (text): keep the brand color when it already
 * reads as text, otherwise use the closest shade of it that does.
 */
const textShade = (brand: string, surfaces: string[], target: number, fallback: string) =>
  surfaces.every(s => contrast(brand, s) >= target) ? brand : adjustForContrast(brand, surfaces, target) ?? fallback;

/** Fade `text` toward `background` as far as possible while staying readable on every given surface. */
const readableFade = (text: string, background: string, surfaces: string[], maxAmount: number, minContrast: number) => {
  for (let amount = maxAmount; amount > 0; amount -= 0.05) {
    const faded = mix(text, background, amount);
    if (surfaces.every(surface => contrast(faded, surface) >= minContrast)) return faded;
  }
  return text;
};

/** Of the candidates, the one that reads best on `background`. */
const bestOn = (background: string, ...candidates: string[]) =>
  candidates.reduce((best, c) => (contrast(c, background) > contrast(best, background) ? c : best));

export function assignRoles(hexes: string[], mode: Mode = 'light'): Roles {
  const colors = hexes.map(hex => ({ hex, ...hexToOklch(hex) }));
  // Generated palettes have fixed positions for primary/accent, which keeps roles stable when a
  // color is adjusted (e.g. a contrast fix). Other palettes fall back to lightness/chroma heuristics.
  const slots = SLOTS_BY_COUNT[hexes.length];
  const slotPrimary = slots ? colors[slots.indexOf('primary')] : undefined;
  const slotAccent = slots && slots.includes('accent') ? colors[slots.indexOf('accent')] : undefined;
  const neutralPool = colors.filter(c => c !== slotPrimary && c !== slotAccent);
  const byLightness = [...neutralPool].sort((a, b) => b.l - a.l);
  const mostChromatic = slotPrimary ?? [...colors].sort((a, b) => b.c - a.c)[0];
  const brandHue = mostChromatic?.h ?? 250;

  // Background: lightest (or darkest in dark mode) color, if it's light/dark enough to be a page
  const background = mode === 'light' ? byLightness[0] : byLightness[byLightness.length - 1];
  const backgroundOk = mode === 'light' ? background.l >= 0.88 : background.l <= 0.3;
  const backgroundHex = backgroundOk
    ? background.hex
    : oklchToHex({ l: mode === 'light' ? 0.985 : 0.17, c: 0.01, h: brandHue });

  // Text: the palette color with the most contrast on the background; derive one if none is readable
  const others = neutralPool.filter(c => c.hex !== backgroundHex);
  const textCandidate = others.length > 0 ? others.reduce((best, c) => (contrast(c.hex, backgroundHex) > contrast(best.hex, backgroundHex) ? c : best)) : undefined;
  const textHex = textCandidate && contrast(textCandidate.hex, backgroundHex) >= 7
    ? textCandidate.hex
    : oklchToHex({ l: mode === 'light' ? 0.2 : 0.96, c: 0.02, h: brandHue });

  // Primary / accent: slot positions when known, else the most chromatic remaining colors,
  // with the accent preferring a different hue
  const chromatic = colors
    .filter(c => c.hex !== backgroundHex && c.hex !== textHex)
    .sort((a, b) => b.c - a.c);
  const primaryColor = slotPrimary ?? chromatic[0];
  const primary = primaryColor?.hex ?? textHex;
  const primaryHue = primaryColor?.h ?? brandHue;
  const hueDistance = (h: number) => Math.min(Math.abs(h - primaryHue), 360 - Math.abs(h - primaryHue));
  const accent = slotAccent?.hex ?? chromatic
    .filter(c => c !== primaryColor)
    .sort((a, b) => b.c * (1 + hueDistance(b.h) / 90) - a.c * (1 + hueDistance(a.h) / 90))[0]?.hex ?? primary;

  const surface = mix(backgroundHex, primary, mode === 'light' ? 0.05 : 0.1);

  return {
    background: backgroundHex,
    surface,
    border: mix(backgroundHex, textHex, 0.14),
    text: textHex,
    mutedText: readableFade(textHex, backgroundHex, [backgroundHex, surface], 0.4, 4.5),
    primary,
    onPrimary: bestOn(primary, backgroundHex, textHex, '#ffffff', '#000000'),
    primaryText: textShade(primary, [backgroundHex, surface], 4.5, textHex),
    accent,
    onAccent: bestOn(accent, backgroundHex, textHex, '#ffffff', '#000000'),
    accentText: textShade(accent, [backgroundHex], 3, textHex),
  };
}

/** Plain-English label for a palette color, matching how the preview and exports use it. */
export function swatchRole(hex: string, roles: Roles): { label: string; use: string } {
  if (hex === roles.background) return { label: 'Background', use: 'Page background' };
  if (hex === roles.text) return { label: 'Text', use: 'Headings and body text' };
  if (hex === roles.primary) return { label: 'Primary', use: 'Buttons and brand' };
  if (hex === roles.accent) return { label: 'Accent', use: 'Badges and highlights' };
  return { label: 'Supporting', use: 'Secondary details' };
}
