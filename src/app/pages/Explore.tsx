import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ExternalLink, House, Moon, Shuffle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { linkProps, navigate } from '../router';
import { encodeShareState } from '../utils/shareUrl';
import { colorFamilyTrends, darkModeShare, moodLabel, moodTrends, ScannedSite, siteMood, TrendingData, TrendMood } from '../utils/trending';
import trendingJson from '../../data/trending.json';

const trending = trendingJson as TrendingData;
const pct = (x: number) => `${Math.round(x * 100)}%`;
const formatDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

function openInGenerator(site: ScannedSite) {
  const mood = siteMood(site);
  navigate(`/generate?${encodeShareState({ colors: site.colors, vibe: mood === 'minimal' ? undefined : mood, mode: site.mode })}`);
}

function FilterChips<T extends string>({ label, options, value, onChange, format }: {
  label: string; options: T[]; value: T | 'all'; onChange: (v: T | 'all') => void; format: (v: T) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={label}>
      <span className="text-sm text-gray-600 mr-1">{label}</span>
      {(['all', ...options] as (T | 'all')[]).map(o => (
        <Button key={o} size="sm" variant={value === o ? 'default' : 'outline'} aria-pressed={value === o} onClick={() => onChange(o)}>
          {o === 'all' ? 'All' : format(o)}
        </Button>
      ))}
    </div>
  );
}

// "What startups are using": weekly scan of real product websites, with trends and reusable palettes
export function Explore() {
  useEffect(() => { document.title = 'Trending palettes · Color Palette Generator'; }, []);
  const [mood, setMood] = useState<TrendMood | 'all'>('all');
  const [category, setCategory] = useState<string | 'all'>('all');

  const moods = useMemo(() => moodTrends(trending), []);
  const families = useMemo(() => colorFamilyTrends(trending.sites).slice(0, 6), []);
  const categories = useMemo(() => [...new Set(trending.sites.map(s => s.category))].sort(), []);
  const maxShare = Math.max(...moods.map(m => m.share), 0.01);
  const visible = trending.sites.filter(s => (mood === 'all' || siteMood(s) === mood) && (category === 'all' || s.category === category));

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="max-w-6xl mx-auto px-6 pt-6 flex items-center justify-between">
        <Button variant="ghost" asChild className="gap-1.5">
          <a {...linkProps('/')}><House className="h-4 w-4" />Home</a>
        </Button>
        <Button asChild className="gap-1.5">
          <a {...linkProps('/generate')}><Shuffle className="h-4 w-4" />Generate your own</a>
        </Button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">What startups are using</h1>
          <p className="mt-3 text-gray-600">
            Brand colors read from the live homepages of {trending.sites.length} startups and products, refreshed weekly.
            {trending.scannedAt && <> Last scan: {formatDate(trending.scannedAt)}.</>}
          </p>
        </header>

        {trending.sites.length === 0 ? (
          <p className="mt-10 text-gray-600">The first scan hasn't run yet.</p>
        ) : (
          <>
            {/* Trend summary */}
            <section className="mt-8 grid gap-4 lg:grid-cols-3" aria-label="Trends">
              <div className="rounded-xl border bg-white p-5 lg:col-span-2">
                <h2 className="text-sm font-medium text-gray-900">Most common moods</h2>
                <p className="text-xs text-gray-600">
                  Share of sites by the mood of their main brand color
                  {trending.previous && <> · change since {formatDate(trending.previous.scannedAt)}</>}
                </p>
                <ul className="mt-4 space-y-2">
                  {moods.map(m => (
                    <li key={m.mood} className="grid grid-cols-[7rem_1fr_6.5rem] items-center gap-3 text-sm">
                      <button type="button" onClick={() => setMood(m.mood)} className="text-left text-gray-900 hover:underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded">
                        {moodLabel(m.mood)}
                      </button>
                      <div className="h-3 rounded-r bg-gray-100" title={`${moodLabel(m.mood)}: ${m.count} of ${trending.sites.length} sites (${pct(m.share)})`}>
                        <div className="h-3 rounded-r bg-gray-800" style={{ width: `${(m.share / maxShare) * 100}%` }} />
                      </div>
                      <span className="text-gray-700 tabular-nums">
                        {pct(m.share)}
                        {m.delta !== undefined && Math.abs(m.delta) >= 0.005 && (
                          <span className={m.delta > 0 ? 'text-emerald-800' : 'text-gray-600'}> {m.delta > 0 ? '▲' : '▼'} {pct(Math.abs(m.delta))}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border bg-white p-5 space-y-5">
                <div>
                  <h2 className="text-sm font-medium text-gray-900">Popular brand colors</h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {families.map(f => (
                      <li key={f.family} className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm">
                        <span className="h-3.5 w-3.5 rounded-sm border border-black/10" style={{ backgroundColor: f.sample }} aria-hidden="true" />
                        <span className="capitalize text-gray-900">{f.family}</span>
                        <span className="text-gray-600 tabular-nums">{pct(f.share)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Moon className="h-4 w-4" />
                  {pct(darkModeShare(trending.sites))} of homepages are dark
                </div>
              </div>
            </section>

            {/* Filters */}
            <div className="mt-8 space-y-2">
              <FilterChips label="Mood" options={moods.map(m => m.mood)} value={mood} onChange={setMood} format={moodLabel} />
              <FilterChips label="Industry" options={categories} value={category} onChange={setCategory} format={c => c} />
            </div>

            {/* Site palettes */}
            <p className="mt-6 text-sm text-gray-600">{visible.length} {visible.length === 1 ? 'site' : 'sites'}</p>
            <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map(site => (
                <li key={site.url} className="flex flex-col rounded-xl border bg-white overflow-hidden">
                  <div className="flex h-20">
                    {site.colors.map((hex, i) => <span key={i} className="flex-1" style={{ backgroundColor: hex }} title={hex} />)}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{site.name}</h3>
                        <a href={site.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-gray-600 hover:underline">
                          {new URL(site.url).hostname.replace(/^www\./, '')}
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1">
                        <Badge variant="secondary">{moodLabel(siteMood(site))}</Badge>
                        {site.mode === 'dark' && <Badge variant="outline">Dark</Badge>}
                      </div>
                    </div>
                    <p className="font-mono text-xs text-gray-600">{site.colors.join(' ')}</p>
                    <Button variant="outline" size="sm" className="mt-auto gap-1.5 self-start" onClick={() => openInGenerator(site)}>
                      Use this palette <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-10 text-xs text-gray-600 max-w-2xl">
              Colors are read from each site's public homepage and shown for inspiration. Company names belong to their owners;
              this page isn't affiliated with or endorsed by them.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
