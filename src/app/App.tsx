import { useState, useEffect, useCallback } from 'react';
import { ColorSwatch } from './components/ColorSwatch';
import { PaletteControls } from './components/PaletteControls';
import { HelpOverlay } from './components/HelpOverlay';
import { Color, colorFromHex } from './utils/colorUtils';
import { generatePalette, lockedPrimary, mergeLocked, MAX_COLORS, MIN_COLORS, VibeId } from './utils/palette';
import { copyToClipboard } from './utils/clipboard';
import { downloadPaletteImage } from './utils/imageExport';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

interface PaletteSettings {
  vibe: VibeId | null;
  baseHex: string;
  count: number;
}

export default function App() {
  const [colors, setColors] = useState<Color[]>([]);
  const [isGradientMode, setIsGradientMode] = useState(false);
  const [selectedBaseColor, setSelectedBaseColor] = useState('');
  const [colorCount, setColorCount] = useState(5);
  const [vibe, setVibe] = useState<VibeId | null>(null);

  // Regenerate unlocked colors, optionally with new settings applied first
  const regenerate = useCallback((overrides: Partial<PaletteSettings> = {}) => {
    const settings: PaletteSettings = { vibe, baseHex: selectedBaseColor, count: colorCount, ...overrides };
    setColors(prevColors => {
      const newColors = generatePalette({
        vibe: settings.vibe ?? undefined,
        // A locked primary anchors the palette like a base color does
        baseHex: settings.baseHex || lockedPrimary(prevColors),
        count: settings.count,
      });
      return mergeLocked(prevColors, newColors);
    });
  }, [vibe, selectedBaseColor, colorCount]);

  const generateNewPalette = useCallback(() => {
    if (colors.length > 0 && colors.every(color => color.locked)) {
      toast('All colors are locked', { description: 'Unlock one to generate new options.' });
      return;
    }
    regenerate();
  }, [regenerate, colors]);

  // Initialize on mount and check URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlColors = urlParams.get('colors');
    const urlCount = parseInt(urlParams.get('count') || '5');

    if (urlParams.has('gradient')) {
      setIsGradientMode(urlParams.get('gradient') === 'true');
    }

    if (urlColors) {
      const hexes = urlColors.split('-');
      if (hexes.every(hex => /^[0-9a-f]{6}$/i.test(hex)) && hexes.length >= 2 && hexes.length <= 10) {
        setColors(hexes.map(hex => colorFromHex(`#${hex}`)));
        setColorCount(hexes.length);
        return;
      }
      console.warn('Invalid URL color parameters');
    }

    const count = urlCount >= MIN_COLORS && urlCount <= MAX_COLORS ? urlCount : colorCount;
    setColorCount(count);
    setColors(generatePalette({ count }));
  }, []);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      // Ignore typing in fields and browser/OS shortcuts like Cmd+S
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      // Keyboard users activating a focused control get the native behavior
      const onFocusedControl = target.matches('button, [role="slider"], a') && target.matches(':focus-visible');

      if (/^Digit[1-9]$/.test(event.code)) {
        const index = Number(event.code.slice(5)) - 1;
        if (index < colors.length) {
          event.preventDefault();
          toggleColorLock(index);
        }
        return;
      }

      switch (event.code) {
        case 'Space':
          if (onFocusedControl) return;
          event.preventDefault();
          if (event.repeat) return;
          generateNewPalette();
          break;
        case 'KeyG':
          event.preventDefault();
          setIsGradientMode(prev => !prev);
          break;
        case 'KeyE':
          event.preventDefault();
          exportPalette();
          break;
        case 'KeyS':
          event.preventDefault();
          sharePalette();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [generateNewPalette, colors, isGradientMode]);

  const toggleColorLock = (index: number) => {
    setColors(prevColors => 
      prevColors.map((color, i) => 
        i === index ? { ...color, locked: !color.locked } : color
      )
    );
  };

  const exportPalette = async () => {
    try {
      await downloadPaletteImage(colors);
      toast.success('Palette image exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export palette image');
    }
  };

  const sharePalette = async () => {
    const colorHexes = colors.map(c => c.hex.slice(1)).join('-');
    const url = `${window.location.origin}${window.location.pathname}?colors=${colorHexes}&gradient=${isGradientMode}&count=${colorCount}`;

    const success = await copyToClipboard(url);
    if (success) {
      toast.success('Shareable link copied to clipboard!');
    } else {
      toast.error('Failed to copy link');
    }
  };

  const handleBaseColorSelect = (hex: string) => {
    setSelectedBaseColor(hex);
    regenerate({ baseHex: hex });
  };

  const handleVibeSelect = (newVibe: VibeId | null) => {
    setVibe(newVibe);
    regenerate({ vibe: newVibe });
  };

  const handleColorCountChange = (newCount: number) => {
    setColorCount(newCount);
    regenerate({ count: newCount });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PaletteControls 
        onGenerate={generateNewPalette}
        vibe={vibe}
        onVibeSelect={handleVibeSelect}
        onExport={exportPalette}
        onShare={sharePalette}
        onBaseColorSelect={handleBaseColorSelect}
        selectedBaseColor={selectedBaseColor}
        colorCount={colorCount}
        onColorCountChange={handleColorCountChange}
      />
      
      <div className="flex h-screen">
        {colors.map((color, index) => (
          <ColorSwatch
            key={index}
            color={color}
            onToggleLock={toggleColorLock}
            index={index}
            isGradientMode={isGradientMode}
          />
        ))}
      </div>

      <HelpOverlay />
      <Toaster />

      {/* Instructions overlay for first-time users */}
      {colors.length > 0 && (
        <div className="fixed bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border p-4 max-w-sm">
          <p className="text-sm text-gray-600">
            Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Space</kbd> to generate, <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">1</kbd>–<kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">{colors.length}</kbd> to lock a color
          </p>
        </div>
      )}
    </div>
  );
}