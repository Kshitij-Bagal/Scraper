import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  RotateCw, 
  ExternalLink, 
  ShieldAlert, 
  Info, 
  CheckCircle2,
  Crosshair,
  Compass
} from 'lucide-react';
import type { ElementSelectionData, ContainerDebugReport } from '../types/scraper.ts';

interface IframeCanvasProps {
  targetUrl: string;
  currentMode: 'navigate' | 'select' | 'two_click';
  viewport: 'desktop' | 'tablet' | 'mobile';
  onElementSelected: (data: ElementSelectionData) => void;
  onElementHovered?: (data: { tagName: string; selector: string; textSnippet: string }) => void;
  onSelectorResult: (data: { selector: string; matchCount: number; valid: boolean; error: string | null }) => void;
  onPageNavigated: (url: string) => void;
  onTwoClickContainerFound?: (data: { containerSelector: string; relativeFieldSelector: string; matchCount: number }) => void;
  onTwoClickStepUpdate?: (step: number, message: string) => void;
  onContainerDebugReport?: (data: ContainerDebugReport) => void;
  activeDebugCommand?: { type: 'debug' | 'highlight' | 'clear'; containerSelector?: string; index?: number; timestamp: number } | null;
  isDraggingResizer?: boolean;
  containerSelector: string;
  activeTestSelector?: string;
  domTraverseCommand?: { direction: 'up' | 'down' | 'to_index'; index?: number; timestamp: number } | null;
  twoClickBannerMessage?: string | null;
  onCancelTwoClick?: () => void;
}

export const IframeCanvas: React.FC<IframeCanvasProps> = ({
  targetUrl,
  currentMode,
  viewport,
  onElementSelected,
  onElementHovered,
  onSelectorResult,
  onPageNavigated,
  onTwoClickContainerFound,
  onTwoClickStepUpdate,
  onContainerDebugReport,
  activeDebugCommand,
  isDraggingResizer,
  onCancelTwoClick,
  twoClickBannerMessage,
  containerSelector,
  activeTestSelector,
  domTraverseCommand
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<{ tagName: string; selector: string; textSnippet: string } | null>(null);

  const proxySrc = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;

  // Send message helper to iframe
  const postToIframe = useCallback((message: any) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(message, '*');
      } catch (err) {
        console.error('Failed to postMessage to iframe:', err);
      }
    }
  }, []);

  // Update mode in iframe whenever currentMode changes
  useEffect(() => {
    postToIframe({ type: 'SET_MODE', mode: currentMode });
  }, [currentMode, postToIframe]);

  // Update container highlights
  useEffect(() => {
    postToIframe({ type: 'HIGHLIGHT_CONTAINER', containerSelector });
  }, [containerSelector, postToIframe]);

  // Test custom selector
  useEffect(() => {
    if (activeTestSelector !== undefined) {
      postToIframe({ type: 'TEST_CUSTOM_SELECTOR', selector: activeTestSelector });
    }
  }, [activeTestSelector, postToIframe]);

  // Traverse DOM command
  useEffect(() => {
    if (domTraverseCommand) {
      postToIframe({
        type: 'TRAVERSE_DOM',
        direction: domTraverseCommand.direction,
        index: domTraverseCommand.index
      });
    }
  }, [domTraverseCommand, postToIframe]);

  // Debug container command
  useEffect(() => {
    if (activeDebugCommand) {
      if (activeDebugCommand.type === 'debug') {
        postToIframe({ type: 'DEBUG_CONTAINER', containerSelector: activeDebugCommand.containerSelector });
      } else if (activeDebugCommand.type === 'highlight') {
        postToIframe({ type: 'HIGHLIGHT_FAILED_NODE', index: activeDebugCommand.index });
      } else if (activeDebugCommand.type === 'clear') {
        postToIframe({ type: 'CLEAR_DEBUG_HIGHLIGHTS' });
      }
    }
  }, [activeDebugCommand, postToIframe]);

  // Listen to messages from injected script inside the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || typeof msg !== 'object') return;

      switch (msg.type) {
        case 'SCRAPER_SCRIPT_READY':
          setIsLoading(false);
          postToIframe({ type: 'SET_MODE', mode: currentMode });
          if (containerSelector) {
            postToIframe({ type: 'HIGHLIGHT_CONTAINER', containerSelector });
          }
          break;

        case 'ELEMENT_SELECTED':
          onElementSelected(msg.data);
          break;

        case 'ELEMENT_HOVERED':
          setHoveredInfo(msg.data);
          if (onElementHovered) onElementHovered(msg.data);
          break;

        case 'SELECTOR_MATCH_RESULT':
          onSelectorResult(msg.data);
          break;

        case 'PAGE_NAVIGATED':
          onPageNavigated(msg.data.url);
          break;

        case 'TWO_CLICK_STEP_UPDATE':
          if (onTwoClickStepUpdate) onTwoClickStepUpdate(msg.step, msg.message);
          break;

        case 'TWO_CLICK_CONTAINER_FOUND':
          if (onTwoClickContainerFound) onTwoClickContainerFound(msg.data);
          break;

        case 'TWO_CLICK_FAILED':
          alert(msg.message || 'Could not find a repeating container between the two clicked elements.');
          if (onCancelTwoClick) onCancelTwoClick();
          break;

        case 'CONTAINER_DEBUG_REPORT':
          if (onContainerDebugReport) onContainerDebugReport(msg.data);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentMode, containerSelector, onElementSelected, onElementHovered, onSelectorResult, onPageNavigated, onTwoClickContainerFound, onTwoClickStepUpdate, onContainerDebugReport, onCancelTwoClick, postToIframe]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    postToIframe({ type: 'SET_MODE', mode: currentMode });
    if (containerSelector) {
      postToIframe({ type: 'HIGHLIGHT_CONTAINER', containerSelector });
    }
  };

  const getViewportWidthClass = () => {
    switch (viewport) {
      case 'mobile':
        return 'w-full max-w-[390px] h-full max-h-[844px] shadow-2xl rounded-2xl border-4 border-slate-700 my-auto';
      case 'tablet':
        return 'w-full max-w-[768px] h-full max-h-[900px] shadow-2xl rounded-xl border-4 border-slate-700 my-auto';
      case 'desktop':
      default:
        return 'w-full h-full min-h-0 min-w-0 flex-1';
    }
  };

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0 bg-slate-950 overflow-hidden relative">
      {/* 2-Click Active Banner */}
      {currentMode === 'two_click' && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2 flex items-center justify-between shadow-lg z-20 animate-in slide-in-from-top-2 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>2-Click LCA Container Mode:</span>
            <span className="font-normal text-amber-100">
              {twoClickBannerMessage || 'Click any element in Card #1 (e.g. Title #1)'}
            </span>
          </div>
          <button
            onClick={onCancelTwoClick}
            className="text-xs bg-black/40 hover:bg-black/60 text-white px-2.5 py-0.5 rounded font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Top Banner / Indicator Strip */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-1 flex items-center justify-between text-[11px] text-slate-400 z-10 select-none shrink-0">
        <div className="flex items-center gap-2">
          {currentMode === 'two_click' ? (
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              2-Click LCA Detection Active
            </span>
          ) : currentMode === 'select' ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Select Mode: Click any element to inspect &amp; extract
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Navigate Mode: Interactive web navigation enabled
            </span>
          )}

          {hoveredInfo && currentMode !== 'navigate' && (
            <span className="hidden md:inline-flex items-center gap-1 font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              Hovering: <strong className="text-rose-400">&lt;{hoveredInfo.tagName.toLowerCase()}&gt;</strong> {hoveredInfo.selector}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-rose-500" /> Hover
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-emerald-500" /> Selected
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-blue-500" /> Siblings
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-amber-500" /> Container
            </span>
          </div>

          <button
            onClick={() => {
              if (iframeRef.current) {
                setIsLoading(true);
                iframeRef.current.src = proxySrc;
              }
            }}
            className="hover:text-slate-200 transition-colors cursor-pointer"
            title="Reload target frame"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 min-h-0 w-full h-full flex justify-center items-center overflow-hidden p-0 relative bg-slate-950">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
            <RotateCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-xs font-medium text-slate-300">Proxying &amp; instrumenting target website...</p>
            <p className="text-[11px] text-slate-500">Injecting CSS highlight boundaries &amp; DOM observer</p>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 p-6 z-20 text-center">
            <ShieldAlert className="w-10 h-10 text-rose-500" />
            <h3 className="text-base font-bold text-white">Proxy Loading Error</h3>
            <p className="text-xs text-slate-400 max-w-md">{loadError}</p>
          </div>
        )}

        <div className={`relative flex flex-col ${isDraggingResizer ? 'transition-none' : 'transition-all duration-150'} ${getViewportWidthClass()}`}>
          <iframe
            ref={iframeRef}
            src={proxySrc}
            onLoad={handleIframeLoad}
            title="Target Website Scraper Canvas"
            className="w-full h-full min-h-0 min-w-0 border-0 bg-white block flex-1"
            style={{
              pointerEvents: isDraggingResizer ? 'none' : 'auto'
            }}
          />
        </div>
      </div>
    </div>
  );
};
