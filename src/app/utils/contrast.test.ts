import { describe, expect, it } from 'vitest';
import { adjustForContrast, checkRoles, rate } from './contrast';
import { assignRoles, contrast } from './roles';
import { generatePalette, hexToOklch, VIBES } from './palette';

describe('rate', () => {
  it('uses WCAG 2.x thresholds', () => {
    expect(rate(21)).toBe('AAA');
    expect(rate(7)).toBe('AAA');
    expect(rate(6.99)).toBe('AA');
    expect(rate(4.5)).toBe('AA');
    expect(rate(4.49)).toBe('AA Large');
    expect(rate(3)).toBe('AA Large');
    expect(rate(2.99)).toBe('Fail');
  });
});

describe('adjustForContrast', () => {
  it('makes the smallest lightness change that passes, keeping the hue', () => {
    const orange = '#ff8a3d'; // white text fails on this
    const fixed = adjustForContrast(orange, ['#ffffff'])!;
    expect(contrast(fixed, '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrast(fixed, '#ffffff')).toBeLessThan(5); // minimal, not overshooting
    expect(Math.abs(hexToOklch(fixed).h - hexToOklch(orange).h)).toBeLessThan(6);
  });

  it('returns undefined when nothing can pass', () => {
    expect(adjustForContrast('#777777', ['#777777'], 22)).toBeUndefined();
  });
});

describe('checkRoles', () => {
  it('button text always passes because it can switch between light and dark', () => {
    const roles = assignRoles(['#111111', '#ffd60a', '#fafafa']);
    expect(checkRoles(roles).find(c => c.id === 'button')!.passes).toBe(true);
  });

  it('flags a bright primary used as link text and suggests a darker version', () => {
    const roles = assignRoles(['#111111', '#ffd60a', '#fafafa']); // yellow on near-white
    const link = checkRoles(roles).find(c => c.id === 'link')!;
    expect(link.passes).toBe(false);
    expect(link.fix?.role).toBe('primary');
    expect(hexToOklch(link.fix!.to).l).toBeLessThan(hexToOklch('#ffd60a').l);
  });

  it('judges headline accents against the large-text minimum (3:1)', () => {
    const highlight = checkRoles(assignRoles(['#111111', '#1d4ed8', '#e0533d', '#fafafa'])).find(c => c.id === 'highlight')!;
    expect(highlight.minimum).toBe(3);
    expect(highlight.passes).toBe(highlight.ratio >= 3);
  });

  it('every suggested fix actually passes once applied to the palette', () => {
    let fixesChecked = 0;
    for (const vibe of VIBES) {
      for (let i = 0; i < 150; i++) {
        const hexes = generatePalette({ vibe: vibe.id }).map(c => c.hex);
        for (const mode of ['light', 'dark'] as const) {
          for (const check of checkRoles(assignRoles(hexes, mode))) {
            if (check.passes) continue;
            expect(check.fix, `${check.id} ${check.foreground}/${check.background}`).toBeDefined();
            const fixed = hexes.map(h => (h === check.fix!.from ? check.fix!.to : h));
            const after = checkRoles(assignRoles(fixed, mode)).find(c => c.id === check.id)!;
            expect(after.ratio, `${check.id} after fix ${check.fix!.from}->${check.fix!.to}`).toBeGreaterThanOrEqual(check.minimum);
            fixesChecked++;
          }
        }
      }
    }
    expect(fixesChecked).toBeGreaterThan(0);
  });
});
