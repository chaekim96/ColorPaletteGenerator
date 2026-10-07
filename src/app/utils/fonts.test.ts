import { describe, expect, it } from 'vitest';
import { FONT_PAIRS, fontStack, googleFontsHref, pairsForVibe, pickPair } from './fonts';
import { VIBES } from './palette';

describe('font pairs', () => {
  it('has 25 unique pairings with distinct heading and body fonts', () => {
    expect(FONT_PAIRS).toHaveLength(25);
    expect(new Set(FONT_PAIRS.map(p => p.id)).size).toBe(25);
    FONT_PAIRS.forEach(p => expect(p.heading.family).not.toBe(p.body.family));
  });

  it('offers at least 5 pairings for every vibe', () => {
    VIBES.forEach(v => expect(pairsForVibe(v.id).length).toBeGreaterThanOrEqual(5));
  });
});

describe('pickPair', () => {
  it('returns a pairing tagged with the vibe and avoids the current one', () => {
    for (const v of VIBES) {
      for (let i = 0; i < 50; i++) {
        const pair = pickPair(v.id, 'manrope-inter');
        expect(pair.vibes).toContain(v.id);
        expect(pair.id).not.toBe('manrope-inter');
      }
    }
  });
});

describe('googleFontsHref', () => {
  it('requests each family once with heading weight and body 400/700', () => {
    const pair = FONT_PAIRS.find(p => p.id === 'plex-sans-serif')!;
    expect(googleFontsHref(pair)).toBe(
      'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@600&family=IBM+Plex+Serif:wght@400;700&display=swap'
    );
  });
});

describe('fontStack', () => {
  it('quotes the family and adds a category fallback', () => {
    expect(fontStack({ family: 'Lora', weight: 600, category: 'serif' })).toBe("'Lora', Georgia, serif");
    expect(fontStack({ family: 'Inter', weight: 400, category: 'sans-serif' })).toBe("'Inter', system-ui, sans-serif");
  });
});
