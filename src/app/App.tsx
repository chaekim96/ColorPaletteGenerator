import { useState, useEffect, useCallback } from 'react';
import { ColorSwatch } from './components/ColorSwatch';
import { PaletteControls } from './components/PaletteControls';
import { HelpOverlay } from './components/HelpOverlay';
import { Color, colorFromHex } from './utils/colorUtils';
import { generatePalette, getVibe, inferVibe, lockedPrimary, mergeLocked, MAX_COLORS, MIN_COLORS, primaryColor, VibeId } from './utils/palette';
import { getFontPair, loadFontPair, pickPair } from './utils/fonts';
import { FontBar } from './components/FontBar';
import { LandingPreview } from './components/LandingPreview';
import { View } from './components/PaletteControls';
import { assignRoles, Mode, Roles } from './utils/roles';
import { checkRoles, PairCheck } from './utils/contrast';
import { ExportDialog } from './components/ExportDialog';
import { describeToSettings } from './utils/describe';
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
  const [fontPairId, setFontPairId] = useState('');
  const [view, setView] = useState<View>('palette');
  const [previewMode, setPreviewMode] = useState<Mode>('light');
  const [exportOpen, setExportOpen] = useState(false);

  // The vibe the palette actually reads as: the chosen one, or inferred from its primary color
  const primary = primaryColor(colors);
  const paletteVibe: VibeId | undefined = vibe ?? (primary ? inferVibe(primary.hex) : undefined);
  const fontPair = getFontPair(fontPairId);

  // Switch fonts only when the current pairing no longer fits the palette's vibe
  useEffect(() => {
    if (!paletteVibe) return;
    if (!getFontPair(fontPairId)?.vibes.includes(paletteVibe)) {
      setFontPairId(pickPair(paletteVibe).id);
    }
  }, [paletteVibe]);

  useEffect(() => {
    if (fontPair) loadFontPair(fontPair);
  }, [fontPair]);

  const roles: Roles | undefined = colors.length > 0 ? assignRoles(colors.map(c => c.hex), previewMode) : undefined;
  const contrastChecks = roles ? checkRoles(roles) : [];

  // Swap the adjusted color into the palette, keeping its lock; a fixed base color stays the base
  const applyContrastFix = ({ from, to }: NonNullable<PairCheck['fix']>) => {
    setColors(prev => prev.map(c => (c.hex === from ? colorFromHex(to, c.locked) : c)));
    if (selectedBaseColor === from) setSelectedBaseColor(to);
    toast.success(`Updated ${from} to ${to}`);
  };

  const shuffleFonts = () => {
    if (paletteVibe) setFontPairId(pickPair(paletteVibe, fontPairId).id);
  };

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
      if (exportOpen) return; // the dialog handles its own keys

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
        case 'KeyP':
          event.preventDefault();
          setView(prev => (prev === 'palette' ? 'preview' : 'palette'));
          break;
        case 'KeyF':
          event.preventDefault();
          shuffleFonts();
          break;
        case 'KeyG':
          event.preventDefault();
          setIsGradientMode(prev => !prev);
          break;
        case 'KeyE':
          event.preventDefault();
          setExportOpen(true);
          break;
        case 'KeyS':
          event.preventDefault();
          sharePalette();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  });

  const toggleColorLock = (index: number) => {
    setColors(prevColors => 
      prevColors.map((color, i) => 
        i === index ? { ...color, locked: !color.locked } : color
      )
    );
  };

  const downloadPng = async () => {
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

  // A description is a fresh start: it replaces both the vibe and the base color
  const handleDescribe = (text: string) => {
    const result = describeToSettings(text);
    if (result.matches.length === 0) {
      toast("Couldn't find a match", {
        description: 'Try an industry, a mood or a color, e.g. "fintech", "playful", "navy".',
      });
      return;
    }
    const newVibe = result.vibe ?? null;
    const newBase = result.baseHex ?? '';
    setVibe(newVibe);
    setSelectedBaseColor(newBase);
    regenerate({ vibe: newVibe, baseHex: newBase });
    toast.success(
      [newVibe && `${getVibe(newVibe).label} vibe`, newBase && `base ${newBase}`].filter(Boolean).join(' · '),
      { description: `Matched ${result.matches.join('; ')}` },
    );
  };

  const handleColorCountChange = (newCount: number) => {
    setColorCount(newCount);
    regenerate({ count: newCount });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <PaletteControls
        view={view}
        onViewChange={setView}
        contrastIssues={contrastChecks.filter(c => !c.passes).length}
        onGenerate={generateNewPalette}
        onDescribe={handleDescribe}
        vibe={vibe}
        onVibeSelect={handleVibeSelect}
        onExport={() => setExportOpen(true)}
        onShare={sharePalette}
        onBaseColorSelect={handleBaseColorSelect}
        selectedBaseColor={selectedBaseColor}
        colorCount={colorCount}
        onColorCountChange={handleColorCountChange}
      />
      
      {view === 'preview' && fontPair && roles ? (
        <LandingPreview
          roles={roles}
          fontPair={fontPair}
          mode={previewMode}
          onModeChange={setPreviewMode}
          checks={contrastChecks}
          onApplyFix={applyContrastFix}
        />
      ) : (
        <div className="flex flex-1 min-h-0">
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
      )}

      {fontPair && paletteVibe && <FontBar pair={fontPair} vibe={paletteVibe} onShuffle={shuffleFonts} />}

      {fontPair && colors.length > 0 && (
        <ExportDialog
          open={exportOpen}
          onOpenChange={setExportOpen}
          onDownloadPng={downloadPng}
          input={{
            palette: colors.map(c => c.hex),
            light: assignRoles(colors.map(c => c.hex), 'light'),
            dark: assignRoles(colors.map(c => c.hex), 'dark'),
            fonts: fontPair,
          }}
        />
      )}

      <HelpOverlay />
      <Toaster />

      {/* Instructions overlay for first-time users */}
      {colors.length > 0 && view === 'palette' && (
        <div className="fixed bottom-32 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border p-4 max-w-sm">
          <p className="text-sm text-gray-600">
            Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Space</kbd> to generate, <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">1</kbd>–<kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">{colors.length}</kbd> to lock a color
          </p>
        </div>
      )}
    </div>
  );
}