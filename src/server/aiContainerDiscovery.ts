import { GoogleGenAI } from '@google/genai';
import * as cheerio from 'cheerio';

export interface SmartContainerRequest {
  targetElementHtml: string;
  targetTagName: string;
  ancestryTrail: Array<{
    index: number;
    tagName: string;
    id?: string;
    classNames?: string;
    selector: string;
  }>;
  surroundingHtml: string;
  url?: string;
  customApiKey?: string;
}

export interface SmartContainerResponse {
  optimalContainerSelector: string;
  alternativeSelectors: string[];
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  suggestedFields: Array<{
    name: string;
    selector: string;
    attribute: string;
    type?: 'text' | 'number' | 'url' | 'image';
  }>;
  source: 'gemini' | 'heuristic';
  tokenUsage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
  };
  keySource?: 'user_custom' | 'system_default' | 'heuristic';
  errorDetails?: string;
}

/**
 * Local heuristic fallback that evaluates DOM patterns when API key is unavailable or offline
 */
function heuristicContainerDiscovery(req: SmartContainerRequest): SmartContainerResponse {
  const $ = cheerio.load(req.surroundingHtml || req.targetElementHtml);
  let optimalContainer = '';
  let reasoning = '';
  const alternatives: string[] = [];

  // Check 1: article elements with data attributes (e.g. Lenskart)
  if ($('article[data-product-position]').length >= 2) {
    optimalContainer = 'article[data-product-position]';
    alternatives.push('article', 'section > article');
    reasoning = 'Detected repeating semantic <article> tags with [data-product-position] tracking attributes, avoiding transient styled-component hashes.';
  } else if ($('article').length >= 2) {
    optimalContainer = 'article';
    alternatives.push('section article', 'div > article');
    reasoning = 'Detected repeating semantic HTML5 <article> cards.';
  } else if ($('li[class*="product"], li[class*="col"], ol.row > li, ul > li').length >= 2) {
    optimalContainer = 'ol.row > li, ul > li';
    alternatives.push('li');
    reasoning = 'Detected standard catalogue list item containers (li).';
  } else if ($('[data-testid*="product"], [data-qa*="product"], [data-cy*="product"]').length >= 2) {
    optimalContainer = '[data-testid*="product"]';
    reasoning = 'Detected testing attributes [data-testid*="product"] consistently repeating on item cards.';
  } else {
    // Check ancestry from leaf to root
    for (let i = req.ancestryTrail.length - 2; i >= 0; i--) {
      const node = req.ancestryTrail[i];
      const tag = node.tagName.toLowerCase();
      if (tag === 'article' || tag === 'li') {
        optimalContainer = tag;
        reasoning = `Selected ancestor tag <${tag}> as repeating item container.`;
        break;
      }
      if (node.classNames) {
        const cleanClasses = node.classNames.split(' ').filter(c => !/^sc-[\w-]+/i.test(c) && !/_[a-z0-9]{5,}/i.test(c));
        const matchedClass = cleanClasses.find(c => /product|card|item|tile|listing/i.test(c));
        if (matchedClass) {
          optimalContainer = `${tag}.${matchedClass}`;
          reasoning = `Found semantic class .${matchedClass} on ancestor <${tag}>.`;
          break;
        }
      }
    }
  }

  if (!optimalContainer) {
    optimalContainer = req.ancestryTrail[req.ancestryTrail.length - 2]?.selector || 'article, .product-card, li';
    reasoning = 'Selected immediate parent container based on DOM hierarchy.';
  }

  // Derive suggested fields
  const fields = [
    { name: 'product_name', selector: 'h1, h2, h3, h4, .title, a[data-product-card-link]', attribute: 'innerText', type: 'text' as const },
    { name: 'sale_price', selector: 'div[aria-label*="Price"] span, .price, .price-sale', attribute: 'innerText', type: 'text' as const },
    { name: 'original_price', selector: 's, del, .price-original', attribute: 'innerText', type: 'text' as const },
    { name: 'product_link', selector: 'a[data-product-card-link], a[href*="product"], a[href*=".html"]', attribute: 'href', type: 'url' as const },
    { name: 'product_image', selector: 'img', attribute: 'src', type: 'image' as const },
    { name: 'product_id', selector: 'a[data-product-id], [data-product-id]', attribute: 'data-product-id', type: 'text' as const }
  ];

  return {
    optimalContainerSelector: optimalContainer,
    alternativeSelectors: alternatives,
    confidence: 'high',
    reasoning,
    suggestedFields: fields,
    source: 'heuristic'
  };
}

/**
 * AI-powered Smart Container Discovery using Gemini 3.8 Flash
 */
export async function discoverSmartContainerWithAI(req: SmartContainerRequest): Promise<SmartContainerResponse> {
  const customKey = req.customApiKey ? req.customApiKey.trim() : '';
  const systemKey = process.env.GEMINI_API_KEY;
  
  const effectiveKey = customKey || (systemKey && systemKey !== 'MY_GEMINI_API_KEY' ? systemKey : '');
  const keySource: 'user_custom' | 'system_default' | 'heuristic' = customKey 
    ? 'user_custom' 
    : (systemKey && systemKey !== 'MY_GEMINI_API_KEY') 
      ? 'system_default' 
      : 'heuristic';

  if (!effectiveKey) {
    const fallback = heuristicContainerDiscovery(req);
    return {
      ...fallback,
      tokenUsage: {
        promptTokens: 0,
        candidatesTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0
      },
      keySource: 'heuristic'
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: effectiveKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `You are an expert Principal Web Scraping Architect specializing in CSS DOM pattern recognition for modern SPAs, Next.js, and Styled-Components websites (such as Lenskart, Shopify, Amazon).

A user is building a visual web scraping recipe and clicked on a sub-element.
Analyze the following DOM excerpt to discover the optimal repeating parent container selector and relative field selectors:

TARGET ELEMENT:
Tag: <${req.targetTagName}>
HTML:
${req.targetElementHtml ? req.targetElementHtml.slice(0, 1000) : ''}

DOM ANCESTRY TRAIL (From Root to Target):
${req.ancestryTrail.map(a => `Level ${a.index}: <${a.tagName}> class="${a.classNames || ''}" id="${a.id || ''}" selector="${a.selector}"`).join('\n')}

SURROUNDING SIBLING DOM SNIPPET:
${req.surroundingHtml ? req.surroundingHtml.slice(0, 3000) : ''}

YOUR TASK:
1. Identify the exact repeating card/container selector that groups each product/item.
   - CRITICAL RULE: STRIP out transient, volatile styled-component hashes (e.g. \`sc-677c591a-13\`, \`sc-24248b3a-0\`, \`__className_869da3\`, \`css-1dbjc4n\`) and item-specific IDs.
   - Prefer semantic tags (e.g. \`article\`, \`li\`), stable data attributes (e.g. \`article[data-product-position]\`, \`[data-testid*="product"]\`), or structural relationships (e.g. \`section[aria-label="Products"] > article\`).
2. Identify relative child selectors inside each container card for:
   - Title / product name
   - Sale price
   - Original strikethrough price (e.g. \`s\` or \`del\`)
   - Product link (href)
   - Product image (src)
   - Product ID or position (attribute)

Respond ONLY with a valid JSON object matching this schema:
{
  "optimalContainerSelector": "string",
  "alternativeSelectors": ["string"],
  "confidence": "high" | "medium" | "low",
  "reasoning": "1-2 sentence explanation of why this container selector is optimal and what classes/hashes were filtered",
  "suggestedFields": [
    {
      "name": "string",
      "selector": "string (relative to container)",
      "attribute": "innerText | href | src | data-product-id | data-product-position | s | aria-label",
      "type": "text | number | url | image"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    // Extract exact usage metadata from Gemini SDK
    const promptTokens = response.usageMetadata?.promptTokenCount ?? 0;
    const candidatesTokens = response.usageMetadata?.candidatesTokenCount ?? 0;
    const totalTokens = response.usageMetadata?.totalTokenCount ?? (promptTokens + candidatesTokens);
    
    // Gemini 2.5 Flash / 1.5 Flash official rates:
    // Prompt: $0.075 / 1M tokens ($0.000000075 / token)
    // Candidate: $0.30 / 1M tokens ($0.0000003 / token)
    const estimatedCostUsd = Number(((promptTokens * 0.000000075) + (candidatesTokens * 0.0000003)).toFixed(6));

    const text = response.text?.trim();
    if (!text) {
      const fallback = heuristicContainerDiscovery(req);
      return {
        ...fallback,
        tokenUsage: {
          promptTokens,
          candidatesTokens,
          totalTokens,
          estimatedCostUsd
        },
        keySource
      };
    }

    const parsed = JSON.parse(text);
    return {
      optimalContainerSelector: parsed.optimalContainerSelector || 'article',
      alternativeSelectors: parsed.alternativeSelectors || [],
      confidence: parsed.confidence || 'high',
      reasoning: parsed.reasoning || 'AI analyzed repeated DOM patterns and isolated repeating container.',
      suggestedFields: parsed.suggestedFields || [],
      source: 'gemini',
      tokenUsage: {
        promptTokens,
        candidatesTokens,
        totalTokens,
        estimatedCostUsd
      },
      keySource
    };
  } catch (err: any) {
    console.warn(`[AI Container Discovery] Gemini API call error: ${err.message}. Falling back to structural heuristic engine.`);
    const fallback = heuristicContainerDiscovery(req);
    return {
      ...fallback,
      tokenUsage: {
        promptTokens: 0,
        candidatesTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0
      },
      keySource: 'heuristic',
      errorDetails: err.message
    };
  }
}
