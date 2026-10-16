import React from 'react';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  BoxSelect, 
  Layers, 
  ArrowRight, 
  Bot, 
  Code, 
  Cpu, 
  Plus, 
  RotateCw,
  Sliders,
  Check,
  Key,
  DollarSign
} from 'lucide-react';
import type { SmartContainerResponse } from '../server/aiContainerDiscovery.ts';
import type { ScrapeRecipe } from '../types/scraper.ts';

interface SmartContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  discoveryResult: SmartContainerResponse | null;
  onApplyContainer: (containerSelector: string) => void;
  onApplyRecipeWithFields: (containerSelector: string, fields: any[]) => void;
  onTestSelectorInPreview: (selector: string) => void;
  onOpenKeyModal?: () => void;
  isCustomKeyActive?: boolean;
}

export const SmartContainerModal: React.FC<SmartContainerModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  discoveryResult,
  onApplyContainer,
  onApplyRecipeWithFields,
  onTestSelectorInPreview,
  onOpenKeyModal,
  isCustomKeyActive = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-sm">AI Smart Container Discovery</h3>
                {discoveryResult && (
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                    <Bot className="w-3 h-3 text-cyan-400" />
                    {discoveryResult.source === 'gemini' ? 'Gemini 3.8 Flash' : 'Structural Heuristics'}
                  </span>
                )}
                {onOpenKeyModal && (
                  <button
                    onClick={onOpenKeyModal}
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 transition-colors cursor-pointer ${
                      isCustomKeyActive
                        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/60'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-800'
                    }`}
                    title="Click to configure personal Gemini API key"
                  >
                    <Key className="w-2.5 h-2.5" />
                    <span>{isCustomKeyActive ? 'My Key Active' : 'System Key'}</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Pattern recognition for dynamic SPAs, Next.js &amp; Styled-Components DOMs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-cyan-400 animate-spin" />
                <Sparkles className="w-5 h-5 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <p className="text-sm font-semibold text-slate-200">Analyzing DOM tree hierarchy...</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Filtering transient classes, analyzing sibling tag repetition, and deriving relative field attributes.
              </p>
            </div>
          ) : discoveryResult ? (
            <>
              {/* Optimal Container Card */}
              <div className="bg-slate-950 rounded-xl p-4 border border-indigo-500/30 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BoxSelect className="w-4 h-4 text-cyan-400" /> Optimal Repeating Container
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> {discoveryResult.confidence.toUpperCase()} CONFIDENCE
                  </span>
                </div>

                <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800 flex items-center justify-between gap-3 font-mono text-sm text-emerald-300">
                  <span className="truncate select-all">{discoveryResult.optimalContainerSelector}</span>
                  <button
                    onClick={() => onTestSelectorInPreview(discoveryResult.optimalContainerSelector)}
                    className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                    title="Highlight matching cards in iframe preview"
                  >
                    Test Match
                  </button>
                </div>

                {/* AI Reasoning */}
                <div className="bg-indigo-950/30 border-l-2 border-indigo-500 rounded p-2.5 text-xs text-slate-300 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-wider">
                    AI Architectural Reasoning:
                  </span>
                  <p className="leading-relaxed text-slate-300">{discoveryResult.reasoning}</p>
                </div>

                {/* Alternative Selectors if any */}
                {discoveryResult.alternativeSelectors && discoveryResult.alternativeSelectors.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1.5">
                      Alternative Valid Selectors:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {discoveryResult.alternativeSelectors.map((altSel, i) => (
                        <button
                          key={i}
                          onClick={() => onTestSelectorInPreview(altSel)}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[11px] font-mono text-cyan-300 px-2 py-0.8 rounded transition-colors cursor-pointer"
                        >
                          {altSel}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Token Telemetry Card for this run */}
                {discoveryResult.tokenUsage && (
                  <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-slate-400 text-[11px]">Run Telemetry:</span>
                      <span className="text-white font-semibold tabular-nums">
                        {discoveryResult.tokenUsage.totalTokens.toLocaleString()} tokens
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-[11px] text-slate-400">
                        ({discoveryResult.tokenUsage.promptTokens} in / {discoveryResult.tokenUsage.candidatesTokens} out)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-semibold tabular-nums">
                        ${discoveryResult.tokenUsage.estimatedCostUsd.toFixed(5)}
                      </span>
                      <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-semibold ${
                        discoveryResult.keySource === 'user_custom'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                      }`}>
                        {discoveryResult.keySource === 'user_custom' ? 'My Quota' : 'System Quota'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggested Fields Table */}
              {discoveryResult.suggestedFields && discoveryResult.suggestedFields.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" /> Auto-Discovered Fields ({discoveryResult.suggestedFields.length})
                    </span>
                    <span className="text-[10px] text-slate-500">Evaluated relative to container</span>
                  </div>

                  <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-850">
                    {discoveryResult.suggestedFields.map((field, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-900/40 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{field.name}</span>
                          <span className="font-mono text-[11px] text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {field.selector}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                          {field.attribute}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">
              Select an element inside the preview to run AI Smart Container Discovery.
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {discoveryResult && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onApplyContainer(discoveryResult.optimalContainerSelector);
                  onClose();
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
              >
                Apply Container Only
              </button>

              <button
                onClick={() => {
                  onApplyRecipeWithFields(
                    discoveryResult.optimalContainerSelector,
                    discoveryResult.suggestedFields
                  );
                  onClose();
                }}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Apply Container &amp; Auto-Populate Fields</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
