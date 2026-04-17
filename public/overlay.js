(function() {
  const BASE_URL = document.currentScript.getAttribute('data-target-url');
  const PROJECT_ID = document.currentScript.getAttribute('data-project-id');

  // --- Styles ---
  const style = document.createElement('style');
  style.innerHTML = `
    #ab-panel {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 360px;
      background: #111;
      color: #e5e7eb;
      border-radius: 10px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    #ab-panel-header {
      padding: 12px 16px;
      background: #1a1a1a;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    #ab-panel-header .ab-title {
      font-size: 13px;
      font-weight: 600;
      color: #f9fafb;
      letter-spacing: 0.01em;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #ab-panel-header .ab-badge {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      background: #1d4ed8;
      color: #bfdbfe;
      padding: 2px 7px;
      border-radius: 4px;
    }
    #ab-panel-close {
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      padding: 0;
      transition: color 0.15s;
    }
    #ab-panel-close:hover { color: #e5e7eb; }
    #ab-panel-body {
      padding: 16px;
      overflow-y: auto;
      max-height: 520px;
    }
    .ab-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #6b7280;
      margin-bottom: 6px;
      display: block;
    }
    .ab-input, .ab-select {
      width: 100%;
      background: #1a1a1a;
      border: 1px solid rgba(255,255,255,0.1);
      color: #e5e7eb;
      padding: 8px 10px;
      border-radius: 6px;
      margin-bottom: 14px;
      box-sizing: border-box;
      font-size: 13px;
      outline: none;
      transition: border-color 0.15s;
      appearance: none;
    }
    .ab-input:focus, .ab-select:focus { border-color: #3b82f6; }
    .ab-select option { background: #1a1a1a; }
    .ab-btn {
      width: 100%;
      padding: 9px 14px;
      border-radius: 6px;
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, opacity 0.15s;
      letter-spacing: 0.01em;
    }
    .ab-btn-primary {
      background: #2563eb;
      color: #fff;
    }
    .ab-btn-primary:hover { background: #1d4ed8; }
    .ab-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .ab-btn-success {
      background: #059669;
      color: #fff;
      margin-top: 16px;
    }
    .ab-btn-success:hover { background: #047857; }
    .ab-btn-success:disabled { opacity: 0.5; cursor: not-allowed; }
    .ab-btn-ghost {
      background: rgba(255,255,255,0.05);
      color: #9ca3af;
      border: 1px solid rgba(255,255,255,0.08);
      margin-top: 8px;
    }
    .ab-btn-ghost:hover { background: rgba(255,255,255,0.09); color: #e5e7eb; }
    .ab-desc {
      color: #9ca3af;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .ab-original-box {
      background: #1a1a1a;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 6px;
      padding: 9px 11px;
      margin-bottom: 14px;
      color: #d1d5db;
      font-size: 13px;
      line-height: 1.5;
    }
    .ab-status {
      display: flex;
      align-items: center;
      gap: 7px;
      color: #34d399;
      font-weight: 600;
      margin-bottom: 12px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .ab-status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #34d399;
      flex-shrink: 0;
    }
    .ab-variant-card {
      background: #1a1a1a;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 7px;
      padding: 11px 13px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .ab-variant-card:hover {
      border-color: rgba(59,130,246,0.5);
      background: #1e2a3a;
    }
    .ab-variant-card.selected {
      border-color: #3b82f6;
      background: #172036;
    }
    .ab-variant-text {
      font-weight: 500;
      color: #f9fafb;
      margin-bottom: 4px;
      font-size: 13px;
    }
    .ab-variant-rationale {
      font-size: 11.5px;
      color: #6b7280;
      line-height: 1.5;
    }
    .ab-divider {
      border: none;
      border-top: 1px solid rgba(255,255,255,0.07);
      margin: 14px 0;
    }
    .ab-spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: ab-spin 0.6s linear infinite;
      margin-right: 7px;
      vertical-align: middle;
    }
    @keyframes ab-spin { to { transform: rotate(360deg); } }

    /* Page selection highlights */
    .ab-hover-highlight {
      outline: 2px dashed #ef4444 !important;
      outline-offset: 3px !important;
      cursor: crosshair !important;
    }
    .ab-selected-highlight {
      outline: 2px solid #3b82f6 !important;
      outline-offset: 3px !important;
    }
  `;
  document.head.appendChild(style);

  // --- Panel HTML ---
  const panel = document.createElement('div');
  panel.id = 'ab-panel';
  panel.innerHTML = `
    <div id="ab-panel-header">
      <div class="ab-title">
        A/B Engine
        <span class="ab-badge">Admin</span>
      </div>
      <button id="ab-panel-close" title="Exit admin mode">&times;</button>
    </div>
    <div id="ab-panel-body">
      <div id="ab-step-1">
        <p class="ab-desc">Click any element on the page to start building a variant.</p>
        <button class="ab-btn ab-btn-primary" id="ab-btn-select">Select Element</button>
      </div>

      <div id="ab-step-2" style="display:none;">
        <div class="ab-status"><span class="ab-status-dot"></span> Element selected</div>

        <label class="ab-label">Test Name</label>
        <input type="text" id="ab-test-name" class="ab-input" placeholder="e.g. Homepage headline test" />

        <label class="ab-label">Original Text</label>
        <div id="ab-original-text" class="ab-original-box"></div>

        <button class="ab-btn ab-btn-primary" id="ab-btn-magic">Generate AI Variants</button>
        <button class="ab-btn ab-btn-ghost" id="ab-btn-diagram">Generate as Diagram</button>
        <button class="ab-btn ab-btn-ghost" id="ab-btn-reselect">Select a different element</button>
      </div>

      <div id="ab-step-3" style="display:none;">
        <label class="ab-label">Choose a variant to test</label>
        <div id="ab-suggestions"></div>

        <hr class="ab-divider" />

        <label class="ab-label">Conversion Goal</label>
        <select id="ab-goal-type" class="ab-select">
          <option value="click">Track clicks on selected element</option>
          <option value="pageview">Track pageviews (default)</option>
        </select>

        <button class="ab-btn ab-btn-success" id="ab-btn-launch">Launch 50/50 Test</button>
        <button class="ab-btn ab-btn-ghost" id="ab-btn-back">Back</button>
      </div>

      <div id="ab-step-4" style="display:none;">
        <div class="ab-status">
          <span class="ab-status-dot" style="background:#f59e0b;"></span>
          <span id="ab-drag-status">Drag the element to a new position</span>
        </div>
        <p class="ab-desc">Drag the highlighted element and drop it before or after any block on the page. A blue line shows where it will land.</p>

        <div id="ab-pos-confirm" style="display:none;">
          <hr class="ab-divider" />
          <label class="ab-label">Conversion Goal</label>
          <select id="ab-pos-goal-type" class="ab-select">
            <option value="click">Track clicks on selected element</option>
            <option value="pageview">Track pageviews (default)</option>
          </select>
          <button class="ab-btn ab-btn-success" id="ab-btn-pos-launch">Launch 50/50 Test</button>
        </div>

        <button class="ab-btn ab-btn-ghost" id="ab-btn-cancel-drag" style="margin-top:8px;">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // --- State ---
  let selectionMode = false;
  let selectedElement = null;
  let selectedSelector = '';
  let generatedVariants = [];
  let chosenVariant = null;
  let originalFullText = '';

  // drag-to-reposition state
  let testType = 'text';
  let dragOriginParent = null;
  let dragOriginNextSibling = null;
  let variantPositionData = null;
  let dropTargetEls = [];
  let dropIndicator = null;

  // --- Element refs ---
  const step1 = document.getElementById('ab-step-1');
  const step2 = document.getElementById('ab-step-2');
  const step3 = document.getElementById('ab-step-3');
  const step4 = document.getElementById('ab-step-4');
  const btnSelect = document.getElementById('ab-btn-select');
  const btnReselect = document.getElementById('ab-btn-reselect');
  const btnDrag = document.getElementById('ab-btn-drag');
  const btnMagic = document.getElementById('ab-btn-magic');
  const btnDiagram = document.getElementById('ab-btn-diagram');
  const btnLaunch = document.getElementById('ab-btn-launch');
  const btnBack = document.getElementById('ab-btn-back');
  const btnCancelDrag = document.getElementById('ab-btn-cancel-drag');
  const btnPosLaunch = document.getElementById('ab-btn-pos-launch');
  const btnClose = document.getElementById('ab-panel-close');
  const originalTextDiv = document.getElementById('ab-original-text');
  const suggestionsDiv = document.getElementById('ab-suggestions');

  // --- Utilities ---
  function getUniqueSelector(el) {
    if (!el || el === document.body) return 'body';
    if (el.id) return '#' + el.id;
    let path = [];
    let cur = el;
    while (cur && cur.nodeType === Node.ELEMENT_NODE) {
      let sel = cur.nodeName.toLowerCase();
      if (cur.id) { sel += '#' + cur.id; path.unshift(sel); break; }
      const classes = Array.from(cur.classList).filter(c => !c.startsWith('ab-'));
      if (classes.length) sel += '.' + classes.slice(0, 2).join('.');
      path.unshift(sel);
      cur = cur.parentNode;
    }
    return path.join(' > ');
  }

  function resetHighlight() {
    if (selectedElement) selectedElement.classList.remove('ab-selected-highlight');
  }

  function showStep(n) {
    [step1, step2, step3, step4].forEach((s, i) => s.style.display = i === n - 1 ? 'block' : 'none');
  }

  // --- Drag-to-reposition handlers (named so they can be removed) ---
  function onDragStart(e) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // required for Firefox
    selectedElement.style.opacity = '0.4';
  }

  function onDragEnd() {
    selectedElement.style.opacity = '0.85';
    if (dropIndicator) dropIndicator.style.display = 'none';
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    dropIndicator.style.left = rect.left + 'px';
    dropIndicator.style.width = rect.width + 'px';
    dropIndicator.style.top = (e.clientY < midY ? rect.top : rect.bottom) - 1 + 'px';
    dropIndicator.style.display = 'block';
  }

  function onDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      dropIndicator.style.display = 'none';
    }
  }

  function onDrop(e) {
    e.preventDefault();
    if (dropIndicator) dropIndicator.style.display = 'none';
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const insertBefore = e.clientY < rect.top + rect.height / 2;

    const newParent = target.parentNode;
    const newBefore = insertBefore ? target : (target.nextSibling || null);

    // Skip no-op drops
    if (newBefore === selectedElement || newBefore === dragOriginNextSibling) return;

    newParent.insertBefore(selectedElement, newBefore);

    variantPositionData = {
      type: 'position',
      parentSelector: getUniqueSelector(newParent),
      beforeSelector: newBefore ? getUniqueSelector(newBefore) : null
    };

    document.getElementById('ab-drag-status').textContent = 'Position set — looks good?';
    document.getElementById('ab-pos-confirm').style.display = 'block';
  }

  // --- Drag mode enable/cancel ---
  function enableDragMode() {
    testType = 'position';
    dragOriginParent = selectedElement.parentNode;
    dragOriginNextSibling = selectedElement.nextSibling;

    dropIndicator = document.createElement('div');
    dropIndicator.style.cssText = 'position:fixed;height:3px;background:#3b82f6;pointer-events:none;z-index:2147483646;border-radius:2px;display:none;';
    document.body.appendChild(dropIndicator);

    selectedElement.setAttribute('draggable', 'true');
    selectedElement.style.cursor = 'grab';
    selectedElement.style.outline = '2px dashed #f59e0b';
    selectedElement.style.outlineOffset = '3px';
    selectedElement.style.opacity = '0.85';
    selectedElement.classList.remove('ab-selected-highlight');

    selectedElement.addEventListener('dragstart', onDragStart);
    selectedElement.addEventListener('dragend', onDragEnd);

    dropTargetEls = Array.from(document.querySelectorAll(
      'body > *, main *, section *, article *, div, p, h1, h2, h3, h4, h5, h6, ul, ol, li, header, footer, nav'
    )).filter(el => el !== selectedElement && !panel.contains(el) && !selectedElement.contains(el));

    dropTargetEls.forEach(el => {
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
    });

    showStep(4);
  }

  function cancelDragMode() {
    // Restore original DOM position
    dragOriginParent.insertBefore(selectedElement, dragOriginNextSibling || null);

    selectedElement.removeAttribute('draggable');
    selectedElement.style.cursor = '';
    selectedElement.style.outline = '';
    selectedElement.style.outlineOffset = '';
    selectedElement.style.opacity = '';
    selectedElement.removeEventListener('dragstart', onDragStart);
    selectedElement.removeEventListener('dragend', onDragEnd);

    dropTargetEls.forEach(el => {
      el.removeEventListener('dragover', onDragOver);
      el.removeEventListener('dragleave', onDragLeave);
      el.removeEventListener('drop', onDrop);
    });
    dropTargetEls = [];

    if (dropIndicator) { dropIndicator.remove(); dropIndicator = null; }

    testType = 'text';
    variantPositionData = null;
    dragOriginParent = null;
    dragOriginNextSibling = null;

    document.getElementById('ab-drag-status').textContent = 'Drag the element to a new position';
    document.getElementById('ab-pos-confirm').style.display = 'none';

    selectedElement.classList.add('ab-selected-highlight');
    showStep(2);
  }

  // --- Panel button handlers ---
  btnClose.addEventListener('click', () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('ab_admin');
    window.location.href = url.toString();
  });

  btnSelect.addEventListener('click', () => {
    selectionMode = true;
    btnSelect.textContent = 'Hovering — click an element...';
    btnSelect.disabled = true;
  });

  btnReselect.addEventListener('click', () => {
    resetHighlight();
    selectedElement = null;
    selectionMode = true;
    showStep(1);
    btnSelect.textContent = 'Hovering — click an element...';
    btnSelect.disabled = true;
  });

  btnDrag.addEventListener('click', enableDragMode);
  btnCancelDrag.addEventListener('click', cancelDragMode);

  document.addEventListener('mouseover', (e) => {
    if (!selectionMode || panel.contains(e.target)) return;
    e.target.classList.add('ab-hover-highlight');
  }, true);

  document.addEventListener('mouseout', (e) => {
    if (!selectionMode) return;
    e.target.classList.remove('ab-hover-highlight');
  }, true);

  document.addEventListener('click', (e) => {
    if (!selectionMode || panel.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    selectionMode = false;
    e.target.classList.remove('ab-hover-highlight');
    resetHighlight();
    selectedElement = e.target;
    selectedSelector = getUniqueSelector(selectedElement);
    selectedElement.classList.add('ab-selected-highlight');
    originalFullText = selectedElement.innerText.trim();
    const preview = originalFullText.length > 200 ? originalFullText.slice(0, 200) + '…' : originalFullText;
    originalTextDiv.textContent = preview;
    showStep(2);
    btnSelect.disabled = false;
    btnSelect.textContent = 'Select Element';
  }, true);

  // --- Text variant generation (unchanged) ---
  btnMagic.addEventListener('click', async () => {
    const text = originalFullText;
    if (!text) return;
    btnMagic.disabled = true;
    btnMagic.innerHTML = '<span class="ab-spinner"></span>Generating variants...';

    try {
      const res = await fetch(`${BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: document.title, elementText: text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      generatedVariants = data.variants || [];
      chosenVariant = null;
      renderVariants();
      showStep(3);
    } catch (err) {
      alert('Failed to generate variants: ' + err.message);
    } finally {
      btnMagic.disabled = false;
      btnMagic.textContent = 'Generate AI Variants';
    }
  });

  function renderVariants() {
    suggestionsDiv.innerHTML = '';
    generatedVariants.forEach((v) => {
      const card = document.createElement('div');
      card.className = 'ab-variant-card' + (v === generatedVariants[0] && v.isDiagram ? ' selected' : '');

      if (v.isDiagram) {
        // Strip the MERMAID: prefix for display
        const MERMAID_PREFIX = 'MERMAID:';
        const displayCode = v.text.startsWith(MERMAID_PREFIX) ? v.text.slice(MERMAID_PREFIX.length) : v.text;
        card.innerHTML = `
          <div class="ab-variant-text" style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="background:#1e3a5f;color:#93c5fd;font-size:10px;font-weight:700;letter-spacing:.06em;padding:2px 7px;border-radius:4px;text-transform:uppercase;">Diagram</span>
            Mermaid Flowchart Variant
          </div>
          <pre style="background:#0d1117;color:#79c0ff;font-size:11px;border-radius:6px;padding:10px;overflow-x:auto;white-space:pre;margin:0;line-height:1.5;">${displayCode.replace(/</g,'&lt;')}</pre>
          <div class="ab-variant-rationale" style="margin-top:8px;">${v.rationale}</div>
        `;
        // Auto-select the diagram card
        card.addEventListener('click', () => {
          document.querySelectorAll('.ab-variant-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          chosenVariant = v.text;
        });
      } else {
        card.innerHTML = `<div class="ab-variant-text">${v.text}</div><div class="ab-variant-rationale">${v.rationale}</div>`;
        card.addEventListener('click', () => {
          document.querySelectorAll('.ab-variant-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          chosenVariant = v.text;
          if (selectedElement) selectedElement.innerText = chosenVariant;
        });
      }
      suggestionsDiv.appendChild(card);
    });
  }

  // --- Diagram generation ---
  btnDiagram.addEventListener('click', async () => {
    const text = originalFullText;
    if (!text) return;
    btnDiagram.disabled = true;
    btnDiagram.innerHTML = '<span class="ab-spinner"></span>Generating diagram...';
    try {
      const res = await fetch(`${BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: document.title, elementText: text, mode: 'diagram' })
      });
      const data = await res.json();
      if (!res.ok || !data.diagram) throw new Error(data.error || 'No diagram returned');
      // Treat the single diagram as the chosen variant, bypass card selection
      generatedVariants = [{ text: data.diagram, rationale: data.rationale, isDiagram: true }];
      chosenVariant = data.diagram;
      renderVariants();
      showStep(3);
    } catch (err) {
      alert('Failed to generate diagram: ' + err.message);
    } finally {
      btnDiagram.disabled = false;
      btnDiagram.textContent = 'Generate as Diagram';
    }
  });

  btnBack.addEventListener('click', () => showStep(2));

  btnLaunch.addEventListener('click', async () => {
    if (!chosenVariant) { alert('Select a variant first.'); return; }
    const testName = document.getElementById('ab-test-name').value || 'AI Generated Test';
    const goal = document.getElementById('ab-goal-type').value;
    btnLaunch.disabled = true;
    btnLaunch.innerHTML = '<span class="ab-spinner"></span>Launching...';

    try {
      const res = await fetch(`${BASE_URL}/api/admin/tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: PROJECT_ID,
          name: testName,
          fingerprint: selectedSelector,
          goal,
          goalTarget: goal === 'click' ? selectedSelector : '',
          controlText: originalFullText,
          variantText: chosenVariant
        })
      });
      if (!res.ok) throw new Error('Failed to save test');
      const url = new URL(window.location.href);
      url.searchParams.delete('ab_admin');
      window.location.href = url.toString();
    } catch (err) {
      alert('Error: ' + err.message);
      btnLaunch.disabled = false;
      btnLaunch.textContent = 'Launch 50/50 Test';
    }
  });

  // --- Position test launch ---
  btnPosLaunch.addEventListener('click', async () => {
    if (!variantPositionData) return;
    const testName = document.getElementById('ab-test-name').value || 'Position Test';
    const goal = document.getElementById('ab-pos-goal-type').value;
    btnPosLaunch.disabled = true;
    btnPosLaunch.innerHTML = '<span class="ab-spinner"></span>Launching...';

    const controlContent = JSON.stringify({
      type: 'position',
      parentSelector: getUniqueSelector(dragOriginParent),
      beforeSelector: dragOriginNextSibling ? getUniqueSelector(dragOriginNextSibling) : null
    });

    try {
      const res = await fetch(`${BASE_URL}/api/admin/tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: PROJECT_ID,
          name: testName,
          fingerprint: selectedSelector,
          goal,
          goalTarget: goal === 'click' ? selectedSelector : '',
          controlText: controlContent,
          variantText: JSON.stringify(variantPositionData)
        })
      });
      if (!res.ok) throw new Error('Failed to save test');
      const url = new URL(window.location.href);
      url.searchParams.delete('ab_admin');
      window.location.href = url.toString();
    } catch (err) {
      alert('Error: ' + err.message);
      btnPosLaunch.disabled = false;
      btnPosLaunch.textContent = 'Launch 50/50 Test';
    }
  });
})();
