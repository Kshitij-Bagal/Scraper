import React from 'react';
import { 
  Sparkles, 
  Key, 
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import type { TokenStats } from '../utils/aiUsageManager.ts';

interface AiTokenBadgeProps {
  tokenStats: TokenStats;
  isCustomKeyActive: boolean;
  onOpenKeyModal: () => void;
  onResetTokens?: () => void;
  compact?: boolean;
}

export const AiTokenBadge: React.FC<AiTokenBadgeProps> = ({
  tokenStats,
  isCustomKeyActive,
  onOpenKeyModal,
  compact = false
}) => {
  const formatTokens = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(2) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toLocaleString();
  };

  const formatCost = (usd: number) => {
    if (usd === 0) return '$0.00';
    if (usd < 0.0001) return '< $0.0001';
    return `$${usd.toFixed(4)}`;
  };

  return (
    <button
      type="button"
      onClick={onOpenKeyModal}
      className={`flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-lg px-2.5 py-1 text-slate-300 transition-all cursor-pointer shadow-xs select-none group text-left ${
        compact ? 'text-[10px]' : 'text-xs'
      }`}
      title="Open AI Token Telemetry & API Credentials Overlay: Monitor token usage, costs and configure personal Gemini API key"
    >
      <div className="flex items-center gap-1 text-[11px] font-mono tabular-nums">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-300 group-hover:scale-110 transition-transform shrink-0" />
        <span className="font-semibold text-slate-200">
          {formatTokens(tokenStats.sessionTotalTokens)}
        </span>
        <span className="text-slate-500 font-normal">tokens</span>
        <span className="text-slate-600">·</span>
        <span className="text-emerald-400 font-medium">
          {formatCost(tokenStats.totalEstimatedCostUsd)}
        </span>
      </div>

      {/* Key Source Indicator */}
      <span 
        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-semibold flex items-center gap-1 transition-colors ${
          isCustomKeyActive
            ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 group-hover:bg-emerald-900/60'
            : 'bg-indigo-950/90 text-indigo-300 border border-indigo-700/60 group-hover:bg-indigo-900/60'
        }`}
      >
        <Key className="w-2.5 h-2.5" />
        <span>{isCustomKeyActive ? 'Personal' : 'System'}</span>
      </span>

      <SlidersHorizontal className="w-3 h-3 text-slate-400 group-hover:text-cyan-300 transition-colors ml-0.5" />
    </button>
  );
};
