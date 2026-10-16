export type ExtractionAttribute =
  | 'innerText'
  | 'innerHTML'
  | 'href'
  | 'src'
  | 'title'
  | 'alt'
  | 'class'
  | 'id'
  | string;

export interface FieldDefinition {
  id: string;
  name: string;
  selector: string;
  attribute: ExtractionAttribute;
  defaultValue?: string;
  type?: 'text' | 'number' | 'url' | 'image';
}

export type PaginationType = 'none' | 'next_link' | 'url_pattern' | 'click_more' | 'infinite_scroll';

export interface PaginationConfig {
  type: PaginationType;
  selector?: string; // e.g. "li.next > a" or "a.pagination-next"
  urlPattern?: string; // e.g. "https://books.toscrape.com/catalogue/page-{page}.html"
  maxPages: number;
  delayMs: number;
}

export interface ScrapeRecipe {
  name: string;
  startUrl: string;
  renderMode: 'static' | 'dynamic';
  containerSelector: string; // e.g. "article.product_pod" or "ol.row > li"
  fields: FieldDefinition[];
  pagination: PaginationConfig;
}

export interface BreadcrumbNode {
  index: number;
  tagName: string;
  id?: string;
  classNames?: string;
  selector: string;
  elementSummary: string;
}

export interface ElementSelectionData {
  selector: string;
  containerRelativeSelector?: string;
  tagName: string;
  id?: string;
  classNames?: string;
  innerText: string;
  outerHTML: string;
  attributes: Record<string, string>;
  ancestry: BreadcrumbNode[];
  similarCount: number;
  containerSuggestion?: string;
  surroundingHtml?: string;
}

export interface ScrapeResultItem {
  _page: number;
  _index: number;
  [key: string]: any;
}

export interface ScrapeExecutionResult {
  success: boolean;
  pagesScraped: number;
  totalItems: number;
  data: ScrapeResultItem[];
  executionTimeMs: number;
  logs: string[];
  error?: string;
}

export interface ContainerFailedNode {
  index: number;
  tagName: string;
  classNames?: string;
  attributes: Record<string, string>;
  innerTextSnippet: string;
  diagnosticReason: string;
  suggestedFix?: string;
  outerHTMLSnippet: string;
}

export interface ContainerDebugReport {
  containerSelector: string;
  matchedCount: number;
  ignoredCount: number;
  totalSiblings: number;
  failedNodes: ContainerFailedNode[];
  parentSelector?: string;
}
