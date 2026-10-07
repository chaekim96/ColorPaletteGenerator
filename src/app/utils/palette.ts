// Vibe-driven palette generation in OKLCH (perceptually even lightness/chroma).
import { clampChroma, converter, formatHex, parse } from 'culori';
import { Color, colorFromHex } from './colorUtils';

type Range = [number, number];
type Harmony = 'analogous' | 'complementary' | 'split' | 'triadic' | 'tetradic' | 'monochrome';

export type VibeId = 'trustworthy' | 'playful' | 'premium' | 'calm' | 'earthy' | 'romantic' | 'bold';

interface Tone {
  l: Range; // OKLCH lightness, 0-1
  c: Range; // OKLCH chroma, 0-~0.37
}

export interface Vibe {
  id: VibeId;
  label: string;
  description: string;
  hues: Range[];
  primary: Tone;
  support: Tone;
  accent?: Tone; // defaults to the primary tone
  harmonies: Harmony[]; // repeats act as weights
  light: Tone;
  dark: Tone;
  lightHue?: number; // tint the light neutral with this hue instead of the primary's (e.g. cream)
  darkHue?: number; // same for the dark neutral (e.g. espresso brown)
  allowOlive?: boolean; // keep mid-lightness yellow-greens (olive, ochre) instead of lifting them
}

/*
 * Tuned against a 97-palette benchmark of curated UI color combinations (Figma's resource library):
 * - most curated palettes stay within ~100° of hue (analogous/monochrome); wide triadic schemes are rare
 * - near-whites are usually warm and visibly tinted (cream/ivory, OKLCH C ~0.03-0.05), darks are
 *   tinted too (navy, forest, oxblood) rather than neutral black
 * - earthy (terracotta/sand/olive) and romantic (dusty rose/mauve/sage) are major categories
 * Unlike those mood palettes, ours always include a usable text color and background.
 */

export const VIBES: Vibe[] = [
  {
    id: 'trustworthy',
    label: 'Trustworthy',
    description: 'Steady blues and teals. Fintech, B2B, health.',
    hues: [[215, 255], [180, 200]],
    primary: { l: [0.45, 0.58], c: [0.1, 0.16] },
    support: { l: [0.6, 0.8], c: [0.05, 0.11] },
    harmonies: ['analogous', 'analogous', 'monochrome', 'complementary', 'complementary'],
    light: { l: [0.97, 0.99], c: [0.004, 0.012] },
    dark: { l: [0.2, 0.27], c: [0.03, 0.06] },
  },
  {
    id: 'playful',
    label: 'Playful',
    description: 'Bright, high-energy color. Consumer apps, kids, food.',
    hues: [[0, 360]],
    primary: { l: [0.62, 0.74], c: [0.17, 0.23] },
    support: { l: [0.72, 0.88], c: [0.11, 0.19] },
    harmonies: ['analogous', 'analogous', 'complementary', 'complementary', 'split', 'triadic'],
    light: { l: [0.97, 0.99], c: [0.012, 0.03] },
    dark: { l: [0.22, 0.3], c: [0.03, 0.06] },
  },
  {
    id: 'premium',
    label: 'Premium',
    description: 'Deep, restrained tones with a warm accent. Luxury, fashion.',
    hues: [[255, 300], [345, 360], [0, 20], [150, 170]],
    primary: { l: [0.25, 0.38], c: [0.05, 0.11] },
    support: { l: [0.55, 0.72], c: [0.04, 0.09] },
    accent: { l: [0.68, 0.8], c: [0.08, 0.13] },
    harmonies: ['monochrome', 'analogous', 'complementary', 'complementary'],
    light: { l: [0.95, 0.98], c: [0.015, 0.035] },
    dark: { l: [0.14, 0.2], c: [0.02, 0.05] },
    lightHue: 90,
  },
  {
    id: 'calm',
    label: 'Calm',
    description: 'Soft, muted sage and sea tones. Wellness, education.',
    hues: [[140, 200], [200, 250]],
    primary: { l: [0.58, 0.72], c: [0.04, 0.09] },
    support: { l: [0.75, 0.9], c: [0.02, 0.06] },
    harmonies: ['analogous', 'analogous', 'monochrome', 'monochrome'],
    light: { l: [0.97, 0.99], c: [0.005, 0.015] },
    dark: { l: [0.26, 0.33], c: [0.025, 0.05] },
  },
  {
    id: 'earthy',
    label: 'Earthy',
    description: 'Terracotta, sand, olive and clay. Coffee, food, home goods.',
    hues: [[30, 60], [60, 85], [105, 130]],
    primary: { l: [0.45, 0.62], c: [0.07, 0.13] },
    support: { l: [0.72, 0.86], c: [0.03, 0.07] },
    accent: { l: [0.5, 0.66], c: [0.05, 0.1] },
    harmonies: ['analogous', 'analogous', 'monochrome', 'complementary'],
    light: { l: [0.95, 0.98], c: [0.025, 0.045] },
    dark: { l: [0.22, 0.3], c: [0.03, 0.06] },
    lightHue: 95,
    darkHue: 50,
    allowOlive: true,
  },
  {
    id: 'romantic',
    label: 'Romantic',
    description: 'Dusty rose, mauve and sage. Weddings, beauty, florals.',
    hues: [[345, 360], [0, 25], [310, 345]],
    primary: { l: [0.58, 0.72], c: [0.06, 0.12] },
    support: { l: [0.8, 0.9], c: [0.025, 0.06] },
    accent: { l: [0.6, 0.72], c: [0.04, 0.08] },
    harmonies: ['analogous', 'monochrome', 'complementary', 'complementary'],
    light: { l: [0.96, 0.985], c: [0.01, 0.025] },
    dark: { l: [0.24, 0.3], c: [0.04, 0.07] },
  },
  {
    id: 'bold',
    label: 'Bold',
    description: 'Saturated, high-contrast color that stands out. Launches, media.',
    hues: [[0, 360]],
    primary: { l: [0.52, 0.65], c: [0.2, 0.26] },
    support: { l: [0.6, 0.85], c: [0.15, 0.22] },
    harmonies: ['complementary', 'complementary', 'split', 'analogous', 'triadic'],
    light: { l: [0.97, 0.995], c: [0, 0.01] },
    dark: { l: [0.12, 0.18], c: [0.005, 0.02] },
  },
];

export function getVibe(id: VibeId): Vibe {
  return VIBES.find(v => v.id === id)!;
}

// Hue offsets for [secondary, accent]
const HARMONY_OFFSETS: Record<Harmony, [number, number]> = {
  analogous: [35, -35],
  complementary: [30, 180],
  split: [150, 210],
  triadic: [120, 240],
  tetradic: [90, 180],
  monochrome: [0, 0],
};

type Slot = 'dark' | 'primary' | 'secondary' | 'accent' | 'muted' | 'light';

// Neutrals bookend the palette so every count yields usable text + background colors.
export const SLOTS_BY_COUNT: Record<number, Slot[]> = {
  3: ['dark', 'primary', 'light'],
  4: ['dark', 'primary', 'accent', 'light'],
  5: ['dark', 'primary', 'secondary', 'accent', 'light'],
  6: ['dark', 'primary', 'secondary', 'accent', 'muted', 'light'],
};

export const MIN_COLORS = 3;
export const MAX_COLORS = 6;

const toOklch = converter('oklch');

export interface Oklch {
  l: number;
  c: number;
  h: number;
}

export function hexToOklch(hex: string): Oklch {
  const o = toOklch(hex)!;
  return { l: o.l, c: o.c, h: o.h ?? 0 };
}

export function oklchToHex({ l, c, h }: Oklch): string {
  const lightness = Math.min(0.995, Math.max(0.05, l));
  return formatHex(clampChroma({ mode: 'oklch', l: lightness, c: Math.max(0, c), h }, 'oklch'));
}

/** Normalize any CSS color string to #rrggbb, or null if unparseable. */
export function normalizeHex(input: string): string | null {
  const trimmed = input.trim();
  const candidate = /^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(trimmed) ? `#${trimmed}` : trimmed;
  const parsed = parse(candidate);
  return parsed ? formatHex(parsed) : null;
}

/** Guess the closest vibe for a color, e.g. a founder's existing brand color. */
export function inferVibe(hex: string): VibeId {
  const { l, c, h } = hexToOklch(hex);
  const warm = h >= 25 && h <= 125; // terracotta, ochre, sand, olive (sage starts ~129 and stays calm)
  const rosy = h >= 310 || h <= 20; // rose, mauve, plum
  if (c < 0.08) return l < 0.45 ? 'premium' : warm ? 'earthy' : rosy && l > 0.55 ? 'romantic' : 'calm';
  if (c > 0.18) return l < 0.66 ? 'bold' : 'playful';
  if (h >= 190 && h <= 265) return 'trustworthy';
  if (l < 0.42) return 'premium';
  if (warm && c < 0.14) return 'earthy';
  if (rosy && c < 0.14 && l > 0.55) return 'romantic';
  return 'playful';
}

// Yellows and chartreuse look clean when light and muddy at mid lightness, except in earthy
// palettes where olive and ochre are the point. Light neutrals may be cream; darker ones stay clean.
const isYellowish = (h: number) => h >= 70 && h <= 135;

function tame(color: Oklch, { neutral = false, allowOlive = false } = {}): Oklch {
  if (!isYellowish(color.h)) return color;
  if (neutral) return { ...color, c: Math.min(color.c, color.l > 0.9 ? 0.05 : 0.012) };
  if (allowOlive) return color;
  return color.c > 0.06 ? { ...color, l: Math.max(color.l, 0.8) } : color;
}

type Rand = () => number;

const between = ([min, max]: Range, rand: Rand) => min + (max - min) * rand();
const pick = <T,>(items: T[], rand: Rand) => items[Math.floor(rand() * items.length)];
const wrapHue = (h: number) => ((h % 360) + 360) % 360;

export interface PaletteOptions {
  vibe?: VibeId; // omitted = random vibe (or inferred from baseHex)
  baseHex?: string; // kept exactly as the primary color
  count?: number;
  rand?: Rand;
}

export function generatePalette({ vibe, baseHex, count = 5, rand = Math.random }: PaletteOptions = {}): Color[] {
  const size = Math.min(MAX_COLORS, Math.max(MIN_COLORS, Math.round(count)));
  const v = getVibe(vibe ?? (baseHex ? inferVibe(baseHex) : pick(VIBES, rand).id));
  const harmony = pick(v.harmonies, rand);
  const olive = { allowOlive: v.allowOlive };
  const neutral = { neutral: true };
  const [secondaryOffset, accentOffset] = HARMONY_OFFSETS[harmony];
  const jitter = () => (rand() - 0.5) * 16;

  let primary: Oklch;
  let primaryTone = v.primary;
  let supportTone = v.support;
  if (baseHex) {
    primary = hexToOklch(baseHex);
    // Derive companions from the base color's own character so they don't clash with it.
    primaryTone = { l: [primary.l - 0.08, primary.l + 0.08], c: [primary.c * 0.8, primary.c * 1.1] };
    supportTone = { l: [Math.max(primary.l, 0.6), 0.85], c: [primary.c * 0.4, primary.c * 0.8] };
  } else {
    primary = tame({ l: between(v.primary.l, rand), c: between(v.primary.c, rand), h: between(pick(v.hues, rand), rand) }, olive);
  }

  const accentTone = baseHex ? primaryTone : v.accent ?? primaryTone;
  const lightHue = v.lightHue ?? primary.h;
  const darkHue = v.darkHue ?? primary.h;
  const make = (slot: Slot): string => {
    switch (slot) {
      case 'primary':
        return baseHex ? normalizeHex(baseHex)! : oklchToHex(primary);
      case 'secondary':
        return oklchToHex(tame({
          l: between(supportTone.l, rand),
          c: between(supportTone.c, rand),
          h: wrapHue(primary.h + secondaryOffset + jitter()),
        }, olive));
      case 'accent':
        return oklchToHex(tame({
          l: between(accentTone.l, rand),
          c: between(accentTone.c, rand),
          h: wrapHue(primary.h + accentOffset + jitter()),
        }, olive));
      case 'muted':
        return oklchToHex(tame({ l: between([0.6, 0.75], rand), c: between([0.02, 0.05], rand), h: primary.h }, neutral));
      case 'light':
        return oklchToHex(tame({ l: between(v.light.l, rand), c: between(v.light.c, rand), h: lightHue }, neutral));
      case 'dark':
        return oklchToHex(tame({ l: between(v.dark.l, rand), c: between(v.dark.c, rand), h: darkHue }, neutral));
    }
  };

  return SLOTS_BY_COUNT[size].map(slot => colorFromHex(make(slot)));
}

/** The primary color: 2nd swatch in generated palettes (and a sensible guess for others). */
export function primaryColor(colors: Color[]): Color | undefined {
  const slots = SLOTS_BY_COUNT[colors.length];
  return colors[slots ? slots.indexOf('primary') : Math.min(1, colors.length - 1)];
}

/** The locked primary color, used to anchor regeneration. */
export function lockedPrimary(colors: Color[]): string | undefined {
  const color = primaryColor(colors);
  return color?.locked ? color.hex : undefined;
}

/**
 * Carry locked colors from the previous palette into a new one. Locks follow their
 * role (dark, primary, accent...) when the count changes; a lock whose role no longer
 * exists takes the nearest free middle slot so it is never silently dropped.
 */
export function mergeLocked(prev: Color[], next: Color[]): Color[] {
  const result = [...next];
  const prevSlots = SLOTS_BY_COUNT[prev.length];
  const nextSlots = SLOTS_BY_COUNT[next.length];
  const taken = new Set<number>();
  const homeless: Color[] = [];

  prev.forEach((color, i) => {
    if (!color.locked) return;
    const target = prevSlots && nextSlots ? nextSlots.indexOf(prevSlots[i]) : i < next.length ? i : -1;
    if (target === -1 || taken.has(target)) {
      homeless.push(color);
    } else {
      result[target] = color;
      taken.add(target);
    }
  });

  // Prefer middle (chromatic) slots, then the ends
  const free = result
    .map((_, i) => i)
    .filter(i => !taken.has(i))
    .sort((a, b) => Number(a === 0 || a === result.length - 1) - Number(b === 0 || b === result.length - 1));
  homeless.forEach((color, k) => {
    if (k < free.length) result[free[k]] = color;
  });
  return result;
}
