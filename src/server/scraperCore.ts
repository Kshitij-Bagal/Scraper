import * as cheerio from 'cheerio';
import { INJECTED_CSS, INJECTED_JS } from './injectedScript.ts';
import { DEMO_PAGES } from './demoData.ts';
import type { ScrapeRecipe, ScrapeExecutionResult, ScrapeResultItem } from '../types/scraper.ts';

/**
 * Injects <base href>, proxy CSS, and point-and-click instrumentation script
 * into raw target HTML using Cheerio.
 */
export function injectScraperAssets(html: string, targetUrl: string): string {
  const $ = cheerio.load(html);

  // Remove existing Content-Security-Policy meta tags that might block inline scripts/styles
  $('meta[http-equiv="Content-Security-Policy" i]').remove();
  $('meta[http-equiv="X-Frame-Options" i]').remove();

  // Prepend <base href> to head so relative CSS, JS, and image assets resolve correctly
  let head = $('head');
  if (head.length === 0) {
    $('html').prepend('<head></head>');
    head = $('head');
  }

  // Check if base tag already exists
  const existingBase = head.find('base');
  if (existingBase.length > 0) {
    existingBase.attr('href', targetUrl);
  } else {
    head.prepend(`<base href="${targetUrl}">`);
  }

  // Inject CSS
  head.append(`<style id="parsevisual-injected-css">${INJECTED_CSS}</style>`);

  // Inject Script into body or head
  let body = $('body');
  if (body.length > 0) {
    body.append(`<script id="parsevisual-injected-js">${INJECTED_JS}</script>`);
  } else {
    head.append(`<script id="parsevisual-injected-js">${INJECTED_JS}</script>`);
  }

  return $.html();
}

/**
 * Fetch a target page HTML or render demo page HTML.
 * Uses multi-strategy fallback:
 * 1. Direct fetch with desktop browser headers
 * 2. Fallback to https://api.allorigins.win/raw?url=
 * 3. Fallback to https://corsproxy.io/?url=
 */
export async function fetchHtmlForUrl(targetUrl: string, pageNumber: number = 1): Promise<{ html: string; finalUrl: string }> {
  // Check for built-in demo targets
  if (targetUrl.startsWith('demo:')) {
    const demoKey = targetUrl.split('?')[0];
    const demo = DEMO_PAGES[demoKey];
    if (demo) {
      const match = targetUrl.match(/page=(\d+)/);
      const page = match ? parseInt(match[1], 10) : pageNumber;
      return {
        html: demo.html(page, targetUrl),
        finalUrl: targetUrl
      };
    }
  }

  const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"macOS"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
  };

  // Strategy 1: Direct fetch
  try {
    const response = await fetch(targetUrl, {
      headers: browserHeaders,
      redirect: 'follow',
      signal: AbortSignal.timeout(9000)
    });

    if (response.ok) {
      const html = await response.text();
      // Ensure we received valid HTML rather than an empty challenge
      if (html && html.length > 200) {
        return {
          html,
          finalUrl: response.url || targetUrl
        };
      }
    }
  } catch (directErr: any) {
    console.warn(`[PROXY] Direct fetch failed for ${targetUrl}: ${directErr.message}. Trying allorigins.win fallback...`);
  }

  // Strategy 2: Fallback through api.allorigins.win
  try {
    const fallbackUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const response = await fetch(fallbackUrl, {
      signal: AbortSignal.timeout(12000)
    });

    if (response.ok) {
      const html = await response.text();
      if (html && html.length > 200) {
        return {
          html,
          finalUrl: targetUrl
        };
      }
    }
  } catch (allOriginsErr: any) {
    console.warn(`[PROXY] allorigins.win fallback failed: ${allOriginsErr.message}. Trying corsproxy.io fallback...`);
  }

  // Strategy 3: Fallback through corsproxy.io
  try {
    const corsProxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`;
    const response = await fetch(corsProxyUrl, {
      signal: AbortSignal.timeout(12000)
    });

    if (response.ok) {
      const html = await response.text();
      if (html && html.length > 200) {
        return {
          html,
          finalUrl: targetUrl
        };
      }
    }
  } catch (corsProxyErr: any) {
    console.warn(`[PROXY] corsproxy.io fallback failed: ${corsProxyErr.message}`);
  }

  throw new Error(`Unable to fetch HTML from "${targetUrl}". The target website may be enforcing strict Cloudflare bot protection, CAPTCHA, or blocking server IP requests. Consider using the 2-Click Container tool or test in the built-in Sandbox environment.`);
}

/**
 * Resolves a potentially relative URL against a base URL.
 */
function resolveUrl(relativeOrAbsolute: string, baseUrl: string): string {
  if (relativeOrAbsolute.startsWith('demo:')) {
    return relativeOrAbsolute;
  }
  try {
    return new URL(relativeOrAbsolute, baseUrl).toString();
  } catch (e) {
    return relativeOrAbsolute;
  }
}

/**
 * Executes a full multi-page container-relative scraping recipe using Cheerio.
 */
export async function executeScrapeRecipe(recipe: ScrapeRecipe): Promise<ScrapeExecutionResult> {
  const startTime = Date.now();
  const logs: string[] = [];
  const allItems: ScrapeResultItem[] = [];

  logs.push(`[INIT] Starting scrape execution for recipe "${recipe.name || 'Untitled'}"`);
  logs.push(`[CONFIG] Start URL: ${recipe.startUrl} | Container: "${recipe.containerSelector}"`);
  logs.push(`[CONFIG] Fields (${recipe.fields.length}): ${recipe.fields.map(f => `${f.name} (${f.attribute})`).join(', ')}`);

  const maxPages = Math.min(Math.max(recipe.pagination.maxPages || 1, 1), 25);
  let currentPage = 1;
  let currentUrl = recipe.startUrl;

  try {
    while (currentPage <= maxPages && currentUrl) {
      logs.push(`[PAGE ${currentPage}] Fetching: ${currentUrl}`);
      
      const { html, finalUrl } = await fetchHtmlForUrl(currentUrl, currentPage);
      const $ = cheerio.load(html);

      // Select container elements
      const containerElements = $(recipe.containerSelector);
      const count = containerElements.length;
      logs.push(`[PAGE ${currentPage}] Found ${count} container elements matching "${recipe.containerSelector}"`);

      if (count === 0 && currentPage === 1) {
        logs.push(`[WARN] No containers found with selector "${recipe.containerSelector}". Checking if root matches...`);
      }

      containerElements.each((index, el) => {
        const item: ScrapeResultItem = {
          _page: currentPage,
          _index: index + 1
        };

        const $container = $(el);

        for (const field of recipe.fields) {
          try {
            // Find relative element within container
            let $target = field.selector ? $container.find(field.selector) : $container;
            
            // If field selector is ':scope' or empty, refer to the container itself
            if (!field.selector || field.selector === ':scope') {
              $target = $container;
            }

            if ($target.length === 0) {
              // Crucial guarantee: missing value is set to null, NOT shifting rows!
              item[field.name] = field.defaultValue ?? null;
              continue;
            }

            let val: any = null;
            const attr = (field.attribute || 'innerText').toLowerCase();

            if (attr === 'innertext' || attr === 'text') {
              val = $target.first().text().trim();
            } else if (attr === 'innerhtml' || attr === 'html') {
              val = $target.first().html()?.trim() ?? null;
            } else if (attr === 'href') {
              const rawHref = $target.first().attr('href');
              val = rawHref ? resolveUrl(rawHref, finalUrl) : null;
            } else if (attr === 'src') {
              const rawSrc = $target.first().attr('src') || $target.first().attr('data-src');
              val = rawSrc ? resolveUrl(rawSrc, finalUrl) : null;
            } else {
              val = $target.first().attr(field.attribute) ?? null;
            }

            // Post-process type conversions if requested
            if (val !== null && field.type === 'number') {
              const numMatch = String(val).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
              val = numMatch ? parseFloat(numMatch[0]) : null;
            }

            item[field.name] = val;
          } catch (fieldErr: any) {
            item[field.name] = null;
          }
        }

        allItems.push(item);
      });

      // Check pagination
      if (currentPage >= maxPages) {
        logs.push(`[PAGINATION] Reached requested max pages limit (${maxPages}).`);
        break;
      }

      if (recipe.pagination.type === 'next_link') {
        const nextSelector = recipe.pagination.selector || 'a.next, .pagination-next, a:contains("Next")';
        const $nextLink = $(nextSelector).first();
        const nextHref = $nextLink.attr('href');

        if (nextHref) {
          currentUrl = resolveUrl(nextHref, finalUrl);
          logs.push(`[PAGINATION] Found next link: ${currentUrl}`);
          currentPage++;

          // Politeness delay
          const delay = Math.max(recipe.pagination.delayMs || 500, 100);
          logs.push(`[POLITENESS] Sleeping ${delay}ms before next page request...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          logs.push(`[PAGINATION] No next link found with selector "${nextSelector}". Reached last page.`);
          break;
        }
      } else if (recipe.pagination.type === 'url_pattern' && recipe.pagination.urlPattern) {
        currentPage++;
        currentUrl = recipe.pagination.urlPattern.replace('{page}', String(currentPage));
        logs.push(`[PAGINATION] Formed next URL pattern: ${currentUrl}`);

        const delay = Math.max(recipe.pagination.delayMs || 500, 100);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Single page or unsupported pagination in static mode
        break;
      }
    }

    const executionTimeMs = Date.now() - startTime;
    logs.push(`[COMPLETE] Successfully extracted ${allItems.length} items across ${currentPage} pages in ${executionTimeMs}ms.`);

    return {
      success: true,
      pagesScraped: currentPage,
      totalItems: allItems.length,
      data: allItems,
      executionTimeMs,
      logs
    };
  } catch (err: any) {
    const executionTimeMs = Date.now() - startTime;
    logs.push(`[ERROR] Execution failed: ${err.message}`);
    return {
      success: false,
      pagesScraped: currentPage,
      totalItems: allItems.length,
      data: allItems,
      executionTimeMs,
      logs,
      error: err.message
    };
  }
}
