import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { RotateCcw } from 'lucide-react';
import { converter } from 'culori';
import { hslToHex } from '../utils/colorUtils';

const toHsl = converter('hsl');

interface ColorWheelProps {
  onColorSelect: (hex: string) => void; // '' = cleared
  selectedColor?: string;
  size?: number;
  showControls?: boolean; // Reset button + label; off when the host provides its own
}

const LIGHTNESS = 50;

// Hue/saturation wheel. Drag updates locally; the palette only regenerates on release.
export function ColorWheel({ onColorSelect, selectedColor, size = 120, showControls = true }: ColorWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(0);

  // Keep the indicator in sync when the base color is set elsewhere (e.g. hex input)
  useEffect(() => {
    if (isDragging) return;
    const hsl = selectedColor ? toHsl(selectedColor) : undefined;
    setHue(Math.round(hsl?.h ?? 0));
    setSaturation(hsl ? Math.round(hsl.s * 100) : 0);
  }, [selectedColor, isDragging]);

  const radius = size / 2;

  const updateFromPointer = (clientX: number, clientY: number) => {
    const rect = wheelRef.current!.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const nextHue = Math.round((Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360);
    const nextSat = Math.round(Math.min(Math.hypot(dx, dy) / radius, 1) * 100);
    setHue(nextHue);
    setSaturation(nextSat);
    return { hue: nextHue, saturation: nextSat };
  };

  const commit = (h: number, s: number) => onColorSelect(hslToHex(h, s, LIGHTNESS));

  const handlePointerDown = (event: React.PointerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    updateFromPointer(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (isDragging) updateFromPointer(event.clientX, event.clientY);
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const { hue: h, saturation: s } = updateFromPointer(event.clientX, event.clientY);
    commit(h, s);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 15 : 5;
    let h = hue;
    let s = saturation || 60;
    switch (event.key) {
      case 'ArrowRight': h = (hue + step) % 360; break;
      case 'ArrowLeft': h = (hue - step + 360) % 360; break;
      case 'ArrowUp': s = Math.min(100, s + step); break;
      case 'ArrowDown': s = Math.max(0, s - step); break;
      default: return;
    }
    event.preventDefault();
    setHue(h);
    setSaturation(s);
    commit(h, s);
  };

  const resetSelection = () => {
    setHue(0);
    setSaturation(0);
    onColorSelect('');
  };

  const indicatorDistance = (saturation / 100) * radius;
  const indicatorX = radius + Math.cos(hue * Math.PI / 180) * indicatorDistance;
  const indicatorY = radius + Math.sin(hue * Math.PI / 180) * indicatorDistance;
  const showIndicator = Boolean(selectedColor) || isDragging;

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div
          ref={wheelRef}
          role="slider"
          tabIndex={0}
          aria-label="Base color wheel. Left and right change hue, up and down change saturation."
          aria-valuemin={0}
          aria-valuemax={359}
          aria-valuenow={hue}
          aria-valuetext={selectedColor ? `Hue ${hue}°, saturation ${saturation}%` : 'No base color'}
          className="relative cursor-crosshair rounded-full shadow-sm border border-gray-200 touch-none outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          style={{
            width: size,
            height: size,
            // Hue 0 sits at 3 o'clock and increases clockwise, matching atan2 in screen coordinates
            background: `radial-gradient(closest-side, hsl(0 0% ${LIGHTNESS}%), transparent),
              conic-gradient(from 90deg, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))`,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => setIsDragging(false)}
          onKeyDown={handleKeyDown}
        >
          {showIndicator && (
            <div
              className="absolute w-3 h-3 rounded-full border-2 border-gray-800 bg-white pointer-events-none -translate-x-1/2 -translate-y-1/2"
              style={{ left: indicatorX, top: indicatorY }}
            />
          )}
        </div>
        {(selectedColor || isDragging) && (
          <div className="absolute -bottom-1 -right-1">
            <div
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: isDragging ? hslToHex(hue, saturation, LIGHTNESS) : selectedColor }}
            />
          </div>
        )}
      </div>

      {showControls && <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={resetSelection}
          className="gap-2"
          disabled={!selectedColor}
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>

        {selectedColor && (
          <div className="text-xs text-gray-500 text-center">
            Base Color
          </div>
        )}
      </div>}
    </div>
  );
}
