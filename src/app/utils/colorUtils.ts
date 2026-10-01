// Utility functions for color generation and manipulation

export interface Color {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  locked: boolean;
}

// Convert hex to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

// Convert RGB to HSL
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

// Build a color object with all formats from a hex string
export function colorFromHex(hex: string, locked = false): Color {
  const rgb = hexToRgb(hex);
  return { hex, rgb, hsl: rgbToHsl(rgb.r, rgb.g, rgb.b), locked };
}

// Convert HSL to Hex
export function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Check if a color is light or dark for contrast
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 128;
}

// Generate gradient CSS for a single color (variations of the same color)
export function generateColorGradient(color: Color): string {
  const { h, s, l } = color.hsl;
  
  // Create a gradient from a lighter version to a darker version of the same color
  const lightVariation = hslToHex(h, Math.max(s - 20, 10), Math.min(l + 30, 85));
  const darkVariation = hslToHex(h, Math.min(s + 20, 90), Math.max(l - 30, 15));
  
  return `linear-gradient(135deg, ${lightVariation} 0%, ${color.hex} 50%, ${darkVariation} 100%)`;
}

// Generate gradient CSS across multiple colors (original function)
export function generateGradient(colors: Color[]): string {
  if (colors.length < 2) return colors[0]?.hex || '#000000';
  
  const colorStops = colors.map(color => color.hex).join(', ');
  return `linear-gradient(135deg, ${colorStops})`;
}