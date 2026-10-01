// Vibe-driven palette generation in OKLCH (perceptually even lightness/chroma).
import { clampChroma, converter, formatHex, parse } from 'culori';
import { Color, colorFromHex } from './colorUtils';

type Range = [number, number];
type Harmony = 'analogous' | 'complementary' | 'split' | 'triadic' | 'tetradic' | 'monochrome';

export type VibeId = 'trustworthy' | 'playful' | 'premium' | 'calm' | 'bold';

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
  harmonies: Harmony[];
  light: Tone;
  dark: Tone;
  neutralHue?: number; // tint neutrals with this hue instead of the primary's
}

export const VIBES: Vibe[] = [
  {
    id: 'trustworthy',
    label: 'Trustworthy',
    description: 'Steady blues and teals. Fintech, B2B, health.',
    hues: [[215, 255], [180, 200]],
    primary: { l: [0.45, 0.58], c: [0.1, 0.16] },
    support: { l: [0.6, 0.8], c: [0.05, 0.11] },
    harmonies: ['analogous', 'complementary'],
    light: { l: [0.97, 0.99], c: [0.004, 0.012] },
    dark: { l: [0.2, 0.27], c: [0.02, 0.05] },
  },
  {
    id: 'playful',
    label: 'Playful',
    description: 'Bright, high-energy color. Consumer apps, kids, food.',
    hues: [[0, 360]],
    primary: { l: [0.62, 0.74], c: [0.17, 0.23] },
    support: { l: [0.72, 0.88], c: [0.11, 0.19] },
    harmonies: ['triadic', 'tetradic', 'split'],
    light: { l: [0.97, 0.99], c: [0.01, 0.025] },
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
    harmonies: ['complementary', 'analogous'],
    light: { l: [0.95, 0.98], c: [0.01, 0.025] },
    dark: { l: [0.14, 0.19], c: [0.005, 0.025] },
    neutralHue: 85,
  },
  {
    id: 'calm',
    label: 'Calm',
    description: 'Soft, muted sage and sea tones. Wellness, education.',
    hues: [[140, 200], [200, 250]],
    primary: { l: [0.58, 0.72], c: [0.04, 0.09] },
    support: { l: [0.75, 0.9], c: [0.02, 0.06] },
    harmonies: ['analogous', 'monochrome'],
    light: { l: [0.97, 0.99], c: [0.005, 0.015] },
    dark: { l: [0.26, 0.33], c: [0.02, 0.04] },
  },
  {
    id: 'bold',
    label: 'Bold',
    description: 'Saturated, high-contrast color that stands out. Launches, media.',
    hues: [[0, 360]],
    primary: { l: [0.52, 0.65], c: [0.2, 0.26] },
    support: { l: [0.6, 0.85], c: [0.15, 0.22] },
    harmonies: ['complementary', 'split', 'triadic'],
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
  if (c < 0.08) return l < 0.45 ? 'premium' : 'calm';
  if (c > 0.18) return l < 0.66 ? 'bold' : 'playful';
  if (h >= 190 && h <= 265) return 'trustworthy';
  if (l < 0.42) return 'premium';
  return 'playful';
}

// Yellows and chartreuse only look clean when light; neutrals in that range turn muddy.
const isYellowish = (h: number) => h >= 70 && h <= 135;

function tame(color: Oklch, neutral = false): Oklch {
  if (!isYellowish(color.h)) return color;
  if (neutral) return { ...color, c: Math.min(color.c, 0.012) };
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
    primary = tame({ l: between(v.primary.l, rand), c: between(v.primary.c, rand), h: between(pick(v.hues, rand), rand) });
  }

  const accentTone = baseHex ? primaryTone : v.accent ?? primaryTone;
  const neutralHue = v.neutralHue ?? primary.h;
  const make = (slot: Slot): string => {
    switch (slot) {
      case 'primary':
        return baseHex ? normalizeHex(baseHex)! : oklchToHex(primary);
      case 'secondary':
        return oklchToHex(tame({
          l: between(supportTone.l, rand),
          c: between(supportTone.c, rand),
          h: wrapHue(primary.h + secondaryOffset + jitter()),
        }));
      case 'accent':
        return oklchToHex(tame({
          l: between(accentTone.l, rand),
          c: between(accentTone.c, rand),
          h: wrapHue(primary.h + accentOffset + jitter()),
        }));
      case 'muted':
        return oklchToHex(tame({ l: between([0.6, 0.75], rand), c: between([0.02, 0.05], rand), h: primary.h }, true));
      case 'light':
        return oklchToHex(tame({ l: between(v.light.l, rand), c: between(v.light.c, rand), h: neutralHue }, true));
      case 'dark':
        return oklchToHex(tame({ l: between(v.dark.l, rand), c: between(v.dark.c, rand), h: neutralHue }, true));
    }
  };

  return SLOTS_BY_COUNT[size].map(slot => colorFromHex(make(slot)));
}

/** The locked primary color (2nd swatch in generated palettes), used to anchor regeneration. */
export function lockedPrimary(colors: Color[]): string | undefined {
  const slots = SLOTS_BY_COUNT[colors.length];
  const color = colors[slots ? slots.indexOf('primary') : 1];
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
