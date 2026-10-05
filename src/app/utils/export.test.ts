import { describe, expect, it } from 'vitest';
import { cssVariables, googleFontsEmbed, tailwindV3, tailwindV4 } from './export';
import { assignRoles } from './roles';
import { FONT_PAIRS, googleFontsHref } from './fonts';

const palette = ['#111827', '#ffd60a', '#93c5fd', '#f97316', '#f8fafc'];
const fonts = FONT_PAIRS.find(p => p.id === 'plex-sans-serif')!; // multi-word family names
const input = { palette, light: assignRoles(palette, 'light'), dark: assignRoles(palette, 'dark'), fonts };

describe('cssVariables', () => {
  const css = cssVariables(input);

  it('includes palette, roles and fonts', () => {
    expect(css).toContain('--palette-1: #111827;');
    expect(css).toContain(`--primary: #ffd60a;`);
    expect(css).toContain(`--primary-text: ${input.light.primaryText};`);
    expect(css).toContain("--font-heading: 'IBM Plex Sans', system-ui, sans-serif;");
  });

  it('includes a dark-mode override and balanced braces', () => {
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain(`--background: ${input.dark.background};`);
    expect(css.split('{').length).toBe(css.split('}').length);
  });
});

describe('tailwindV4', () => {
  it('defines theme colors and fonts with Tailwind naming', () => {
    const css = tailwindV4(input);
    expect(css).toContain('@theme {');
    expect(css).toContain(`--color-primary-foreground: ${input.light.onPrimary};`);
    expect(css).toContain('--color-palette-5: #f8fafc;');
    expect(css).toContain("--font-body: 'IBM Plex Serif', Georgia, serif;");
    expect(css.split('{').length).toBe(css.split('}').length);
  });
});

describe('tailwindV3', () => {
  it('is a valid config with nested primary/accent colors and quoted font names', () => {
    const module = { exports: {} as any };
    new Function('module', tailwindV3(input))(module);
    const { colors, fontFamily } = module.exports.theme.extend;
    expect(colors.primary).toEqual({ DEFAULT: '#ffd60a', foreground: input.light.onPrimary, text: input.light.primaryText });
    expect(colors.palette[3]).toBe('#93c5fd');
    expect(fontFamily.heading).toEqual(['"IBM Plex Sans"', 'system-ui', 'sans-serif']);
    expect(fontFamily.body).toEqual(['"IBM Plex Serif"', 'Georgia', 'serif']);
  });

  it('does not quote single-word families twice', () => {
    const module = { exports: {} as any };
    new Function('module', tailwindV3({ ...input, fonts: FONT_PAIRS.find(p => p.id === 'lora-mulish')! }))(module);
    expect(module.exports.theme.extend.fontFamily.heading[0]).toBe('Lora');
  });
});

describe('googleFontsEmbed', () => {
  it('uses the same URL the app loads, as a link and an @import', () => {
    const html = googleFontsEmbed(fonts);
    const href = googleFontsHref(fonts);
    expect(html).toContain(`<link href="${href}" rel="stylesheet">`);
    expect(html).toContain(`@import url('${href}');`);
    expect(html).toContain('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>');
  });
});

describe('palette name header', () => {
  it('labels every code export with the palette name when given', () => {
    const named = { ...input, name: 'Velvet Plum' };
    for (const out of [cssVariables(named), tailwindV4(named), tailwindV3(named)]) {
      expect(out.startsWith('/* Velvet Plum */\n')).toBe(true);
    }
    expect(cssVariables(input).startsWith(':root')).toBe(true);
  });
});
