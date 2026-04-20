(function() {
  const SCRIPT_URL = new URL(document.currentScript.src);
  const BASE_URL = SCRIPT_URL.origin;
  const PROJECT_ID = document.currentScript.getAttribute('data-project-id');
  const MERMAID_PREFIX = 'MERMAID:';
  const GAME_PREFIX = 'GAME:';
  const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';

  if (!PROJECT_ID) {
    console.warn('[AB] Missing data-project-id on script tag.');
    return;
  }

  // Sticky user ID
  let userId = localStorage.getItem('ab_uid');
  if (!userId) {
    userId = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
    localStorage.setItem('ab_uid', userId);
  }

  // Admin overlay injection
  if (new URLSearchParams(window.location.search).get('ab_admin') === 'true') {
    const s = document.createElement('script');
    s.src = `${BASE_URL}/overlay.js`;
    s.setAttribute('data-target-url', BASE_URL);
    s.setAttribute('data-project-id', PROJECT_ID);
    document.head.appendChild(s);
    return;
  }

  // Deterministic hash 0-99
  function bucket(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    }
    return Math.abs(h) % 100;
  }

  // Find element by selector, falling back to text-content match
  function findElement(selector, controlText) {
    try {
      const el = document.querySelector(selector);
      if (el) return el;
    } catch(e) {}

    if (controlText) {
      const trimmed = controlText.trim();
      const candidates = document.querySelectorAll(
        'h1,h2,h3,h4,h5,h6,p,a,button,span,li,td,th,label,div'
      );
      for (const el of candidates) {
        if (el.childElementCount <= 2 && el.innerText && el.innerText.trim() === trimmed) {
          console.log('[AB] Matched element by text content fallback:', el);
          return el;
        }
      }
    }

    return null;
  }

  // Lazy-load Mermaid.js from CDN, then call back
  let mermaidLoaded = false;
  let mermaidCallbacks = [];
  function withMermaid(fn) {
    if (mermaidLoaded) { fn(); return; }
    mermaidCallbacks.push(fn);
    if (document.getElementById('ab-mermaid-script')) return; // already loading
    const s = document.createElement('script');
    s.id = 'ab-mermaid-script';
    s.src = MERMAID_CDN;
    s.onload = () => {
      window.mermaid.initialize({ startOnLoad: false, theme: 'default' });
      mermaidLoaded = true;
      mermaidCallbacks.forEach(cb => cb());
      mermaidCallbacks = [];
    };
    document.head.appendChild(s);
  }

  // Inject a sandboxed iframe containing the AI-generated HTML quiz game
  function applyGame(el, htmlContent) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'width:100%;margin:12px 0;';

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:100%;border:none;border-radius:10px;display:block;';
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.srcdoc = htmlContent;

    // Auto-resize iframe to fit content once loaded
    iframe.onload = () => {
      try {
        const h = iframe.contentDocument.body.scrollHeight;
        iframe.style.height = (h + 32) + 'px';
      } catch(e) {
        iframe.style.height = '420px';
      }
    };
    iframe.style.height = '420px'; // safe default before load

    wrapper.appendChild(iframe);
    el.parentNode.insertBefore(wrapper, el);
    el.style.display = 'none';
    console.log('[AB] Injected game iframe for element:', el);
  }

  // Replace an element with a rendered Mermaid diagram
  function applyDiagram(el, diagramDef) {
    withMermaid(() => {
      const id = 'ab-diagram-' + Math.random().toString(36).slice(2);
      const wrapper = document.createElement('div');
      wrapper.id = id;
      wrapper.style.cssText = 'width:100%;overflow-x:auto;padding:12px 0;';

      const inner = document.createElement('div');
      inner.className = 'mermaid';
      inner.textContent = diagramDef;
      wrapper.appendChild(inner);

      // Replace the original element in-place, preserving its position in the DOM
      el.parentNode.insertBefore(wrapper, el);
      el.style.display = 'none'; // hide original, keep for control reference

      window.mermaid.run({ nodes: [inner] }).catch(err => {
        console.warn('[AB] Mermaid render error:', err);
        // Fallback: show a code block with the raw definition
        inner.innerHTML = '<pre style="background:#f6f8fa;padding:12px;border-radius:6px;font-size:12px;overflow-x:auto;">' +
          diagramDef.replace(/</g, '&lt;') + '</pre>';
      });
    });
  }

  async function track(variantId, type) {
    try {
      await fetch(`${BASE_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, type, userId })
      });
    } catch(e) {}
  }

  async function applyTests() {
    let tests;
    try {
      const res = await fetch(`${BASE_URL}/api/tests?projectId=${PROJECT_ID}`);
      const data = await res.json();
      tests = data.tests || [];
    } catch(e) {
      console.warn('[AB] Could not fetch tests:', e);
      return;
    }

    for (const test of tests) {
      const score = bucket(`${userId}-${test.id}`);

      let cumulative = 0;
      let chosen = null;
      for (const v of test.variants) {
        cumulative += v.traffic;
        if (score < cumulative) { chosen = v; break; }
      }
      if (!chosen) chosen = test.variants[0];

      console.log(`[AB] Test "${test.name}" | score=${score} | assigned="${chosen.name}" | selector="${test.fingerprint}"`);

      track(chosen.id, 'view');

      const isControl = chosen.name.toLowerCase() === 'control';
      if (!isControl && chosen.content) {
        const controlVariant = test.variants.find(v => v.name.toLowerCase() === 'control');
        const controlText = controlVariant ? controlVariant.content : null;
        const el = findElement(test.fingerprint, controlText);

        if (el) {
          // --- Game variant ---
          if (chosen.content.startsWith(GAME_PREFIX)) {
            const htmlContent = chosen.content.slice(GAME_PREFIX.length);
            console.log(`[AB] Applying game variant to element:`, el);
            applyGame(el, htmlContent);

          // --- Diagram variant ---
          } else if (chosen.content.startsWith(MERMAID_PREFIX)) {
            const diagramDef = chosen.content.slice(MERMAID_PREFIX.length);
            console.log(`[AB] Applying diagram variant to element:`, el);
            applyDiagram(el, diagramDef);

          // --- Text variant ---
          } else {
            console.log(`[AB] Applying text variant "${chosen.name}" to element:`, el);
            if (el.childElementCount === 0) {
              el.innerText = chosen.content;
            } else {
              const originalText = el.innerText.trim();
              const ratio = chosen.content.length / Math.max(originalText.length, 1);
              if (ratio > 0.5 && ratio < 2) {
                const textNodes = [];
                const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
                let node;
                while ((node = walker.nextNode())) textNodes.push(node);
                if (textNodes.length === 1) {
                  textNodes[0].textContent = chosen.content;
                } else {
                  const largest = textNodes.reduce((a, b) => a.textContent.length >= b.textContent.length ? a : b);
                  largest.textContent = chosen.content;
                  textNodes.forEach(n => { if (n !== largest) n.textContent = ''; });
                }
              } else {
                el.innerText = chosen.content;
              }
            }
          }
        } else {
          console.warn(`[AB] Could not find element for test "${test.name}". Selector: "${test.fingerprint}"`);
        }
      }

      // Conversion tracking
      if (test.goal === 'click' && test.goalTarget) {
        document.addEventListener('click', (e) => {
          try {
            if (e.target.matches(test.goalTarget) || e.target.closest(test.goalTarget)) {
              track(chosen.id, 'conversion');
            }
          } catch(err) {}
        });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTests);
  } else {
    applyTests();
  }
})();
