import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createScraperMiddleware } from './src/server/proxyMiddleware.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Mount scraper and proxy middleware
app.use(createScraperMiddleware() as any);

// Serve static assets from Vite build in dist
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ParseVisual Server running on port ${PORT}`);
});
