(function() {
  const SCRIPT_URL = new URL(document.currentScript.src);
  const BASE_URL = SCRIPT_URL.origin;
  const PROJECT_ID = document.currentScript.getAttribute('data-project-id');

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
    // 1. Try the stored CSS selector directly
    try {
      const el = document.querySelector(selector);
      if (el) return el;
    } catch(e) {}

    // 2. Fall back: walk all elements and match by trimmed text
    if (controlText) {
      const trimmed = controlText.trim();
      const candidates = document.querySelectorAll(
        'h1,h2,h3,h4,h5,h6,p,a,button,span,li,td,th,label,div'
      );
      for (const el of candidates) {
        // Only check leaf-ish nodes (no deeply nested children to avoid containers)
        if (el.childElementCount <= 2 && el.innerText && el.innerText.trim() === trimmed) {
          console.log('[AB] Matched element by text content fallback:', el);
          return el;
        }
      }
    }

    return null;
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

      // Assign variant deterministically
      let cumulative = 0;
      let chosen = null;
      for (const v of test.variants) {
        cumulative += v.traffic;
        if (score < cumulative) { chosen = v; break; }
      }
      if (!chosen) chosen = test.variants[0];

      console.log(`[AB] Test "${test.name}" | score=${score} | assigned="${chosen.name}" | selector="${test.fingerprint}"`);

      // Track impression
      track(chosen.id, 'view');

      // Apply DOM mutation if NOT the control
      const isControl = chosen.name.toLowerCase() === 'control';
      if (!isControl && chosen.content) {
        const controlVariant = test.variants.find(v => v.name.toLowerCase() === 'control');
        const controlText = controlVariant ? controlVariant.content : null;

        const el = findElement(test.fingerprint, controlText);
        if (el) {
          let parsed = null;
          try { parsed = JSON.parse(chosen.content); } catch(e) {}

          if (parsed && parsed.type === 'position') {
            // Position test — move element to new DOM location
            const newParent = document.querySelector(parsed.parentSelector);
            const newBefore = parsed.beforeSelector ? document.querySelector(parsed.beforeSelector) : null;
            if (newParent) {
              newParent.insertBefore(el, newBefore);
              console.log(`[AB] Moved element to new position under`, parsed.parentSelector);
            } else {
              console.warn(`[AB] Position test: parent not found:`, parsed.parentSelector);
            }
          } else {
            // Text test — replace content, preserving child HTML structure where possible
            console.log(`[AB] Applying variant "${chosen.name}" to element:`, el);
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
