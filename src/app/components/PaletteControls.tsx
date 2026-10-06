import { useEffect, useState } from 'react';
import { Shuffle, Download, Share, Sparkles, Columns3, LayoutTemplate, Dices, ChevronDown, X, CircleHelp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { ColorWheel } from './ColorWheel';
import { MAX_COLORS, MIN_COLORS, normalizeHex, VIBES, VibeId } from '../utils/palette';

export type View = 'palette' | 'preview';

interface PaletteControlsProps {
  view: View;
  onViewChange: (view: View) => void;
  contrastIssues: number;
  onGenerate: () => void;
  onDescribe: (text: string) => void;
  vibe: VibeId | null;
  onVibeSelect: (vibe: VibeId | null) => void;
  onExport: () => void;
  onShare: () => void;
  onBaseColorSelect: (hex: string) => void;
  selectedBaseColor: string;
  colorCount: number;
  onColorCountChange: (count: number) => void;
  onHelp: () => void;
  showTip: boolean;
  onDismissTip: () => void;
}

export function PaletteControls({ view, onViewChange, contrastIssues, onGenerate, onDescribe, vibe, onVibeSelect, onExport, onShare, onBaseColorSelect, selectedBaseColor, colorCount, onColorCountChange, onHelp, showTip, onDismissTip }: PaletteControlsProps) {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-10 w-[min(960px,calc(100vw-2rem))]">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border p-4 flex flex-col gap-3">
        {/* 1. Start from a description */}
        <DescribeInput onSubmit={onDescribe} />

        {/* 2. Or pick a mood */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Vibe">
          <span className="text-sm text-gray-600 mr-1">Mood</span>
          <Button
            size="sm"
            variant={vibe === null ? 'default' : 'outline'}
            aria-pressed={vibe === null}
            onClick={() => onVibeSelect(null)}
            title="A different mood every time you generate"
            className="gap-1.5"
          >
            <Dices className="h-3.5 w-3.5" />
            Surprise me
          </Button>
          {VIBES.map(v => (
            <Button
              key={v.id}
              size="sm"
              variant={vibe === v.id ? 'default' : 'outline'}
              aria-pressed={vibe === v.id}
              onClick={() => onVibeSelect(v.id)}
              title={v.description}
            >
              {v.label}
            </Button>
          ))}
        </div>

        {/* 3. Refine, then view and take it with you */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <div className="flex flex-wrap items-center gap-3">
            <BrandColorPicker value={selectedBaseColor} onChange={onBaseColorSelect} />

            <Button onClick={onGenerate} className="gap-2" title="New palette (Space)">
              <Shuffle className="h-4 w-4" />
              Generate
              <kbd className="ml-1 rounded bg-white/15 px-1.5 text-[11px] font-normal">Space</kbd>
            </Button>

            <div className="flex items-center gap-2">
              <Label htmlFor="color-count" className="text-sm whitespace-nowrap text-gray-700">
                {colorCount} colors
              </Label>
              <Slider
                id="color-count"
                aria-label="Number of colors"
                min={MIN_COLORS}
                max={MAX_COLORS}
                step={1}
                value={[colorCount]}
                onValueChange={(value) => onColorCountChange(value[0])}
                className="w-20"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Palette / website preview switch */}
            <div className="flex rounded-md border p-0.5" role="group" aria-label="View">
              {([['palette', 'Palette', Columns3], ['preview', 'Website preview', LayoutTemplate]] as const).map(([id, label, Icon]) => (
                <Button
                  key={id}
                  size="sm"
                  variant={view === id ? 'default' : 'ghost'}
                  aria-pressed={view === id}
                  onClick={() => onViewChange(id)}
                  className="h-7 gap-1.5"
                  title={`${label} (P)`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {id === 'preview' && contrastIssues > 0 && (
                    <span
                      className="ml-0.5 rounded-full bg-red-600 text-white text-[10px] leading-none px-1.5 py-0.5"
                      aria-label={`${contrastIssues} contrast ${contrastIssues === 1 ? 'issue' : 'issues'}`}
                    >
                      {contrastIssues}
                    </span>
                  )}
                </Button>
              ))}
            </div>

            <Button variant="outline" onClick={onExport} className="gap-2" title="Code for your site (E)">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" onClick={onShare} className="gap-2" title="Copy a link to this palette (S)">
              <Share className="h-4 w-4" />
              Share
            </Button>
            <Button variant="ghost" size="icon" onClick={onHelp} aria-label="Keyboard shortcuts and help" title="Help (?)">
              <CircleHelp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showTip && (
          <div className="flex items-center justify-between gap-3 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700" role="note">
            <span>
              Tip: press <kbd className="px-1 py-0.5 bg-white rounded text-xs">Space</kbd> for a new palette. Lock the colors you like first and they stay.
            </span>
            <button type="button" onClick={onDismissTip} className="text-gray-500 hover:text-gray-900 rounded p-0.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" aria-label="Dismiss tip">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// One compact control for "I already have a brand color": swatch button that opens hex + wheel
function BrandColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2" aria-label={value ? `Brand color ${value}` : 'Add your brand color'}>
          {value ? (
            <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: value }} />
          ) : (
            <span className="h-4 w-4 rounded-full border border-dashed border-gray-400" />
          )}
          {value ? <span className="font-mono text-sm">{value}</span> : 'Brand color'}
          <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-900">Start from your brand color</p>
          <p className="text-xs text-gray-600 mt-0.5">It stays in the palette exactly as entered; the rest is built around it.</p>
        </div>
        <BaseColorInput value={value} onChange={onChange} />
        <div className="flex items-center justify-between">
          <ColorWheel onColorSelect={onChange} selectedColor={value} size={120} showControls={false} />
          <Button variant="ghost" size="sm" onClick={() => onChange('')} disabled={!value} className="self-end gap-1.5">
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Hex field for founders who already have a brand color; applies on Enter or blur
function BaseColorInput({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [text, setText] = useState(value);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setText(value);
    setInvalid(false);
  }, [value]);

  const commit = () => {
    if (text.trim() === '') {
      if (value) onChange('');
      return;
    }
    const hex = normalizeHex(text);
    setInvalid(!hex);
    if (hex && hex !== value) onChange(hex);
  };

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="base-color" className="text-sm whitespace-nowrap">Hex</Label>
      <Input
        id="base-color"
        value={text}
        placeholder="e.g. #3b82f6"
        aria-invalid={invalid}
        aria-describedby="base-color-hint"
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        className="flex-1 font-mono"
        spellCheck={false}
      />
      <span id="base-color-hint" className="sr-only">
        Your brand color in hex. It stays in the palette exactly as entered.
      </span>
    </div>
  );
}

// Plain-English starting point, e.g. "calm meditation app, sage green"
function DescribeInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState('');

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) onSubmit(text);
      }}
    >
      <Label htmlFor="describe" className="sr-only">Describe your project</Label>
      <Input
        id="describe"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What are you building? e.g. calm meditation app, sage green"
        className="flex-1"
        autoComplete="off"
      />
      <Button type="submit" variant="outline" className="gap-2" disabled={!text.trim()}>
        <Sparkles className="h-4 w-4" />
        Suggest
      </Button>
    </form>
  );
}
