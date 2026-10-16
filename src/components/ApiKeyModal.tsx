import React, { useState, useEffect } from 'react';
import { 
  Key, 
  X, 
  Check, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Trash2, 
  AlertCircle,
  HelpCircle,
  Cpu,
  RotateCcw,
  BarChart3,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { 
  getUserApiKey, 
  setUserApiKey, 
  clearUserApiKey, 
  getIsCustomKeyActive, 
  setIsCustomKeyActive,
  type TokenStats
} from '../utils/aiUsageManager.ts';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyChanged: (hasCustomKey: boolean) => void;
  tokenStats?: TokenStats;
  onResetTokens?: () => void;
  initialTab?: 'telemetry' | 'credentials';
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyChanged,
  tokenStats,
  onResetTokens,
  initialTab = 'telemetry'
}) => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'credentials'>(initialTab);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [useCustomKey, setUseCustomKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getUserApiKey();
      setApiKeyInput(stored);
      setUseCustomKey(getIsCustomKeyActive());
      setSavedSuccess(false);
      setErrorMsg(null);
      setConfirmReset(false);
      // If user has no API key and no token usage, start on credentials tab
      if (!stored && (!tokenStats || tokenStats.sessionTotalTokens === 0)) {
        setActiveTab('credentials');
      }
    }
  }, [isOpen, tokenStats]);

  if (!isOpen) return null;

  const handleSave = () => {
    setErrorMsg(null);
    const trimmed = apiKeyInput.trim();

    if (!trimmed) {
      clearUserApiKey();
      setUseCustomKey(false);
      onKeyChanged(false);
      setSavedSuccess(true);
      setTimeout(() => onClose(), 800);
      return;
    }

    if (trimmed.length < 20) {
      setErrorMsg('API key appears unusually short. Gemini keys typically start with "AIzaSy" and are ~39 characters.');
      return;
    }

    setUserApiKey(trimmed);
    setIsCustomKeyActive(true);
    setUseCustomKey(true);
    onKeyChanged(true);
    setSavedSuccess(true);
    setTimeout(() => onClose(), 800);
  };

  const handleClear = () => {
    clearUserApiKey();
    setApiKeyInput('');
    setUseCustomKey(false);
    onKeyChanged(false);
    setSavedSuccess(true);
    setTimeout(() => onClose(), 800);
  };

  const handleToggleActive = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setUseCustomKey(checked);
    setIsCustomKeyActive(checked);
    onKeyChanged(checked && !!apiKeyInput.trim());
  };

  const formatCost = (usd: number = 0) => {
    if (usd === 0) return '$0.00';
    if (usd < 0.0001) return '< $0.0001';
    return `$${usd.toFixed(4)}`;
  };

  const totalTokens = tokenStats?.sessionTotalTokens || 0;
  const promptTokens = tokenStats?.sessionPromptTokens || 0;
  const candidateTokens = tokenStats?.sessionCandidatesTokens || 0;
  const promptPercent = totalTokens > 0 ? Math.round((promptTokens / totalTokens) * 100) : 50;
  const candidatePercent = totalTokens > 0 ? 100 - promptPercent : 50;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-100 flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">AI Token Telemetry &amp; Credentials</h3>
              <p className="text-[11px] text-slate-400">
                Monitor live usage metrics and manage your Gemini API credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Summary Ribbon */}
        <div className="bg-slate-950/90 px-5 py-2.5 border-b border-slate-800/80 flex items-center justify-between text-xs flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400 text-[11px]">Session Tokens:</span>
              <span className="font-bold text-slate-100">{totalTokens.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-slate-400 text-[11px]">Est. Cost:</span>
              <span className="font-bold text-emerald-400">{formatCost(tokenStats?.totalEstimatedCostUsd)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Active Quota:</span>
            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
              useCustomKey && apiKeyInput.trim()
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                : 'bg-indigo-950 text-indigo-300 border border-indigo-700/60'
            }`}>
              <Key className="w-2.5 h-2.5" />
              {useCustomKey && apiKeyInput.trim() ? 'Personal Key' : 'System Account'}
            </span>
          </div>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="px-5 pt-3 border-b border-slate-800 flex gap-2 shrink-0 bg-slate-900/60">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer border-t-2 ${
              activeTab === 'telemetry'
                ? 'bg-slate-900 text-cyan-300 border-cyan-400 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/40'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Usage Monitoring</span>
            {totalTokens > 0 && (
              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.2 rounded-full">
                {totalTokens > 1000 ? `${(totalTokens / 1000).toFixed(1)}k` : totalTokens}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('credentials')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer border-t-2 ${
              activeTab === 'credentials'
                ? 'bg-slate-900 text-cyan-300 border-cyan-400 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/40'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>API Key &amp; Credentials</span>
            {useCustomKey && apiKeyInput.trim() && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            )}
          </button>
        </div>

        {/* Tab 1: Usage Monitoring & Telemetry */}
        {activeTab === 'telemetry' && (
          <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Total Tokens */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Tokens Used
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold font-mono text-white tabular-nums">
                    {totalTokens.toLocaleString()}
                  </span>
                  <span className="text-slate-500 text-[11px]">tokens</span>
                </div>
                <p className="text-[10px] text-slate-500">Combined prompt &amp; candidates</p>
              </div>

              {/* Total Cost */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Estimated Cost (USD)
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold font-mono text-emerald-400 tabular-nums">
                    {formatCost(tokenStats?.totalEstimatedCostUsd)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Based on Gemini Flash rates</p>
              </div>

              {/* Prompt Input Tokens */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                    Prompt (Input)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{promptPercent}%</span>
                </div>
                <span className="text-lg font-bold font-mono text-cyan-300 tabular-nums block">
                  {promptTokens.toLocaleString()}
                </span>
                <p className="text-[10px] text-slate-500">DOM snippets &amp; schema instructions</p>
              </div>

              {/* Output Candidate Tokens */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                    Candidate (Output)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{candidatePercent}%</span>
                </div>
                <span className="text-lg font-bold font-mono text-indigo-300 tabular-nums block">
                  {candidateTokens.toLocaleString()}
                </span>
                <p className="text-[10px] text-slate-500">Generated selectors &amp; field recipes</p>
              </div>
            </div>

            {/* Token Distribution Bar */}
            {totalTokens > 0 && (
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                    Input Tokens: <strong className="text-slate-200">{promptTokens.toLocaleString()}</strong> ({promptPercent}%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                    Output Tokens: <strong className="text-slate-200">{candidateTokens.toLocaleString()}</strong> ({candidatePercent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                  <div 
                    className="bg-cyan-400 h-full transition-all duration-300" 
                    style={{ width: `${promptPercent}%` }} 
                  />
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-300" 
                    style={{ width: `${candidatePercent}%` }} 
                  />
                </div>
              </div>
            )}

            {/* Activity Summary */}
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
              <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Discovery Execution Metrics
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div>AI Discovery Runs: <strong className="text-white font-mono">{tokenStats?.runsCount || 0}</strong> queries</div>
                <div>Billing Source: <strong className="text-white font-mono">{useCustomKey && apiKeyInput ? 'Personal Account' : 'System Default'}</strong></div>
              </div>
            </div>

            {/* Rate & Pricing Transparency */}
            <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-[11px] text-indigo-300/90 space-y-1 leading-relaxed">
              <span className="font-bold text-indigo-200 block">Pricing Calculation Formula:</span>
              <p>
                Tokens are computed at standard Google Gemini 1.5/3.8 Flash rates: <strong>$0.075 per 1M input tokens</strong> and <strong>$0.30 per 1M output tokens</strong>. Using your own key preserves free tier quotas.
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              {tokenStats && tokenStats.sessionTotalTokens > 0 ? (
                confirmReset ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-rose-300">Confirm reset?</span>
                    <button
                      onClick={() => {
                        if (onResetTokens) onResetTokens();
                        setConfirmReset(false);
                      }}
                      className="text-xs bg-rose-600 hover:bg-rose-500 text-white px-2 py-1 rounded cursor-pointer"
                    >
                      Yes, Reset
                    </button>
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmReset(true)}
                    className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Session Token Counter</span>
                  </button>
                )
              ) : <div />}

              <button
                onClick={() => setActiveTab('credentials')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Edit API Key Credentials →</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: API Credentials & Key Management */}
        {activeTab === 'credentials' && (
          <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
            {/* Active Status Banner */}
            <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              useCustomKey && apiKeyInput.trim()
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                : 'bg-indigo-950/30 border-indigo-800/40 text-slate-300'
            }`}>
              <ShieldCheck className={`w-5 h-5 shrink-0 ${
                useCustomKey && apiKeyInput.trim() ? 'text-emerald-400' : 'text-indigo-400'
              }`} />
              <div>
                <span className="font-bold block text-xs uppercase tracking-wider mb-0.5">
                  {useCustomKey && apiKeyInput.trim()
                    ? 'Personal API Key Active'
                    : 'Using Application Default Key'}
                </span>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {useCustomKey && apiKeyInput.trim()
                    ? 'All AI container discovery operations consume tokens directly from your personal Google Gemini account quota.'
                    : 'Container discovery currently uses the backend system account. Enter your personal key below to avoid shared system rate limits.'}
                </p>
              </div>
            </div>

            {/* Key Input Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Google Gemini API Key
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
                >
                  <span>Get Free API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 pr-10 text-xs font-mono text-emerald-300 focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-1.5 text-rose-400 text-[11px] bg-rose-950/40 p-2.5 rounded-lg border border-rose-900">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Toggle Switch */}
            {apiKeyInput.trim() && (
              <label className="flex items-center gap-2.5 cursor-pointer bg-slate-950/70 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={useCustomKey}
                  onChange={handleToggleActive}
                  className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                />
                <div>
                  <span className="text-slate-200 font-semibold text-xs block">
                    Enable personal API key for AI Smart Container Discovery
                  </span>
                  <span className="text-[11px] text-slate-400">
                    When unchecked, discovery will seamlessly revert to system quota without deleting your key.
                  </span>
                </div>
              </label>
            )}

            {/* Privacy & Storage Guarantee */}
            <div className="text-[11px] text-slate-400 bg-slate-950/50 p-3.5 rounded-xl border border-slate-850 space-y-1.5 leading-relaxed">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" /> How credentials are kept secure:
              </span>
              <p>
                Your API key is saved solely inside your browser&apos;s <code className="text-slate-300 font-mono">localStorage</code>. When you run AI discovery, the key is passed over local proxy headers to authenticate with Google Gemini. It is never logged, stored in databases, or transmitted to any third party.
              </p>
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          {apiKeyInput ? (
            <button
              onClick={handleClear}
              className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-2.5 py-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Key</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>

            {activeTab === 'credentials' ? (
              <button
                onClick={handleSave}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-emerald-600/30"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved &amp; Applied!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save &amp; Apply</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('credentials')}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-cyan-600/30"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Configure Key</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
