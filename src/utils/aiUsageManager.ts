export interface TokenUsageData {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface TokenStats {
  sessionPromptTokens: number;
  sessionCandidatesTokens: number;
  sessionTotalTokens: number;
  totalEstimatedCostUsd: number;
  runsCount: number;
  lastRun?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    timestamp: number;
    keySource: 'user_custom' | 'system_default' | 'heuristic';
  };
}

const API_KEY_STORAGE_KEY = 'scrape_studio_user_gemini_key';
const API_KEY_ACTIVE_KEY = 'scrape_studio_user_key_active';
const TOKEN_STATS_STORAGE_KEY = 'scrape_studio_ai_tokens';

export function getUserApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setUserApiKey(key: string): void {
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
      localStorage.setItem(API_KEY_ACTIVE_KEY, 'true');
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      localStorage.setItem(API_KEY_ACTIVE_KEY, 'false');
    }
  } catch (err) {
    console.error('Failed to store API key:', err);
  }
}

export function clearUserApiKey(): void {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    localStorage.setItem(API_KEY_ACTIVE_KEY, 'false');
  } catch (err) {
    console.error('Failed to clear API key:', err);
  }
}

export function getIsCustomKeyActive(): boolean {
  try {
    const hasKey = !!getUserApiKey();
    const pref = localStorage.getItem(API_KEY_ACTIVE_KEY);
    return hasKey && pref !== 'false';
  } catch {
    return false;
  }
}

export function setIsCustomKeyActive(active: boolean): void {
  try {
    localStorage.setItem(API_KEY_ACTIVE_KEY, active ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to set key active preference:', err);
  }
}

export function getInitialTokenStats(): TokenStats {
  try {
    const raw = localStorage.getItem(TOKEN_STATS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        sessionPromptTokens: Number(parsed.sessionPromptTokens) || 0,
        sessionCandidatesTokens: Number(parsed.sessionCandidatesTokens) || 0,
        sessionTotalTokens: Number(parsed.sessionTotalTokens) || 0,
        totalEstimatedCostUsd: Number(parsed.totalEstimatedCostUsd) || 0,
        runsCount: Number(parsed.runsCount) || 0,
        lastRun: parsed.lastRun
      };
    }
  } catch (e) {
    console.error('Failed to parse saved token stats:', e);
  }

  return {
    sessionPromptTokens: 0,
    sessionCandidatesTokens: 0,
    sessionTotalTokens: 0,
    totalEstimatedCostUsd: 0,
    runsCount: 0
  };
}

export function recordTokenUsage(
  usage: TokenUsageData | undefined, 
  keySource: 'user_custom' | 'system_default' | 'heuristic' = 'system_default'
): TokenStats {
  const current = getInitialTokenStats();
  if (!usage) return current;

  const promptTokens = usage.promptTokens || 0;
  const candidatesTokens = usage.candidatesTokens || 0;
  const totalTokens = usage.totalTokens || (promptTokens + candidatesTokens);
  const cost = usage.estimatedCostUsd || Number(((promptTokens * 0.000000075) + (candidatesTokens * 0.0000003)).toFixed(6));

  const updated: TokenStats = {
    sessionPromptTokens: current.sessionPromptTokens + promptTokens,
    sessionCandidatesTokens: current.sessionCandidatesTokens + candidatesTokens,
    sessionTotalTokens: current.sessionTotalTokens + totalTokens,
    totalEstimatedCostUsd: Number((current.totalEstimatedCostUsd + cost).toFixed(6)),
    runsCount: current.runsCount + 1,
    lastRun: {
      promptTokens,
      candidatesTokens,
      totalTokens,
      estimatedCostUsd: cost,
      timestamp: Date.now(),
      keySource
    }
  };

  try {
    localStorage.setItem(TOKEN_STATS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to persist token stats:', err);
  }

  return updated;
}

export function resetTokenStats(): TokenStats {
  const reset: TokenStats = {
    sessionPromptTokens: 0,
    sessionCandidatesTokens: 0,
    sessionTotalTokens: 0,
    totalEstimatedCostUsd: 0,
    runsCount: 0
  };

  try {
    localStorage.setItem(TOKEN_STATS_STORAGE_KEY, JSON.stringify(reset));
  } catch (err) {
    console.error('Failed to reset token stats:', err);
  }

  return reset;
}
