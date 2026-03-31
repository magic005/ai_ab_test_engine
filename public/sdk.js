(function() {
  const SCRIPT_URL = new URL(document.currentScript.src);
  const BASE_URL = SCRIPT_URL.origin;
  const PROJECT_ID = document.currentScript.getAttribute('data-project-id');

  if (!PROJECT_ID) {
    console.error('[AB Testing SDK] Missing data-project-id attribute on script tag.');
    return;
  }

  // Determine User ID
  let userId = localStorage.getItem('ab_test_userId');
  if (!userId) {
    userId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    localStorage.setItem('ab_test_userId', userId);
  }

  // Admin Overlay Injection
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('ab_admin') === 'true') {
    const adminScript = document.createElement('script');
    adminScript.src = `${BASE_URL}/overlay.js`;
    adminScript.setAttribute('data-target-url', BASE_URL);
    adminScript.setAttribute('data-project-id', PROJECT_ID);
    document.head.appendChild(adminScript);
    return; // Don't run tests in admin mode to avoid conflicts
  }

  // Utility to determine if a variant wins (deterministic hash)
  function hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
  }

  async function trackEvent(variantId, type) {
    try {
      await fetch(`${BASE_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, type, userId })
      });
    } catch(e) {
      console.error('[AB Testing SDK] Failed to track event', e);
    }
  }

  async function init() {
    try {
      const res = await fetch(`${BASE_URL}/api/tests?projectId=${PROJECT_ID}`);
      const data = await res.json();
      const tests = data.tests || [];

      window.abTestVariants = window.abTestVariants || {};

      tests.forEach(test => {
        // Hash to 0-99
        const score = hash(`${userId}-${test.id}`) % 100;
        
        // Find which variant to assign
        let cumulative = 0;
        let chosenVariant = null;

        for (const variant of test.variants) {
          cumulative += variant.traffic;
          if (score < cumulative) {
            chosenVariant = variant;
            break;
          }
        }

        if (!chosenVariant) chosenVariant = test.variants[0]; // fallback Control
        window.abTestVariants[test.id] = chosenVariant.id;

        // Apply mutation if it's not the control and content exists
        if (chosenVariant.name.toLowerCase() !== 'control' && chosenVariant.content) {
            const el = document.querySelector(test.fingerprint);
            if (el) {
                // save original just in case
                el.setAttribute('data-ab-original', el.innerText);
                el.innerText = chosenVariant.content;
            }
        }

        // Track view
        trackEvent(chosenVariant.id, 'view');

        // Setup conversion tracking
        if (test.goal === 'click' && test.goalTarget) {
            document.addEventListener('click', (e) => {
                if (e.target.matches(test.goalTarget) || e.target.closest(test.goalTarget)) {
                    trackEvent(chosenVariant.id, 'conversion');
                }
            });
        }
      });
    } catch (e) {
      console.error('[AB Testing SDK] Initialization failed', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
