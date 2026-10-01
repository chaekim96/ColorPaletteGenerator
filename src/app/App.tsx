import { useState, useEffect, useCallback } from 'react';
import { ColorSwatch } from './components/ColorSwatch';
import { PaletteControls } from './components/PaletteControls';
import { HelpOverlay } from './components/HelpOverlay';
import { Color, generateHarmoniousPalette, hexToRgb, rgbToHsl } from './utils/colorUtils';
import { copyToClipboard } from './utils/clipboard';
import { downloadPaletteImage } from './utils/imageExport';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

export default function App() {
  const [colors, setColors] = useState<Color[]>([]);
  const [isGradientMode, setIsGradientMode] = useState(false);
  const [selectedBaseColor, setSelectedBaseColor] = useState('');
  const [colorCount, setColorCount] = useState(5);

  // Initialize palette
  const generateNewPalette = useCallback(() => {
    setColors(prevColors => {
      const newColors = generateHarmoniousPalette(selectedBaseColor || undefined, colorCount);
      
      // Preserve locked colors (only if they exist in the new array)
      return newColors.map((newColor, index) => {
        if (prevColors[index]?.locked) {
          return prevColors[index];
        }
        return newColor;
      });
    });
  }, [selectedBaseColor, colorCount]);

  // Effect to generate palette when colorCount changes (after URL initialization)
  useEffect(() => {
    // Only generate if we have colors already (meaning we've initialized)
    if (colors.length > 0 && colors.length !== colorCount) {
      const newColors = generateHarmoniousPalette(selectedBaseColor || undefined, colorCount);
      setColors(prevColors => {
        // Preserve locked colors (only if they exist in the new array)
        return newColors.map((newColor, index) => {
          if (prevColors[index]?.locked) {
            return prevColors[index];
          }
          return newColor;
        });
      });
    }
  }, [colorCount, selectedBaseColor]);

  // Initialize on mount and check URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlColors = urlParams.get('colors');
    const urlGradient = urlParams.get('gradient') === 'true';
    const urlCount = parseInt(urlParams.get('count') || '5');
    
    // First, set the gradient mode from URL if present
    if (urlParams.has('gradient')) {
      setIsGradientMode(urlGradient);
    }
    
    if (urlColors) {
      try {
        const hexColors = urlColors.split('-').map(hex => `#${hex}`);
        const parsedColors: Color[] = hexColors.map(hex => {
          const rgb = hexToRgb(hex);
          const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
          return { hex, rgb, hsl, locked: false };
        });
        
        if (parsedColors.length >= 2 && parsedColors.length <= 10) {
          setColors(parsedColors);
          setColorCount(parsedColors.length);
          return;
        }
      } catch (error) {
        console.warn('Invalid URL color parameters');
      }
    }
    
    // Set color count from URL if valid
    if (urlCount >= 2 && urlCount <= 10 && urlCount !== colorCount) {
      setColorCount(urlCount);
      // Generate palette with the new count
      const newColors = generateHarmoniousPalette(selectedBaseColor || undefined, urlCount);
      setColors(newColors);
    } else {
      // Generate initial palette with current colorCount
      const newColors = generateHarmoniousPalette(selectedBaseColor || undefined, colorCount);
      setColors(newColors);
    }
  }, []); // Remove generateNewPalette from dependencies to avoid circular dependency

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
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

  const handleBaseColorSelect = (color: string) => {
    setSelectedBaseColor(color);
    // The useEffect will handle palette regeneration
  };

  const handleColorCountChange = (newCount: number) => {
    setColorCount(newCount);
    // The useEffect will handle palette regeneration
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PaletteControls 
        onGenerate={generateNewPalette}
        onToggleGradient={() => setIsGradientMode(prev => !prev)}
        isGradientMode={isGradientMode}
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
            key={`${color.hex}-${index}`}
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
            Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Space</kbd> to generate new colors
          </p>
        </div>
      )}
    </div>
  );
}