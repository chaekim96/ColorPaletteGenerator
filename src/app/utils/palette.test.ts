import { describe, expect, it } from 'vitest';
import { generatePalette, hexToOklch, inferVibe, normalizeHex, VIBES, MIN_COLORS, MAX_COLORS } from './palette';

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
