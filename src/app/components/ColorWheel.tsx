import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { RotateCcw } from 'lucide-react';

interface ColorWheelProps {
  onColorSelect: (color: string) => void;
  selectedColor?: string;
  size?: number;
}

export function ColorWheel({ onColorSelect, selectedColor, size = 120 }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentHue, setCurrentHue] = useState(0);
  const [currentSaturation, setCurrentSaturation] = useState(50);

  const drawColorWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw color wheel
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 1) * Math.PI / 180;
      const endAngle = angle * Math.PI / 180;

      for (let r = 0; r < radius; r++) {
        const saturation = r / radius * 100;
        const lightness = 50;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, startAngle, endAngle);
        ctx.strokeStyle = `hsl(${angle}, ${saturation}%, ${lightness}%)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Draw center circle (white)
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw selection indicator
    if (selectedColor) {
      const hue = currentHue;
      const saturation = currentSaturation;
      const indicatorRadius = (saturation / 100) * radius;
      const angle = (hue * Math.PI) / 180;
      
      const x = centerX + Math.cos(angle) * indicatorRadius;
      const y = centerY + Math.sin(angle) * indicatorRadius;

      // Draw indicator
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [size, selectedColor, currentHue, currentSaturation]);

  const getColorFromPosition = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    const deltaX = canvasX - centerX;
    const deltaY = canvasY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Check if within wheel bounds
    if (distance > radius) return null;

    const angle = Math.atan2(deltaY, deltaX);
    let hue = (angle * 180 / Math.PI + 360) % 360;
    const saturation = Math.min((distance / radius) * 100, 100);
    const lightness = 50;

    return {
      hue: Math.round(hue),
      saturation: Math.round(saturation),
      color: `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${lightness}%)`
    };
  }, [size]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    setIsDragging(true);
    const colorData = getColorFromPosition(event.clientX, event.clientY);
    if (colorData) {
      setCurrentHue(colorData.hue);
      setCurrentSaturation(colorData.saturation);
      onColorSelect(colorData.color);
    }
  }, [getColorFromPosition, onColorSelect]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging) return;
    
    const colorData = getColorFromPosition(event.clientX, event.clientY);
    if (colorData) {
      setCurrentHue(colorData.hue);
      setCurrentSaturation(colorData.saturation);
      onColorSelect(colorData.color);
    }
  }, [isDragging, getColorFromPosition, onColorSelect]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetSelection = () => {
    setCurrentHue(0);
    setCurrentSaturation(50);
    onColorSelect('');
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    drawColorWheel();
  }, [drawColorWheel]);

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="cursor-crosshair rounded-full shadow-sm border border-gray-200"
          onMouseDown={handleMouseDown}
        />
        {selectedColor && (
          <div className="absolute -bottom-1 -right-1">
            <div 
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: selectedColor }}
            />
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-2">
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
      </div>
    </div>
  );
}