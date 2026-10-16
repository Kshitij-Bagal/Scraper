/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Header } from './components/Header.tsx';
import { IframeCanvas } from './components/IframeCanvas.tsx';
import { InspectorDock } from './components/InspectorDock.tsx';
import { RecipeSidebar } from './components/RecipeSidebar.tsx';
import { ExecutionModal } from './components/ExecutionModal.tsx';
import { RecipeJsonModal } from './components/RecipeJsonModal.tsx';
import { SmartContainerModal } from './components/SmartContainerModal.tsx';
import { ApiKeyModal } from './components/ApiKeyModal.tsx';
import { 
  getInitialTokenStats, 
  recordTokenUsage, 
  resetTokenStats, 
  getUserApiKey, 
  getIsCustomKeyActive, 
  type TokenStats 
} from './utils/aiUsageManager.ts';
import type { 
  ElementSelectionData, 
  ScrapeRecipe, 
  ScrapeExecutionResult,
  ContainerDebugReport 
} from './types/scraper.ts';
import type { SmartContainerResponse } from './server/aiContainerDiscovery.ts';

const INITIAL_RECIPE: ScrapeRecipe = {
  name: 'DummyJSON Products Catalog Recipe',
  startUrl: 'demo:dummyjson',
  renderMode: 'static',
  containerSelector: 'article.product-card',
  fields: [
    { id: 'f1', name: 'product_title', selector: 'h3.product-title a', attribute: 'innerText', type: 'text' },
    { id: 'f2', name: 'sale_price', selector: '.sale-price', attribute: 'innerText', type: 'text' },
    { id: 'f3', name: 'original_price', selector: '.original-price', attribute: 'innerText', type: 'text' },
    { id: 'f4', name: 'discount', selector: '.discount-pill', attribute: 'innerText', type: 'text' },
    { id: 'f5', name: 'rating', selector: '.rating-score', attribute: 'innerText', type: 'text' },
    { id: 'f6', name: 'stock_status', selector: '.stock-status', attribute: 'innerText', type: 'text' },
    { id: 'f7', name: 'brand', selector: '.brand-tag', attribute: 'innerText', type: 'text' },
    { id: 'f8', name: 'sku', selector: '.sku-badge', attribute: 'data-sku', type: 'text' },
    { id: 'f9', name: 'thumbnail_url', selector: '.thumbnail-container img', attribute: 'src', type: 'image' },
    { id: 'f10', name: 'product_url', selector: 'h3.product-title a', attribute: 'href', type: 'url' }
  ],
  pagination: {
    type: 'next_link',
    selector: 'li.next > a',
    maxPages: 4,
    delayMs: 600
  }
};

export default function App() {
  const [targetUrl, setTargetUrl] = useState<string>('demo:dummyjson');
  const [urlInput, setUrlInput] = useState<string>('demo:dummyjson');
  const [currentMode, setCurrentMode] = useState<'navigate' | 'select' | 'two_click'>('select');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Element selection & inspector state
  const [selectedElement, setSelectedElement] = useState<ElementSelectionData | null>(null);
  const [selectorMatchCount, setSelectorMatchCount] = useState<number | null>(null);
  const [selectorError, setSelectorError] = useState<string | null>(null);
  const [activeTestSelector, setActiveTestSelector] = useState<string>('');
  const [suggestedContainer, setSuggestedContainer] = useState<string>('');
  const [twoClickBannerMessage, setTwoClickBannerMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [domTraverseCommand, setDomTraverseCommand] = useState<{
    direction: 'up' | 'down' | 'to_index';
    index?: number;
    timestamp: number;
  } | null>(null);

  // Recipe configuration state
  const [recipe, setRecipe] = useState<ScrapeRecipe>(INITIAL_RECIPE);

  // Execution state
  const [isExecutingScrape, setIsExecutingScrape] = useState(false);
  const [executionResult, setExecutionResult] = useState<ScrapeExecutionResult | null>(null);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  // Dynamic proportional split-pane resizing state
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const [splitRatio, setSplitRatio] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('scrape_studio_split_ratio');
      return saved ? Math.max(0.18, Math.min(0.82, parseFloat(saved))) : 0.62;
    } catch {
      return 0.62;
    }
  });
  const [sidebarWidth, setSidebarWidth] = useState<number>(380);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  // AI Token Usage & User Credentials state
  const [tokenStats, setTokenStats] = useState<TokenStats>(() => getInitialTokenStats());
  const [isCustomKeyActive, setIsCustomKeyActive] = useState<boolean>(() => getIsCustomKeyActive());
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Container diagnostics state
  const [containerDebugReport, setContainerDebugReport] = useState<ContainerDebugReport | null>(null);
  const [activeDebugCommand, setActiveDebugCommand] = useState<{
    type: 'debug' | 'highlight' | 'clear';
    containerSelector?: string;
    index?: number;
    timestamp: number;
  } | null>(null);

  // AI Smart Container Discovery state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiDiscoveryResult, setAiDiscoveryResult] = useState<SmartContainerResponse | null>(null);

  // Proportional split drag listeners - calculates height relative to single parent container
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSplit && splitContainerRef.current) {
        const rect = splitContainerRef.current.getBoundingClientRect();
        if (rect.height > 0) {
          const relativeY = e.clientY - rect.top;
          // Calculate proportional split percentage clamped between 18% and 82%
          const newRatio = Math.max(0.18, Math.min(0.82, relativeY / rect.height));
          setSplitRatio(newRatio);
          try {
            localStorage.setItem('scrape_studio_split_ratio', newRatio.toString());
          } catch {}
          if (isDockCollapsed) setIsDockCollapsed(false);
        }
      } else if (isDraggingSidebar) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 260 && newWidth <= 680) {
          setSidebarWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSplit(false);
      setIsDraggingSidebar(false);
    };

    if (isDraggingSplit || isDraggingSidebar) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDraggingSplit, isDraggingSidebar, isDockCollapsed]);

  // Load new target URL
  const handleLoadUrl = useCallback((newUrl: string) => {
    let cleanUrl = newUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('demo:')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    setTargetUrl(cleanUrl);
    setUrlInput(cleanUrl);
    setSelectedElement(null);
    setSelectorMatchCount(null);
    setSelectorError(null);
    setSuggestedContainer('');
    setRecipe(prev => ({ ...prev, startUrl: cleanUrl }));
  }, []);

  // Handle element selection from iframe
  const handleElementSelected = useCallback((data: ElementSelectionData) => {
    setSelectedElement(data);
    setActiveTestSelector(data.selector);
    setSelectorMatchCount(data.similarCount);
    setSelectorError(null);
    if (data.containerSuggestion) {
      setSuggestedContainer(data.containerSuggestion);
    }
  }, []);

  // Handle selector test result from iframe
  const handleSelectorResult = useCallback((data: {
    selector: string;
    matchCount: number;
    valid: boolean;
    error: string | null;
  }) => {
    setSelectorMatchCount(data.matchCount);
    setSelectorError(data.error);
  }, []);

  // Handle DOM traversal request from inspector dock
  const handleTraverseDom = useCallback((direction: 'up' | 'down' | 'to_index', index?: number) => {
    setDomTraverseCommand({
      direction,
      index,
      timestamp: Date.now()
    });
  }, []);

  // Handle custom selector testing from dock
  const handleTestSelector = useCallback((selector: string) => {
    setActiveTestSelector(selector);
  }, []);

  // Start 2-Click Container detection mode
  const handleStartTwoClick = useCallback(() => {
    setCurrentMode('two_click');
    setTwoClickBannerMessage('Click any element in Card #1 (e.g. Title #1)');
  }, []);

  const handleCancelTwoClick = useCallback(() => {
    setCurrentMode('select');
    setTwoClickBannerMessage(null);
  }, []);

  const handleTwoClickStepUpdate = useCallback((step: number, message: string) => {
    setTwoClickBannerMessage(message);
  }, []);

  const handleTwoClickContainerFound = useCallback((data: {
    containerSelector: string;
    relativeFieldSelector: string;
    matchCount: number;
  }) => {
    setRecipe(prev => ({ ...prev, containerSelector: data.containerSelector }));
    setCurrentMode('select');
    setTwoClickBannerMessage(null);
    setToastMessage(`🎉 2-Click LCA Success! Isolated container "${data.containerSelector}" (${data.matchCount} cards matched)`);
    setTimeout(() => setToastMessage(null), 5000);
  }, []);

  // Token and API Key management callbacks
  const handleResetTokens = useCallback(() => {
    const reset = resetTokenStats();
    setTokenStats(reset);
    setToastMessage('AI token session counter reset');
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const handleKeyChanged = useCallback((hasKey: boolean) => {
    setIsCustomKeyActive(hasKey);
    setToastMessage(hasKey ? 'Personal Gemini API key active!' : 'Reverted to application default key');
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Run AI-powered Smart Container Discovery (Gemini 3.8 Flash)
  const handleRunAiDiscovery = useCallback(async () => {
    if (!selectedElement) {
      setToastMessage('⚠️ Click any element in the preview first to discover its repeating container.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    setIsAiModalOpen(true);
    setIsAiLoading(true);
    setAiDiscoveryResult(null);

    const customKey = isCustomKeyActive ? getUserApiKey() : undefined;

    try {
      const res = await fetch('/api/ai-discover-container', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(customKey ? { 'x-user-gemini-key': customKey } : {})
        },
        body: JSON.stringify({
          targetElementHtml: selectedElement.outerHTML,
          targetTagName: selectedElement.tagName,
          ancestryTrail: selectedElement.ancestry,
          surroundingHtml: selectedElement.surroundingHtml || selectedElement.outerHTML,
          url: targetUrl,
          ...(customKey ? { customApiKey: customKey } : {})
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: SmartContainerResponse = await res.json();
      setAiDiscoveryResult(data);

      // Accumulate real token usage telemetry
      if (data.tokenUsage) {
        const updated = recordTokenUsage(
          data.tokenUsage, 
          data.keySource || (customKey ? 'user_custom' : 'system_default')
        );
        setTokenStats(updated);
      }
    } catch (err: any) {
      console.error('Failed to run AI discovery:', err);
      setToastMessage('AI Discovery error: ' + err.message);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsAiLoading(false);
    }
  }, [selectedElement, targetUrl, isCustomKeyActive]);

  // Apply AI Discovered Container and auto-populate all suggested fields
  const handleApplyRecipeWithFields = useCallback((containerSelector: string, fields: any[]) => {
    setRecipe(prev => ({
      ...prev,
      containerSelector,
      fields: fields.map((f, i) => ({
        id: 'f_ai_' + i + '_' + Math.random().toString(36).substr(2, 6),
        name: f.name,
        selector: f.selector,
        attribute: f.attribute,
        type: f.type || (f.attribute === 'href' ? 'url' : f.attribute === 'src' ? 'image' : 'text')
      }))
    }));
    setActiveTestSelector(containerSelector);
    setToastMessage(`✨ Applied AI container "${containerSelector}" & auto-populated ${fields.length} columns!`);
    setTimeout(() => setToastMessage(null), 4500);
  }, []);

  // Set repeating parent container
  const handleSetContainer = useCallback((containerSel: string) => {
    setRecipe(prev => ({ ...prev, containerSelector: containerSel }));
    setToastMessage(`Container locked to: "${containerSel}"`);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Container Diagnostics & Ignored Siblings Debugger handlers
  const handleRequestContainerDebug = useCallback(() => {
    if (!recipe.containerSelector) {
      setToastMessage('⚠️ Set a container selector first to diagnose sibling matching.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setActiveDebugCommand({
      type: 'debug',
      containerSelector: recipe.containerSelector,
      timestamp: Date.now()
    });
    setToastMessage(`🔍 Diagnosing container: "${recipe.containerSelector}"`);
    setTimeout(() => setToastMessage(null), 3000);
  }, [recipe.containerSelector]);

  const handleHighlightFailedNode = useCallback((index: number) => {
    setActiveDebugCommand({
      type: 'highlight',
      index,
      timestamp: Date.now()
    });
  }, []);

  const handleClearDebugHighlights = useCallback(() => {
    setActiveDebugCommand({
      type: 'clear',
      timestamp: Date.now()
    });
  }, []);

  const handleContainerDebugReport = useCallback((report: ContainerDebugReport) => {
    setContainerDebugReport(report);
  }, []);

  // Add field from element selection
  const handleAddFieldFromElement = useCallback((name: string, selector: string, attribute: string) => {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'column';
    setRecipe(prev => {
      let finalName = cleanName;
      let counter = 1;
      while (prev.fields.some(f => f.name === finalName)) {
        finalName = `${cleanName}_${counter++}`;
      }

      return {
        ...prev,
        fields: [
          ...prev.fields,
          {
            id: 'field_' + Math.random().toString(36).substr(2, 9),
            name: finalName,
            selector: selector || ':scope',
            attribute: attribute || 'innerText',
            type: attribute === 'href' ? 'url' : attribute === 'src' ? 'image' : 'text'
          }
        ]
      };
    });
    setToastMessage(`Added field "${cleanName}" (${attribute})`);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // Navigate mode: user clicked a link inside iframe
  const handlePageNavigated = useCallback((url: string) => {
    handleLoadUrl(url);
  }, [handleLoadUrl]);

  // Execute scrape recipe
  const handleRunScraper = async () => {
    if (!recipe.containerSelector || recipe.fields.length === 0) {
      alert('Please configure at least one repeating container selector and one field before running.');
      return;
    }

    setIsExecutingScrape(true);
    setIsExecutionModalOpen(true);
    setExecutionResult(null);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipe })
      });

      const result: ScrapeExecutionResult = await response.json();
      setExecutionResult(result);
    } catch (err: any) {
      setExecutionResult({
        success: false,
        pagesScraped: 0,
        totalItems: 0,
        data: [],
        executionTimeMs: 0,
        logs: [`[CRITICAL] Request failed: ${err.message}`],
        error: err.message
      });
    } finally {
      setIsExecutingScrape(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-2 rounded-lg text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Application Header */}
      <Header
        urlInput={urlInput}
        setUrlInput={setUrlInput}
        onLoadUrl={handleLoadUrl}
        currentMode={currentMode}
        onToggleMode={(mode) => {
          if (mode === 'two_click') {
            handleStartTwoClick();
          } else {
            setCurrentMode(mode);
            setTwoClickBannerMessage(null);
          }
        }}
        viewport={viewport}
        setViewport={setViewport}
        onRunScraper={handleRunScraper}
        onOpenRecipeJson={() => setIsRecipeModalOpen(true)}
        onOpenExportModal={() => setIsExecutionModalOpen(true)}
        isLoadingPage={isLoadingPage}
        isExecutingScrape={isExecutingScrape}
        totalExtractedItems={executionResult?.data?.length || 0}
      />

      {/* Main Workspace with Dynamic Resizable Sections */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Single Enclosing Div Container for Iframe Canvas and Inspector Dock */}
        <div 
          ref={splitContainerRef}
          className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative"
        >
          {/* Upper Section: Iframe Canvas */}
          <div 
            className={`w-full min-h-0 relative flex flex-col overflow-hidden ${isDraggingSplit ? 'transition-none select-none pointer-events-none' : 'transition-[height] duration-75'}`}
            style={{
              height: isDockCollapsed 
                ? 'calc(100% - 38px)' 
                : `${splitRatio * 100}%`
            }}
          >
            <IframeCanvas
              targetUrl={targetUrl}
              currentMode={currentMode}
              viewport={viewport}
              onElementSelected={handleElementSelected}
              onSelectorResult={handleSelectorResult}
              onPageNavigated={handlePageNavigated}
              onTwoClickContainerFound={handleTwoClickContainerFound}
              onTwoClickStepUpdate={handleTwoClickStepUpdate}
              onCancelTwoClick={handleCancelTwoClick}
              onContainerDebugReport={handleContainerDebugReport}
              activeDebugCommand={activeDebugCommand}
              isDraggingResizer={isDraggingSplit || isDraggingSidebar}
              twoClickBannerMessage={twoClickBannerMessage}
              containerSelector={recipe.containerSelector}
              activeTestSelector={activeTestSelector}
              domTraverseCommand={domTraverseCommand}
            />
          </div>

          {/* Draggable Resizer Divider between Iframe and Inspector Dock */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDraggingSplit(true);
            }}
            onDoubleClick={() => {
              setSplitRatio(0.62);
              setIsDockCollapsed(false);
            }}
            title="Drag vertically to resize Inspector Dock & Iframe (Double-click to reset 62/38 split)"
            className={`h-2.5 bg-slate-950 hover:bg-emerald-500/80 active:bg-emerald-500 cursor-row-resize flex items-center justify-between px-3 transition-colors group z-20 shrink-0 border-y border-slate-800 select-none shadow-sm ${
              isDraggingSplit ? 'bg-emerald-500 ring-1 ring-emerald-400' : ''
            }`}
          >
            {/* Collapse / Expand toggle button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDockCollapsed(prev => !prev);
              }}
              className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
              title={isDockCollapsed ? "Expand Inspector Dock" : "Collapse Inspector Dock"}
            >
              {isDockCollapsed ? <ChevronUp className="w-3 h-3 text-emerald-400" /> : <ChevronDown className="w-3 h-3" />}
              <span className="font-mono text-[9px] uppercase tracking-wider">
                {isDockCollapsed ? 'Expand Dock' : 'Collapse'}
              </span>
            </button>

            {/* Grab Handle */}
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1 rounded-full bg-slate-700 group-hover:bg-white" />
              <div className="w-12 h-1 rounded-full bg-slate-600 group-hover:bg-white group-active:bg-white transition-colors" />
              <div className="w-1.5 h-1 rounded-full bg-slate-700 group-hover:bg-white" />
            </div>

            {/* Current split percentage indicator */}
            <div className="text-[9px] font-mono text-slate-500 group-hover:text-slate-300">
              {isDockCollapsed ? 'Collapsed' : `${Math.round(splitRatio * 100)}% / ${Math.round((1 - splitRatio) * 100)}%`}
            </div>
          </div>

          {/* Lower Section: Bottom CSS & DOM Inspector Dock */}
          <div 
            className="w-full overflow-hidden transition-[height] duration-75 flex flex-col"
            style={{
              height: isDockCollapsed 
                ? '38px' 
                : `${(1 - splitRatio) * 100}%`
            }}
          >
            <InspectorDock
              selectedElement={selectedElement}
              onTraverseDom={handleTraverseDom}
              onTestSelector={handleTestSelector}
              selectorMatchCount={selectorMatchCount}
              selectorError={selectorError}
              onSetContainer={handleSetContainer}
              onAddFieldFromElement={handleAddFieldFromElement}
              currentContainerSelector={recipe.containerSelector}
              onRunAiDiscovery={handleRunAiDiscovery}
              containerDebugReport={containerDebugReport}
              onRequestContainerDebug={handleRequestContainerDebug}
              onHighlightFailedNode={handleHighlightFailedNode}
              onClearDebugHighlights={handleClearDebugHighlights}
              height="100%"
              isCollapsed={isDockCollapsed}
              onToggleCollapse={() => setIsDockCollapsed(prev => !prev)}
              tokenStats={tokenStats}
              isCustomKeyActive={isCustomKeyActive}
              onOpenKeyModal={() => setIsKeyModalOpen(true)}
              onResetTokens={handleResetTokens}
            />
          </div>
        </div>

        {/* Draggable Resizer Divider between Workspace and Recipe Sidebar */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDraggingSidebar(true);
          }}
          onDoubleClick={() => setSidebarWidth(380)}
          title="Drag horizontally to resize Recipe Builder (Double-click to reset to 380px)"
          className="w-2 bg-slate-950 hover:bg-emerald-500/80 active:bg-emerald-500 cursor-col-resize flex flex-col items-center justify-center transition-colors group z-20 shrink-0 border-x border-slate-800 select-none shadow-sm"
        >
          <div className="h-14 w-1 rounded-full bg-slate-700 group-hover:bg-white group-active:bg-white transition-colors" />
        </div>

        {/* Right Section: Scrape Recipe Builder Sidebar */}
        <RecipeSidebar
          recipe={recipe}
          setRecipe={setRecipe}
          onRunScraper={handleRunScraper}
          isExecutingScrape={isExecutingScrape}
          suggestedContainer={suggestedContainer}
          onApplySuggestedContainer={handleSetContainer}
          onStartTwoClick={handleStartTwoClick}
          onRunAiDiscovery={handleRunAiDiscovery}
          width={sidebarWidth}
          tokenStats={tokenStats}
          isCustomKeyActive={isCustomKeyActive}
          onOpenKeyModal={() => setIsKeyModalOpen(true)}
          onResetTokens={handleResetTokens}
        />
      </div>

      {/* AI Smart Container Discovery Modal */}
      <SmartContainerModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        isLoading={isAiLoading}
        discoveryResult={aiDiscoveryResult}
        onApplyContainer={(containerSel) => {
          handleSetContainer(containerSel);
          setActiveTestSelector(containerSel);
        }}
        onApplyRecipeWithFields={handleApplyRecipeWithFields}
        onTestSelectorInPreview={(sel) => {
          setActiveTestSelector(sel);
        }}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        isCustomKeyActive={isCustomKeyActive}
      />

      {/* User Gemini API Key, Credentials & Token Telemetry Overlay Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeyChanged={handleKeyChanged}
        tokenStats={tokenStats}
        onResetTokens={handleResetTokens}
      />

      {/* Execution Results & Data Modal */}
      <ExecutionModal
        isOpen={isExecutionModalOpen}
        onClose={() => setIsExecutionModalOpen(false)}
        result={executionResult}
        isRunning={isExecutingScrape}
      />

      {/* Recipe JSON Modal */}
      <RecipeJsonModal
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        recipe={recipe}
        onImportRecipe={(importedRecipe) => {
          setRecipe(importedRecipe);
          if (importedRecipe.startUrl) {
            handleLoadUrl(importedRecipe.startUrl);
          }
        }}
      />

      {/* Global Transparent Mouse-drag capture overlay to prevent iframe stealing pointer events during resize */}
      {(isDraggingSplit || isDraggingSidebar) && (
        <div 
          className={`fixed inset-0 z-50 ${isDraggingSplit ? 'cursor-row-resize' : 'cursor-col-resize'}`} 
          style={{ pointerEvents: 'auto' }}
        />
      )}
    </div>
  );
}
