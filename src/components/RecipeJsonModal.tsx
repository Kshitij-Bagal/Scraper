import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, Upload, AlertCircle, FileCode } from 'lucide-react';
import type { ScrapeRecipe } from '../types/scraper.ts';
import { downloadJsonFile } from '../utils/exportUtils.ts';

interface RecipeJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: ScrapeRecipe;
  onImportRecipe: (newRecipe: ScrapeRecipe) => void;
}

export const RecipeJsonModal: React.FC<RecipeJsonModalProps> = ({
  isOpen,
  onClose,
  recipe,
  onImportRecipe
}) => {
  const [jsonText, setJsonText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setJsonText(JSON.stringify(recipe, null, 2));
      setParseError(null);
    }
  }, [isOpen, recipe]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyChanges = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.startUrl || !parsed.containerSelector) {
        throw new Error('Recipe must contain "startUrl" and "containerSelector"');
      }
      onImportRecipe(parsed);
      onClose();
    } catch (err: any) {
      setParseError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-white text-sm">Scrape Recipe JSON</h3>
              <p className="text-[11px] text-slate-400">Portable declarative recipe schema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex-1 flex flex-col space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>You can edit this JSON directly or copy it for CLI / headless execution:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() => downloadJsonFile(JSON.parse(jsonText || '{}'), `${recipe.name || 'recipe'}.json`)}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Save</span>
              </button>
            </div>
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setParseError(null);
            }}
            rows={15}
            className="w-full bg-slate-950 font-mono text-xs text-emerald-400 p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 scrollbar-thin select-text"
          />

          {parseError && (
            <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-800 text-rose-300 px-3 py-2 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>JSON Parse Error: {parseError}</span>
            </div>
          )}
        </div>

        <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyChanges}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Apply to Studio
          </button>
        </div>
      </div>
    </div>
  );
};
