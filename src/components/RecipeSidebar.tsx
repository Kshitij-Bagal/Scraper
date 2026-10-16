import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  BoxSelect, 
  Settings2, 
  Clock, 
  ShieldCheck, 
  Play, 
  Sparkles, 
  FileText, 
  HelpCircle,
  Hash,
  Link as LinkIcon,
  Image as ImageIcon,
  Type,
  ChevronRight,
  Eye,
  RefreshCw
} from 'lucide-react';
import type { ScrapeRecipe, FieldDefinition, PaginationType } from '../types/scraper.ts';
import { AiTokenBadge } from './AiTokenBadge.tsx';
import type { TokenStats } from '../utils/aiUsageManager.ts';

interface RecipeSidebarProps {
  recipe: ScrapeRecipe;
  setRecipe: React.Dispatch<React.SetStateAction<ScrapeRecipe>>;
  onRunScraper: () => void;
  isExecutingScrape: boolean;
  suggestedContainer?: string;
  onApplySuggestedContainer?: (sel: string) => void;
  onStartTwoClick?: () => void;
  onRunAiDiscovery?: () => void;
  width?: number;
  tokenStats?: TokenStats;
  isCustomKeyActive?: boolean;
  onOpenKeyModal?: () => void;
  onResetTokens?: () => void;
}

export const RecipeSidebar: React.FC<RecipeSidebarProps> = ({
  recipe,
  setRecipe,
  onRunScraper,
  isExecutingScrape,
  suggestedContainer,
  onApplySuggestedContainer,
  onStartTwoClick,
  onRunAiDiscovery,
  width = 380,
  tokenStats,
  isCustomKeyActive = false,
  onOpenKeyModal,
  onResetTokens
}) => {
  const [activeTab, setActiveTab] = useState<'fields' | 'pagination'>('fields');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldSelector, setNewFieldSelector] = useState('');
  const [newFieldAttr, setNewFieldAttr] = useState('innerText');

  const handleContainerChange = (val: string) => {
    setRecipe(prev => ({ ...prev, containerSelector: val }));
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    const newField: FieldDefinition = {
      id: 'field_' + Math.random().toString(36).substr(2, 9),
      name: newFieldName.trim().toLowerCase().replace(/\s+/g, '_'),
      selector: newFieldSelector.trim() || ':scope',
      attribute: newFieldAttr || 'innerText',
      type: newFieldAttr === 'href' ? 'url' : newFieldAttr === 'src' ? 'image' : 'text'
    };

    setRecipe(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));

    setNewFieldName('');
    setNewFieldSelector('');
    setNewFieldAttr('innerText');
  };

  const handleRemoveField = (id: string) => {
    setRecipe(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== id)
    }));
  };

  const handleUpdateField = (id: string, updates: Partial<FieldDefinition>) => {
    setRecipe(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === id ? { ...f, ...updates } : f)
    }));
  };

  const handlePaginationChange = (type: PaginationType) => {
    setRecipe(prev => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        type
      }
    }));
  };

  return (
    <aside 
      className="bg-slate-900 border-l border-slate-800 flex flex-col h-full text-slate-200 shadow-xl select-none shrink-0 overflow-hidden"
      style={{ width: `${width}px` }}
    >
      {/* Top Sidebar Header & Tabs */}
      <div className="bg-slate-950 px-3 py-2 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-xs text-white">Scrape Recipe Builder</span>
        </div>
        <div className="flex bg-slate-900 rounded p-0.5 border border-slate-800">
          <button
            onClick={() => setActiveTab('fields')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === 'fields'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Fields ({recipe.fields.length})
          </button>
          <button
            onClick={() => setActiveTab('pagination')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === 'pagination'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pagination &amp; Delay
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === 'fields' ? (
          <>
            {/* Repeating Parent Container Card */}
            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BoxSelect className="w-3.5 h-3.5" /> Repeating Parent Container
                </span>
                <span className="text-[10px] text-slate-500">2-Click LCA Anchor</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Groups fields into aligned records. Missing fields on any card will output <code className="text-emerald-400 bg-slate-900 px-1 py-0.2 rounded font-mono">null</code> without shifting row alignment.
              </p>

              <div className="space-y-1.5">
                <input
                  type="text"
                  value={recipe.containerSelector}
                  onChange={(e) => handleContainerChange(e.target.value)}
                  placeholder="e.g. ol.row > li or div[class*='ProductCard']"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                />

                {onStartTwoClick && (
                  <button
                    onClick={onStartTwoClick}
                    className="w-full bg-gradient-to-r from-amber-600/30 to-orange-600/30 hover:from-amber-600/40 hover:to-orange-600/40 text-amber-200 border border-amber-500/40 rounded-lg py-1.5 px-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    title="Click 2 cards in preview to automatically compute the Lowest Common Ancestor (LCA) and isolate all cards"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>2-Click Auto-Detect (LCA)</span>
                  </button>
                )}

                {onRunAiDiscovery && (
                  <div className="space-y-1.5 pt-0.5">
                    <button
                      onClick={onRunAiDiscovery}
                      className="w-full bg-gradient-to-r from-cyan-600/30 via-indigo-600/30 to-purple-600/30 hover:from-cyan-600/40 hover:via-indigo-600/40 hover:to-purple-600/40 text-cyan-200 border border-cyan-500/40 rounded-lg py-1.5 px-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title="AI Smart Container Discovery: Analyzes DOM tree with Gemini to isolate repeating containers"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                      <span>AI Smart Container Discovery</span>
                    </button>

                    {tokenStats && onOpenKeyModal && (
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] text-slate-400 font-mono">Token Telemetry:</span>
                        <AiTokenBadge
                          tokenStats={tokenStats}
                          isCustomKeyActive={isCustomKeyActive}
                          onOpenKeyModal={onOpenKeyModal}
                          onResetTokens={onResetTokens || (() => {})}
                          compact
                        />
                      </div>
                    )}
                  </div>
                )}

                {suggestedContainer && suggestedContainer !== recipe.containerSelector && onApplySuggestedContainer && (
                  <button
                    onClick={() => onApplySuggestedContainer(suggestedContainer)}
                    className="w-full text-left bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded px-2 py-1 text-[11px] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="truncate flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      Auto-detected sibling pattern: <code className="font-mono">{suggestedContainer}</code>
                    </span>
                    <span className="font-bold underline ml-1 flex-shrink-0">Apply</span>
                  </button>
                )}
              </div>
            </div>

            {/* Extracted Fields List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Extracted Columns ({recipe.fields.length})
                </span>
                <span className="text-[10px] text-slate-500">Relative to Container</span>
              </div>

              {recipe.fields.length === 0 ? (
                <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-4 text-center text-xs text-slate-500 space-y-1">
                  <p>No fields defined yet.</p>
                  <p className="text-[11px] text-slate-600">
                    Click any element inside the preview to add fields via the bottom dock, or use the form below.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recipe.fields.map((field) => (
                    <div
                      key={field.id}
                      className="bg-slate-950 rounded-lg p-2.5 border border-slate-800 space-y-2 shadow-xs hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {field.attribute === 'href' ? (
                            <LinkIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          ) : field.attribute === 'src' ? (
                            <ImageIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          ) : (
                            <Type className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => handleUpdateField(field.id, { name: e.target.value })}
                            className="bg-transparent font-bold text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded px-1 w-full"
                          />
                        </div>

                        <button
                          onClick={() => handleRemoveField(field.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 hover:bg-slate-900 rounded transition-colors cursor-pointer"
                          title="Delete field"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Selector</label>
                          <input
                            type="text"
                            value={field.selector}
                            onChange={(e) => handleUpdateField(field.id, { selector: e.target.value })}
                            placeholder=":scope or child"
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Attribute</label>
                          <select
                            value={field.attribute}
                            onChange={(e) => handleUpdateField(field.id, { attribute: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-[11px] focus:outline-none focus:border-emerald-500 cursor-pointer"
                          >
                            <option value="innerText">innerText (Visible text)</option>
                            <option value="href">href (Link URL)</option>
                            <option value="src">src (Image URL)</option>
                            <option value="title">title (Hover text)</option>
                            <option value="alt">alt (Image alt)</option>
                            <option value="class">class (CSS classes)</option>
                            <option value="innerHTML">innerHTML (Raw HTML)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Field Inline Bar */}
              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-2 mt-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Quick Add Field
                </span>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="Field name (e.g. price, title)..."
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newFieldSelector}
                      onChange={(e) => setNewFieldSelector(e.target.value)}
                      placeholder="Relative selector..."
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <select
                      value={newFieldAttr}
                      onChange={(e) => setNewFieldAttr(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="innerText">innerText</option>
                      <option value="href">href</option>
                      <option value="src">src</option>
                      <option value="title">title</option>
                      <option value="class">class</option>
                    </select>
                  </div>
                  <button
                    onClick={handleAddField}
                    disabled={!newFieldName.trim()}
                    className="w-full bg-emerald-600/90 hover:bg-emerald-600 disabled:opacity-40 text-white font-medium py-1.5 rounded text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Column</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Multi-Page Pagination & Politeness Engine Tab */
          <div className="space-y-4">
            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Settings2 className="w-3.5 h-3.5" /> Pagination Strategy
                </span>
              </div>

              <div className="space-y-2">
                {[
                  {
                    type: 'none' as PaginationType,
                    title: 'Single Page Only',
                    desc: 'Scrapes only the initial page loaded.'
                  },
                  {
                    type: 'next_link' as PaginationType,
                    title: 'Next Button Link',
                    desc: 'Follows <a href="..."> next page link up to max page limit.'
                  },
                  {
                    type: 'url_pattern' as PaginationType,
                    title: 'URL Pattern ({page})',
                    desc: 'Iterates page number in URL e.g. /page-{page}.html'
                  }
                ].map((strat) => (
                  <label
                    key={strat.type}
                    onClick={() => handlePaginationChange(strat.type)}
                    className={`block p-2.5 rounded-lg border cursor-pointer transition-all ${
                      recipe.pagination.type === strat.type
                        ? 'bg-emerald-950/30 border-emerald-500/50 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={recipe.pagination.type === strat.type}
                        onChange={() => {}}
                        className="text-emerald-500"
                      />
                      <span className="font-semibold text-xs text-white">{strat.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 ml-5">{strat.desc}</p>
                  </label>
                ))}
              </div>

              {recipe.pagination.type === 'next_link' && (
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] text-slate-400 font-semibold uppercase">
                    Next Link Selector
                  </label>
                  <input
                    type="text"
                    value={recipe.pagination.selector || ''}
                    onChange={(e) =>
                      setRecipe(prev => ({
                        ...prev,
                        pagination: { ...prev.pagination, selector: e.target.value }
                      }))
                    }
                    placeholder="e.g. li.next > a or .pagination-next"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {recipe.pagination.type === 'url_pattern' && (
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] text-slate-400 font-semibold uppercase">
                    URL Pattern (Must include &#123;page&#125;)
                  </label>
                  <input
                    type="text"
                    value={recipe.pagination.urlPattern || ''}
                    onChange={(e) =>
                      setRecipe(prev => ({
                        ...prev,
                        pagination: { ...prev.pagination, urlPattern: e.target.value }
                      }))
                    }
                    placeholder="https://example.com/items?page={page}"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}
            </div>

            {/* Politeness & Crawl Safety Engine */}
            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Politeness &amp; Rate Limits
                </span>
              </div>

              {/* Max Pages Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Max Pages Cap</span>
                  <span className="font-mono text-white font-bold">{recipe.pagination.maxPages} pages</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={recipe.pagination.maxPages}
                  onChange={(e) =>
                    setRecipe(prev => ({
                      ...prev,
                      pagination: { ...prev.pagination, maxPages: parseInt(e.target.value, 10) }
                    }))
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Politeness Delay Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" /> Delay Between Pages
                  </span>
                  <span className="font-mono text-amber-300 font-bold">{recipe.pagination.delayMs} ms</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="4000"
                  step="100"
                  value={recipe.pagination.delayMs}
                  onChange={(e) =>
                    setRecipe(prev => ({
                      ...prev,
                      pagination: { ...prev.pagination, delayMs: parseInt(e.target.value, 10) }
                    }))
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">
                  Prevents IP bans and protects server load. High delay ensures bot safety.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Scrape Execution Trigger */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <button
          onClick={onRunScraper}
          disabled={isExecutingScrape || !recipe.containerSelector || recipe.fields.length === 0}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 text-slate-950 font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          {isExecutingScrape ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          <span>{isExecutingScrape ? 'Running Cheerio Scraper...' : `Run Recipe (${recipe.fields.length} Fields)`}</span>
        </button>
      </div>
    </aside>
  );
};
