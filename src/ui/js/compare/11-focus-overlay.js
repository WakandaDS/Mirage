// ─── Focus Overlay (double-click em token) ───────────────

    function _cmOpenFocusOverlay(variableId) {
      cmFocusedVariableId = variableId;
      var ol = _cmGetFocusOverlay();
      ol.style.display = 'flex';

      var nodeA    = cmLayoutA && cmLayoutA.tokenNodeMap[variableId];
      var nodeB    = cmLayoutB && cmLayoutB.tokenNodeMap[variableId];
      var pairing  = cmPairingMap[variableId];
      var kind     = pairing ? pairing.kind
                             : (cmRemovalIds[variableId] ? 'removal'
                             : (cmAddonIds[variableId]   ? 'addon' : null));
      var color    = CM_COLORS[kind] || 'rgba(255,255,255,0.5)';

      var nameA    = nodeA ? nodeA.label    : '—';
      var propA    = nodeA ? nodeA.property : '';
      var valA     = nodeA ? (nodeA.resolvedValue || '') : '';
      var nameB    = nodeB ? nodeB.label    : '—';
      var propB    = nodeB ? nodeB.property : '';
      var valB     = nodeB ? (nodeB.resolvedValue || '') : '';
      var kindLabel = kind ? kind.charAt(0).toUpperCase() + kind.slice(1) : '';

      // Mini-canvas
      var cv = document.getElementById('cm-focus-canvas');
      var dpr = window.devicePixelRatio || 1;
      var cw = cv.offsetWidth, ch = cv.offsetHeight;
      cv.width  = cw * dpr;
      cv.height = ch * dpr;
      var ctx = cv.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cw, ch);

      var r   = 10;
      var cyM = ch / 2;
      var xA  = 60, xB = cw - 60;
      var mx  = cw / 2;

      // Bezier
      ctx.beginPath();
      ctx.moveTo(xA + r, cyM);
      ctx.bezierCurveTo(mx, cyM, mx, cyM, xB - r, cyM);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.lineWidth   = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Círculo A
      ctx.beginPath();
      ctx.arc(xA, cyM, r, 0, Math.PI * 2);
      ctx.fillStyle   = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      // Círculo B
      ctx.beginPath();
      ctx.arc(xB, cyM, r, 0, Math.PI * 2);
      ctx.fillStyle   = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      // Kind badge no centro
      if (kindLabel) {
        ctx.font         = 'bold 9px Inter, -apple-system, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign    = 'center';
        ctx.fillStyle    = color;
        ctx.fillText(kindLabel.toUpperCase(), mx, cyM - 12);
        ctx.textAlign    = 'left';
      }

      // Preencher info
      var elNameA = document.getElementById('cm-focus-name-a');
      elNameA.textContent = nameA.split('/').pop();
      elNameA.title       = nameA;
      elNameA.dataset.copy = nameA;
      elNameA.classList.add('cm-focus-copyable');

      document.getElementById('cm-focus-prop-a').textContent  = propA;
      document.getElementById('cm-focus-val-a').textContent   = valA;

      var elNameB = document.getElementById('cm-focus-name-b');
      elNameB.textContent  = nameB.split('/').pop();
      elNameB.title        = nameB;
      elNameB.dataset.copy = nameB;
      elNameB.classList.add('cm-focus-copyable');

      document.getElementById('cm-focus-prop-b').textContent  = propB;
      document.getElementById('cm-focus-val-b').textContent   = valB;
      document.getElementById('cm-focus-badge').textContent   = kindLabel;
      document.getElementById('cm-focus-badge').style.color   = color;
      document.getElementById('cm-focus-fullname').textContent = nameA !== '—' ? nameA : nameB;
    }

    function _cmCloseFocusOverlay() {
      cmFocusedVariableId = null;
      var ol = document.getElementById('cm-focus-overlay');
      if (ol) ol.style.display = 'none';
    }

    function _cmGetFocusOverlay() {
      var ol = document.getElementById('cm-focus-overlay');
      if (ol) return ol;

      ol = document.createElement('div');
      ol.id = 'cm-focus-overlay';
      ol.innerHTML = [
        '<div id="cm-focus-card">',
        '  <div id="cm-focus-header">',
        '    <button id="cm-focus-back">&#8592; Voltar</button>',
        '    <span id="cm-focus-fullname"></span>',
        '    <span id="cm-focus-badge"></span>',
        '  </div>',
        '  <canvas id="cm-focus-canvas"></canvas>',
        '  <div id="cm-focus-info">',
        '    <div class="cm-focus-side" id="cm-focus-side-a">',
        '      <div class="cm-focus-side-label">A</div>',
        '      <div class="cm-focus-token-name" id="cm-focus-name-a"></div>',
        '      <div class="cm-focus-token-prop" id="cm-focus-prop-a"></div>',
        '      <div class="cm-focus-token-val"  id="cm-focus-val-a"></div>',
        '    </div>',
        '    <div class="cm-focus-divider"></div>',
        '    <div class="cm-focus-side" id="cm-focus-side-b">',
        '      <div class="cm-focus-side-label">B</div>',
        '      <div class="cm-focus-token-name" id="cm-focus-name-b"></div>',
        '      <div class="cm-focus-token-prop" id="cm-focus-prop-b"></div>',
        '      <div class="cm-focus-token-val"  id="cm-focus-val-b"></div>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('');

      var area = document.getElementById('cm-area') || document.getElementById('compare');
      area.appendChild(ol);

      // Fechar ao clicar no fundo
      ol.addEventListener('click', function (e) {
        if (e.target === ol) _cmCloseFocusOverlay();
      });

      // Copy em nomes de token (delegado)
      ol.addEventListener('click', function (e) {
        var t = e.target.closest('.cm-focus-copyable');
        if (t && t.dataset.copy) _cmCopyToClipboard(t.dataset.copy);
      });

      // Botão voltar
      ol.querySelector('#cm-focus-back').addEventListener('click', function () {
        _cmCloseFocusOverlay();
      });

      return ol;
    }
