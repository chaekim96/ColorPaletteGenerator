// Auto-assign UI roles (background, text, primary...) from any palette.
import { interpolate, formatHex, wcagContrast } from 'culori';
import { hexToOklch, oklchToHex } from './palette';

export type Mode = 'light' | 'dark';

export interface Roles {
  background: string;
  surface: string; // cards
  border: string;
  text: string;
  mutedText: string;
  primary: string; // buttons, links, brand
  onPrimary: string; // text on primary
  accent: string; // highlights, badges, icons
  onAccent: string;
}

export const ROLE_LABELS: Record<keyof Roles, string> = {
  background: 'Background',
  surface: 'Surface',
  border: 'Border',
  text: 'Text',
  mutedText: 'Muted text',
  primary: 'Primary',
  onPrimary: 'On primary',
  accent: 'Accent',
  onAccent: 'On accent',
};

export const contrast = (a: string, b: string) => wcagContrast(a, b);

const mix = (from: string, to: string, amount: number) => formatHex(interpolate([from, to], 'oklch')(amount));

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
  const byLightness = [...colors].sort((a, b) => b.l - a.l);
  const mostChromatic = [...colors].sort((a, b) => b.c - a.c)[0];
  const brandHue = mostChromatic?.h ?? 250;

  // Background: lightest (or darkest in dark mode) color, if it's light/dark enough to be a page
  let background = mode === 'light' ? byLightness[0] : byLightness[byLightness.length - 1];
  const backgroundOk = mode === 'light' ? background.l >= 0.88 : background.l <= 0.3;
  const backgroundHex = backgroundOk
    ? background.hex
    : oklchToHex({ l: mode === 'light' ? 0.985 : 0.17, c: 0.01, h: brandHue });

  // Text: the palette color with the most contrast on the background; derive one if none is readable
  const others = colors.filter(c => c.hex !== backgroundHex);
  const textCandidate = others.length > 0 ? others.reduce((best, c) => (contrast(c.hex, backgroundHex) > contrast(best.hex, backgroundHex) ? c : best)) : undefined;
  const textHex = textCandidate && contrast(textCandidate.hex, backgroundHex) >= 7
    ? textCandidate.hex
    : oklchToHex({ l: mode === 'light' ? 0.2 : 0.96, c: 0.02, h: brandHue });

  // Primary / accent: the most chromatic remaining colors, accent preferring a different hue
  const chromatic = colors
    .filter(c => c.hex !== backgroundHex && c.hex !== textHex)
    .sort((a, b) => b.c - a.c);
  const primary = chromatic[0]?.hex ?? textHex;
  const primaryHue = chromatic[0]?.h ?? brandHue;
  const hueDistance = (h: number) => Math.min(Math.abs(h - primaryHue), 360 - Math.abs(h - primaryHue));
  const accent = chromatic.slice(1).sort((a, b) => b.c * (1 + hueDistance(b.h) / 90) - a.c * (1 + hueDistance(a.h) / 90))[0]?.hex ?? primary;

  const surface = mix(backgroundHex, primary, mode === 'light' ? 0.05 : 0.1);

  return {
    background: backgroundHex,
    surface,
    border: mix(backgroundHex, textHex, 0.14),
    text: textHex,
    mutedText: readableFade(textHex, backgroundHex, [backgroundHex, surface], 0.4, 4.5),
    primary,
    onPrimary: bestOn(primary, backgroundHex, textHex, '#ffffff', '#000000'),
    accent,
    onAccent: bestOn(accent, backgroundHex, textHex, '#ffffff', '#000000'),
  };
}
