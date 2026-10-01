import { describe, expect, it } from 'vitest';
import { assignRoles, contrast } from './roles';
import { generatePalette, hexToOklch, VIBES } from './palette';

describe('assignRoles', () => {
  it('maps a standard palette to the obvious roles', () => {
    const roles = assignRoles(['#111827', '#2563eb', '#93c5fd', '#f97316', '#f8fafc']);
    expect(roles.background).toBe('#f8fafc');
    expect(roles.text).toBe('#111827');
    expect(roles.primary).toBe('#2563eb');
    expect(roles.accent).toBe('#f97316'); // distinct hue beats the similar light blue
  });

  it('swaps background and text in dark mode', () => {
    const roles = assignRoles(['#111827', '#2563eb', '#93c5fd', '#f97316', '#f8fafc'], 'dark');
    expect(roles.background).toBe('#111827');
    expect(roles.text).toBe('#f8fafc');
  });

  it('keeps body text readable (AA) for every generated palette', () => {
    for (const vibe of VIBES) {
      for (let i = 0; i < 100; i++) {
        const hexes = generatePalette({ vibe: vibe.id }).map(c => c.hex);
        for (const mode of ['light', 'dark'] as const) {
          const roles = assignRoles(hexes, mode);
          expect(contrast(roles.text, roles.background)).toBeGreaterThanOrEqual(7);
          expect(contrast(roles.mutedText, roles.background)).toBeGreaterThanOrEqual(4.5);
          expect(contrast(roles.mutedText, roles.surface)).toBeGreaterThanOrEqual(4.5);
          expect(contrast(roles.text, roles.surface)).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it('derives a page background when the palette has no light color', () => {
    const roles = assignRoles(['#1e3a8a', '#dc2626', '#16a34a']);
    expect(hexToOklch(roles.background).l).toBeGreaterThan(0.95);
    expect(contrast(roles.text, roles.background)).toBeGreaterThanOrEqual(7);
  });

  it('works for tiny palettes', () => {
    const roles = assignRoles(['#000000', '#ffffff']);
    expect(roles.background).toBe('#ffffff');
    expect(roles.text).toBe('#000000');
    expect(roles.primary).toBe('#000000');
  });
});
