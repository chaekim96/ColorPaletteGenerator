import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';

// Shortcut sheet; opened from the toolbar's help button or the ? key
export function HelpOverlay({ open: isVisible, onOpenChange: setIsVisible }: { open: boolean; onOpenChange: (open: boolean) => void }) {

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === '?' || event.key === 'h') {
        setIsVisible(!isVisible);
      }
      if (event.key === 'Escape') {
        setIsVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible, setIsVisible]);

  const shortcuts = [
    { key: 'Spacebar', action: 'Generate new palette (keeps locked colors)' },
    { key: '1–6', action: 'Lock / unlock a color' },
    { key: 'P', action: 'Switch palette / preview' },
    { key: 'F', action: 'Shuffle fonts' },
    { key: 'G', action: 'Toggle gradient mode' },
    { key: 'E', action: 'Export code (CSS, Tailwind, fonts) or PNG' },
    { key: 'S', action: 'Share palette' },
    { key: '?', action: 'Toggle this help' },
    { key: 'Esc', action: 'Close help' },
  ];

  if (!isVisible) return null;

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
            Describe your project or pick a mood. Add your brand color and it stays exactly as entered. Lock the colors you like and press Space to regenerate the rest. Each color is labeled with what it's for; click a hex code to copy it.
          </p>
        </div>
      </div>
    </div>
  );
}