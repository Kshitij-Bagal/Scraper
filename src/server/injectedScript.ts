/**
 * Script and styles injected into proxied HTML pages to enable
 * visual point-and-click inspection, 2-Click LCA container detection,
 * fuzzy class generalization for dynamic e-commerce sites (e.g. Lenskart),
 * two-way DOM traversal, and selector testing.
 */

export const INJECTED_CSS = `
/* ParseVisual Scraper Injected Styles */
.scraper-hover {
  outline: 2px dashed #ff4757 !important;
  outline-offset: -2px !important;
  cursor: crosshair !important;
  transition: outline 0.08s ease-in-out !important;
}

.scraper-selected {
  outline: 3px solid #2ed573 !important;
  outline-offset: -2px !important;
  background-color: rgba(46, 213, 115, 0.16) !important;
  box-shadow: 0 0 12px rgba(46, 213, 115, 0.45) !important;
  position: relative !important;
}

.scraper-similar {
  outline: 2px solid #1e90ff !important;
  outline-offset: -2px !important;
  background-color: rgba(30, 144, 255, 0.12) !important;
  box-shadow: 0 0 8px rgba(30, 144, 255, 0.3) !important;
}

.scraper-container {
  outline: 2.5px dashed #ffa502 !important;
  outline-offset: 1px !important;
  background-color: rgba(255, 165, 2, 0.08) !important;
}

.scraper-two-click-first {
  outline: 3px solid #ffa502 !important;
  outline-offset: -2px !important;
  background-color: rgba(255, 165, 2, 0.2) !important;
  box-shadow: 0 0 14px rgba(255, 165, 2, 0.5) !important;
}

.scraper-debug-failed {
  outline: 3px dashed #ef4444 !important;
  outline-offset: -2px !important;
  background-color: rgba(239, 68, 68, 0.2) !important;
  box-shadow: 0 0 14px rgba(239, 68, 68, 0.55) !important;
  position: relative !important;
}

/* Tooltip / Badge for 2-click workflow and selected nodes */
.scraper-badge {
  position: absolute !important;
  top: -24px !important;
  left: 0 !important;
  background: #0f172a !important;
  color: #38bdf8 !important;
  border: 1px solid #0284c7 !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  padding: 2px 7px !important;
  border-radius: 4px !important;
  z-index: 2147483647 !important;
  pointer-events: none !important;
  box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important;
}
`;

export const INJECTED_JS = `
(function() {
  if (window.__PARSEVISUAL_INJECTED__) return;
  window.__PARSEVISUAL_INJECTED__ = true;

  let currentMode = 'select'; // 'navigate' | 'select' | 'two_click'
  let currentHoveredElement = null;
  let currentSelectedElement = null;
  let activeAncestryList = [];
  let currentContainerSelector = '';
  let debugFailedElementsList = [];

  // 2-Click LCA State
  let twoClickStep = 0; // 0: inactive, 1: waiting for second click
  let twoClickFirstElement = null;

  const SCRAPER_CLASSES = [
    'scraper-hover', 
    'scraper-selected', 
    'scraper-similar', 
    'scraper-container', 
    'scraper-two-click-first',
    'scraper-debug-failed'
  ];

  function stripScraperClasses(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/\\b(scraper-hover|scraper-selected|scraper-similar|scraper-container|scraper-two-click-first|scraper-debug-failed)\\b/g, '')
      .replace(/\\s{2,}/g, ' ')
      .trim();
  }

  function getCleanOuterHTML(el) {
    if (!el || !el.cloneNode) return '';
    try {
      const clone = el.cloneNode(true);
      const all = [clone, ...clone.querySelectorAll('*')];
      all.forEach(node => {
        if (node.classList) {
          SCRAPER_CLASSES.forEach(cls => node.classList.remove(cls));
          if (!node.className || node.className.trim() === '') {
            node.removeAttribute('class');
          }
        }
        if (node.classList && node.classList.contains('scraper-badge')) {
          node.remove();
        }
      });
      return clone.outerHTML;
    } catch(err) {
      return el.outerHTML || '';
    }
  }

  /**
   * Sanitizes classes by stripping styled-components hashes (e.g. -sc-xxx-0),
   * CSS module hashes (_17x8a), and volatile utility classes.
   */
  function sanitizeClassName(className) {
    if (!className || typeof className !== 'string') return '';
    // Strip styled-component hashes like ProductCard__Container-sc-123456 -> ProductCard__Container
    let cleaned = className.replace(/-sc-[a-zA-Z0-9]+(-\d+)?/g, '');
    // Strip random tail hashes like _1a2b3c
    cleaned = cleaned.replace(/_[a-zA-Z0-9]{5,}/g, '');
    return cleaned;
  }

  function getCleanClassList(el) {
    if (!el || !el.className || typeof el.className !== 'string') return [];
    return el.className
      .split(/\\s+/)
      .map(c => c.trim())
      .filter(c => c && !SCRAPER_CLASSES.includes(c) && !c.startsWith('scraper-'))
      // Filter out volatile numeric or active/focus state classes
      .filter(c => !/^(active|focus|hover|selected|open|closed|show|hide|undefined|null)$/i.test(c));
  }

  function getElementAttributes(el) {
    const attrs = {};
    if (!el || !el.attributes) return attrs;
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      if (attr.name === 'class') {
        const cleanClass = stripScraperClasses(attr.value);
        if (cleanClass) attrs['class'] = cleanClass;
      } else if (!attr.name.startsWith('data-scraper')) {
        attrs[attr.name] = attr.value;
      }
    }
    return attrs;
  }

  function buildBreadcrumbs(el) {
    const list = [];
    let curr = el;
    let idx = 0;
    while (curr && curr.nodeType === 1 && curr.tagName !== 'HTML') {
      const tag = curr.tagName.toLowerCase();
      const id = curr.id ? '#' + curr.id : '';
      const classes = getCleanClassList(curr);
      const classStr = classes.length ? '.' + classes.slice(0, 2).join('.') : '';
      const summary = tag + (id || classStr);
      
      list.unshift({
        index: idx++,
        tagName: curr.tagName.toUpperCase(),
        id: curr.id || undefined,
        classNames: classes.join(' ') || undefined,
        selector: generateElementSelector(curr),
        elementSummary: summary
      });
      curr = curr.parentElement;
    }
    return list.map((item, i) => ({ ...item, index: i }));
  }

  /**
   * Generates resilient selector, robust against dynamic hashes (Lenskart / Next.js)
   */
  function generateElementSelector(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el.tagName === 'BODY') return 'body';

    // 1. Stable, non-generated ID check
    if (el.id && !/\\d{4,}|[a-f0-9-]{10,}|^(item|card|product)[-_]\\d+$/i.test(el.id)) {
      try {
        if (document.querySelectorAll('#' + CSS.escape(el.id)).length === 1) {
          return '#' + CSS.escape(el.id);
        }
      } catch(e) {}
    }

    const tag = el.tagName.toLowerCase();
    const cleanClasses = getCleanClassList(el);

    // 2. Check for semantic or data-testid attribute (often present in modern React sites)
    for (const attrName of ['data-testid', 'data-qa', 'data-cy', 'aria-label']) {
      const val = el.getAttribute(attrName);
      if (val && !/\\d{5,}/.test(val)) {
        const sel = tag + '[' + attrName + '="' + CSS.escape(val) + '"]';
        try {
          if (document.querySelectorAll(sel).length > 0) return sel;
        } catch(e) {}
      }
    }

    // 3. Substring matching for product/card classes on dynamic e-commerce sites
    for (const cls of cleanClasses) {
      if (/product|card|item|grid|tile|listing|box/i.test(cls)) {
        const baseCls = sanitizeClassName(cls);
        if (baseCls && baseCls.length > 3) {
          const candidate = tag + '[class*="' + baseCls + '"]';
          try {
            const matches = document.querySelectorAll(candidate);
            if (matches.length > 0 && matches.length < 100) return candidate;
          } catch(e) {}
        }
      }
    }

    // 4. Look for distinctive tag + class
    if (cleanClasses.length > 0) {
      const primary = sanitizeClassName(cleanClasses[0]);
      if (primary && primary.length > 1) {
        const candidate = tag + '.' + CSS.escape(primary);
        try {
          const matches = document.querySelectorAll(candidate);
          if (matches.length > 0 && matches.length < 80) return candidate;
        } catch(e) {}
      }
    }

    // 5. Parent + Child hierarchy
    const parent = el.parentElement;
    if (parent && parent.tagName !== 'HTML' && parent.tagName !== 'BODY') {
      const parentTag = parent.tagName.toLowerCase();
      const parentClasses = getCleanClassList(parent);
      const parentSel = parentClasses.length ? parentTag + '.' + CSS.escape(sanitizeClassName(parentClasses[0])) : parentTag;
      const childSel = cleanClasses.length ? tag + '.' + CSS.escape(sanitizeClassName(cleanClasses[0])) : tag;
      const combined = parentSel + ' > ' + childSel;
      try {
        if (document.querySelectorAll(combined).length > 0) return combined;
      } catch(e) {}
    }

    return tag;
  }

  // ==========================================
  // 2-CLICK LOWEST COMMON ANCESTOR (LCA) LOGIC
  // ==========================================

  /**
   * Finds the Lowest Common Ancestor (LCA) between two DOM elements.
   */
  function findLCA(nodeA, nodeB) {
    if (!nodeA || !nodeB) return document.body;
    const ancestorsA = [];
    let curr = nodeA;
    while (curr && curr.tagName !== 'HTML') {
      ancestorsA.push(curr);
      curr = curr.parentElement;
    }

    curr = nodeB;
    while (curr && curr.tagName !== 'HTML') {
      if (ancestorsA.includes(curr)) {
        return curr; // Lowest Common Ancestor
      }
      curr = curr.parentElement;
    }
    return document.body;
  }

  /**
   * Given LCA and two selected nodes (e.g. Card 1 and Card 2),
   * finds the repeating sibling containers and generalizes the selector.
   */
  function resolveTwoClickContainer(nodeA, nodeB) {
    const lca = findLCA(nodeA, nodeB);
    if (!lca || lca === document.body) {
      return null;
    }

    // Trace down from LCA to find the two direct children (or repeating branches) under LCA
    function getBranchChild(lcaNode, target) {
      let curr = target;
      while (curr && curr.parentElement && curr.parentElement !== lcaNode) {
        curr = curr.parentElement;
      }
      return curr;
    }

    const branchA = getBranchChild(lca, nodeA);
    const branchB = getBranchChild(lca, nodeB);

    if (!branchA || !branchB || branchA === branchB) {
      return null;
    }

    // Now branchA and branchB are sibling product cards under LCA!
    const tagA = branchA.tagName.toLowerCase();
    const tagB = branchB.tagName.toLowerCase();
    const sharedTag = (tagA === tagB) ? tagA : '*';

    const classesA = getCleanClassList(branchA).map(sanitizeClassName);
    const classesB = getCleanClassList(branchB).map(sanitizeClassName);
    const sharedClasses = classesA.filter(c => classesB.includes(c) && c.length > 2);

    let containerSelector = '';
    const lcaSelector = generateElementSelector(lca);

    // Strategy 1: Shared semantic classes
    if (sharedClasses.length > 0) {
      containerSelector = sharedTag + '.' + sharedClasses.map(c => CSS.escape(c)).join('.');
      try {
        if (document.querySelectorAll(containerSelector).length >= 2) {
          // Verify
        } else {
          containerSelector = '';
        }
      } catch(e) { containerSelector = ''; }
    }

    // Strategy 2: Fuzzy class substring match (crucial for Lenskart / CSS modules / Styled-Components)
    if (!containerSelector) {
      for (const cls of [...classesA, ...classesB]) {
        if (/product|card|item|tile|col|grid/i.test(cls)) {
          const sub = cls.split(/[_-]/)[0];
          if (sub && sub.length >= 4) {
            const candidate = sharedTag + '[class*="' + sub + '"]';
            try {
              const matches = document.querySelectorAll(candidate);
              if (matches.length >= 2) {
                containerSelector = candidate;
                break;
              }
            } catch(e) {}
          }
        }
      }
    }

    // Strategy 3: Structural child selector under LCA
    if (!containerSelector) {
      containerSelector = lcaSelector + ' > ' + sharedTag;
      try {
        if (document.querySelectorAll(containerSelector).length < 2) {
          containerSelector = lcaSelector + ' ' + sharedTag;
        }
      } catch(e) {}
    }

    // Also determine relative selector from card to clicked element
    let relativeFieldSelector = ':scope';
    if (branchA !== nodeA) {
      relativeFieldSelector = generateRelativeSelector(branchA, nodeA);
    }

    // Test match count
    let matchCount = 0;
    try {
      matchCount = document.querySelectorAll(containerSelector).length;
    } catch(e) {}

    return {
      containerSelector,
      relativeFieldSelector,
      matchCount,
      lcaTag: lca.tagName.toLowerCase(),
      branchTag: sharedTag
    };
  }

  function highlightSimilar(selector) {
    clearHighlights(['scraper-similar']);
    if (!selector) return 0;
    try {
      const matches = document.querySelectorAll(selector);
      let count = 0;
      matches.forEach(m => {
        if (m !== currentSelectedElement) {
          m.classList.add('scraper-similar');
          count++;
        }
      });
      return matches.length;
    } catch(err) {
      return 0;
    }
  }

  function clearHighlights(classes = SCRAPER_CLASSES) {
    classes.forEach(cls => {
      document.querySelectorAll('.' + cls).forEach(el => el.classList.remove(cls));
    });
  }

  function selectElement(el, skipSimilar = false) {
    if (!el || el.nodeType !== 1) return;
    clearHighlights(['scraper-hover', 'scraper-selected']);

    currentSelectedElement = el;
    el.classList.add('scraper-selected');

    const cleanOuter = getCleanOuterHTML(el);
    const selector = generateElementSelector(el);
    const ancestry = buildBreadcrumbs(el);
    activeAncestryList = [];
    
    let node = el;
    while (node && node.nodeType === 1 && node.tagName !== 'HTML') {
      activeAncestryList.unshift(node);
      node = node.parentElement;
    }

    let similarCount = 1;
    if (!skipSimilar) {
      similarCount = highlightSimilar(selector);
    }

    // Automatic single-click container suggestion
    let containerSuggestion = '';
    let curr = el;
    while (curr && curr.parentElement && curr.parentElement.tagName !== 'BODY') {
      const p = curr.parentElement;
      const sibs = Array.from(p.children).filter(c => c.tagName === curr.tagName);
      if (sibs.length >= 2) {
        const pSel = generateElementSelector(p);
        const cTag = curr.tagName.toLowerCase();
        
        // Priority 1: Semantic attributes (e.g. data-product-position on Lenskart)
        if (curr.hasAttribute('data-product-position')) {
          containerSuggestion = cTag + '[data-product-position]';
          break;
        } else if (curr.hasAttribute('data-product-id')) {
          containerSuggestion = cTag + '[data-product-id]';
          break;
        }

        // Priority 2: Semantic HTML5 container tag
        if (cTag === 'article') {
          containerSuggestion = 'article';
          break;
        }

        // Priority 3: Clean, non-hashed classes
        const cClasses = getCleanClassList(curr).map(sanitizeClassName).filter(c => !/^sc-[\w-]+/i.test(c));
        if (cClasses.length > 0) {
          const candidate = cTag + '.' + CSS.escape(cClasses[0]);
          try {
            if (document.querySelectorAll(candidate).length >= 2) {
              containerSuggestion = candidate;
              break;
            }
          } catch(e) {}
        }

        // Fallback: Structural parent > child
        containerSuggestion = pSel + ' > ' + cTag;
        break;
      }
      curr = curr.parentElement;
    }

    let containerRelativeSelector = selector;
    if (currentContainerSelector) {
      try {
        const container = el.closest(currentContainerSelector);
        if (container) {
          containerRelativeSelector = generateRelativeSelector(container, el);
        }
      } catch(e) {}
    }

    const data = {
      selector,
      containerRelativeSelector,
      tagName: el.tagName.toUpperCase(),
      id: el.id || undefined,
      classNames: getCleanClassList(el).join(' ') || undefined,
      innerText: (el.innerText || el.textContent || '').trim(),
      outerHTML: cleanOuter,
      attributes: getElementAttributes(el),
      ancestry,
      similarCount,
      containerSuggestion,
      surroundingHtml: (el.parentElement && el.parentElement.parentElement ? getCleanOuterHTML(el.parentElement.parentElement) : getCleanOuterHTML(el.parentElement || el)).slice(0, 4000)
    };

    window.parent.postMessage({
      type: 'ELEMENT_SELECTED',
      data
    }, '*');
  }

  function generateRelativeSelector(container, target) {
    if (container === target) return ':scope';
    const tag = target.tagName.toLowerCase();
    const cleanClasses = getCleanClassList(target).map(sanitizeClassName);
    let sel = cleanClasses.length ? tag + '.' + CSS.escape(cleanClasses[0]) : tag;
    try {
      if (container.querySelectorAll(sel).length === 1) {
        return sel;
      }
    } catch(e) {}
    let path = [];
    let curr = target;
    while (curr && curr !== container) {
      const ctag = curr.tagName.toLowerCase();
      const cclasses = getCleanClassList(curr).map(sanitizeClassName);
      path.unshift(cclasses.length ? ctag + '.' + CSS.escape(cclasses[0]) : ctag);
      curr = curr.parentElement;
    }
    return path.join(' > ');
  }

  // ==========================================
  // EVENT LISTENERS & 2-CLICK MODE HANDLING
  // ==========================================

  document.addEventListener('mouseover', function(e) {
    if (currentMode !== 'select' && currentMode !== 'two_click') return;
    const target = e.target;
    if (!target || target.nodeType !== 1) return;
    if (target === currentSelectedElement || target === twoClickFirstElement) return;

    if (currentHoveredElement && currentHoveredElement !== target) {
      currentHoveredElement.classList.remove('scraper-hover');
    }

    currentHoveredElement = target;
    target.classList.add('scraper-hover');

    window.parent.postMessage({
      type: 'ELEMENT_HOVERED',
      data: {
        tagName: target.tagName.toUpperCase(),
        selector: generateElementSelector(target),
        textSnippet: (target.innerText || '').slice(0, 40)
      }
    }, '*');
  }, true);

  document.addEventListener('mouseout', function(e) {
    if (currentHoveredElement) {
      currentHoveredElement.classList.remove('scraper-hover');
      currentHoveredElement = null;
    }
  }, true);

  document.addEventListener('click', function(e) {
    if (currentMode === 'two_click') {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target;
      if (!target || target.nodeType !== 1) return false;

      if (twoClickStep === 0) {
        // Step 1: Clicked Card / Element #1
        twoClickFirstElement = target;
        twoClickStep = 1;
        target.classList.add('scraper-two-click-first');

        window.parent.postMessage({
          type: 'TWO_CLICK_STEP_UPDATE',
          step: 1,
          message: 'First item selected! Now click the same element on Product Card #2.'
        }, '*');
      } else if (twoClickStep === 1) {
        // Step 2: Clicked Card / Element #2
        const secondElement = target;
        secondElement.classList.add('scraper-two-click-first');

        const result = resolveTwoClickContainer(twoClickFirstElement, secondElement);
        twoClickStep = 0;
        clearHighlights(['scraper-two-click-first']);

        if (result && result.containerSelector) {
          currentContainerSelector = result.containerSelector;
          // Highlight all matched containers across the page
          try {
            document.querySelectorAll(result.containerSelector).forEach(c => c.classList.add('scraper-container'));
          } catch(err) {}

          window.parent.postMessage({
            type: 'TWO_CLICK_CONTAINER_FOUND',
            data: result
          }, '*');
        } else {
          window.parent.postMessage({
            type: 'TWO_CLICK_FAILED',
            message: 'Could not detect a repeating ancestor between the two clicked elements. Please try clicking two sibling cards.'
          }, '*');
        }
        currentMode = 'select';
      }
      return false;
    }

    if (currentMode === 'select') {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target;
      if (target && target.nodeType === 1) {
        selectElement(target);
      }
      return false;
    } else {
      const link = e.target.closest('a');
      if (link && link.href) {
        window.parent.postMessage({
          type: 'PAGE_NAVIGATED',
          data: { url: link.href }
        }, '*');
      }
    }
  }, true);

  // Dynamic MutationObserver to maintain container and similar highlights when products hydrate
  let observerTimeout = null;
  const domObserver = new MutationObserver(function() {
    if (observerTimeout) clearTimeout(observerTimeout);
    observerTimeout = setTimeout(() => {
      if (currentContainerSelector) {
        try {
          document.querySelectorAll(currentContainerSelector).forEach(c => {
            if (!c.classList.contains('scraper-container')) {
              c.classList.add('scraper-container');
            }
          });
        } catch(e) {}
      }
    }, 300);
  });

  if (document.body) {
    domObserver.observe(document.body, { childList: true, subtree: true });
  }

  // Parent Message Handler
  window.addEventListener('message', function(event) {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

    switch (msg.type) {
      case 'SET_MODE': {
        currentMode = msg.mode;
        if (currentMode !== 'two_click') {
          twoClickStep = 0;
          twoClickFirstElement = null;
          clearHighlights(['scraper-two-click-first']);
        }
        if (currentMode === 'navigate') {
          clearHighlights(['scraper-hover', 'scraper-similar']);
        }
        break;
      }

      case 'START_TWO_CLICK_CONTAINER': {
        currentMode = 'two_click';
        twoClickStep = 0;
        twoClickFirstElement = null;
        clearHighlights(['scraper-two-click-first']);
        window.parent.postMessage({
          type: 'TWO_CLICK_STEP_UPDATE',
          step: 0,
          message: 'Click any element inside Product Card #1'
        }, '*');
        break;
      }

      case 'TRAVERSE_DOM': {
        if (!currentSelectedElement) break;
        if (msg.direction === 'up') {
          const parent = currentSelectedElement.parentElement;
          if (parent && parent.tagName !== 'HTML') {
            selectElement(parent);
          }
        } else if (msg.direction === 'down') {
          const firstChild = currentSelectedElement.firstElementChild;
          if (firstChild) {
            selectElement(firstChild);
          }
        } else if (msg.direction === 'to_index' && typeof msg.index === 'number') {
          if (activeAncestryList[msg.index]) {
            selectElement(activeAncestryList[msg.index]);
          }
        }
        break;
      }

      case 'TEST_CUSTOM_SELECTOR': {
        const selector = msg.selector;
        clearHighlights(['scraper-similar']);
        if (!selector || !selector.trim()) {
          window.parent.postMessage({
            type: 'SELECTOR_MATCH_RESULT',
            data: { selector, matchCount: 0, valid: true, error: null }
          }, '*');
          return;
        }

        try {
          const matches = document.querySelectorAll(selector.trim());
          const matchCount = matches.length;
          matches.forEach(el => {
            if (el !== currentSelectedElement) {
              el.classList.add('scraper-similar');
            }
          });
          const samples = Array.from(matches).slice(0, 5).map(m => (m.innerText || m.textContent || '').trim().slice(0, 60));
          window.parent.postMessage({
            type: 'SELECTOR_MATCH_RESULT',
            data: { selector, matchCount, valid: true, error: null, samples }
          }, '*');
        } catch (err) {
          window.parent.postMessage({
            type: 'SELECTOR_MATCH_RESULT',
            data: { selector, matchCount: 0, valid: false, error: err.message }
          }, '*');
        }
        break;
      }

      case 'HIGHLIGHT_CONTAINER': {
        clearHighlights(['scraper-container']);
        currentContainerSelector = msg.containerSelector || '';
        if (currentContainerSelector) {
          try {
            const containers = document.querySelectorAll(currentContainerSelector);
            containers.forEach(c => c.classList.add('scraper-container'));
          } catch(e) {}
        }
        break;
      }

      case 'DEBUG_CONTAINER': {
        const report = debugContainerSelector(msg.containerSelector || currentContainerSelector);
        window.parent.postMessage({
          type: 'CONTAINER_DEBUG_REPORT',
          data: report
        }, '*');
        break;
      }

      case 'HIGHLIGHT_FAILED_NODE': {
        clearHighlights(['scraper-debug-failed']);
        const targetNode = debugFailedElementsList[msg.index];
        if (targetNode) {
          targetNode.classList.add('scraper-debug-failed');
          try {
            targetNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } catch(e) {}
        }
        break;
      }

      case 'CLEAR_DEBUG_HIGHLIGHTS': {
        clearHighlights(['scraper-debug-failed']);
        break;
      }

      case 'CLEAR_SELECTION': {
        clearHighlights();
        currentSelectedElement = null;
        twoClickStep = 0;
        twoClickFirstElement = null;
        break;
      }
    }
  });

  // ==========================================
  // CONTAINER SELECTOR VISUAL DEBUGGING ENGINE
  // ==========================================

  function debugContainerSelector(selector) {
    if (!selector || !selector.trim()) {
      return {
        containerSelector: '',
        matchedCount: 0,
        ignoredCount: 0,
        totalSiblings: 0,
        failedNodes: []
      };
    }

    try {
      const matched = Array.from(document.querySelectorAll(selector.trim()));
      debugFailedElementsList = [];

      if (matched.length === 0) {
        return {
          containerSelector: selector,
          matchedCount: 0,
          ignoredCount: 0,
          totalSiblings: 0,
          failedNodes: []
        };
      }

      const parent = matched[0].parentElement;
      if (!parent) {
        return {
          containerSelector: selector,
          matchedCount: matched.length,
          ignoredCount: 0,
          totalSiblings: matched.length,
          failedNodes: []
        };
      }

      const allSiblings = Array.from(parent.children).filter(function(el) { return el.nodeType === 1; });
      const failedNodes = [];

      allSiblings.forEach(function(sibling) {
        let isMatch = false;
        try {
          isMatch = sibling.matches(selector.trim());
        } catch(e) { isMatch = false; }

        if (!isMatch) {
          debugFailedElementsList.push(sibling);
          const childTag = sibling.tagName.toLowerCase();
          const cleanClasses = getCleanClassList(sibling);
          const attrs = getElementAttributes(sibling);

          let reason = 'Ignored by current container selector';
          let suggestedFix = '';

          if (selector.indexOf('article') !== -1 && childTag !== 'article') {
            reason = 'Tag mismatch: Sibling is <' + childTag + '> instead of <article>';
            suggestedFix = childTag;
          } else if (selector.indexOf('[data-product-position]') !== -1 && !sibling.hasAttribute('data-product-position')) {
            reason = 'Missing required attribute: [data-product-position]';
            suggestedFix = childTag;
          } else if (cleanClasses.length > 0 && selector.indexOf('.') !== -1) {
            const requiredClasses = selector.match(/\\.([a-zA-Z0-9_-]+)/g) || [];
            const missing = requiredClasses.filter(function(c) { return cleanClasses.indexOf(c.slice(1)) === -1; });
            if (missing.length > 0) {
              reason = 'Missing required class(es): ' + missing.join(', ');
              suggestedFix = childTag;
            }
          }

          failedNodes.push({
            index: debugFailedElementsList.length - 1,
            tagName: sibling.tagName.toUpperCase(),
            classNames: cleanClasses.join(' '),
            attributes: attrs,
            innerTextSnippet: (sibling.innerText || sibling.textContent || '').trim().slice(0, 50),
            diagnosticReason: reason,
            suggestedFix: suggestedFix || childTag,
            outerHTMLSnippet: getCleanOuterHTML(sibling).slice(0, 160)
          });
        }
      });

      return {
        containerSelector: selector,
        matchedCount: matched.length,
        ignoredCount: failedNodes.length,
        totalSiblings: allSiblings.length,
        parentSelector: generateElementSelector(parent),
        failedNodes: failedNodes.slice(0, 25)
      };
    } catch (err) {
      return {
        containerSelector: selector,
        matchedCount: 0,
        ignoredCount: 0,
        totalSiblings: 0,
        failedNodes: []
      };
    }
  }

  window.parent.postMessage({
    type: 'SCRAPER_SCRIPT_READY',
    data: { url: window.location.href, title: document.title }
  }, '*');
})();
`;
