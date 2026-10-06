// "What startups are using": mood and color trends across the weekly site scan.
import { getVibe, hexToOklch, inferVibe, VibeId } from './palette';
import { hueFamily } from './names';

export type TrendMood = VibeId | 'minimal';

export interface ScannedSite {
  name: string;
  url: string;
  category: string;
  colors: string[]; // dark, primary, accents..., light
  mode: 'light' | 'dark';
}

export interface TrendingData {
  scannedAt: string; // ISO date
  sites: ScannedSite[];
  previous?: { scannedAt: string; moods: Partial<Record<TrendMood, number>> };
}

export const moodLabel = (mood: TrendMood) => (mood === 'minimal' ? 'Minimal' : getVibe(mood).label);

/** Black-and-white sites read as "minimal"; otherwise the mood of their main brand color. */
export function siteMood(site: ScannedSite): TrendMood {
  const primary = site.colors[1];
  return hexToOklch(primary).c < 0.03 ? 'minimal' : inferVibe(primary);
}

export function moodShares(sites: ScannedSite[]): Partial<Record<TrendMood, number>> {
  const shares: Partial<Record<TrendMood, number>> = {};
  sites.forEach(s => { const m = siteMood(s); shares[m] = (shares[m] ?? 0) + 1 / sites.length; });
  return shares;
}

export interface MoodTrend { mood: TrendMood; share: number; delta?: number; count: number }

/** Moods ranked by share, with change since the previous scan when there is one. */
export function moodTrends(data: TrendingData): MoodTrend[] {
  const now = moodShares(data.sites);
  const counts: Partial<Record<TrendMood, number>> = {};
  data.sites.forEach(s => { const m = siteMood(s); counts[m] = (counts[m] ?? 0) + 1; });
  return (Object.keys(now) as TrendMood[])
    .map(mood => ({
      mood,
      share: now[mood]!,
      count: counts[mood]!,
      delta: data.previous ? now[mood]! - (data.previous.moods[mood] ?? 0) : undefined,
    }))
    .sort((a, b) => b.share - a.share);
}

/** Most common brand-color families (e.g. blue 34%). */
export function colorFamilyTrends(sites: ScannedSite[]): { family: string; share: number; sample: string }[] {
  const groups = new Map<string, string[]>();
  sites.forEach(s => {
    const family = hueFamily(s.colors[1]);
    groups.set(family, [...(groups.get(family) ?? []), s.colors[1]]);
  });
  return [...groups]
    .map(([family, hexes]) => ({ family, share: hexes.length / sites.length, sample: hexes[0] }))
    .sort((a, b) => b.share - a.share);
}

export const darkModeShare = (sites: ScannedSite[]) => sites.filter(s => s.mode === 'dark').length / Math.max(1, sites.length);
