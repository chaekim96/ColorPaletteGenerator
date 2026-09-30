import { Color } from './colorUtils';

export interface PaletteImageOptions {
  width?: number;
  height?: number;
  swatchHeight?: number;
  fontSize?: number;
  padding?: number;
  showLabels?: boolean;
}

export function generatePaletteImage(
  colors: Color[], 
  options: PaletteImageOptions = {}
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const {
        width = 1200,
        height = 600,
        swatchHeight = height,
        fontSize = 16,
        padding = 20,
        showLabels = true
      } = options;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = width;
      canvas.height = height;

      // Calculate swatch width
      const swatchWidth = width / colors.length;

      // Draw each color swatch
      colors.forEach((color, index) => {
        const x = index * swatchWidth;
        
        // Draw color background
        ctx.fillStyle = color.hex;
        ctx.fillRect(x, 0, swatchWidth, swatchHeight);

        if (showLabels) {
          // Determine text color based on color brightness
          const brightness = (color.rgb.r * 299 + color.rgb.g * 587 + color.rgb.b * 114) / 1000;
          const textColor = brightness > 128 ? '#000000' : '#FFFFFF';
          
          ctx.fillStyle = textColor;
          ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
          ctx.textAlign = 'center';

          const centerX = x + swatchWidth / 2;
          const startY = swatchHeight / 2 - fontSize * 1.5;

          // Add semi-transparent background for better text readability
          const textBgColor = brightness > 128 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
          const lineHeight = fontSize * 1.4;
          const textWidth = Math.max(
            ctx.measureText(color.hex).width,
            ctx.measureText(`RGB(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`).width,
            ctx.measureText(`HSL(${color.hsl.h}°, ${color.hsl.s}%, ${color.hsl.l}%)`).width
          );
          
          const bgPadding = 12;
          const bgWidth = textWidth + bgPadding * 2;
          const bgHeight = lineHeight * 3 + bgPadding;
          
          ctx.fillStyle = textBgColor;
          ctx.fillRect(
            centerX - bgWidth / 2,
            startY - bgPadding / 2,
            bgWidth,
            bgHeight
          );

          // Draw text labels
          ctx.fillStyle = textColor;
          
          // HEX
          ctx.fillText(color.hex, centerX, startY + lineHeight);
          
          // RGB
          ctx.fillText(
            `RGB(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`,
            centerX,
            startY + lineHeight * 2
          );
          
          // HSL
          ctx.fillText(
            `HSL(${color.hsl.h}°, ${color.hsl.s}%, ${color.hsl.l}%)`,
            centerX,
            startY + lineHeight * 3
          );
        }
      });

      // Add title/header if there's space
      if (height > swatchHeight + 60) {
        ctx.fillStyle = '#333333';
        ctx.font = `bold ${Math.floor(fontSize * 1.5)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(
          `Color Palette - ${colors.length} Colors`,
          width / 2,
          swatchHeight + 40
        );

        // Add generation timestamp
        ctx.font = `${Math.floor(fontSize * 0.8)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        ctx.fillStyle = '#666666';
        ctx.fillText(
          `Generated on ${new Date().toLocaleDateString()}`,
          width / 2,
          swatchHeight + 60
        );
      }

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate image blob'));
        }
      }, 'image/png', 1.0);

    } catch (error) {
      reject(error);
    }
  });
}

export function downloadPaletteImage(colors: Color[], filename?: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const blob = await generatePaletteImage(colors);
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `color-palette-${Date.now()}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}