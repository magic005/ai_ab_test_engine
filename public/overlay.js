(function() {
  const BASE_URL = document.currentScript.getAttribute('data-target-url');
  const PROJECT_ID = document.currentScript.getAttribute('data-project-id');

  // Inject styles for overlay
  const style = document.createElement('style');
  style.innerHTML = `
    #ab-overlay-root {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 380px;
      height: 550px;
      background: #111827;
      color: white;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
      z-index: 999999;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #374151;
    }
    #ab-overlay-header {
      padding: 16px;
      background: #1f2937;
      border-bottom: 1px solid #374151;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #ab-overlay-body {
      padding: 16px;
      flex-grow: 1;
      overflow-y: auto;
      font-size: 14px;
    }
    .ab-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      width: 100%;
      margin-top: 10px;
    }
    .ab-btn:hover { background: #2563eb; }
    .ab-btn:disabled { background: #4b5563; cursor: not-allowed; opacity: 0.7;}
    .ab-input {
      width: 100%;
      background: #1f2937;
      border: 1px solid #374151;
      color: white;
      padding: 8px;
      border-radius: 6px;
      margin-top: 4px;
      margin-bottom: 12px;
      box-sizing: border-box;
    }
    .ab-label {
      font-size: 12px;
      color: #9ca3af;
      font-weight: 600;
      text-transform: uppercase;
    }
    .ab-variant-card {
      background: #1f2937;
      border: 1px solid #374151;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .ab-variant-card:hover { border-color: #3b82f6; }
    .ab-variant-card.selected { border-color: #3b82f6; background: #1e3a8a; }

    /* Page highlights */
    .ab-hover-highlight {
      outline: 2px dashed #ef4444 !important;
      outline-offset: 4px !important;
      cursor: crosshair !important;
      transition: outline 0.1s;
    }
    .ab-selected-highlight {
      outline: 3px solid #3b82f6 !important;
      background-color: rgba(59, 130, 246, 0.1) !important;
    }
  `;
  document.head.appendChild(style);

  // Root container
  const root = document.createElement('div');
  root.id = 'ab-overlay-root';
  root.innerHTML = `
    <div id="ab-overlay-header">
      <span>✨ AI A/B Test Builder</span>
      <button onclick="window.location.href = window.location.pathname" style="background:transparent; border:none; color:#9ca3af; cursor:pointer;">✕</button>
    </div>
    <div id="ab-overlay-body">
      <div id="ab-step-1">
        <p style="color:#d1d5db; margin-bottom:16px;">Hover and click any element on your page to start building a variant.</p>
        <button class="ab-btn" id="ab-btn-select">Select Element</button>
      </div>
      
      <div id="ab-step-2" style="display:none;">
        <p style="color:#10b981; font-weight:600; margin-bottom:12px;">✓ Element Selected</p>
        
        <label class="ab-label">Test Name</label>
        <input type="text" id="ab-test-name" class="ab-input" placeholder="e.g., Homepage Headline Test" />
        
        <label class="ab-label">Original Text</label>
        <div id="ab-original-text" style="background:#1f2937; padding:8px; border-radius:6px; font-size:13px; color:#d1d5db; margin:4px 0 16px 0;"></div>

        <button class="ab-btn" id="ab-btn-magic" style="background: linear-gradient(to right, #8b5cf6, #3b82f6);">✨ AI Generate Variants</button>
      </div>

      <div id="ab-step-3" style="display:none;">
        <p style="color:#d1d5db; margin-bottom:12px;">Select a variant to test against the control.</p>
        <div id="ab-suggestions"></div>
        
        <div style="margin-top: 20px;">
          <label class="ab-label">Conversion Goal</label>
          <select id="ab-goal-type" class="ab-input">
            <option value="click">Track Clicks on this Element</option>
            <option value="pageview">Track Pageviews (Default)</option>
          </select>
        </div>
        
        <button class="ab-btn" id="ab-btn-launch" style="background:#10b981; margin-top:20px; font-size:16px;">🚀 Launch Test (50/50 Split)</button>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  // State
  let selectionMode = false;
  let selectedElement = null;
  let selectedSelector = '';
  let generatedVariants = [];
  let chosenVariant = null;

  // DOM Elements
  const btnSelect = document.getElementById('ab-btn-select');
  const step1 = document.getElementById('ab-step-1');
  const step2 = document.getElementById('ab-step-2');
  const step3 = document.getElementById('ab-step-3');
  const originalTextDiv = document.getElementById('ab-original-text');
  const btnMagic = document.getElementById('ab-btn-magic');
  const suggestionsDiv = document.getElementById('ab-suggestions');
  const btnLaunch = document.getElementById('ab-btn-launch');

  // Utility to generate unique selector
  function getUniqueSelector(el) {
    if (el.id) return '#' + el.id;
    if (el.tagName === 'BODY') return 'body';
    
    let path = [];
    while (el.nodeType === Node.ELEMENT_NODE) {
      let selector = el.nodeName.toLowerCase();
      if (el.id) {
        selector += '#' + el.id;
        path.unshift(selector);
        break;
      }
      
      if (el.className) {
           let classes = Array.from(el.classList).filter(c => !c.startsWith('ab-')).join('.');
           if(classes) selector += '.' + classes;
      }
      path.unshift(selector);
      el = el.parentNode;
    }
    return path.join(' > ');
  }

  // Event Listeners
  btnSelect.addEventListener('click', () => {
    selectionMode = true;
    btnSelect.textContent = "Hovering over elements...";
    btnSelect.style.background = "#4b5563";
  });

  document.addEventListener('mouseover', (e) => {
    if (!selectionMode || root.contains(e.target)) return;
    e.target.classList.add('ab-hover-highlight');
  });

  document.addEventListener('mouseout', (e) => {
    if (!selectionMode) return;
    e.target.classList.remove('ab-hover-highlight');
  });

  document.addEventListener('click', (e) => {
    if (!selectionMode || root.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();

    selectionMode = false;
    e.target.classList.remove('ab-hover-highlight');
    
    if (selectedElement) {
      selectedElement.classList.remove('ab-selected-highlight');
    }

    selectedElement = e.target;
    selectedSelector = getUniqueSelector(selectedElement);
    selectedElement.classList.add('ab-selected-highlight');

    step1.style.display = 'none';
    step2.style.display = 'block';
    
    originalTextDiv.textContent = selectedElement.innerText.trim();
  }, true);

  btnMagic.addEventListener('click', async () => {
    const textContext = selectedElement.innerText.trim();
    if (!textContext) return alert("Select an element that has text.");

    btnMagic.disabled = true;
    btnMagic.textContent = "Generating... ✨";

    try {
      const res = await fetch(`${BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          context: document.title,
          elementText: textContext
        })
      });
      const data = await res.json();
      generatedVariants = data.variants || [];

      renderSuggestions();
      step2.style.display = 'none';
      step3.style.display = 'block';
    } catch (err) {
      console.error(err);
      alert("Failed to generate variants.");
    } finally {
      btnMagic.disabled = false;
      btnMagic.textContent = "✨ AI Generate Variants";
    }
  });

  function renderSuggestions() {
    suggestionsDiv.innerHTML = '';
    generatedVariants.forEach((v, idx) => {
      const div = document.createElement('div');
      div.className = 'ab-variant-card';
      div.innerHTML = `
        <div style="font-weight:600; color:white; margin-bottom:4px;">${v.text}</div>
        <div style="font-size:12px; color:#9ca3af;">${v.rationale}</div>
      `;
      div.addEventListener('click', () => {
        document.querySelectorAll('.ab-variant-card').forEach(n => n.classList.remove('selected'));
        div.classList.add('selected');
        chosenVariant = v.text;
        selectedElement.innerText = chosenVariant; // live preview
      });
      suggestionsDiv.appendChild(div);
    });
  }

  btnLaunch.addEventListener('click', async () => {
    if (!chosenVariant) return alert("Select a variant first.");

    const testName = document.getElementById('ab-test-name').value || 'AI Generated Test';
    const goal = document.getElementById('ab-goal-type').value;
    
    btnLaunch.disabled = true;
    btnLaunch.textContent = "Launching... 🚀";

    try {
      const res = await fetch(`${BASE_URL}/api/admin/tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: PROJECT_ID,
          name: testName,
          fingerprint: selectedSelector,
          goal: goal,
          goalTarget: goal === 'click' ? selectedSelector : '',
          controlText: originalTextDiv.textContent,
          variantText: chosenVariant
        })
      });

      if (!res.ok) throw new Error("Failed");
      
      alert("Test Launched! Returning to normal site.");
      window.location.href = window.location.pathname; // remove admin param
    } catch(err) {
      console.error(err);
      alert("Error saving test. See console.");
      btnLaunch.disabled = false;
      btnLaunch.textContent = "🚀 Launch Test (50/50 Split)";
    }
  });
})();
