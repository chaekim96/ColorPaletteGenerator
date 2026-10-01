import { describe, expect, it } from 'vitest';
import { describeToSettings } from './describe';
import { hexToOklch } from './palette';

describe('describeToSettings', () => {
  it('maps industries and moods to vibes', () => {
    expect(describeToSettings('A fintech app for small business payments').vibe).toBe('trustworthy');
    expect(describeToSettings('fun snack brand for kids').vibe).toBe('playful');
    expect(describeToSettings('luxury jewelry boutique').vibe).toBe('premium');
    expect(describeToSettings('meditation and sleep app').vibe).toBe('calm');
    expect(describeToSettings('streetwear drop, loud and edgy').vibe).toBe('bold');
  });

  it('prefers the more specific phrase on ties', () => {
    expect(describeToSettings('mental health journaling').vibe).toBe('calm');
  });

  it('does not match words inside other words', () => {
    // "care" inside "healthcare", "fun" inside "funding", "tea" inside "team"
    const result = describeToSettings('healthcare funding team');
    expect(result.vibe).toBe('trustworthy');
  });

  it('picks the first color name as the base, longest names first', () => {
    expect(describeToSettings('navy blue and gold').baseHex).toBe('#1e3a8a');
    expect(describeToSettings('gold and navy').baseHex).toBe('#c9a227');
    expect(describeToSettings('a forest green outdoors brand').baseHex).toBe('#1f5f3f');
  });

  it('applies modifiers right before the color', () => {
    const plain = hexToOklch(describeToSettings('pink').baseHex!);
    const pastel = hexToOklch(describeToSettings('pastel pink').baseHex!);
    const dark = hexToOklch(describeToSettings('dark pink').baseHex!);
    expect(pastel.l).toBeGreaterThan(plain.l);
    expect(pastel.c).toBeLessThan(plain.c);
    expect(dark.l).toBeLessThan(plain.l);
  });

  it('uses an explicit hex code as the base', () => {
    const result = describeToSettings('our logo is #FF5A1F, make it bold');
    expect(result.baseHex).toBe('#ff5a1f');
    expect(result.vibe).toBe('bold');
  });

  it('returns nothing for unrelated text', () => {
    expect(describeToSettings('asdf qwerty')).toEqual({ vibe: undefined, baseHex: undefined, matches: [] });
  });

  it('explains what it matched', () => {
    expect(describeToSettings('calm spa, sage green').matches).toEqual(['calm, spa → Calm', 'sage → base color']);
  });
});
