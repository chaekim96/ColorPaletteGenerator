import { CSSProperties } from 'react';
import { ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { FontPair, fontStack } from '../utils/fonts';
import { Mode, Roles, ROLE_LABELS } from '../utils/roles';
import { PairCheck } from '../utils/contrast';
import { ContrastPanel } from './ContrastPanel';

interface LandingPreviewProps {
  name: string;
  roles: Roles;
  fontPair: FontPair;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  checks: PairCheck[];
  onApplyFix: (fix: NonNullable<PairCheck['fix']>) => void;
}

const LEGEND: (keyof Roles)[] = ['background', 'surface', 'text', 'primary', 'primaryText', 'accent'];

const FEATURES = [
  { icon: Zap, title: 'Set up in minutes', body: 'Connect your tools and get your first result before your coffee gets cold.' },
  { icon: ShieldCheck, title: 'Secure by default', body: 'Your data is encrypted and never shared. Built for teams that care.' },
  { icon: Sparkles, title: 'Gets smarter', body: 'Every week it learns what works for you and suggests the next step.' },
];

// Sample landing page painted with the palette's auto-assigned roles and the current font pairing
export function LandingPreview({ name, roles, fontPair, mode, onModeChange, checks, onApplyFix }: LandingPreviewProps) {
  const heading: CSSProperties = { fontFamily: fontStack(fontPair.heading), fontWeight: fontPair.heading.weight };
  const body: CSSProperties = { fontFamily: fontStack(fontPair.body), fontWeight: fontPair.body.weight };
  const primaryButton: CSSProperties = { backgroundColor: roles.primary, color: roles.onPrimary, fontWeight: 600 };

  return (
    <div className="flex-1 min-h-0 overflow-auto pt-44 pb-10 px-6">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Role legend */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ul className="flex flex-wrap items-center gap-2" aria-label="Color roles">
            <li className="text-sm font-medium text-gray-900 mr-1">{name}</li>
            {LEGEND.filter(role => role !== 'primaryText' || roles.primaryText !== roles.primary).map(role => (
              <li key={role} className="flex items-center gap-2 bg-white border rounded-md px-2 py-1 text-xs">
                <span className="w-4 h-4 rounded border border-black/10" style={{ backgroundColor: roles[role] }} />
                <span className="text-gray-600">{ROLE_LABELS[role]}</span>
                <span className="font-mono text-gray-900">{roles[role]}</span>
              </li>
            ))}
          </ul>
          <div className="flex rounded-md border bg-white p-0.5 text-xs" role="group" aria-label="Preview theme">
            {(['light', 'dark'] as const).map(m => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => onModeChange(m)}
                className={`px-3 py-1 rounded capitalize outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${mode === m ? 'bg-primary text-primary-foreground' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <ContrastPanel checks={checks} onApplyFix={onApplyFix} />

        {/* Browser frame */}
        <div className="rounded-xl border shadow-lg overflow-hidden bg-white">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-gray-100" aria-hidden="true">
            <span className="w-3 h-3 rounded-full bg-gray-300" />
            <span className="w-3 h-3 rounded-full bg-gray-300" />
            <span className="w-3 h-3 rounded-full bg-gray-300" />
            <span className="ml-3 flex-1 max-w-xs rounded bg-white px-3 py-0.5 text-xs text-gray-500">yourstartup.com</span>
          </div>

          {/* Sample page: inline styles so palette roles don't inherit app theme classes */}
          <div style={{ backgroundColor: roles.background, color: roles.text, ...body }}>
            <nav className="flex items-center justify-between px-8 py-4" style={{ borderBottom: `1px solid ${roles.border}` }}>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg" style={{ backgroundColor: roles.primary }} />
                <span style={{ ...heading, fontSize: '1.25rem' }}>Northwind</span>
              </div>
              <div className="hidden sm:flex items-center gap-6" style={{ color: roles.mutedText, fontSize: '0.95rem' }}>
                <span>Product</span>
                <span>Pricing</span>
                <span>Customers</span>
              </div>
              <span className="rounded-lg px-4 py-2" style={{ ...primaryButton, fontSize: '0.9rem' }}>Get started</span>
            </nav>

            <header className="px-8 pt-16 pb-14 text-center max-w-3xl mx-auto">
              <span
                className="inline-block rounded-full px-3 py-1 mb-6"
                style={{ backgroundColor: roles.accent, color: roles.onAccent, fontSize: '0.8rem', fontWeight: 600 }}
              >
                New · Now in public beta
              </span>
              <h1 style={{ ...heading, fontSize: 'clamp(2rem, 5vw, 3.25rem)', lineHeight: 1.1, margin: 0 }}>
                Turn your idea into a product <span style={{ color: roles.accentText }}>people love</span>
              </h1>
              <p className="mt-5 mx-auto max-w-xl" style={{ color: roles.mutedText, fontSize: '1.1rem', lineHeight: 1.6 }}>
                Northwind gives small teams everything they need to launch, learn from customers and grow, without hiring a design team.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <span className="rounded-lg px-6 py-3" style={primaryButton}>Start free trial</span>
                <span className="rounded-lg px-6 py-3" style={{ border: `1px solid ${roles.border}`, color: roles.text, fontWeight: 600 }}>
                  Book a demo
                </span>
              </div>
              <p className="mt-5" style={{ color: roles.primaryText, fontWeight: 600, fontSize: '0.95rem' }}>
                See how it works →
              </p>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 px-8 pb-16">
              {FEATURES.map(({ icon: Icon, title, body: text }, i) => {
                const tile = i === 1 ? { bg: roles.accent, fg: roles.onAccent } : { bg: roles.primary, fg: roles.onPrimary };
                return (
                  <article
                    key={title}
                    className="rounded-xl p-6"
                    style={{ backgroundColor: roles.surface, border: `1px solid ${roles.border}` }}
                  >
                    <span className="inline-flex w-10 h-10 items-center justify-center rounded-lg mb-4" style={{ backgroundColor: tile.bg, color: tile.fg }}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <h2 style={{ ...heading, fontSize: '1.2rem', margin: 0 }}>{title}</h2>
                    <p className="mt-2" style={{ color: roles.mutedText, fontSize: '0.95rem', lineHeight: 1.6 }}>{text}</p>
                    <p className="mt-3" style={{ color: roles.primaryText, fontWeight: 600, fontSize: '0.9rem' }}>Learn more →</p>
                  </article>
                );
              })}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
