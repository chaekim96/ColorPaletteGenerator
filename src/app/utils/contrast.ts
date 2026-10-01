// WCAG contrast checks for the role pairs the preview uses, with minimal-change fixes.
import { contrast, Roles } from './roles';
import { hexToOklch, oklchToHex } from './palette';

export type Rating = 'AAA' | 'AA' | 'AA Large' | 'Fail';

/** WCAG 2.x rating for normal-size text (AA Large = only OK for 24px+ or 18.66px+ bold). */
export function rate(ratio: number): Rating {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return 'Fail';
}

export const AA = 4.5;
export const AA_LARGE = 3;

export interface PairCheck {
  id: string;
  label: string; // where it shows up, in plain words
  foreground: string;
  background: string;
  minimum: number; // 4.5 for normal text, 3 for large text
  ratio: number;
  rating: Rating;
  passes: boolean;
  /** Present when the pair is below AA and a palette color can be adjusted to fix it */
  fix?: { role: keyof Roles; from: string; to: string };
}

/**
 * Smallest OKLCH lightness change to `hex` (hue and chroma kept) after which it reaches `target`
 * against every entry of `against`. An entry is a color, or a function producing the color to
 * check for a candidate (text on buttons is re-picked as the button changes).
 */
export function adjustForContrast(hex: string, against: (string | ((candidate: string) => string))[], target = AA): string | undefined {
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

export function checkRoles(roles: Roles): PairCheck[] {
  // Text on a button/badge is re-chosen from these whenever the fill color changes
  const onCandidates = [roles.background, roles.text, '#ffffff', '#000000'];
  const bestOn = (fill: string) =>
    onCandidates.reduce((best, c) => (contrast(c, fill) > contrast(best, fill) ? c : best));

  // Each pair names the palette role to adjust if it fails, and what that role must read against
  const pairs: (Omit<PairCheck, 'ratio' | 'rating' | 'passes' | 'fix'> & { fixRole?: keyof Roles; fixAgainst?: Parameters<typeof adjustForContrast>[1] })[] = [
    { id: 'body', label: 'Headings and body text', foreground: roles.text, background: roles.background, minimum: AA, fixRole: 'text', fixAgainst: [roles.background, roles.surface] },
    { id: 'muted', label: 'Secondary text', foreground: roles.mutedText, background: roles.background, minimum: AA },
    { id: 'card', label: 'Text on cards', foreground: roles.mutedText, background: roles.surface, minimum: AA },
    { id: 'button', label: 'Button text', foreground: roles.onPrimary, background: roles.primary, minimum: AA, fixRole: 'primary', fixAgainst: [bestOn] },
    { id: 'link', label: 'Links in primary color', foreground: roles.primary, background: roles.background, minimum: AA, fixRole: 'primary', fixAgainst: [roles.background, roles.surface, bestOn] },
    { id: 'badge', label: 'Badge text', foreground: roles.onAccent, background: roles.accent, minimum: AA, fixRole: 'accent', fixAgainst: [bestOn] },
    { id: 'highlight', label: 'Accent words in headlines (large text)', foreground: roles.accent, background: roles.background, minimum: AA_LARGE, fixRole: 'accent', fixAgainst: [roles.background] },
  ];

  return pairs.map(({ fixRole, fixAgainst, ...pair }) => {
    const ratio = contrast(pair.foreground, pair.background);
    const check: PairCheck = { ...pair, ratio, rating: rate(ratio), passes: ratio >= pair.minimum };
    if (check.passes || !fixRole || !fixAgainst) return check;

    const from = roles[fixRole];
    const to = adjustForContrast(from, fixAgainst, pair.minimum);
    if (to) check.fix = { role: fixRole, from, to };
    return check;
  });
}
