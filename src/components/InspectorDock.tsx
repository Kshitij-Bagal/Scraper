import React, { useState, useEffect } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  CornerDownRight, 
  Copy, 
  Check, 
  Plus, 
  BoxSelect, 
  Sliders, 
  Code, 
  ListTree, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Maximize2,
  Minimize2,
  Sparkles,
  Bug,
  AlertTriangle,
  RefreshCw,
  SearchCode,
  Layers,
  Wand2
} from 'lucide-react';
import type { ElementSelectionData, BreadcrumbNode, ContainerDebugReport } from '../types/scraper.ts';
import { AiTokenBadge } from './AiTokenBadge.tsx';
import type { TokenStats } from '../utils/aiUsageManager.ts';

interface InspectorDockProps {
  selectedElement: ElementSelectionData | null;
  onTraverseDom: (direction: 'up' | 'down' | 'to_index', index?: number) => void;
  onTestSelector: (selector: string) => void;
  selectorMatchCount: number | null;
  selectorError: string | null;
  onSetContainer: (selector: string) => void;
  onAddFieldFromElement: (name: string, selector: string, attribute: string) => void;
  currentContainerSelector: string;
  onRunAiDiscovery?: () => void;
  containerDebugReport?: ContainerDebugReport | null;
  onRequestContainerDebug?: () => void;
  onHighlightFailedNode?: (index: number) => void;
  onClearDebugHighlights?: () => void;
  height?: number | string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  tokenStats?: TokenStats;
  isCustomKeyActive?: boolean;
  onOpenKeyModal?: () => void;
  onResetTokens?: () => void;
}

export const InspectorDock: React.FC<InspectorDockProps> = ({
  selectedElement,
  onTraverseDom,
  onTestSelector,
  selectorMatchCount,
  selectorError,
  onSetContainer,
  onAddFieldFromElement,
  currentContainerSelector,
  onRunAiDiscovery,
  containerDebugReport,
  onRequestContainerDebug,
  onHighlightFailedNode,
  onClearDebugHighlights,
  height = '100%',
  isCollapsed = false,
  onToggleCollapse,
  tokenStats,
  isCustomKeyActive = false,
  onOpenKeyModal,
  onResetTokens
}) => {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const isDockOpen = isCollapsed ? false : internalExpanded;
  const [editableSelector, setEditableSelector] = useState('');
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [activeTab, setActiveTab] = useState<'attributes' | 'html' | 'debugger'>('attributes');
  const [activeHighlightedFailedIndex, setActiveHighlightedFailedIndex] = useState<number | null>(null);

  // Sync editable selector when selectedElement changes
  useEffect(() => {
    if (selectedElement) {
      setEditableSelector(selectedElement.selector);
    }
  }, [selectedElement]);

  // Debounce selector updates to test custom selector in iframe
  const handleSelectorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSel = e.target.value;
    setEditableSelector(newSel);
    onTestSelector(newSel);
  };

  const handleCopyHtml = () => {
    if (selectedElement?.outerHTML) {
      navigator.clipboard.writeText(selectedElement.outerHTML);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    }
  };

  const handleToggleOpen = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  if (!isDockOpen) {
    return (
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-300 h-full">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-white">DOM &amp; CSS Inspector Dock</span>
          {selectedElement ? (
            <span className="text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded text-[11px]">
              Selected: <strong className="text-emerald-400">{selectedElement.tagName.toLowerCase()}</strong> ({selectedElement.similarCount} matches)
            </span>
          ) : (
            <span className="text-slate-500 italic">No element selected. Click any element inside preview to inspect.</span>
          )}
        </div>
        <button
          onClick={handleToggleOpen}
          className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          <span>Expand Dock</span>
        </button>
      </div>
    );
  }

  return (
    <div 
      className="bg-slate-900 border-t border-slate-800 shadow-2xl flex flex-col text-slate-200 transition-[height] duration-75 h-full overflow-hidden"
      style={{ height: height === '100%' ? '100%' : typeof height === 'number' ? `${height}px` : height }}
    >
      {/* Top Header Bar of Dock */}
      <div className="px-3 py-1.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold text-white text-xs">DOM &amp; CSS Inspector Dock</span>
          <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 hidden sm:inline">
            Click Target Trap Resolver &amp; Container Debugger
          </span>
        </div>

        {/* DOM Ancestry Navigation Shortcuts & Tab Switches */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onTraverseDom('up')}
            disabled={!selectedElement}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 px-2 py-1 rounded text-[11px] font-medium border border-slate-700 transition-colors cursor-pointer"
            title="Traverse up to parent element in DOM tree"
          >
            <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Parent</span>
          </button>
          <button
            onClick={() => onTraverseDom('down')}
            disabled={!selectedElement}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 px-2 py-1 rounded text-[11px] font-medium border border-slate-700 transition-colors cursor-pointer"
            title="Traverse down to first child element"
          >
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>Child</span>
          </button>
          <div className="h-4 w-[1px] bg-slate-800 mx-1" />
          <button
            onClick={handleToggleOpen}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="Collapse dock"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-3 space-y-2.5">
        {/* Section 1: Interactive DOM Breadcrumb Bar (if element selected) */}
        {selectedElement && (
          <div className="shrink-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <ListTree className="w-3 h-3 text-cyan-400" /> DOM Ancestry Trail (Click to Jump)
              </span>
              <span className="text-[10px] text-slate-500">
                Root → Target ({selectedElement.ancestry.length} levels)
              </span>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto py-1 px-1 bg-slate-950/80 rounded-md border border-slate-800 scrollbar-thin">
              {selectedElement.ancestry.map((node: BreadcrumbNode, i: number) => {
                const isSelected = i === selectedElement.ancestry.length - 1;
                return (
                  <React.Fragment key={i}>
                    <button
                      onClick={() => onTraverseDom('to_index', node.index)}
                      className={`px-2 py-0.8 rounded text-[11px] font-mono whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-bold shadow-sm ring-1 ring-emerald-400'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-emerald-300 border border-slate-800'
                      }`}
                      title={`Jump to <${node.tagName.toLowerCase()}> - Selector: ${node.selector}`}
                    >
                      <span className="text-slate-400">&lt;</span>
                      <span className={isSelected ? 'text-white' : 'text-cyan-300'}>
                        {node.tagName.toLowerCase()}
                      </span>
                      {node.id && <span className="text-amber-400">#{node.id}</span>}
                      {node.classNames && !node.id && (
                        <span className="text-indigo-300">.{node.classNames.split(' ')[0]}</span>
                      )}
                      <span className="text-slate-400">&gt;</span>
                    </button>
                    {i < selectedElement.ancestry.length - 1 && (
                      <span className="text-slate-600 text-xs font-mono">&gt;</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 2: Live Editable CSS Selector Input */}
        <div className="bg-slate-950/90 rounded-lg p-2.5 border border-slate-800 flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <BoxSelect className="w-3 h-3 text-emerald-400" /> Live CSS Selector
              </label>
              <div className="flex items-center gap-2">
                {selectorError ? (
                  <span className="flex items-center gap-1 text-[11px] text-rose-400 font-mono bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                    <AlertCircle className="w-3 h-3" /> Syntax error: {selectorError}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] text-cyan-300 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    {selectorMatchCount !== null ? selectorMatchCount : (selectedElement?.similarCount ?? 0)} matches on page
                  </span>
                )}
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={editableSelector}
                onChange={handleSelectorChange}
                placeholder="e.g. article.product_pod, article[data-product-position], or ol.row > li"
                className={`w-full bg-slate-900 border rounded px-3 py-1.5 text-xs font-mono text-emerald-300 focus:outline-none transition-colors ${
                  selectorError ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'
                }`}
              />
            </div>
          </div>

          {/* Quick Action Buttons for Selector */}
          <div className="flex items-center gap-2 self-end pb-0.5 flex-wrap">
            <button
              onClick={() => onSetContainer(editableSelector)}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Use this selector as the repeating parent container for multi-field scraping"
            >
              <BoxSelect className="w-3.5 h-3.5" />
              <span>Set as Container</span>
            </button>

            {onRunAiDiscovery && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={onRunAiDiscovery}
                  className="bg-gradient-to-r from-cyan-600/30 via-indigo-600/30 to-purple-600/30 hover:from-cyan-600/40 hover:via-indigo-600/40 hover:to-purple-600/40 text-cyan-200 border border-cyan-500/40 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Run AI Smart Container Discovery on this element using Gemini 3.8 Flash"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  <span>AI Discover</span>
                </button>

                {tokenStats && onOpenKeyModal && (
                  <AiTokenBadge
                    tokenStats={tokenStats}
                    isCustomKeyActive={isCustomKeyActive}
                    onOpenKeyModal={onOpenKeyModal}
                    onResetTokens={onResetTokens || (() => {})}
                  />
                )}
              </div>
            )}
            
            {selectedElement && (
              <button
                onClick={() => {
                  const tag = selectedElement.tagName.toLowerCase();
                  const attrs = selectedElement.attributes;
                  const text = selectedElement.innerText.trim();

                  let defaultName = 'field';
                  let defaultAttr = 'innerText';

                  if (tag === 's' || tag === 'del' || tag === 'strike') {
                    defaultName = 'original_price';
                    defaultAttr = 'innerText';
                  } else if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') {
                    defaultName = 'product_name';
                    defaultAttr = 'innerText';
                  } else if (tag === 'img') {
                    defaultName = 'image';
                    defaultAttr = attrs['src'] ? 'src' : 'alt';
                  } else if (tag === 'a') {
                    if (attrs['data-product-id']) {
                      defaultName = 'product_link';
                    } else {
                      defaultName = 'link';
                    }
                    defaultAttr = attrs['href'] ? 'href' : 'innerText';
                  } else if (attrs['data-product-position']) {
                    defaultName = 'position';
                    defaultAttr = 'data-product-position';
                  } else if (attrs['data-product-id']) {
                    defaultName = 'product_id';
                    defaultAttr = 'data-product-id';
                  } else if (attrs['aria-label'] && /price/i.test(attrs['aria-label'])) {
                    defaultName = 'price_label';
                    defaultAttr = 'aria-label';
                  } else if (/^[₹$€£]/.test(text) || /price/i.test(selectedElement.classNames || '')) {
                    defaultName = 'price';
                    defaultAttr = 'innerText';
                  } else if (tag === 'button' && attrs['value']) {
                    defaultName = 'option_value';
                    defaultAttr = 'value';
                  } else if (selectedElement.classNames) {
                    const firstCls = selectedElement.classNames.split(' ')[0].replace(/^sc-[\w-]+/i, '').replace(/^[_-]/, '');
                    defaultName = firstCls || 'column';
                  }

                  const relativeSel = selectedElement.containerRelativeSelector || editableSelector;
                  onAddFieldFromElement(defaultName, relativeSel, defaultAttr);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                title="Add this element as a new extracted column/field"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Field</span>
              </button>
            )}
          </div>
        </div>

        {/* Section 3: Tabs Header */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('attributes')}
                className={`text-xs font-semibold px-2.5 py-1 rounded-t transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'attributes'
                    ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Attributes</span>
                {selectedElement && (
                  <span className="text-[10px] bg-slate-900 px-1.5 py-0.2 rounded text-emerald-400">
                    {Object.keys(selectedElement.attributes).length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('html')}
                className={`text-xs font-semibold px-2.5 py-1 rounded-t transition-colors cursor-pointer ${
                  activeTab === 'html'
                    ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Clean Outer HTML
              </button>

              <button
                onClick={() => {
                  setActiveTab('debugger');
                  if (onRequestContainerDebug) {
                    onRequestContainerDebug();
                  }
                }}
                className={`text-xs font-semibold px-2.5 py-1 rounded-t transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'debugger'
                    ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bug className="w-3.5 h-3.5 text-amber-400" />
                <span>Container Diagnostics &amp; Ignored Siblings</span>
                {containerDebugReport && containerDebugReport.ignoredCount > 0 ? (
                  <span className="text-[10px] bg-rose-900/80 text-rose-300 border border-rose-700 font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                    {containerDebugReport.ignoredCount} Ignored
                  </span>
                ) : containerDebugReport && containerDebugReport.matchedCount > 0 ? (
                  <span className="text-[10px] bg-emerald-900/80 text-emerald-300 border border-emerald-700 px-1.5 py-0.2 rounded-full">
                    {containerDebugReport.matchedCount} Matched
                  </span>
                ) : null}
              </button>
            </div>

            {activeTab === 'html' && selectedElement && (
              <button
                onClick={handleCopyHtml}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {copiedHtml ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedHtml ? 'Copied' : 'Copy HTML'}</span>
              </button>
            )}

            {activeTab === 'debugger' && (
              <div className="flex items-center gap-2">
                {onClearDebugHighlights && (
                  <button
                    onClick={() => {
                      onClearDebugHighlights();
                      setActiveHighlightedFailedIndex(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Clear Red Outlines
                  </button>
                )}
                {onRequestContainerDebug && (
                  <button
                    onClick={onRequestContainerDebug}
                    className="flex items-center gap-1 text-[11px] text-amber-300 hover:text-white px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/80 hover:bg-amber-900/80 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Re-Scan Siblings</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tab Content 1: Attributes */}
          {activeTab === 'attributes' && (
            selectedElement ? (
              <div className="flex-1 overflow-y-auto p-1 flex flex-wrap gap-2 content-start">
                {/* Standard text extraction pill */}
                <div className="bg-slate-950 border border-slate-800 rounded-md p-1.5 flex items-center gap-2 text-xs">
                  <span className="font-mono text-emerald-400 font-semibold">innerText</span>
                  <span className="text-slate-300 max-w-xs truncate" title={selectedElement.innerText}>
                    "{selectedElement.innerText.slice(0, 45) || '(empty)'}"
                  </span>
                  <button
                    onClick={() => {
                      const sel = selectedElement.containerRelativeSelector || editableSelector;
                      onAddFieldFromElement('text', sel, 'innerText');
                    }}
                    className="ml-auto bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer"
                    title="Add innerText as column"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>Extract</span>
                  </button>
                </div>

                {/* Dynamic attribute pills */}
                {Object.entries(selectedElement.attributes).map(([attrName, attrValue]) => (
                  <div
                    key={attrName}
                    className="bg-slate-950 border border-slate-800 rounded-md p-1.5 flex items-center gap-2 text-xs"
                  >
                    <span className="font-mono text-cyan-400 font-semibold">{attrName}</span>
                    <span className="text-slate-300 max-w-xs truncate font-mono text-[11px]" title={attrValue}>
                      "{attrValue}"
                    </span>
                    <button
                      onClick={() => {
                        const sel = selectedElement.containerRelativeSelector || editableSelector;
                        onAddFieldFromElement(attrName, sel, attrName);
                      }}
                      className="ml-auto bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer"
                      title={`Extract attribute "${attrName}" as column`}
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Extract</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs p-4">
                <CornerDownRight className="w-5 h-5 mb-1 text-slate-600 animate-bounce" />
                <p>Click any element in the webpage preview to inspect its attributes &amp; tag hierarchy.</p>
              </div>
            )
          )}

          {/* Tab Content 2: Clean Outer HTML */}
          {activeTab === 'html' && (
            selectedElement ? (
              <pre className="flex-1 overflow-y-auto text-[11px] font-mono bg-slate-950 p-2.5 rounded-md border border-slate-800 text-slate-300 whitespace-pre-wrap select-text">
                {selectedElement.outerHTML}
              </pre>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs p-4">
                <p>No element selected. Click an element to view sanitized HTML.</p>
              </div>
            )
          )}

          {/* Tab Content 3: Visual Container Debugger */}
          {activeTab === 'debugger' && (
            <div className="flex-1 overflow-y-auto flex flex-col space-y-2 pr-1">
              {/* Overview Bar */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Active Container Selector</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      {currentContainerSelector || '(None configured yet)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="bg-slate-900 border border-emerald-900/60 px-2.5 py-1 rounded flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    <span className="text-slate-400">Matched:</span>
                    <strong className="text-emerald-300 font-mono">
                      {containerDebugReport ? containerDebugReport.matchedCount : selectorMatchCount ?? 0}
                    </strong>
                  </div>

                  <div className={`px-2.5 py-1 rounded flex items-center gap-1.5 border ${
                    containerDebugReport && containerDebugReport.ignoredCount > 0
                      ? 'bg-rose-950/60 border-rose-800/80 text-rose-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    <span className={`w-2 h-2 rounded-full inline-block ${
                      containerDebugReport && containerDebugReport.ignoredCount > 0 ? 'bg-rose-500' : 'bg-slate-500'
                    }`} />
                    <span>Ignored Siblings:</span>
                    <strong className="font-mono">
                      {containerDebugReport ? containerDebugReport.ignoredCount : 0}
                    </strong>
                  </div>

                  {containerDebugReport?.parentSelector && (
                    <div className="hidden md:flex bg-slate-900 border border-slate-800 px-2.5 py-1 rounded items-center gap-1 text-[11px] text-slate-400">
                      <span>Parent:</span>
                      <code className="text-cyan-300 font-mono">{containerDebugReport.parentSelector}</code>
                    </div>
                  )}
                </div>
              </div>

              {/* Diagnostic explanation if ignored nodes found */}
              {containerDebugReport && containerDebugReport.failedNodes && containerDebugReport.failedNodes.length > 0 ? (
                <div className="space-y-2">
                  <div className="bg-amber-950/30 border border-amber-800/50 rounded-md p-2 flex items-start gap-2 text-xs text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Detected {containerDebugReport.failedNodes.length} sibling elements ignored under the common parent node.</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Modern websites (such as Lenskart or dynamic e-commerce catalogs) frequently use promotional banners, varying tags (&lt;aside&gt;, &lt;div&gt;), or cards missing specific attributes. Click <strong className="text-rose-400">"Highlight in Red"</strong> to locate the ignored card, or <strong className="text-amber-400">"Loosen Selector"</strong> to adapt.
                      </p>
                    </div>
                  </div>

                  {/* List of failed nodes */}
                  <div className="grid grid-cols-1 gap-2">
                    {containerDebugReport.failedNodes.map((node) => {
                      const isHighlighted = activeHighlightedFailedIndex === node.index;
                      return (
                        <div
                          key={node.index}
                          className={`p-2.5 rounded-lg border text-xs transition-all ${
                            isHighlighted
                              ? 'bg-rose-950/40 border-rose-500 ring-1 ring-rose-500'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800 text-[11px]">
                                &lt;{node.tagName.toLowerCase()}&gt;
                              </span>
                              {node.classNames ? (
                                <span className="font-mono text-slate-400 text-[11px] truncate max-w-xs" title={node.classNames}>
                                  .{node.classNames.split(' ').slice(0, 3).join('.')}
                                </span>
                              ) : (
                                <span className="text-slate-500 italic text-[11px]">(no class)</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {onHighlightFailedNode && (
                                <button
                                  onClick={() => {
                                    setActiveHighlightedFailedIndex(node.index);
                                    onHighlightFailedNode(node.index);
                                  }}
                                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                                    isHighlighted
                                      ? 'bg-rose-600 text-white shadow-sm'
                                      : 'bg-rose-950/70 text-rose-300 hover:bg-rose-900 border border-rose-800'
                                  }`}
                                  title="Scroll to and outline this ignored element in dashed red inside preview"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>{isHighlighted ? 'Highlighted' : 'Highlight in Red'}</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  // Suggest loosened selector (union of current + child tag)
                                  const loosened = currentContainerSelector.includes(node.tagName.toLowerCase())
                                    ? currentContainerSelector
                                    : `${currentContainerSelector}, ${node.tagName.toLowerCase()}`;
                                  onSetContainer(loosened);
                                }}
                                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer"
                                title="Expand current container selector to include this sibling tag"
                              >
                                <span>+ Loosen Selector</span>
                              </button>
                            </div>
                          </div>

                          {/* Failure Reason */}
                          <div className="bg-slate-900/90 rounded px-2.5 py-1.5 border border-slate-800/80 text-[11px] flex items-center justify-between gap-2">
                            <span className="text-rose-300 font-medium flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span>{node.diagnosticReason}</span>
                            </span>
                            {node.innerTextSnippet && (
                              <span className="text-slate-400 italic truncate max-w-sm" title={node.innerTextSnippet}>
                                "{node.innerTextSnippet}"
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : containerDebugReport && containerDebugReport.matchedCount > 0 ? (
                <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-lg p-4 text-center text-xs text-emerald-300 flex flex-col items-center justify-center gap-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <span className="font-bold text-sm">Perfect Container Alignment!</span>
                  <p className="text-slate-400 text-[11px] max-w-md">
                    All {containerDebugReport.matchedCount} sibling cards under parent <code className="text-emerald-300 font-mono">{containerDebugReport.parentSelector}</code> match cleanly. No dropped products or unmatched cards.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-950 rounded-lg p-6 text-center text-xs text-slate-400 border border-slate-800 flex flex-col items-center justify-center gap-2">
                  <SearchCode className="w-8 h-8 text-slate-600" />
                  <p className="font-semibold text-slate-300">Ready to Diagnose Sibling Matching</p>
                  <p className="text-[11px] text-slate-500 max-w-md">
                    Click <strong>"Re-Scan Siblings"</strong> above to compare the container selector against all sibling nodes under the parent container. This spots ignored products, advertisements, or varying tags.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
