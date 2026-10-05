import { describe, expect, it } from 'vitest';
import { hueFamily, paletteName } from './names';
import { generatePalette, VIBES } from './palette';

describe('paletteName', () => {
  it('is deterministic for the same colors', () => {
    const hexes = ['#111827', '#2563eb', '#93c5fd', '#f97316', '#f8fafc'];
    expect(paletteName(hexes, hexes[1])).toBe(paletteName([...hexes], hexes[1]));
  });

  it('is two capitalized words that never repeat', () => {
    for (const v of VIBES) {
      for (let i = 0; i < 50; i++) {
        const hexes = generatePalette({ vibe: v.id }).map(c => c.hex);
        const name = paletteName(hexes, hexes[1], v.id);
        expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
        const [a, b] = name.split(' ');
        expect(a).not.toBe(b);
      }
    }
  });

  it('reflects the vibe and the main color', () => {
    const name = paletteName(['#1a1a2e', '#4b2a5c', '#c9a227', '#f6f0df'], '#4b2a5c', 'premium');
    expect(name.split(' ')[0]).toMatch(/Velvet|Midnight|Gilded|Noble|Evening|Satin/);
    expect(name.split(' ')[1]).toMatch(/Iris|Plum|Lilac|Amethyst|Dusk/);
  });
});

describe('hueFamily', () => {
  it('buckets OKLCH hues into everyday color names', () => {
    expect(hueFamily('#ec4899')).toBe('pink');
    expect(hueFamily('#dc2626')).toBe('red');
    expect(hueFamily('#f97316')).toBe('orange');
    expect(hueFamily('#facc15')).toBe('yellow');
    expect(hueFamily('#16a34a')).toBe('green');
    expect(hueFamily('#0d9488')).toBe('teal');
    expect(hueFamily('#2563eb')).toBe('blue');
    expect(hueFamily('#7c3aed')).toBe('violet');
    expect(hueFamily('#777777')).toBe('neutral');
  });
});
