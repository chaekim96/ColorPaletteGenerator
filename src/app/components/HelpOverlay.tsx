import { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from './ui/button';

export function HelpOverlay() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === '?' || event.key === 'h') {
        setIsVisible(!isVisible);
      }
      if (event.key === 'Escape') {
        setIsVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  const shortcuts = [
    { key: 'Spacebar', action: 'Generate new palette' },
    { key: 'G', action: 'Toggle gradient mode' },
    { key: 'E', action: 'Export palette as PNG' },
    { key: 'S', action: 'Share palette' },
    { key: '?', action: 'Toggle this help' },
    { key: 'Esc', action: 'Close help' },
  ];

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-20">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsVisible(true)}
          className="gap-2 bg-white/90 backdrop-blur-sm"
        >
          <Keyboard className="h-4 w-4" />
          Help
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
          <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{shortcut.action}</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-gray-500">
            Click on any color to copy its value. Hover over colors to see all formats and lock them. Use the color wheel to select a base color and the slider to choose how many colors (2-10) for harmonious palettes.
          </p>
        </div>
      </div>
    </div>
  );
}