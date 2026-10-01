import { Shuffle, Palette, Download, Share } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { ColorWheel } from './ColorWheel';

interface PaletteControlsProps {
  onGenerate: () => void;
  onToggleGradient: () => void;
  isGradientMode: boolean;
  onExport: () => void;
  onShare: () => void;
  onBaseColorSelect: (color: string) => void;
  selectedBaseColor: string;
  colorCount: number;
  onColorCountChange: (count: number) => void;
}

export function PaletteControls({ onGenerate, onToggleGradient, isGradientMode, onExport, onShare, onBaseColorSelect, selectedBaseColor, colorCount, onColorCountChange }: PaletteControlsProps) {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-10">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border p-4">
        <div className="flex items-center gap-6">
          {/* Color Wheel */}
          <ColorWheel 
            onColorSelect={onBaseColorSelect}
            selectedColor={selectedBaseColor}
            size={100}
          />
          
          {/* Controls */}
          <div className="flex items-center gap-4">
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
                min={2}
                max={10}
                step={1}
                value={[colorCount]}
                onValueChange={(value) => onColorCountChange(value[0])}
                className="w-20"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Switch 
                id="gradient-mode" 
                checked={isGradientMode}
                onCheckedChange={onToggleGradient}
              />
              <Label htmlFor="gradient-mode" className="flex items-center gap-1">
                <Palette className="h-4 w-4" />
                Gradient
              </Label>
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
  );
}