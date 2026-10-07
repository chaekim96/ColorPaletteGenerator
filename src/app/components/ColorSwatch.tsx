import { useState } from 'react';
import { Copy, Lock, Unlock } from 'lucide-react';
import { Color, generateColorGradient } from '../utils/colorUtils';
import { contrast } from '../utils/roles';
import { copyToClipboard } from '../utils/clipboard';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface ColorSwatchProps {
  color: Color;
  onToggleLock: (index: number) => void;
  index: number;
  isGradientMode?: boolean;
  /** What this color is used for in the preview/export, e.g. { label: 'Primary', use: 'Buttons & links' } */
  role?: { label: string; use: string };
}

export function ColorSwatch({ color, onToggleLock, index, isGradientMode, role }: ColorSwatchProps) {
  const [copied, setCopied] = useState(false);
  // Black or white, whichever reads better on this color (WCAG contrast)
  const textColor = contrast('#000000', color.hex) >= contrast('#ffffff', color.hex) ? 'text-black' : 'text-white';
  // Hover-revealed on desktop, always visible on touch devices
  const revealClasses = 'opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100';

  const handleCopyToClipboard = async (text: string, type: string) => {
    const success = await copyToClipboard(text);
    
    if (success) {
      setCopied(true);
      toast.success(`${type} copied to clipboard!`);
      setTimeout(() => setCopied(false), 1000);
    } else {
      toast.error('Failed to copy to clipboard');
    }
  };

  const swatchStyle = isGradientMode 
    ? { background: generateColorGradient(color) }
    : { backgroundColor: color.hex };

  return (
    <div 
      className="relative flex-1 h-full group cursor-pointer transition-all duration-200 hover:scale-[1.02]"
      style={swatchStyle}
    >
      {/* Lock button (centered so the toolbar never covers it): shown when locked, on touch, and on focus */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200 ${color.locked ? 'opacity-100' : 'opacity-40 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100'}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleLock(index)}
          aria-pressed={color.locked}
          aria-label={`${color.locked ? 'Unlock' : 'Lock'} color ${index + 1} (${color.hex}). Shortcut: ${index + 1}`}
          title={`${color.locked ? 'Unlock' : 'Lock'} (${index + 1})`}
          className={`${textColor} hover:bg-black/10 hover:text-current ${color.locked ? 'bg-black/10' : ''}`}
        >
          {color.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          <span className="text-xs">{color.locked ? 'Locked' : 'Lock'}</span>
        </Button>
      </div>

      {/* Color info: role and hex always visible; RGB/HSL on hover or focus */}
      <div className={`absolute bottom-0 left-0 right-0 p-6 space-y-2 ${textColor}`}>
        <div className={`space-y-2 transition-opacity duration-200 ${revealClasses} group-focus-within:opacity-100`}>
          {/* RGB */}
          <button
            type="button"
            className="block w-full text-left cursor-pointer hover:bg-black/10 focus-visible:bg-black/10 outline-none p-2 rounded transition-colors"
            onClick={() => handleCopyToClipboard(`rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`, 'RGB')}
          >
            <div className="flex items-center justify-between">
              <span className="opacity-70">RGB</span>
              <Copy className="h-3 w-3 opacity-50" />
            </div>
            <div className="font-mono">{color.rgb.r}, {color.rgb.g}, {color.rgb.b}</div>
          </button>

          {/* HSL */}
          <button
            type="button"
            className="block w-full text-left cursor-pointer hover:bg-black/10 focus-visible:bg-black/10 outline-none p-2 rounded transition-colors"
            onClick={() => handleCopyToClipboard(`hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`, 'HSL')}
          >
            <div className="flex items-center justify-between">
              <span className="opacity-70">HSL</span>
              <Copy className="h-3 w-3 opacity-50" />
            </div>
            <div className="font-mono">{color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%</div>
          </button>
        </div>

        {role && (
          <div className="px-2">
            <div className="text-xs font-semibold uppercase tracking-wide">{role.label}</div>
            <div className="text-xs opacity-75">{role.use}</div>
          </div>
        )}
        <button
          type="button"
          className="flex w-full items-center justify-between text-left cursor-pointer hover:bg-black/10 focus-visible:bg-black/10 outline-none p-2 rounded transition-colors"
          onClick={() => handleCopyToClipboard(color.hex, 'HEX')}
          aria-label={`Copy ${color.hex}`}
        >
          <span className="font-mono text-lg">{color.hex}</span>
          <Copy className="h-3.5 w-3.5 opacity-60" />
        </button>
      </div>

      {/* Copied indicator */}
      {copied && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${textColor} bg-black/20 px-4 py-2 rounded-lg backdrop-blur-sm`}>
            Copied!
          </div>
        </div>
      )}
    </div>
  );
}