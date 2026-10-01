import { Shuffle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { FontPair, FontSpec, fontStack } from '../utils/fonts';
import { getVibe, VibeId } from '../utils/palette';

interface FontBarProps {
  pair: FontPair;
  vibe: VibeId;
  onShuffle: () => void;
}

const WEIGHT_NAMES: Record<number, string> = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold' };
const describeFont = (font: FontSpec) => `${font.family} ${WEIGHT_NAMES[font.weight] ?? font.weight}`;

// Docked under the swatches: live sample of the heading/body pairing that matches the palette's vibe
export function FontBar({ pair, vibe, onShuffle }: FontBarProps) {
  return (
    <section aria-label="Font pairing" className="h-28 shrink-0 bg-white border-t px-6 flex items-center gap-6">
      <div className="flex-1 min-w-0">
        <p
          className="truncate text-gray-900"
          style={{ fontFamily: fontStack(pair.heading), fontWeight: pair.heading.weight, fontSize: '1.75rem', lineHeight: 1.2 }}
        >
          A brand that looks the part
        </p>
        <p
          className="truncate text-gray-600 mt-1"
          style={{ fontFamily: fontStack(pair.body), fontWeight: pair.body.weight, fontSize: '0.95rem' }}
        >
          Body text is set in {pair.body.family}. This is how paragraphs, buttons and captions will read.
        </p>
      </div>

      <div className="shrink-0 text-right space-y-1">
        <div className="flex items-center justify-end gap-2">
          <Badge variant="secondary">{getVibe(vibe).label}</Badge>
          <span className="text-xs text-gray-500">{pair.note}</span>
        </div>
        <p className="text-sm text-gray-900">
          <span className="text-gray-500">Heading</span> {describeFont(pair.heading)}
          <span className="text-gray-300 mx-2">·</span>
          <span className="text-gray-500">Body</span> {describeFont(pair.body)}
        </p>
      </div>

      <Button variant="outline" onClick={onShuffle} className="gap-2 shrink-0" title="Shuffle fonts (F)">
        <Shuffle className="h-4 w-4" />
        Shuffle fonts
      </Button>
    </section>
  );
}
