import React from 'react';
import { 
  Crosshair, 
  Compass, 
  Play, 
  Download, 
  Code2, 
  Laptop, 
  Tablet, 
  Smartphone, 
  RotateCw, 
  Globe,
  Sparkles,
  Layers
} from 'lucide-react';

interface HeaderProps {
  urlInput: string;
  setUrlInput: (val: string) => void;
  onLoadUrl: (url: string) => void;
  currentMode: 'navigate' | 'select' | 'two_click';
  onToggleMode: (mode: 'navigate' | 'select' | 'two_click') => void;
  viewport: 'desktop' | 'tablet' | 'mobile';
  setViewport: (vp: 'desktop' | 'tablet' | 'mobile') => void;
  onRunScraper: () => void;
  onOpenRecipeJson: () => void;
  onOpenExportModal: () => void;
  isLoadingPage: boolean;
  isExecutingScrape: boolean;
  totalExtractedItems: number;
}

export const Header: React.FC<HeaderProps> = ({
  urlInput,
  setUrlInput,
  onLoadUrl,
  currentMode,
  onToggleMode,
  viewport,
  setViewport,
  onRunScraper,
  onOpenRecipeJson,
  onOpenExportModal,
  isLoadingPage,
  isExecutingScrape,
  totalExtractedItems
}) => {
  const presets = [
    { label: 'DummyJSON Store (Playground)', url: 'demo:dummyjson' },
    { label: 'Smartphones & Tech', url: 'demo:dummyjson?category=smartphones' },
    { label: 'Books to Scrape (Multi-page)', url: 'demo:books' },
    { label: 'Lenskart (Dynamic CSS)', url: 'demo:lenskart' },
    { label: 'https://books.toscrape.com', url: 'https://books.toscrape.com' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onLoadUrl(urlInput.trim());
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md select-none">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Layers className="w-4 h-4 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base">ParseVisual</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Cheerio Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none">Visual Pattern &amp; DOM Scraper</p>
          </div>
        </div>

        {/* Quick Presets dropdown */}
        <div className="hidden lg:flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Demo Examples:
          </span>
          {presets.map(p => (
            <button
              key={p.url}
              onClick={() => {
                setUrlInput(p.url);
                onLoadUrl(p.url);
              }}
              className={`text-xs px-2.5 py-1 rounded transition-colors ${
                urlInput === p.url
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* URL Search & Load Form */}
      <form onSubmit={handleSubmit} className="flex-1 max-w-xl flex items-center gap-2 min-w-[280px]">
        <div className="relative flex-1">
          <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter target URL (e.g. demo:dummyjson or https://example.com)..."
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={isLoadingPage}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
        >
          {isLoadingPage ? (
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RotateCw className="w-3.5 h-3.5" />
          )}
          <span>Load</span>
        </button>
      </form>

      {/* Interaction Mode Toggle */}
      <div className="flex items-center gap-2">
        <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex items-center">
          <button
            onClick={() => onToggleMode('select')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              currentMode === 'select'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Select Mode: Click an element to inspect and add fields"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Select</span>
          </button>
          <button
            onClick={() => onToggleMode('two_click')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              currentMode === 'two_click'
                ? 'bg-amber-600 text-white shadow-sm font-bold animate-pulse'
                : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-900'
            }`}
            title="2-Click Container: Solves dynamic e-commerce sites like Lenskart by clicking 2 cards to find LCA"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>2-Click Container</span>
          </button>
          <button
            onClick={() => onToggleMode('navigate')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              currentMode === 'navigate'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Navigate Mode: Normal browser clicks to explore links and dismiss popups"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Navigate</span>
          </button>
        </div>

        {/* Viewport switcher */}
        <div className="hidden sm:flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 items-center">
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded transition-colors ${
              viewport === 'desktop' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Desktop Viewport"
          >
            <Laptop className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded transition-colors ${
              viewport === 'tablet' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tablet Viewport (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded transition-colors ${
              viewport === 'mobile' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mobile Viewport (390px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Recipe JSON Modal */}
        <button
          onClick={onOpenRecipeJson}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
          title="Inspect & Edit Scrape Recipe JSON"
        >
          <Code2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Recipe JSON</span>
        </button>

        {/* Export Data Button */}
        <button
          onClick={onOpenExportModal}
          disabled={totalExtractedItems === 0}
          className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
          title="Export Extracted Records"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Export</span>
          {totalExtractedItems > 0 && (
            <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
              {totalExtractedItems}
            </span>
          )}
        </button>

        {/* Primary Run Scraper Button */}
        <button
          onClick={onRunScraper}
          disabled={isExecutingScrape}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
        >
          {isExecutingScrape ? (
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{isExecutingScrape ? 'Scraping...' : 'Run Scraper'}</span>
        </button>
      </div>
    </header>
  );
};
