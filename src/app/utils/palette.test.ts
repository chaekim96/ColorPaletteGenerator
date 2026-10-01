import { describe, expect, it } from 'vitest';
import { generatePalette, hexToOklch, inferVibe, lockedPrimary, mergeLocked, normalizeHex, VIBES, MIN_COLORS, MAX_COLORS } from './palette';
import { colorFromHex } from './colorUtils';

const HEX = /^#[0-9a-f]{6}$/;
const RUNS = 200;

describe('generatePalette', () => {
  it('returns the requested number of valid hex colors, clamped to 3-6', () => {
    for (let count = 1; count <= 8; count++) {
      const palette = generatePalette({ count });
      expect(palette).toHaveLength(Math.min(MAX_COLORS, Math.max(MIN_COLORS, count)));
      palette.forEach(c => expect(c.hex).toMatch(HEX));
    }
  });

  it('always bookends with a dark and a light neutral', () => {
    for (const vibe of VIBES) {
      for (let i = 0; i < RUNS; i++) {
        const palette = generatePalette({ vibe: vibe.id, count: 5 });
        expect(hexToOklch(palette[0].hex).l).toBeLessThan(0.36);
        expect(hexToOklch(palette[palette.length - 1].hex).l).toBeGreaterThan(0.94);
      }
    }
  });

  it('keeps the base color exactly as the primary', () => {
    for (const base of ['#ff5a1f', '#1E40AF', '#0f766e', '#000000', '#ffffff']) {
      for (const count of [3, 4, 5, 6]) {
        const palette = generatePalette({ baseHex: base, count });
        expect(palette[1].hex).toBe(base.toLowerCase());
      }
    }
  });

  it('keeps preset primaries within the vibe hue ranges', () => {
    const trustworthy = VIBES.find(v => v.id === 'trustworthy')!;
    for (let i = 0; i < RUNS; i++) {
      const { h } = hexToOklch(generatePalette({ vibe: 'trustworthy' })[1].hex);
      // Gamut clamping can shift hue slightly, so allow a small tolerance
      expect(trustworthy.hues.some(([min, max]) => h >= min - 5 && h <= max + 5)).toBe(true);
    }
  });

  it('is deterministic for a given random source', () => {
    const seeded = () => {
      let s = 42;
      return () => ((s = (s * 16807) % 2147483647) / 2147483647);
    };
    expect(generatePalette({ rand: seeded() }).map(c => c.hex)).toEqual(generatePalette({ rand: seeded() }).map(c => c.hex));
  });
});

describe('normalizeHex', () => {
  it('accepts common formats', () => {
    expect(normalizeHex('#ABC')).toBe('#aabbcc');
    expect(normalizeHex('abcdef')).toBe('#abcdef');
    expect(normalizeHex(' #3B82F6 ')).toBe('#3b82f6');
    expect(normalizeHex('hsl(210, 50%, 50%)')).toMatch(HEX);
  });

  it('rejects garbage', () => {
    expect(normalizeHex('nope')).toBeNull();
    expect(normalizeHex('#12')).toBeNull();
  });
});

describe('inferVibe', () => {
  it('maps recognizable brand colors to sensible vibes', () => {
    expect(inferVibe('#1d4ed8')).toBe('bold'); // saturated royal blue
    expect(inferVibe('#2f6f9f')).toBe('trustworthy'); // corporate blue
    expect(inferVibe('#a3b8a0')).toBe('calm'); // sage
    expect(inferVibe('#2b2135')).toBe('premium'); // deep plum
    expect(inferVibe('#ff6b9d')).toBe('playful'); // bubblegum
  });
});

describe('mergeLocked', () => {
  const lock = (hex: string) => colorFromHex(hex, true);
  const free = (hex: string) => colorFromHex(hex);

  it('keeps locked colors in place when the count is unchanged', () => {
    const prev = [free('#000000'), lock('#ff0000'), free('#00ff00'), lock('#0000ff'), free('#ffffff')];
    const next = generatePalette({ count: 5 });
    const merged = mergeLocked(prev, next);
    expect(merged[1].hex).toBe('#ff0000');
    expect(merged[3].hex).toBe('#0000ff');
    expect(merged[0].hex).toBe(next[0].hex);
  });

  it('moves locks with their role when the count changes', () => {
    // 5 = dark, primary, secondary, accent, light -> 3 = dark, primary, light
    const prev = [lock('#111111'), lock('#ff0000'), free('#00ff00'), free('#0000ff'), lock('#fafafa')];
    const merged = mergeLocked(prev, generatePalette({ count: 3 }));
    expect(merged.map(c => c.hex)).toEqual(['#111111', '#ff0000', '#fafafa']);
  });

  it('never drops a lock whose role disappears', () => {
    // locked accent (index 3 of 5); 3 colors has no accent slot
    const prev = [free('#111111'), free('#ff0000'), free('#00ff00'), lock('#0000ff'), free('#fafafa')];
    const merged = mergeLocked(prev, generatePalette({ count: 3 }));
    expect(merged[1].hex).toBe('#0000ff');
  });

  it('falls back to index matching for non-standard counts from old share links', () => {
    const prev = Array.from({ length: 8 }, (_, i) => colorFromHex('#123456', i === 2));
    const merged = mergeLocked(prev, generatePalette({ count: 5 }));
    expect(merged[2].hex).toBe('#123456');
  });
});

describe('lockedPrimary', () => {
  it('returns the primary only when it is locked', () => {
    const palette = generatePalette({ count: 4 });
    expect(lockedPrimary(palette)).toBeUndefined();
    palette[1] = { ...palette[1], locked: true };
    expect(lockedPrimary(palette)).toBe(palette[1].hex);
  });
});
