// Turn a plain-English project description into palette settings using keyword matching.
import { hexToOklch, normalizeHex, oklchToHex, VibeId, getVibe } from './palette';

// Industry and mood words that point to a vibe. Multi-word phrases are matched first.
const VIBE_WORDS: Record<VibeId, string[]> = {
  trustworthy: [
    'trust', 'trustworthy', 'reliable', 'secure', 'security', 'safe', 'safety', 'bank', 'banking', 'fintech',
    'finance', 'financial', 'payments', 'insurance', 'legal', 'law', 'lawyer', 'enterprise', 'b2b', 'saas',
    'corporate', 'professional', 'healthcare', 'health', 'medical', 'clinic', 'doctor', 'dental', 'consulting',
    'accounting', 'tax', 'government', 'data', 'analytics', 'cloud', 'infrastructure', 'devtools', 'developer',
    'developers', 'compliance', 'stable', 'serious', 'credible', 'cybersecurity', 'hr', 'recruiting', 'logistics',
  ],
  playful: [
    'fun', 'playful', 'friendly', 'kids', 'kid', 'children', 'family', 'families', 'game', 'games', 'toy', 'toys',
    'candy', 'food', 'snack', 'snacks', 'dessert', 'ice cream', 'pet', 'pets', 'dog', 'cat', 'party',
    'social', 'creative', 'cheerful', 'happy', 'quirky', 'whimsical', 'youthful', 'young', 'gen z', 'colorful',
    'community', 'school', 'learning', 'cute', 'approachable', 'events',
  ],
  premium: [
    'luxury', 'luxurious', 'premium', 'elegant', 'sophisticated', 'high-end', 'high end', 'upscale', 'fashion',
    'jewelry', 'jewellery', 'wine', 'winery', 'spirits', 'whiskey', 'cocktail', 'hotel', 'boutique', 'exclusive',
    'refined', 'classy', 'timeless', 'real estate', 'watch', 'watches', 'beauty', 'cosmetics', 'perfume',
    'fragrance', 'architecture', 'private', 'concierge', 'wealth', 'black',
  ],
  earthy: [
    'earthy', 'rustic', 'warm', 'cozy', 'nature', 'natural', 'organic', 'sustainable', 'sustainability', 'eco',
    'plant', 'plants', 'garden', 'gardening', 'farm', 'farmers', 'coffee', 'cafe', 'café', 'bakery', 'bread',
    'chocolate', 'craft', 'handmade', 'artisan', 'ceramics', 'pottery', 'leather', 'home decor', 'furniture',
    'interior', 'interiors', 'outdoors', 'outdoor', 'hiking', 'camping', 'vintage', 'retro', 'boho', 'grounded',
  ],
  romantic: [
    'romantic', 'romance', 'wedding', 'weddings', 'bridal', 'bride', 'florist', 'flowers', 'floral', 'feminine',
    'dating', 'love', 'valentine', 'dreamy', 'delicate', 'soft pink', 'blush', 'lingerie', 'stationery', 'invitations',
    'event planning', 'nail', 'nails', 'salon',
  ],
  calm: [
    'calm', 'peaceful', 'serene', 'relaxing', 'relaxed', 'soothing', 'gentle', 'soft', 'wellness', 'wellbeing',
    'mindfulness', 'mindful', 'meditation', 'yoga', 'spa', 'sleep', 'mental health', 'therapy', 'therapist',
    'tea', 'skincare', 'clean', 'airy', 'quiet', 'journal', 'journaling', 'care', 'caring', 'muted', 'pastel',
  ],
  bold: [
    'bold', 'loud', 'energetic', 'energy', 'edgy', 'daring', 'vibrant', 'powerful', 'strong', 'fitness', 'gym',
    'sports', 'sport', 'athletic', 'music', 'festival', 'streetwear', 'media', 'news', 'launch', 'disruptive',
    'crypto', 'web3', 'esports', 'nightlife', 'dynamic', 'rebellious', 'punk', 'neon', 'electric', 'fast',
    'competitive', 'gaming', 'hype', 'standout', 'stand out', 'restaurant', 'food delivery', 'delivery', 'street food',
  ],
};

// Brand-friendly versions of common color names (not raw CSS keywords, which are often harsh)
const COLOR_NAMES: Record<string, string> = {
  red: '#dc2626', crimson: '#b91c1c', scarlet: '#e0301e', burgundy: '#7f1d1d', maroon: '#7a1f2b',
  coral: '#ff7f61', salmon: '#fa8072', terracotta: '#c8553d', rust: '#b7410e',
  orange: '#f97316', peach: '#fbb48a', apricot: '#f9a66c', amber: '#f59e0b',
  gold: '#c9a227', golden: '#c9a227', yellow: '#facc15', mustard: '#d4a017', lemon: '#fde047',
  lime: '#84cc16', green: '#16a34a', forest: '#1f5f3f', 'forest green': '#1f5f3f', emerald: '#059669',
  mint: '#6ee7b7', sage: '#9caf88', olive: '#6b7a2f', moss: '#5c6e3a',
  teal: '#0d9488', turquoise: '#14b8a6', aqua: '#22d3ee', cyan: '#06b6d4',
  sky: '#38bdf8', 'sky blue': '#38bdf8', blue: '#2563eb', navy: '#1e3a8a', 'navy blue': '#1e3a8a',
  cobalt: '#0047ab', 'royal blue': '#2952cc', indigo: '#4f46e5',
  purple: '#7c3aed', violet: '#8b5cf6', lavender: '#b8a9e3', lilac: '#c8a2c8', plum: '#6b2d5c',
  magenta: '#c026d3', fuchsia: '#d946ef', pink: '#ec4899', 'hot pink': '#ff3e9a', rose: '#e11d48', blush: '#e8b4b8',
  brown: '#7c4a2d', chocolate: '#5d3a1a', tan: '#c8a27c', caramel: '#c68e4e',
  sand: '#d2bc94', clay: '#b66a50', ochre: '#c8892c', sienna: '#a0522d', mauve: '#b07a95', 'dusty rose': '#c48b8f',
  periwinkle: '#8b8fd8', slate: '#5f6f82',
};

type Modifier = 'darker' | 'lighter' | 'brighter' | 'muted';

const MODIFIERS: Record<string, Modifier> = {
  dark: 'darker', deep: 'darker', rich: 'darker',
  light: 'lighter', pale: 'lighter', pastel: 'lighter', soft: 'lighter', baby: 'lighter',
  bright: 'brighter', vibrant: 'brighter', neon: 'brighter', electric: 'brighter', vivid: 'brighter',
  muted: 'muted', dusty: 'muted', earthy: 'muted', desaturated: 'muted',
};

function applyModifier(hex: string, modifier: Modifier): string {
  const color = hexToOklch(hex);
  switch (modifier) {
    case 'darker': return oklchToHex({ ...color, l: color.l - 0.15 });
    case 'lighter': return oklchToHex({ ...color, l: Math.min(0.9, color.l + 0.15), c: color.c * 0.6 });
    case 'brighter': return oklchToHex({ ...color, c: color.c * 1.3 });
    case 'muted': return oklchToHex({ ...color, c: color.c * 0.5 });
  }
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const phraseRegex = (phrase: string) => new RegExp(`(^|[^a-z0-9-])${escape(phrase)}($|[^a-z0-9-])`);

export interface DescribeResult {
  vibe?: VibeId;
  baseHex?: string;
  /** Human-readable explanation of what was picked up, e.g. "fintech → Trustworthy" */
  matches: string[];
}

export function describeToSettings(text: string): DescribeResult {
  const input = ` ${text.toLowerCase()} `;
  const matches: string[] = [];

  // Vibe: most keyword hits wins; ties go to the earliest mention
  let best: { vibe: VibeId; hits: string[]; firstIndex: number } | undefined;
  for (const [vibe, words] of Object.entries(VIBE_WORDS) as [VibeId, string[]][]) {
    const hits = words.filter(word => phraseRegex(word).test(input));
    if (hits.length === 0) continue;
    const firstIndex = Math.min(...hits.map(word => input.search(phraseRegex(word))));
    if (!best || hits.length > best.hits.length || (hits.length === best.hits.length && firstIndex < best.firstIndex)) {
      best = { vibe, hits, firstIndex };
    }
  }
  if (best) matches.push(`${best.hits.slice(0, 3).join(', ')} → ${getVibe(best.vibe).label}`);

  // Base color: an explicit hex code wins, otherwise the first color name mentioned
  let baseHex: string | undefined;
  const hexMatch = input.match(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/);
  if (hexMatch) {
    baseHex = normalizeHex(hexMatch[0]) ?? undefined;
    if (baseHex) matches.push(`${hexMatch[0]} → base color`);
  } else {
    const names = Object.keys(COLOR_NAMES).sort((a, b) => b.length - a.length); // "navy blue" before "blue"
    let first: { name: string; index: number } | undefined;
    for (const name of names) {
      const index = input.search(phraseRegex(name));
      if (index !== -1 && (!first || index < first.index)) first = { name, index };
    }
    if (first) {
      const before = input.slice(0, first.index + 1).trim().split(/\s+/).pop() ?? '';
      const modifier = MODIFIERS[before];
      baseHex = modifier ? applyModifier(COLOR_NAMES[first.name], modifier) : COLOR_NAMES[first.name];
      matches.push(`${modifier ? `${before} ` : ''}${first.name} → base color`);
    }
  }

  return { vibe: best?.vibe, baseHex, matches };
}
