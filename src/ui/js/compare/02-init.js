// ─── Inicialização ──────────────────────────────────────

    /**
     * Inicializa os event listeners do Compare Mode.
     * Chamado em 13-inicializacao.js após o DOM estar pronto.
     */
    function initCompareMode() {
      var slotA = document.getElementById('cm-slot-a');
      var slotB = document.getElementById('cm-slot-b');
      if (slotA) slotA.addEventListener('click', function () { selectSlot('a'); });
      if (slotB) slotB.addEventListener('click', function () { selectSlot('b'); });

      var clearBtns = document.querySelectorAll('.cm-slot-clear');
      clearBtns.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          clearCompareSlot(btn.dataset.slot);
        });
      });


      var expandAllBtn = document.getElementById('cm-expand-all');
      if (expandAllBtn) expandAllBtn.addEventListener('click', _cmExpandAll);

      var resetBtn = document.getElementById('cm-reset');
      if (resetBtn) resetBtn.addEventListener('click', _cmResetView);

      var vsBtn = document.getElementById('cm-vs');
      if (vsBtn) vsBtn.addEventListener('click', _cmSwapSlots);

      // Filtros de layer e token (CM-I8 / CM-I9)
      var filterLayerInput = document.getElementById('cm-filter-layer');
      var filterTokenInput = document.getElementById('cm-filter-token');
      if (filterLayerInput) {
        filterLayerInput.addEventListener('input', function () {
          cmFilterLayer = this.value.trim();
          clearTimeout(_cmFilterTimer);
          _cmFilterTimer = setTimeout(function () { _rebuildAndDraw(); }, 150);
        });
      }
      if (filterTokenInput) {
        filterTokenInput.addEventListener('input', function () {
          cmFilterToken = this.value.trim();
          clearTimeout(_cmFilterTimer);
          _cmFilterTimer = setTimeout(function () { _rebuildAndDraw(); }, 150);
        });
      }

      // Resize handles (corner + laterais)
      ['cm-resize-handle', 'cm-resize-right', 'cm-resize-bottom', 'cm-resize-left'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('mousedown', function (e) {
          _cmRsX   = e.screenX;
          _cmRsY   = e.screenY;
          _cmRsW   = window.innerWidth;
          _cmRsH   = window.innerHeight;
          _cmRsDir = el.dataset.resize || 'se';
          e.preventDefault();
          document.addEventListener('mousemove', _cmResizeDrag);
          document.addEventListener('mouseup',   _cmResizeEnd);
        });
      });

      // Restaurar tamanho guardado
      try {
        var _saved = JSON.parse(localStorage.getItem('tm-win-size'));
        if (_saved && _saved.w >= 320 && _saved.h >= 280) {
          post({ type: 'RESIZE', width: _saved.w, height: _saved.h });
        }
      } catch (e) {}

      initCompareCanvas();
      _cmSetLive(true);
    }

    function _cmResizeDrag(e) {
      var dx = e.screenX - _cmRsX;
      var dy = e.screenY - _cmRsY;
      var w = _cmRsW, h = _cmRsH;
      if (_cmRsDir === 'se' || _cmRsDir === 'e') w = _cmRsW + dx;
      if (_cmRsDir === 'se' || _cmRsDir === 's') h = _cmRsH + dy;
      if (_cmRsDir === 'w') w = _cmRsW - dx;
      w = Math.round(Math.max(320, w));
      h = Math.round(Math.max(280, h));
      post({ type: 'RESIZE', width: w, height: h });
      try { localStorage.setItem('tm-win-size', JSON.stringify({ w: w, h: h })); } catch (e) {}
    }

    function _cmResizeEnd() {
      document.removeEventListener('mousemove', _cmResizeDrag);
      document.removeEventListener('mouseup', _cmResizeEnd);
    }
