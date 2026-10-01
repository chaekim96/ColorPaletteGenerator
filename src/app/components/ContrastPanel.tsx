import { useState } from 'react';
import { ArrowRight, Check, ChevronDown, ChevronUp, TriangleAlert } from 'lucide-react';
import { Button } from './ui/button';
import { PairCheck } from '../utils/contrast';
import { ROLE_LABELS } from '../utils/roles';

interface ContrastPanelProps {
  checks: PairCheck[];
  onApplyFix: (fix: NonNullable<PairCheck['fix']>) => void;
}

function RatingBadge({ check }: { check: PairCheck }) {
  const style = !check.passes
    ? check.rating === 'Fail' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'
    : check.rating === 'AAA' ? 'bg-emerald-100 text-emerald-900' : 'bg-emerald-50 text-emerald-800';
  const label = !check.passes && check.rating === 'AA Large' ? 'Large text only' : check.rating;
  return <span className={`rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ${style}`}>{label}</span>;
}

// WCAG checks for every color pairing the preview uses, with one-click fixes for failures
export function ContrastPanel({ checks, onApplyFix }: ContrastPanelProps) {
  const failing = checks.filter(c => !c.passes);
  const [expanded, setExpanded] = useState(false);
  const open = expanded || failing.length > 0;

  return (
    <section className="bg-white border rounded-lg" aria-label="Contrast check">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <p className="flex items-center gap-2 text-sm text-gray-900">
          {failing.length === 0 ? (
            <><Check className="h-4 w-4 text-emerald-700" /> All {checks.length} color pairings pass WCAG AA</>
          ) : (
            <><TriangleAlert className="h-4 w-4 text-amber-700" /> {failing.length} of {checks.length} pairings are hard to read</>
          )}
        </p>
        {failing.length === 0 && (
          <Button variant="ghost" size="sm" onClick={() => setExpanded(e => !e)} aria-expanded={open} className="gap-1 text-gray-600">
            {open ? 'Hide' : 'Details'}
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {open && (
        <ul className="border-t divide-y">
          {checks.map(check => (
            <li key={check.id} className="flex flex-wrap items-center gap-3 px-4 py-2">
              <span
                className="w-10 h-7 shrink-0 rounded border border-black/10 flex items-center justify-center text-sm font-semibold"
                style={{ color: check.foreground, backgroundColor: check.background }}
                aria-hidden="true"
              >
                Aa
              </span>
              <span className="flex-1 min-w-40 text-sm text-gray-900">{check.label}</span>
              <span className="font-mono text-xs text-gray-700 w-14 text-right">{check.ratio.toFixed(2)}:1</span>
              <RatingBadge check={check} />
              {check.fix && (
                <span className="flex items-center gap-2 w-full sm:w-auto sm:ml-2">
                  <span className="text-xs text-gray-600">{ROLE_LABELS[check.fix.role]}</span>
                  <span className="w-4 h-4 rounded border border-black/10" style={{ backgroundColor: check.fix.from }} title={check.fix.from} />
                  <ArrowRight className="h-3 w-3 text-gray-500" aria-hidden="true" />
                  <span className="w-4 h-4 rounded border border-black/10" style={{ backgroundColor: check.fix.to }} title={check.fix.to} />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7"
                    onClick={() => onApplyFix(check.fix!)}
                    aria-label={`Fix ${check.label.toLowerCase()}: change ${ROLE_LABELS[check.fix.role].toLowerCase()} from ${check.fix.from} to ${check.fix.to}`}
                  >
                    Use {check.fix.to}
                  </Button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
