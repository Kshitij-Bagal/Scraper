import type { IncomingMessage, ServerResponse } from 'http';
import { fetchHtmlForUrl, injectScraperAssets, executeScrapeRecipe } from './scraperCore.ts';
import { DEMO_PAGES } from './demoData.ts';
import { discoverSmartContainerWithAI } from './aiContainerDiscovery.ts';
import type { ScrapeRecipe } from '../types/scraper.ts';

function readJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export function createScraperMiddleware() {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = urlObj.pathname;

    // Route 1: /api/proxy (GET)
    if (pathname === '/api/proxy' && req.method === 'GET') {
      const targetUrl = urlObj.searchParams.get('url');
      if (!targetUrl) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing "url" query parameter' }));
        return;
      }

      try {
        const { html, finalUrl } = await fetchHtmlForUrl(targetUrl);
        const transformedHtml = injectScraperAssets(html, finalUrl);

        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          // Remove frame restrictions
          'X-Frame-Options': 'ALLOWALL',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(transformedHtml);
      } catch (err: any) {
        res.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <html>
            <body style="font-family: system-ui; padding: 2rem; background: #0f172a; color: #f8fafc;">
              <h2 style="color: #f87171;">Failed to Proxy Target URL</h2>
              <p style="color: #cbd5e1;"><strong>Target:</strong> ${targetUrl}</p>
              <pre style="background: #1e293b; padding: 1rem; border-radius: 6px; color: #fca5a5;">${err.message}</pre>
              <p style="color: #94a3b8; font-size: 0.9rem;">
                Tip: If the target website blocks server requests with Cloudflare or bot protection, try the built-in demo databases (e.g. <code>demo:dummyjson</code> or <code>demo:books</code>) for 100% reproducible live play-testing.
              </p>
            </body>
          </html>
        `);
      }
      return;
    }

    // Route 2: /api/scrape (POST)
    if (pathname === '/api/scrape' && req.method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const recipe: ScrapeRecipe = body.recipe;

        if (!recipe || !recipe.startUrl || !recipe.containerSelector) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Invalid recipe: "startUrl" and "containerSelector" are required.'
          }));
          return;
        }

        const result = await executeScrapeRecipe(recipe);
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(result));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: err.message
        }));
      }
      return;
    }

    // Route 3: /api/demo-recipes (GET)
    if (pathname === '/api/demo-recipes' && req.method === 'GET') {
      const demos = Object.entries(DEMO_PAGES).map(([key, page]) => ({
        key,
        title: page.title,
        url: page.url,
        recipe: page.suggestedRecipe
      }));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ demos }));
      return;
    }

    // Route 4: /api/ai-discover-container (POST)
    if (pathname === '/api/ai-discover-container' && req.method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const userHeaderKey = req.headers['x-user-gemini-key'] as string | undefined;
        if (userHeaderKey && !body.customApiKey) {
          body.customApiKey = userHeaderKey;
        }
        const result = await discoverSmartContainerWithAI(body);
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(result));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: err.message
        }));
      }
      return;
    }

    // Pass through to next Vite middleware
    next();
  };
}
