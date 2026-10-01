import { useEffect, useState } from 'react';
import { Shuffle, Download, Share } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { ColorWheel } from './ColorWheel';
import { MAX_COLORS, MIN_COLORS, normalizeHex, VIBES, VibeId } from '../utils/palette';

interface PaletteControlsProps {
  onGenerate: () => void;
  vibe: VibeId | null;
  onVibeSelect: (vibe: VibeId | null) => void;
  onExport: () => void;
  onShare: () => void;
  onBaseColorSelect: (hex: string) => void;
  selectedBaseColor: string;
  colorCount: number;
  onColorCountChange: (count: number) => void;
}

export function PaletteControls({ onGenerate, vibe, onVibeSelect, onExport, onShare, onBaseColorSelect, selectedBaseColor, colorCount, onColorCountChange }: PaletteControlsProps) {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-10">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border p-4">
        <div className="flex items-center gap-6">
          {/* Color Wheel */}
          <ColorWheel
            onColorSelect={onBaseColorSelect}
            selectedColor={selectedBaseColor}
            size={84}
          />

          <div className="flex flex-col gap-3">
            {/* Vibe presets */}
            <div className="flex items-center gap-1.5" role="group" aria-label="Vibe">
              <Button
                size="sm"
                variant={vibe === null ? 'default' : 'outline'}
                aria-pressed={vibe === null}
                onClick={() => onVibeSelect(null)}
                title="A different vibe every time"
              >
                Any
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

            {/* Controls */}
            <div className="flex items-center gap-4">
              <BaseColorInput value={selectedBaseColor} onChange={onBaseColorSelect} />

              <Button onClick={onGenerate} className="gap-2">
                <Shuffle className="h-4 w-4" />
                Generate
              </Button>

              {/* Color Count Slider */}
              <div className="flex items-center gap-3">
                <Label htmlFor="color-count" className="text-sm whitespace-nowrap">
                  Colors: {colorCount}
                </Label>
                <Slider
                  id="color-count"
                  min={MIN_COLORS}
                  max={MAX_COLORS}
                  step={1}
                  value={[colorCount]}
                  onValueChange={(value) => onColorCountChange(value[0])}
                  className="w-20"
                />
              </div>

              <Button variant="outline" onClick={onExport} className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>

              <Button variant="outline" onClick={onShare} className="gap-2">
                <Share className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
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
      <Label htmlFor="base-color" className="text-sm whitespace-nowrap">Base</Label>
      <Input
        id="base-color"
        value={text}
        placeholder="Brand hex"
        aria-invalid={invalid}
        aria-describedby="base-color-hint"
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        className="w-28 font-mono"
        spellCheck={false}
      />
      <span id="base-color-hint" className="sr-only">
        Your brand color in hex. It stays in the palette exactly as entered.
      </span>
    </div>
  );
}
