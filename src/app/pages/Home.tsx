import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Shuffle, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { describeToSettings } from '../utils/describe';
import { encodeShareState } from '../utils/shareUrl';
import { generatePalette, VibeId } from '../utils/palette';
import { linkProps, navigate } from '../router';
import { moodLabel, moodTrends, TrendingData } from '../utils/trending';
import trendingJson from '../../data/trending.json';

const trending = trendingJson as TrendingData;

function Strip({ colors, label }: { colors: string[]; label?: string }) {
  return (
    <div>
      <div className="flex h-10 overflow-hidden rounded-md border border-black/5">
        {colors.map((hex, i) => <span key={i} className="flex-1" style={{ backgroundColor: hex }} />)}
      </div>
      {label && <p className="mt-1 text-xs text-gray-600">{label}</p>}
    </div>
  );
}

// Landing page: two clear paths, generate your own or explore what real startups use
export function Home() {
  useEffect(() => { document.title = 'Color Palette Generator'; }, []);
  const [text, setText] = useState('');
  const samples = useMemo(
    () => (['trustworthy', 'earthy', 'bold'] as VibeId[]).map(vibe => ({ vibe, colors: generatePalette({ vibe }).map(c => c.hex) })),
    [],
  );
  const topMood = trending.sites.length ? moodTrends(trending)[0] : undefined;

  const start = (e: React.FormEvent) => {
    e.preventDefault();
    const { vibe, baseHex } = describeToSettings(text);
    navigate(`/generate?${encodeShareState({ vibe, base: baseHex })}`);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <header className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">Colors and fonts for your startup, in minutes</h1>
          <p className="mt-4 text-lg text-gray-600">
            No design background needed. Generate a palette that passes accessibility checks, or see what real startups are using right now.
          </p>
          <form onSubmit={start} className="mt-8 flex gap-2">
            <label htmlFor="home-describe" className="sr-only">What are you building?</label>
            <Input
              id="home-describe"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="What are you building? e.g. coffee subscription, warm and earthy"
              className="h-11 bg-white text-base"
              autoComplete="off"
            />
            <Button type="submit" className="h-11 gap-2 px-5">
              <Sparkles className="h-4 w-4" />
              Start
            </Button>
          </form>
        </header>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <a {...linkProps('/generate')} className="group flex flex-col rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-white"><Shuffle className="h-4 w-4" /></span>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Generate a palette</h2>
            <p className="mt-1 text-gray-600">Pick a mood or your brand color. Get colors, matching fonts, a website preview and code to paste.</p>
            <div className="mt-6 space-y-3">
              {samples.map(s => <Strip key={s.vibe} colors={s.colors} />)}
            </div>
            <span className="mt-6 inline-flex items-center gap-1.5 font-medium text-gray-900">
              Start generating <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </a>

          <a {...linkProps('/explore')} className="group flex flex-col rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-white"><TrendingUp className="h-4 w-4" /></span>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Explore trending palettes</h2>
            <p className="mt-1 text-gray-600">
              {trending.sites.length
                ? `Brand colors from ${trending.sites.length} startup websites, refreshed weekly. Use any of them as your starting point.`
                : 'Brand colors from real startup websites, refreshed weekly.'}
            </p>
            <div className="mt-6 space-y-3">
              {trending.sites.slice(0, 3).map(site => <Strip key={site.url} colors={site.colors} label={site.name} />)}
            </div>
            <span className="mt-6 inline-flex items-center gap-1.5 font-medium text-gray-900">
              {topMood ? `Most common right now: ${moodLabel(topMood.mood)}` : 'Explore trends'}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </a>
        </div>
      </div>
    </main>
  );
}
