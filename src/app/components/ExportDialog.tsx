import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { copyToClipboard } from '../utils/clipboard';
import { cssVariables, ExportInput, googleFontsEmbed, tailwindV3, tailwindV4 } from '../utils/export';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  input: ExportInput;
  onDownloadPng: () => void;
}

const FORMATS = [
  { id: 'css', label: 'CSS variables', where: 'Paste into your global stylesheet (e.g. globals.css). Works with any framework.', build: cssVariables },
  { id: 'tw4', label: 'Tailwind v4', where: 'Replace the @import "tailwindcss" line in your main CSS file with this.', build: tailwindV4 },
  { id: 'tw3', label: 'Tailwind v3', where: 'Merge into tailwind.config.js. Load the fonts with the Google Fonts tab.', build: tailwindV3 },
  { id: 'fonts', label: 'Google Fonts', where: 'Add to your <head>, or use the @import line in CSS.', build: (input: ExportInput) => googleFontsEmbed(input.fonts) },
] as const;

function CodeBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (await copyToClipboard(code)) {
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 1500);
    } else {
      toast.error('Copy failed. Select the code and copy it manually.');
    }
  };

  return (
    <div className="relative min-w-0">
      <pre className="max-h-[50vh] overflow-auto rounded-md border bg-gray-50 p-4 pr-24 text-xs leading-relaxed text-gray-900">
        <code>{code}</code>
      </pre>
      <Button size="sm" variant="outline" onClick={copy} className="absolute top-2 right-2 gap-1.5 bg-white">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}

// Developer handoff: palette roles and fonts as ready-to-paste code
export function ExportDialog({ open, onOpenChange, input, onDownloadPng }: ExportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export your palette and fonts</DialogTitle>
          <DialogDescription>
            Colors are named by role (background, primary, accent...) so they work without design decisions. Light mode by default, dark mode included where supported.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="css" className="min-w-0">
          <TabsList className="w-full">
            {FORMATS.map(f => (
              <TabsTrigger key={f.id} value={f.id}>{f.label}</TabsTrigger>
            ))}
          </TabsList>
          {FORMATS.map(f => (
            <TabsContent key={f.id} value={f.id} className="space-y-2 min-w-0">
              <p className="text-sm text-gray-600">{f.where}</p>
              <CodeBlock code={f.build(input)} label={f.label} />
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-gray-600">Need it for a deck or a designer?</p>
          <Button variant="outline" onClick={onDownloadPng} className="gap-2">
            <Download className="h-4 w-4" />
            Download PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
