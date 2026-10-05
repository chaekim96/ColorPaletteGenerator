// Curated Google Fonts heading/body pairings, tagged by vibe.
import { VibeId } from './palette';

export interface FontSpec {
  family: string;
  weight: number; // weight used for this role
  category: 'sans-serif' | 'serif' | 'display';
}

export interface FontPair {
  id: string;
  heading: FontSpec;
  body: FontSpec;
  vibes: VibeId[]; // first entry is the primary fit
  note: string;
}

const sans = (family: string, weight = 400): FontSpec => ({ family, weight, category: 'sans-serif' });
const serif = (family: string, weight = 400): FontSpec => ({ family, weight, category: 'serif' });
const display = (family: string, weight = 400): FontSpec => ({ family, weight, category: 'display' });

export const FONT_PAIRS: FontPair[] = [
  // Trustworthy
  { id: 'manrope-inter', heading: sans('Manrope', 700), body: sans('Inter'), vibes: ['trustworthy', 'calm'], note: 'Clean, modern SaaS' },
  { id: 'plex-sans-serif', heading: sans('IBM Plex Sans', 600), body: serif('IBM Plex Serif'), vibes: ['trustworthy', 'premium'], note: 'Engineered and editorial' },
  { id: 'jakarta-inter', heading: sans('Plus Jakarta Sans', 700), body: sans('Inter'), vibes: ['trustworthy'], note: 'Friendly fintech' },
  { id: 'merriweather-opensans', heading: serif('Merriweather', 700), body: sans('Open Sans'), vibes: ['trustworthy', 'earthy'], note: 'Established and credible' },
  { id: 'sourceserif-sourcesans', heading: serif('Source Serif 4', 600), body: sans('Source Sans 3'), vibes: ['trustworthy', 'calm'], note: 'Healthcare and legal classic' },
  // Playful
  { id: 'fredoka-nunito', heading: display('Fredoka', 600), body: sans('Nunito'), vibes: ['playful'], note: 'Rounded and warm' },
  { id: 'baloo-nunitosans', heading: display('Baloo 2', 700), body: sans('Nunito Sans'), vibes: ['playful'], note: 'Chunky and cheerful' },
  { id: 'poppins-karla', heading: sans('Poppins', 600), body: sans('Karla'), vibes: ['playful', 'bold'], note: 'Geometric consumer app' },
  { id: 'lilita-quicksand', heading: display('Lilita One'), body: sans('Quicksand', 500), vibes: ['playful'], note: 'Food, kids and games' },
  { id: 'bricolage-dmsans', heading: sans('Bricolage Grotesque', 700), body: sans('DM Sans'), vibes: ['playful', 'bold'], note: 'Quirky and current' },
  // Premium
  { id: 'playfair-sourcesans', heading: serif('Playfair Display', 600), body: sans('Source Sans 3'), vibes: ['premium', 'romantic'], note: 'High-contrast elegance' },
  { id: 'cormorant-montserrat', heading: serif('Cormorant Garamond', 600), body: sans('Montserrat'), vibes: ['premium', 'romantic'], note: 'Fashion and beauty' },
  { id: 'dmserif-dmsans', heading: serif('DM Serif Display'), body: sans('DM Sans'), vibes: ['premium', 'trustworthy', 'romantic'], note: 'Polished boutique' },
  { id: 'bodoni-jost', heading: serif('Bodoni Moda', 600), body: sans('Jost'), vibes: ['premium', 'bold'], note: 'Magazine luxury' },
  { id: 'marcellus-raleway', heading: serif('Marcellus'), body: sans('Raleway'), vibes: ['premium', 'calm', 'romantic'], note: 'Hospitality and spa' },
  // Calm
  { id: 'lora-mulish', heading: serif('Lora', 600), body: sans('Mulish'), vibes: ['calm', 'earthy', 'romantic'], note: 'Gentle and readable' },
  { id: 'newsreader-inter', heading: serif('Newsreader', 500), body: sans('Inter'), vibes: ['calm', 'trustworthy', 'earthy'], note: 'Thoughtful and literary' },
  { id: 'outfit-figtree', heading: sans('Outfit', 500), body: sans('Figtree'), vibes: ['calm', 'playful'], note: 'Soft, airy wellness' },
  { id: 'fraunces-worksans', heading: serif('Fraunces', 600), body: sans('Work Sans'), vibes: ['earthy', 'calm', 'premium'], note: 'Organic and crafted' },
  { id: 'crimson-lato', heading: serif('Crimson Pro', 600), body: sans('Lato'), vibes: ['calm', 'earthy'], note: 'Quiet and classic' },
  // Bold
  { id: 'archivo', heading: display('Archivo Black'), body: sans('Archivo'), vibes: ['bold'], note: 'Heavy and confident' },
  { id: 'spacegrotesk-inter', heading: sans('Space Grotesk', 700), body: sans('Inter'), vibes: ['bold', 'trustworthy'], note: 'Techy and sharp' },
  { id: 'anton-roboto', heading: display('Anton'), body: sans('Roboto'), vibes: ['bold'], note: 'Loud condensed headlines' },
  { id: 'bebas-montserrat', heading: display('Bebas Neue'), body: sans('Montserrat'), vibes: ['bold'], note: 'Sports and events' },
  { id: 'syne-manrope', heading: sans('Syne', 700), body: sans('Manrope'), vibes: ['bold', 'premium'], note: 'Art-directed and unusual' },
];

export function getFontPair(id: string): FontPair | undefined {
  return FONT_PAIRS.find(pair => pair.id === id);
}

export function pairsForVibe(vibe: VibeId): FontPair[] {
  return FONT_PAIRS.filter(pair => pair.vibes.includes(vibe));
}

/** Random pairing for a vibe, avoiding `currentId` when there is an alternative. */
export function pickPair(vibe: VibeId, currentId?: string, rand: () => number = Math.random): FontPair {
  const options = pairsForVibe(vibe);
  const others = options.filter(pair => pair.id !== currentId);
  const pool = others.length > 0 ? others : options;
  return pool[Math.floor(rand() * pool.length)];
}

/** CSS font-family value with a sensible fallback. */
export function fontStack(font: FontSpec): string {
  const fallback = font.category === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif';
  return `'${font.family}', ${fallback}`;
}

/** Google Fonts CSS2 URL loading both fonts (body also gets 700 for bold text). */
export function googleFontsHref(pair: FontPair): string {
  const weights = new Map<string, Set<number>>();
  const add = (family: string, ...ws: number[]) => {
    const set = weights.get(family) ?? new Set<number>();
    ws.forEach(w => set.add(w));
    weights.set(family, set);
  };
  add(pair.heading.family, pair.heading.weight);
  add(pair.body.family, pair.body.weight, 700);
  const families = [...weights].map(([family, ws]) =>
    `family=${family.replace(/ /g, '+')}:wght@${[...ws].sort((a, b) => a - b).join(';')}`
  );
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

/** Inject the stylesheet for a pairing once. */
export function loadFontPair(pair: FontPair): void {
  const href = googleFontsHref(pair);
  if (document.querySelector(`link[data-font-pair="${pair.id}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.fontPair = pair.id;
  document.head.appendChild(link);
}
