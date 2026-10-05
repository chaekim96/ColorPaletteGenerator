import { useState, useEffect, useCallback, useRef } from 'react';
import { ColorSwatch } from './components/ColorSwatch';
import { PaletteControls } from './components/PaletteControls';
import { HelpOverlay } from './components/HelpOverlay';
import { Color, colorFromHex } from './utils/colorUtils';
import { generatePalette, getVibe, inferVibe, lockedPrimary, mergeLocked, primaryColor, VibeId } from './utils/palette';
import { getFontPair, loadFontPair, pickPair } from './utils/fonts';
import { FontBar } from './components/FontBar';
import { LandingPreview } from './components/LandingPreview';
import { View } from './components/PaletteControls';
import { assignRoles, Mode, Roles } from './utils/roles';
import { checkRoles, PairCheck } from './utils/contrast';
import { ExportDialog } from './components/ExportDialog';
import { describeToSettings } from './utils/describe';
import { copyToClipboard } from './utils/clipboard';
import { decodeShareState, encodeShareState } from './utils/shareUrl';
import { paletteName } from './utils/names';
import { downloadPaletteImage } from './utils/imageExport';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

interface PaletteSettings {
  vibe: VibeId | null;
  baseHex: string;
  count: number;
}

// Read once at startup: a shared link restores palette, fonts, vibe, base color and view
const initial = decodeShareState(window.location.search);

export default function App() {
  const [colors, setColors] = useState<Color[]>(() =>
    initial.colors
      ? initial.colors.map(hex => colorFromHex(hex))
      : generatePalette({ vibe: initial.vibe, baseHex: initial.base, count: initial.count ?? 5 })
  );
  const [isGradientMode, setIsGradientMode] = useState(initial.gradient ?? false);
  const [selectedBaseColor, setSelectedBaseColor] = useState(initial.base ?? '');
  const [colorCount, setColorCount] = useState(initial.colors?.length ?? initial.count ?? 5);
  const [vibe, setVibe] = useState<VibeId | null>(initial.vibe ?? null);
  const [fontPairId, setFontPairId] = useState(initial.fonts ?? '');
  const [view, setView] = useState<View>(initial.view ?? 'palette');
  const [previewMode, setPreviewMode] = useState<Mode>(initial.mode ?? 'light');
  const [exportOpen, setExportOpen] = useState(false);
  const keepSharedFonts = useRef(Boolean(initial.fonts));

  // The vibe the palette actually reads as: the chosen one, or inferred from its primary color
  const primary = primaryColor(colors);
  const paletteVibe: VibeId | undefined = vibe ?? (primary ? inferVibe(primary.hex) : undefined);
  const fontPair = getFontPair(fontPairId);
  const name = primary ? paletteName(colors.map(c => c.hex), primary.hex, vibe ?? undefined) : '';

  useEffect(() => {
    document.title = name ? `${name} · Color Palette Generator` : 'Color Palette Generator';
  }, [name]);

  // Switch fonts only when the current pairing no longer fits the palette's vibe
  useEffect(() => {
    if (!paletteVibe) return;
    // Fonts from a shared link are shown as shared, even if they'd be picked differently here
    if (keepSharedFonts.current) {
      keepSharedFonts.current = false;
      return;
    }
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

  const shareQuery = encodeShareState({
    colors: colors.map(c => c.hex),
    fonts: fontPairId || undefined,
    vibe: vibe ?? undefined,
    base: selectedBaseColor || undefined,
    view,
    mode: previewMode,
    gradient: isGradientMode,
  });

  // Keep the address bar in sync so reloads and copied URLs keep the current state
  useEffect(() => {
    window.history.replaceState(null, '', `${window.location.pathname}?${shareQuery}`);
  }, [shareQuery]);

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
      await downloadPaletteImage(colors, `${name.toLowerCase().replace(/\s+/g, '-') || 'color-palette'}.png`);
      toast.success('Palette image exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export palette image');
    }
  };

  const sharePalette = async () => {
    const url = `${window.location.origin}${window.location.pathname}?${shareQuery}`;

    const success = await copyToClipboard(url);
    if (success) {
      toast.success('Link copied', {
        description: view === 'preview'
          ? `Opens ${name} with its fonts and the preview page.`
          : `Opens ${name} and its font pairing.`,
      });
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
          name={name}
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
            name,
          }}
        />
      )}

      <HelpOverlay />
      <Toaster />

      {/* Instructions overlay for first-time users */}
      {colors.length > 0 && view === 'palette' && (
        <div className="fixed bottom-32 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border p-4 max-w-sm">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{name}</span>
            <span className="mx-2 text-gray-300">·</span>
            Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Space</kbd> to generate, <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">1</kbd>–<kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">{colors.length}</kbd> to lock a color
          </p>
        </div>
      )}
    </div>
  );
}