# Rock-Solid Split-Pane Resizing & AI Token Accounting

A comprehensive implementation plan to resolve dynamic pane resizing with a single-container proportional split pane, enable user-supplied Gemini API credentials directly inside the AI container tool, and provide transparent token usage metrics with cost estimation.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed through Phase 1 user interview questions and form the governing specification:
> - **Proportional Split-Pane Resizing**: The preview iframe and the DOM & CSS inspector dock are housed inside a single unified container with a draggable dividing border. Pane sizing is computed as a fluid percentage of the parent container's bounding rectangle (`getBoundingClientRect()`), guaranteeing constant total dimensions without jitter, jumpiness, or page scroll overflow. Includes one-click collapse and restore toggles.
> - **In-Tool Custom Gemini API Key & Credentials**: A quick-access configuration dialog inside the AI Smart Container Discovery interface allows users to supply their personal Gemini API key. When active, requests pass the custom credential securely to the proxy backend, consuming the user's account tokens instead of the platform default.
> - **Detailed Token Usage & Cost Accounting Badge**: Positioned directly beside the "AI Smart Container Discovery" button, a detailed metrics badge displays input (prompt) tokens, output (candidates) tokens, total accumulated session tokens, and an estimated dollar cost based on Gemini token pricing.

---

## 1. Overview & Core Concept

### What It Does
1. **Unified Split-Pane Viewport**: Combines the live iframe canvas and the interactive Inspector Dock into a single vertical flex container with an interactive divider bar. Dragging the divider calculates proportional height splits (`splitPercent` between 15% and 85%) based on the container's real-time bounding box, maintaining total height stability regardless of window resizing.
2. **Transparent AI Token Telemetry**: Connects the server-side `@google/genai` response `usageMetadata` (prompt tokens, candidate tokens, total tokens) to a persistent client-side token registry. Displays an active session token badge beside the AI Discovery button with hover popovers detailing consumption breakdown and cost calculations.
3. **Bring-Your-Own-Key (BYOK) Credential Flow**: Allows users to enter, save, or clear their personal Gemini API key directly within the AI discovery tool. Keys are saved in encrypted/obfuscated client localStorage and sent via an authenticated request header (`x-user-gemini-key`), with seamless fallback to the system key if none is provided.

### Target Audience & Persona
Web scraping engineers, data analysts, and automation developers inspecting complex DOM structures (such as Lenskart, Amazon, or dynamic React/Vue SPAs) who need stable, adjustable viewing real estate and complete transparency over AI operational costs.

### Key Value
- **Zero layout drift**: Eliminates fixed-pixel resize drift where dragging the inspector caused the iframe or recipe panel to overflow or collapse unexpectedly.
- **Cost awareness & control**: Users clearly observe token consumption per container discovery run and can switch to their own billing credentials to preserve team quotas.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Resizing the Workspace**:
   - The user hovers over the horizontal divider between the iframe and the inspector dock. The cursor changes to `row-resize` and a subtle highlight accent appears.
   - Clicking and dragging recalculates the relative height percentage in real-time. An invisible pointer-capture overlay prevents the embedded iframe from stealing mouse events.
   - Double-clicking the divider resets the layout to the optimal 65% (iframe) / 35% (dock) split.
   - Clicking the chevron toggle on the divider collapses the dock down to a slim 36px status bar, or restores it to the previous height.
2. **Executing AI Smart Container Discovery**:
   - The user selects a product card sub-element in the iframe or enters a query.
   - The user clicks **AI Smart Container Discovery**. The button indicates loading while the model analyzes the DOM.
   - Upon completion, the optimal container selector, confidence score, and token telemetry are returned.
   - The token badge beside the button smoothly updates with the newly consumed tokens and incremental cost.
3. **Configuring Personal API Key**:
   - Inside the AI container discovery modal or toolbar, the user clicks the key icon ("Use Personal Gemini Key").
   - A clean dialog opens showing the current status ("Using System Key" or "Custom Key Active").
   - The user pastes their Gemini API key (`AIza...`). The system validates formatting and stores it in browser storage.
   - All subsequent AI discovery calls include this key in the proxy request header, and the token badge displays an active "Personal Key Active" indicator.

### Visual Identity & Theme
- **Color Palette**: Neutral dark slate (`#0B0F19` background, `#111827` surface panels, `#1F2937` borders) with vibrant Indigo (`#6366F1`) and Emerald (`#10B981`) accent indicators.
- **Typography**: Clean sans-serif UI typography paired with `JetBrains Mono` / `tabular-nums` for DOM tags, selectors, token counts, and cost numbers to prevent layout twitching.
- **Anti-Slop Discipline**: No decorative pulsing dots, no fake system status bars, no arbitrary "AI magic scores". Token counts and cost metrics reflect real API consumption numbers directly from `@google/genai` SDK `usageMetadata`.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Proportional Split-Pane Container Math
- **Chosen Approach**: Wrap the iframe canvas and inspector dock in a single `flex flex-col` container with `overflow-hidden`. Sizing is governed by a single state: `splitRatio` (default `0.65`, meaning 65% iframe height, 35% inspector height). Drag calculations use `(e.clientY - containerRect.top) / containerRect.height` clamped between `0.15` and `0.85`.
- **Why**: Pixel-based height dragging suffered from bounding offsets, scrollbar variations, and viewport resize desynchronization. A single enclosing div with fractional sizing guarantees the sum of heights always equals 100% of the parent workspace.
- **Alternative Considered**: CSS grid `grid-template-rows: 1fr auto 1fr` with resize handles. Rejected because CSS grid resize requires manual pixel calculation anyway and lacks smooth programmatic collapse animation.

### Decision 2: In-Tool Credential Injection
- **Chosen Approach**: Add a quick-access credential button and drawer directly in the AI tool modal/dock. The key is persisted in `localStorage` under `scrape_studio_user_gemini_key` and sent via `x-user-gemini-key` header to `/api/ai-container-discovery`.
- **Why**: Keeps setup frictionless right at the point of need without forcing users to navigate to a detached global settings panel.
- **Security & Scope**: The key is stored purely on the client side in the user's browser origin and only passed over local server routes to initialize the `@google/genai` client for their specific request; it is never committed or logged.

### Decision 3: Exact SDK Token Telemetry & Pricing Tier
- **Chosen Approach**: Server captures `response.usageMetadata` from the `@google/genai` response:
  - `promptTokenCount`
  - `candidatesTokenCount`
  - `totalTokenCount`
  Cost is estimated using standard Gemini 2.5 Flash / 1.5 Flash API pricing ($0.075 / 1M prompt tokens, $0.30 / 1M candidate tokens) with tabular precision down to 5 decimal places (`$0.00012`).
- **Why**: Gives users exact situational awareness and confidence regarding operational expense.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App Navigation Header                           │
├────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────┐ ┌─────────────────┐ │
│ │ Unified Workspace Parent (100% Height, Flex)   │ │ Recipe Sidebar  │ │
│ │                                                │ │ (Width Resizer) │ │
│ │ ┌────────────────────────────────────────────┐ │ │                 │ │
│ │ │ Iframe Canvas (height: splitRatio * 100%)  │ │ │                 │ │
│ │ └────────────────────────────────────────────┘ │ │                 │ │
│ │ ══════════════════════════════════════════════ │ │                 │ │
│ │ ── Draggable Split Border [▲ Collapse / ▼] ─── │ │                 │ │
│ │ ══════════════════════════════════════════════ │ │                 │ │
│ │ ┌────────────────────────────────────────────┐ │ │                 │ │
│ │ │ Inspector Dock (height: (1 - splitRatio))  │ │ │                 │ │
│ │ │  • DOM / CSS Inspector                     │ │ │                 │ │
│ │ │  • Visual Debugger (Ignored Siblings)      │ │ │                 │ │
│ │ └────────────────────────────────────────────┘ │ │                 │ │
│ └────────────────────────────────────────────────┘ └─────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State Additions

```typescript
// Token Usage State
interface TokenUsageSummary {
  sessionPromptTokens: number;
  sessionCandidatesTokens: number;
  sessionTotalTokens: number;
  lastRequestTokens?: {
    prompt: number;
    candidates: number;
    total: number;
  };
  totalEstimatedCostUsd: number;
  runsCount: number;
}

// User Credential State
interface UserApiCredentials {
  apiKey: string;
  isCustomKeyActive: boolean;
  maskedKey: string;
}
```

### Component & State Mapping
- `src/App.tsx`:
  - `splitRatio` state (0.15 to 0.85) replacing fragile raw pixel calculations.
  - Transparent drag event blocker preventing iframe mouse interception during dragging.
  - Token usage accumulator state persisted across requests.
  - Active credentials state passed down to discovery calls.
- `src/components/InspectorDock.tsx`:
  - Integrated with the proportional flex parent.
  - Dynamic height bound to splitRatio or collapse state.
- `src/server/aiContainerDiscovery.ts`:
  - Accepts optional `customApiKey` parameter in `SmartContainerRequest`.
  - Instantiates `GoogleGenAI` with either `customApiKey` or `process.env.GEMINI_API_KEY`.
  - Extracts and returns `usageMetadata` with prompt, candidates, and total token counts.
- `src/components/AiDiscoveryModal.tsx` / `AiTokenBadge.tsx`:
  - Interactive badge beside the AI Discovery button showing tokens, cost, and personal key status.
  - In-tool quick credential dialog with key validation and toggle.
