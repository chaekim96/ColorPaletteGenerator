// Shareable state <-> URL query string. No database: the link is the palette.
import { getFontPair } from './fonts';
import { MAX_COLORS, MIN_COLORS, VIBES, VibeId } from './palette';

export interface ShareState {
  colors?: string[]; // '#rrggbb'
  fonts?: string; // font pair id
  vibe?: VibeId;
  base?: string; // '#rrggbb'
  view?: 'palette' | 'preview';
  mode?: 'light' | 'dark';
  gradient?: boolean;
  count?: number; // legacy links without colors
}

const HEX6 = /^[0-9a-f]{6}$/i;

/** Query string (without '?'); defaults are omitted to keep links short. */
export function encodeShareState(state: ShareState): string {
  const params = new URLSearchParams();
  if (state.colors?.length) params.set('colors', state.colors.map(hex => hex.replace('#', '').toLowerCase()).join('-'));
  if (state.fonts) params.set('fonts', state.fonts);
  if (state.vibe) params.set('vibe', state.vibe);
  if (state.base) params.set('base', state.base.replace('#', '').toLowerCase());
  if (state.view === 'preview') params.set('view', 'preview');
  if (state.mode === 'dark') params.set('mode', 'dark');
  if (state.gradient) params.set('gradient', 'true');
  // URLSearchParams encodes '-' fine; keep the result readable
  return params.toString();
}

/** Parse a query string, dropping anything invalid. Accepts legacy ?colors=&gradient=&count= links. */
export function decodeShareState(search: string): ShareState {
  const params = new URLSearchParams(search);
  const state: ShareState = {};

  const colors = params.get('colors')?.split('-');
  if (colors && colors.length >= 2 && colors.length <= 10 && colors.every(hex => HEX6.test(hex))) {
    state.colors = colors.map(hex => `#${hex.toLowerCase()}`);
  }

  const fonts = params.get('fonts');
  if (fonts && getFontPair(fonts)) state.fonts = fonts;

  const vibe = params.get('vibe');
  if (vibe && VIBES.some(v => v.id === vibe)) state.vibe = vibe as VibeId;

  const base = params.get('base');
  if (base && HEX6.test(base)) state.base = `#${base.toLowerCase()}`;

  if (params.get('view') === 'preview') state.view = 'preview';
  if (params.get('mode') === 'dark') state.mode = 'dark';
  if (params.get('gradient') === 'true') state.gradient = true;

  const count = Number(params.get('count'));
  if (!state.colors && Number.isInteger(count) && count >= MIN_COLORS && count <= MAX_COLORS) state.count = count;

  return state;
}
