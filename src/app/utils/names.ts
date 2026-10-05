// Evocative, deterministic palette names ("Velvet Plum", "Misty Lagoon"), so a palette is memorable
// and shareable. Same colors always give the same name, so share links need no extra parameter.
import { hexToOklch, inferVibe, VibeId } from './palette';

const MOOD_WORDS: Record<VibeId, string[]> = {
  trustworthy: ['Steady', 'Clear', 'True', 'Civic', 'Anchor', 'Harbor'],
  playful: ['Sunny', 'Fizzy', 'Bouncy', 'Lucky', 'Pop', 'Sherbet'],
  premium: ['Velvet', 'Midnight', 'Gilded', 'Noble', 'Evening', 'Satin'],
  calm: ['Still', 'Misty', 'Gentle', 'Morning', 'Quiet', 'Drift'],
  earthy: ['Sunbaked', 'Rustic', 'Harvest', 'Canyon', 'Field', 'Hearth'],
  romantic: ['Blush', 'Petal', 'Dusky', 'Tender', 'Rosy', 'Twilight'],
  bold: ['Electric', 'Daring', 'Loud', 'Rebel', 'Volt', 'Neon'],
};

type Family = 'pink' | 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'violet' | 'neutral';

const COLOR_WORDS: Record<Family, string[]> = {
  pink: ['Peony', 'Rose', 'Blossom', 'Flamingo', 'Orchid'],
  red: ['Ember', 'Cherry', 'Brick', 'Poppy', 'Ruby'],
  orange: ['Apricot', 'Clay', 'Marigold', 'Copper', 'Tangerine'],
  yellow: ['Lemon', 'Honey', 'Saffron', 'Wheat', 'Olive'],
  green: ['Fern', 'Moss', 'Pine', 'Sage', 'Meadow'],
  teal: ['Lagoon', 'Tide', 'Jade', 'Reef', 'Spruce'],
  blue: ['Cobalt', 'Sky', 'Denim', 'Ocean', 'Slate'],
  violet: ['Iris', 'Plum', 'Lilac', 'Amethyst', 'Dusk'],
  neutral: ['Stone', 'Linen', 'Ink', 'Chalk', 'Pebble'],
};

/** OKLCH hue buckets (OKLCH hues differ from HSL: pink ~350, red ~27, yellow ~100, blue ~260). */
export function hueFamily(hex: string): Family {
  const { c, h } = hexToOklch(hex);
  if (c < 0.03) return 'neutral';
  if (h >= 320 || h < 10) return 'pink';
  if (h < 45) return 'red';
  if (h < 80) return 'orange';
  if (h < 115) return 'yellow';
  if (h < 165) return 'green';
  if (h < 215) return 'teal';
  if (h < 275) return 'blue';
  return 'violet';
}

const hash = (text: string) => [...text].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7);

/** Name from the palette's vibe (chosen or inferred) and its primary color's hue. */
export function paletteName(hexes: string[], primaryHex: string, vibe?: VibeId): string {
  const seed = hash(hexes.join('').toLowerCase());
  const moods = MOOD_WORDS[vibe ?? inferVibe(primaryHex)];
  const colors = COLOR_WORDS[hueFamily(primaryHex)];
  const mood = moods[seed % moods.length];
  const color = colors[Math.floor(seed / moods.length) % colors.length];
  return mood === color ? `${mood} ${colors[(colors.indexOf(color) + 1) % colors.length]}` : `${mood} ${color}`;
}
