// Utility functions for color generation and manipulation

export interface Color {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  locked: boolean;
}

// Generate a random hex color
export function generateRandomHex(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
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

// Generate a color object with all formats
export function generateColor(): Color {
  const hex = generateRandomHex();
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  return {
    hex,
    rgb,
    hsl,
    locked: false
  };
}

// Generate harmonious colors using color theory
export function generateHarmoniousPalette(baseColor?: string, colorCount: number = 5): Color[] {
  const schemes = ['analogous', 'triadic', 'complementary', 'tetradic', 'monochromatic'];
  const randomScheme = schemes[Math.floor(Math.random() * schemes.length)];
  
  let baseHue: number;
  let baseSaturation: number;
  let baseLightness: number;
  
  if (baseColor) {
    // Parse the base color (assuming HSL format)
    const hslMatch = baseColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (hslMatch) {
      baseHue = parseInt(hslMatch[1]);
      baseSaturation = parseInt(hslMatch[2]);
      baseLightness = parseInt(hslMatch[3]);
    } else {
      // Fallback to random if parsing fails
      baseHue = Math.floor(Math.random() * 360);
      baseSaturation = 40 + Math.random() * 50;
      baseLightness = 30 + Math.random() * 40;
    }
  } else {
    baseHue = Math.floor(Math.random() * 360);
    baseSaturation = 40 + Math.random() * 50; // 40-90%
    baseLightness = 30 + Math.random() * 40; // 30-70%
  }
  
  let hues: number[] = [];
  
  switch (randomScheme) {
    case 'analogous':
      // Generate analogous colors around the base hue
      hues = Array.from({ length: colorCount }, (_, i) => {
        const step = 60 / Math.max(colorCount - 1, 1);
        return (baseHue + (i - Math.floor(colorCount / 2)) * step + 360) % 360;
      });
      break;
    case 'triadic':
      // Generate triadic colors (120° apart) and fill remaining slots
      const triadicBase = [baseHue, (baseHue + 120) % 360, (baseHue + 240) % 360];
      hues = Array.from({ length: colorCount }, (_, i) => {
        if (i < 3) return triadicBase[i];
        // Fill remaining with variations
        return (baseHue + (i * 30)) % 360;
      });
      break;
    case 'complementary':
      // Generate complementary colors (180° apart) and fill remaining slots
      hues = Array.from({ length: colorCount }, (_, i) => {
        if (i === 0) return baseHue;
        if (i === 1) return (baseHue + 180) % 360;
        // Fill remaining with analogous variations
        return (baseHue + (i * 25)) % 360;
      });
      break;
    case 'tetradic':
      // Generate tetradic colors (90° apart) and fill remaining slots
      const tetradicBase = [baseHue, (baseHue + 90) % 360, (baseHue + 180) % 360, (baseHue + 270) % 360];
      hues = Array.from({ length: colorCount }, (_, i) => {
        if (i < 4) return tetradicBase[i];
        // Fill remaining with variations
        return (baseHue + (i * 20)) % 360;
      });
      break;
    case 'monochromatic':
      hues = Array.from({ length: colorCount }, () => baseHue);
      break;
  }
  
  return hues.map((hue, index) => {
    let saturation = baseSaturation;
    let lightness = baseLightness;
    
    if (randomScheme === 'monochromatic') {
      // Vary lightness for monochromatic
      lightness = 20 + (index * 15) + Math.random() * 10;
      saturation = baseSaturation + (Math.random() - 0.5) * 20;
    } else {
      // Add some variation but keep it more controlled when base color is provided
      const variation = baseColor ? 20 : 30;
      saturation += (Math.random() - 0.5) * variation;
      lightness += (Math.random() - 0.5) * variation;
    }
    
    // Ensure values are within valid ranges
    saturation = Math.max(10, Math.min(90, saturation));
    lightness = Math.max(15, Math.min(85, lightness));
    
    const hex = hslToHex(hue, saturation, lightness);
    const rgb = hexToRgb(hex);
    const hsl = { h: Math.round(hue), s: Math.round(saturation), l: Math.round(lightness) };
    
    return { hex, rgb, hsl, locked: false };
  });
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