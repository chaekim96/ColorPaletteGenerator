import { describe, expect, it } from 'vitest';
import { colorFamilyTrends, darkModeShare, moodTrends, siteMood, ScannedSite, TrendingData } from './trending';

const site = (name: string, primary: string, mode: 'light' | 'dark' = 'light'): ScannedSite =>
  ({ name, url: `https://${name}.com`, category: 'Test', colors: ['#111111', primary, '#ffffff'], mode });

const sites = [
  site('a', '#3b6ea5'), // trustworthy blue
  site('b', '#2f6f9f'), // trustworthy blue
  site('c', '#888888', 'dark'), // minimal gray
  site('d', '#c0633f'), // earthy terracotta
];

describe('trending', () => {
  it('classifies black-and-white sites as minimal and others by brand color mood', () => {
    expect(siteMood(sites[2])).toBe('minimal');
    expect(siteMood(sites[3])).toBe('earthy');
  });

  it('ranks moods by share, with counts', () => {
    const trends = moodTrends({ scannedAt: '2026-10-05', sites });
    expect(trends[0]).toMatchObject({ share: 0.5, count: 2 });
    expect(trends.reduce((sum, t) => sum + t.share, 0)).toBeCloseTo(1);
    expect(trends[0].delta).toBeUndefined();
  });

  it('reports change since the previous scan', () => {
    const data: TrendingData = { scannedAt: '2026-10-12', sites, previous: { scannedAt: '2026-10-05', moods: { minimal: 0.5 } } };
    const minimal = moodTrends(data).find(t => t.mood === 'minimal')!;
    expect(minimal.delta).toBeCloseTo(-0.25);
    const earthy = moodTrends(data).find(t => t.mood === 'earthy')!;
    expect(earthy.delta).toBeCloseTo(0.25); // new mood counts from zero
  });

  it('summarizes brand color families and dark homepages', () => {
    expect(colorFamilyTrends(sites)[0]).toMatchObject({ family: 'blue', share: 0.5 });
    expect(darkModeShare(sites)).toBe(0.25);
    expect(darkModeShare([])).toBe(0);
  });
});
