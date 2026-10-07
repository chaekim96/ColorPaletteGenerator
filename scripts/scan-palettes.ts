// Weekly scan: visit each site in scripts/sites.json, read the colors it actually renders and
// write src/data/trending.json for the Explore page. Run with `npm run scan`.
// Polite by design: respects robots.txt, one site at a time, identifies itself, no screenshots.
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { chromium } from 'playwright';
import { buildPalette, Sample } from '../src/app/utils/extract';
import { moodShares, ScannedSite, TrendingData } from '../src/app/utils/trending';

const OUT = 'src/data/trending.json';
const USER_AGENT = 'ColorPaletteGenerator-TrendScan/1.0 (+https://github.com/chaekim96/ColorPaletteGenerator)';
const sites: { name: string; url: string; category: string }[] = JSON.parse(readFileSync('scripts/sites.json', 'utf8'));
const only = process.argv[2]; // optional: scan a single site by name for debugging

/** Minimal robots.txt check for the homepage under the generic user agent. */
async function allowedByRobots(url: string): Promise<boolean> {
  try {
    const res = await fetch(new URL('/robots.txt', url), { headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return true;
    let applies = false;
    for (const raw of (await res.text()).split('\n')) {
      const line = raw.split('#')[0].trim();
      const [key, ...rest] = line.split(':');
      const value = rest.join(':').trim();
      if (/^user-agent$/i.test(key)) applies = value === '*';
      else if (applies && /^disallow$/i.test(key) && value === '/') return false;
    }
    return true;
  } catch {
    return true;
  }
}

// Runs in the page: computed colors of visible fills and text in the first two screens
function sampleColors() {
  const out: { color: string; weight: number; kind: 'bg' | 'text' | 'cta' }[] = [];
  const H = innerHeight * 2;
  for (const el of [document.documentElement, document.body]) {
    out.push({ color: getComputedStyle(el).backgroundColor, weight: innerWidth * H * 0.5, kind: 'bg' });
  }
  let n = 0;
  for (const el of Array.from(document.querySelectorAll('body *'))) {
    if (++n > 6000) break;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > H) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.5) continue;
    const area = Math.min(r.width, innerWidth) * Math.min(r.height, H);
    const isCta = el.matches('a, button, [role=button], input[type=submit]') && area < 60_000;
    out.push({ color: cs.backgroundColor, weight: area, kind: isCta ? 'cta' : 'bg' });
    const ownText = Array.from(el.childNodes).filter(t => t.nodeType === 3).map(t => t.textContent?.trim() ?? '').join('').length;
    if (ownText) out.push({ color: cs.color, weight: ownText * parseFloat(cs.fontSize), kind: isCta ? 'cta' : 'text' });
  }
  return out;
}

const browser = await chromium.launch();
const context = await browser.newContext({ userAgent: USER_AGENT, viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
const results: ScannedSite[] = [];
const skipped: string[] = [];

async function scan(site: (typeof sites)[number]) {
  const page = await context.newPage();
  try {
    if (!(await allowedByRobots(site.url))) throw new Error('robots.txt disallows');
    await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3_000);
    const title = await page.title();
    if (/just a moment|attention required|access denied|forbidden|captcha/i.test(title)) throw new Error(`blocked (${title})`);
    const palette = buildPalette((await page.evaluate(sampleColors)) as Sample[]);
    if (!palette) throw new Error('no usable colors');
    results.push({ ...site, ...palette });
    console.log(`✓ ${site.name.padEnd(18)} ${palette.colors.join(' ')}`);
  } catch (e) {
    skipped.push(`${site.name}: ${(e as Error).message.split('\n')[0]}`);
    console.log(`✗ ${site.name.padEnd(18)} ${(e as Error).message.split('\n')[0]}`);
  } finally {
    await page.close();
  }
}

// A few sites at a time; each site still gets a single visit
const queue = sites.filter(s => !only || s.name === only);
await Promise.all(Array.from({ length: 3 }, async () => {
  while (queue.length) await scan(queue.shift()!);
}));
const order = new Map(sites.map((s, i) => [s.url, i]));
results.sort((a, b) => order.get(a.url)! - order.get(b.url)!);
await browser.close();

if (only) process.exit(0);
const old: TrendingData | undefined = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : undefined;
const data: TrendingData = {
  scannedAt: new Date().toISOString().slice(0, 10),
  sites: results,
  ...(old && old.sites.length ? { previous: { scannedAt: old.scannedAt, moods: moodShares(old.sites) } } : {}),
};
writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n');
console.log(`\nScanned ${results.length}/${sites.length} sites. Skipped:\n  ${skipped.join('\n  ') || 'none'}`);
