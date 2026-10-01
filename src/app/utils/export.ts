// Code exports: CSS variables, Tailwind v4 / v3 config, Google Fonts embed.
// Token names follow shadcn/ui conventions so they drop into the most common startup stack.
import { FontPair, FontSpec, googleFontsHref, fontStack } from './fonts';
import { Roles } from './roles';

export interface ExportInput {
  palette: string[];
  light: Roles;
  dark: Roles;
  fonts: FontPair;
}

// [token name, role, comment]
const TOKENS: [string, keyof Roles, string][] = [
  ['background', 'background', 'page background'],
  ['foreground', 'text', 'headings and body text'],
  ['muted-foreground', 'mutedText', 'secondary text'],
  ['card', 'surface', 'cards and panels'],
  ['border', 'border', 'dividers and outlines'],
  ['primary', 'primary', 'buttons and brand fills'],
  ['primary-foreground', 'onPrimary', 'text on primary'],
  ['primary-text', 'primaryText', 'links (readable shade of primary)'],
  ['accent', 'accent', 'badges and highlights'],
  ['accent-foreground', 'onAccent', 'text on accent'],
  ['accent-text', 'accentText', 'large accent text'],
];

const tokenLines = (roles: Roles, prefix: string, indent: string, withComments: boolean) =>
  TOKENS.map(([name, role, comment]) =>
    `${indent}--${prefix}${name}: ${roles[role]};${withComments ? ` /* ${comment} */` : ''}`
  ).join('\n');

const fontLines = (fonts: FontPair, prefix: string, indent: string) =>
  `${indent}--${prefix}heading: ${fontStack(fonts.heading)};\n${indent}--${prefix}body: ${fontStack(fonts.body)};`;

export function cssVariables({ palette, light, dark, fonts }: ExportInput): string {
  return `:root {
  /* Palette */
${palette.map((hex, i) => `  --palette-${i + 1}: ${hex};`).join('\n')}

  /* Roles */
${tokenLines(light, '', '  ', true)}

  /* Fonts */
${fontLines(fonts, 'font-', '  ')}
}

/* Dark mode (remove if you only need light) */
@media (prefers-color-scheme: dark) {
  :root {
${tokenLines(dark, '', '    ', false)}
  }
}

/* Optional base styles */
body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-body);
  font-weight: ${fonts.body.weight};
}
h1, h2, h3 {
  font-family: var(--font-heading);
  font-weight: ${fonts.heading.weight};
}
a {
  color: var(--primary-text);
}
`;
}

export function tailwindV4({ palette, light, dark, fonts }: ExportInput): string {
  return `@import "tailwindcss";

/* Use as bg-primary, text-primary-foreground, text-primary-text, font-heading... */
@theme {
${tokenLines(light, 'color-', '  ', false)}
${palette.map((hex, i) => `  --color-palette-${i + 1}: ${hex};`).join('\n')}

${fontLines(fonts, 'font-', '  ')}
}

/* Dark mode (remove if you only need light) */
@media (prefers-color-scheme: dark) {
  :root {
${tokenLines(dark, 'color-', '    ', false)}
  }
}
`;
}

// Tailwind v3 joins fontFamily entries with commas, so multi-word names need their own quotes
const v3FontFamily = (font: FontSpec) => {
  const fallback = font.category === 'serif' ? ["'Georgia'", "'serif'"] : ["'system-ui'", "'sans-serif'"];
  const name = font.family.includes(' ') ? `'"${font.family}"'` : `'${font.family}'`;
  return `[${name}, ${fallback.join(', ')}]`;
};

export function tailwindV3({ palette, light, fonts }: ExportInput): string {
  const c = (role: keyof Roles) => `'${light[role]}'`;
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      // Use as bg-primary, text-primary-foreground, text-primary-text, font-heading...
      colors: {
        background: ${c('background')},
        foreground: ${c('text')},
        'muted-foreground': ${c('mutedText')},
        card: ${c('surface')},
        border: ${c('border')},
        primary: { DEFAULT: ${c('primary')}, foreground: ${c('onPrimary')}, text: ${c('primaryText')} },
        accent: { DEFAULT: ${c('accent')}, foreground: ${c('onAccent')}, text: ${c('accentText')} },
        palette: { ${palette.map((hex, i) => `${i + 1}: '${hex}'`).join(', ')} },
      },
      fontFamily: {
        heading: ${v3FontFamily(fonts.heading)},
        body: ${v3FontFamily(fonts.body)},
      },
    },
  },
};
`;
}

export function googleFontsEmbed(fonts: FontPair): string {
  const href = googleFontsHref(fonts);
  return `<!-- Paste inside <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${href}" rel="stylesheet">

<!-- Or, in CSS -->
@import url('${href}');

/* ${fonts.heading.family} for headings, ${fonts.body.family} for body text */
`;
}
