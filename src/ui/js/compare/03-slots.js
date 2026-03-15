// ─── Autocomplete dos slots ──────────────────────────────

    /**
     * Configura input + dropdown de autocomplete para um slot (side 'a' ou 'b').
     */
    function _cmSetupSlotInput(slot) {
      var input = document.getElementById('cm-slot-input-' + slot);
      var dd    = document.getElementById('cm-slot-dd-' + slot);
      if (!input || !dd) return;

      input.addEventListener('input', function () {
        var q = this.value.trim();
        if (q.length < 3) { _cmHideDd(dd); return; }
        // Debounce: aguardar 200ms antes de enviar ao backend
        clearTimeout(_cmSearchTimer);
        _cmSearchTimer = setTimeout(function () {
          _cmShowLoading(slot);
          post({ type: 'SEARCH_COMPONENTS', query: q });
        }, 200);
      });

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          _cmHideDd(dd);
          this.blur();
          return;
        }
        if (e.key === 'Enter') {
          var active = dd.querySelector('li.cm-dd-active');
          if (active && !active.classList.contains('cm-dd-empty')) {
            active.dispatchEvent(new MouseEvent('mousedown'));
          } else if (!this.value.trim()) {
            // Input vazio + Enter → selecionar no canvas
            selectSlot(slot);
          }
          return;
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          _cmNavDd(dd, e.key === 'ArrowDown' ? 1 : -1);
        }
      });

      input.addEventListener('blur', function () {
        clearTimeout(_cmDdBlurTimer);
        _cmDdBlurTimer = setTimeout(function () { _cmHideDd(dd); }, 200);
      });
    }

    // Slot cujo dropdown está à espera de resposta do backend
    var _cmDdActiveSlot = null;

    function _cmShowLoading(slot) {
      _cmDdActiveSlot = slot;
      var dd = document.getElementById('cm-slot-dd-' + slot);
      if (!dd) return;
      dd.innerHTML = '';
      var li = document.createElement('li');
      li.className = 'cm-dd-empty';
      li.textContent = '…';
      dd.appendChild(li);
      _cmPositionDd(slot);
      dd.classList.add('cm-slot-dd-open');
    }

    // Chamado pelo handler COMPONENTS_LIST quando o backend responde
    function _cmRenderDdResults(components) {
      var slot = _cmDdActiveSlot;
      if (!slot) return;
      var dd = document.getElementById('cm-slot-dd-' + slot);
      if (!dd) return;

      dd.innerHTML = '';

      if (!components.length) {
        var empty = document.createElement('li');
        empty.className = 'cm-dd-empty';
        empty.textContent = 'Sem resultados';
        dd.appendChild(empty);
      } else {
        components.forEach(function (c) {
          var li   = document.createElement('li');
          var name = document.createElement('span');
          name.className   = 'cm-dd-name';
          name.textContent = c.name;
          var type = document.createElement('span');
          type.className   = 'cm-dd-type';
          type.textContent = (c.page ? c.page + ' · ' : '') + c.type;
          li.appendChild(name);
          li.appendChild(type);
          li.addEventListener('mousedown', function (e) {
            e.preventDefault();
            _cmSelectSlotComp(slot, c.nodeId, c.name);
            _cmHideDd(dd);
          });
          dd.appendChild(li);
        });
      }

      _cmPositionDd(slot);
      dd.classList.add('cm-slot-dd-open'); // garantir que está aberto após resultados
    }

    function _cmPositionDd(slot) {
      var input = document.getElementById('cm-slot-input-' + slot);
      var dd    = document.getElementById('cm-slot-dd-' + slot);
      if (!input || !dd) return;
      var rect = input.getBoundingClientRect();
      dd.style.top   = (rect.bottom + 2) + 'px';
      dd.style.left  = rect.left + 'px';
      dd.style.width = rect.width + 'px';
    }

    function _cmHideDd(dd) {
      if (dd) dd.classList.remove('cm-slot-dd-open');
    }

    function _cmNavDd(dd, dir) {
      var items = Array.prototype.slice.call(dd.querySelectorAll('li:not(.cm-dd-empty)'));
      if (!items.length) return;
      var idx = items.indexOf(dd.querySelector('li.cm-dd-active'));
      if (idx >= 0) items[idx].classList.remove('cm-dd-active');
      idx = (idx + dir + items.length) % items.length;
      items[idx].classList.add('cm-dd-active');
      items[idx].scrollIntoView({ block: 'nearest' });
    }

    function _cmSelectSlotComp(slot, nodeId, name) {
      var info = { nodeId: nodeId, name: name };
      if (slot === 'a') compareSlotA = info;
      else              compareSlotB = info;

      var input = document.getElementById('cm-slot-input-' + slot);
      if (input) { input.value = name; input.blur(); }

      var slotEl = document.getElementById('cm-slot-' + slot);
      if (slotEl) slotEl.classList.add('cm-slot-filled');

      updateCompareBtn();
      if (compareSlotA && compareSlotB) runCompare();
    }

    /**
     * Obtém referência ao canvas e configura scroll por wheel e resize.
     */
    function initCompareCanvas() {
      cmCanvas = document.getElementById('cm-canvas');
      if (!cmCanvas) return;
      cmCtx = cmCanvas.getContext('2d');

      // Scroll por roda do rato
      cmCanvas.addEventListener('wheel', function (e) {
        e.preventDefault();
        var viewH = cmCanvas.clientHeight;
        cmScrollY = Math.max(0, Math.min(cmScrollY + e.deltaY * 0.8, Math.max(0, cmTotalH - viewH)));
        redrawCompareCanvas();
      }, { passive: false });

      // Click — colapsar / expandir layer nodes com filhos
      cmCanvas.addEventListener('click', function (e) {
        handleCMCanvasClick(e);
      });

      // Double-click — focus overlay numa ligação de token
      cmCanvas.addEventListener('dblclick', function (e) {
        var pos  = _cmEventCoords(e);
        var node = _cmHitTokenNode(pos.x, pos.y);
        if (node) _cmOpenFocusOverlay(node.variableId);
      });

      // Hover — cursor + highlight + tooltip
      cmCanvas.addEventListener('mousemove', function (e) {
        handleCMCanvasHover(e);
      });
      cmCanvas.addEventListener('mouseleave', function () {
        clearTimeout(_cmHoverTimer);
        _cmHoverTimer = null;
        if (cmHoveredId !== null) {
          cmHoveredId           = null;
          cmHoveredCounterpartId = null;
          redrawCompareCanvas();
        }
        // Usar grace period normal — o rato pode estar a mover-se para o tooltip
        _cmHideTooltip();
      });

      // Resize da janela — refaz layout e redesenha
      window.addEventListener('resize', function () {
        var el = document.getElementById('compare');
        if (el && el.style.display !== 'none' && cmLayoutA) {
          resizeCompareCanvas();
          _rebuildAndDraw();
        }
      });
    }

    /**
     * Dimensiona o canvas para preencher o container, com DPR.
     */
    function resizeCompareCanvas() {
      if (!cmCanvas) return;
      var wrapper = document.getElementById('cm-area');
      if (!wrapper) return;
      var dpr = window.devicePixelRatio || 1;
      var w   = wrapper.offsetWidth;
      var h   = wrapper.offsetHeight;
      cmCanvas.width  = Math.round(w * dpr);
      cmCanvas.height = Math.round(h * dpr);
      cmCanvas.style.width  = w + 'px';
      cmCanvas.style.height = h + 'px';
      cmCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

// ─── Selecção de slots ──────────────────────────────────

    /**
     * Marca um slot como pendente e pede a selecção actual ao backend.
     */
    function selectSlot(slot) {
      comparePendingSlot = slot;
      var slotEl = document.getElementById('cm-slot-' + slot);
      if (slotEl) {
        var val = slotEl.querySelector('.cm-slot-value');
        if (val) { val.textContent = 'A selecionar…'; val.classList.add('cm-slot-empty'); }
      }
      post({ type: 'GET_SELECTION' });
    }

    /**
     * Preenche o slot pendente com a info recebida do backend.
     */
    function fillCompareSlot(nodeId, name) {
      if (!comparePendingSlot) return;

      var slot = comparePendingSlot;
      comparePendingSlot = null;

      if (!nodeId) {
        updateSlotUI(slot, null);
        return;
      }

      var info = { nodeId: nodeId, name: name };
      if (slot === 'a') compareSlotA = info;
      else              compareSlotB = info;

      updateSlotUI(slot, info);
      updateCompareBtn();
      _cmUpdateEmptyState();

      if (compareSlotA && compareSlotB) runCompare();
    }

    /**
     * Actualiza o visual de um selector com os dados do componente.
     * Quando preenchido, adiciona .cm-slot-filled para revelar o botão clear em hover.
     */
    function updateSlotUI(slot, info) {
      var slotEl = document.getElementById('cm-slot-' + slot);
      if (!slotEl) return;
      var val = slotEl.querySelector('.cm-slot-value');
      if (!val) return;
      if (info) {
        val.textContent = info.name;
        val.classList.remove('cm-slot-empty');
        slotEl.classList.add('cm-slot-filled');
      } else {
        val.textContent = 'Selecionar…';
        val.classList.add('cm-slot-empty');
        slotEl.classList.remove('cm-slot-filled');
      }
    }

    /**
     * Limpa um slot e invalida o resultado de comparação actual.
     * O canvas é limpo e a legenda é esvaziada.
     */
    function clearCompareSlot(slot) {
      if (slot === 'a') compareSlotA = null;
      else              compareSlotB = null;

      comparePendingSlot = null;
      compareResult      = null;
      cmLayoutA          = null;
      cmLayoutB          = null;

      updateSlotUI(slot, null);
      updateCompareBtn();

      _cmUpdateEmptyState();

      // Limpar canvas e legenda
      if (cmCtx && cmCanvas) {
        var dpr = window.devicePixelRatio || 1;
        cmCtx.clearRect(0, 0, cmCanvas.width / dpr, cmCanvas.height / dpr);
      }
      var legendEl = document.getElementById('cm-legend');
      if (legendEl) legendEl.innerHTML = '';

      document.getElementById('cm-area').classList.remove('cm-loading');
    }

// ─── Disparar comparação ────────────────────────────────

    function runCompare() {
      if (!compareSlotA || !compareSlotB) return;
      document.getElementById('cm-area').classList.add('cm-loading');
      post({
        type:    'COMPARE',
        nodeIdA: compareSlotA.nodeId,
        nodeIdB: compareSlotB.nodeId
      });
    }

// ─── Swap A ↔ B ──────────────────────────────────────────

    function _cmSwapSlots() {
      var btn = document.getElementById('cm-vs');

      // Trocar estado
      var tmp    = compareSlotA;
      compareSlotA = compareSlotB;
      compareSlotB = tmp;

      // Atualizar UI dos dois slots
      updateSlotUI('a', compareSlotA);
      updateSlotUI('b', compareSlotB);
      updateCompareBtn();

      // Re-correr comparação se ambos preenchidos
      if (compareSlotA && compareSlotB) runCompare();
    }

    function _cmUpdateEmptyState() {
      var el = document.getElementById('cm-empty');
      if (!el) return;
      if (compareResult) { el.style.display = 'none'; return; }
      el.style.display = 'flex';
      var txt = document.getElementById('cm-empty-text');
      if (!txt) return;
      if (compareSlotA && !compareSlotB)       txt.textContent = 'Agora selecciona o Componente B';
      else if (!compareSlotA && compareSlotB)  txt.textContent = 'Agora selecciona o Componente A';
      else                                     txt.textContent = 'Selecciona dois componentes para começar';
    }

    function updateCompareBtn() {
      var btn = document.getElementById('btn-compare');
      if (!btn) return;
      var ready = !!(compareSlotA && compareSlotB);
      btn.title = ready
        ? 'Comparar ' + compareSlotA.name + ' ↔ ' + compareSlotB.name
        : 'Compare Mode β — seleciona dois componentes';
    }
