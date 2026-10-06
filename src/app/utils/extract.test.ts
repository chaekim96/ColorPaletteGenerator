import { describe, expect, it } from 'vitest';
import { buildPalette, opaqueHex, Sample, tidyColors } from './extract';

const page = (extra: Sample[] = []): Sample[] => [
  { color: 'rgb(255, 255, 255)', weight: 1_000_000, kind: 'bg' }, // page background
  { color: 'rgb(17, 24, 39)', weight: 5_000, kind: 'text' }, // body text
  { color: 'rgb(18, 25, 40)', weight: 2_000, kind: 'text' }, // near-identical text color merges
  ...extra,
];

describe('opaqueHex', () => {
  it('accepts modern color syntax and drops transparent colors', () => {
    expect(opaqueHex('rgb(255, 0, 0)')).toBe('#ff0000');
    expect(opaqueHex('oklch(0.628 0.258 29.23)')).toMatch(/^#f[0-9a-f]{5}$/);
    expect(opaqueHex('rgba(0, 0, 0, 0)')).toBeNull();
    expect(opaqueHex('rgba(0, 0, 0, 0.5)')).toBeNull();
    expect(opaqueHex('nonsense')).toBeNull();
  });
});

describe('buildPalette', () => {
  it('finds background, text and the button color as primary', () => {
    const result = buildPalette(page([
      { color: 'rgb(99, 91, 255)', weight: 20_000, kind: 'cta' }, // purple buttons
      { color: 'rgb(255, 120, 80)', weight: 30_000, kind: 'bg' }, // orange section
    ]))!;
    expect(result.mode).toBe('light');
    expect(result.colors[0]).toBe('#111827');
    expect(result.colors[1]).toBe('#635bff'); // buttons outrank a bigger decorative fill
    expect(result.colors).toContain('#ff7850');
    expect(result.colors.at(-1)).toBe('#ffffff');
  });

  it('handles dark-mode sites', () => {
    const result = buildPalette([
      { color: 'rgb(8, 9, 10)', weight: 1_000_000, kind: 'bg' },
      { color: 'rgb(247, 248, 248)', weight: 8_000, kind: 'text' },
      { color: 'rgb(94, 106, 210)', weight: 10_000, kind: 'cta' },
    ])!;
    expect(result.mode).toBe('dark');
    expect(result.colors).toEqual(['#08090a', '#5e6ad2', '#f7f8f8']);
  });

  it('prefers the most readable text color over a larger amount of gray secondary text', () => {
    const result = buildPalette([
      { color: 'rgb(8, 9, 10)', weight: 1_000_000, kind: 'bg' },
      { color: 'rgb(138, 143, 152)', weight: 9_000, kind: 'text' }, // lots of gray body copy
      { color: 'rgb(247, 248, 248)', weight: 4_000, kind: 'text' }, // headings
    ])!;
    expect(result.colors.at(-1)).toBe('#f7f8f8');
    expect(result.colors[1]).toBe('#8a8f98'); // gray becomes the minimal "primary"
  });

  it('falls back to a neutral for minimal black-and-white sites', () => {
    const result = buildPalette(page([{ color: 'rgb(120, 120, 120)', weight: 9_000, kind: 'cta' }]))!;
    expect(result.colors).toEqual(['#111827', '#787878', '#ffffff']);
  });

  it('keeps accents distinct and caps the palette at 5 colors', () => {
    const result = buildPalette(page([
      { color: 'rgb(37, 99, 235)', weight: 9_000, kind: 'cta' },
      { color: 'rgb(38, 100, 236)', weight: 8_000, kind: 'cta' }, // same blue
      { color: 'rgb(16, 185, 129)', weight: 7_000, kind: 'cta' },
      { color: 'rgb(245, 158, 11)', weight: 6_000, kind: 'cta' },
      { color: 'rgb(236, 72, 153)', weight: 5_000, kind: 'cta' },
    ]))!;
    expect(result.colors).toHaveLength(5);
    expect(result.colors.filter(c => c === '#2563eb' || c === '#2664ec')).toHaveLength(1);
  });

  it('ignores browser-default link colors and near-black accents', () => {
    const result = buildPalette(page([
      { color: 'rgb(0, 0, 238)', weight: 50_000, kind: 'cta' }, // unstyled link blue
      { color: 'rgb(16, 2, 24)', weight: 40_000, kind: 'bg' }, // very dark purple section
      { color: 'rgb(255, 108, 55)', weight: 10_000, kind: 'cta' }, // the real brand orange
    ]))!;
    expect(result.colors).not.toContain('#0000ee');
    expect(result.colors).not.toContain('#100218');
    expect(result.colors[1]).toBe('#ff6c37');
  });

  it('returns null when there is nothing to work with', () => {
    expect(buildPalette([{ color: 'rgb(255,255,255)', weight: 10, kind: 'bg' }])).toBeNull();
  });
});

describe('tidyColors', () => {
  it('drops near-copies of the ends but keeps real brand tints', () => {
    expect(tidyColors(['#000000', '#040404', '#f5f5f5'])).toEqual(['#000000', '#f5f5f5']);
    expect(tidyColors(['#000000', '#dddddd', '#ffffff'])).toEqual(['#000000', '#ffffff']);
    expect(tidyColors(['#000000', '#8a8f98', '#f7f8f8'])).toEqual(['#000000', '#8a8f98', '#f7f8f8']);
    expect(tidyColors(['#000000', '#0075de', '#005bab', '#ffffff'])).toHaveLength(4);
  });
});
