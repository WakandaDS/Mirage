// ─── Copy utility ────────────────────────────────────────

    function _cmCopyToClipboard(text) {
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          _cmShowCopyToast(text);
        });
      } else {
        // fallback para Figma sandbox
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity  = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); _cmShowCopyToast(text); } catch (err) {}
        document.body.removeChild(ta);
      }
    }

    var _cmCopyToastTimer = null;
    function _cmShowCopyToast(text) {
      var el = document.getElementById('cm-copy-toast');
      if (!el) {
        el = document.createElement('div');
        el.id = 'cm-copy-toast';
        document.body.appendChild(el);
      }
      // Truncar label longa
      var label = text.length > 38 ? text.slice(0, 36) + '…' : text;
      el.textContent = 'Copiado: ' + label;
      el.classList.remove('cm-toast-hide');
      el.style.display = 'block';
      clearTimeout(_cmCopyToastTimer);
      _cmCopyToastTimer = setTimeout(function () {
        el.classList.add('cm-toast-hide');
        _cmCopyToastTimer = setTimeout(function () { el.style.display = 'none'; }, 300);
      }, 1800);
    }

// ─── Tooltip de token (CM-I1) ────────────────────────────

    function _cmGetTooltipEl() {
      if (!_cmTooltipEl) {
        _cmTooltipEl = document.createElement('div');
        _cmTooltipEl.id = 'cm-tooltip';
        document.body.appendChild(_cmTooltipEl);

        // Enquanto o rato está sobre o tooltip cancela o hide
        _cmTooltipEl.addEventListener('mouseenter', function () {
          clearTimeout(_cmTooltipHideTimer);
          clearTimeout(_cmTooltipTimer);
        });
        _cmTooltipEl.addEventListener('mouseleave', function () {
          _cmTooltipHideTimer = setTimeout(function () {
            if (_cmTooltipEl) _cmTooltipEl.style.display = 'none';
          }, 90);
        });
      }
      return _cmTooltipEl;
    }

    function _cmScheduleTooltip(e, tokenNode) {
      clearTimeout(_cmTooltipHideTimer);  // cancelar hide pendente
      clearTimeout(_cmTooltipTimer);
      // Se já está visível (troca de token), mostrar quase imediatamente
      var alreadyVisible = _cmTooltipEl && _cmTooltipEl.style.display !== 'none';
      _cmTooltipTimer = setTimeout(function () { _cmShowTooltip(e, tokenNode); }, alreadyVisible ? 40 : 350);
    }

    function _cmShowTooltip(e, n) {
      var el      = _cmGetTooltipEl();
      var kind    = _tokenNodeKind(n) || '';
      var pairing = cmPairingMap[n.variableId];

      var html = '<div class="cm-tip-name cm-tip-copyable" data-copy="' + _cmHtmlEsc(n.label) + '">'
               + _cmHtmlEsc(n.label)
               + '<span class="cm-tip-copy-icon">⎘</span>'
               + '</div>';
      if (n.property) {
        html += '<div class="cm-tip-prop">' + _cmHtmlEsc(n.property) + '</div>';
      }
      if (pairing && pairing.kind === 'renamed' && pairing.nameA !== pairing.nameB) {
        html += '<div class="cm-tip-row"><span class="cm-tip-side">A</span>' + _cmHtmlEsc(pairing.nameA.split('/').pop()) + '</div>';
        html += '<div class="cm-tip-row"><span class="cm-tip-side">B</span>' + _cmHtmlEsc(pairing.nameB.split('/').pop()) + '</div>';
      }
      if (n.resolvedValue) {
        html += '<div class="cm-tip-val">' + _cmHtmlEsc(n.resolvedValue) + '</div>';
      }
      if (kind) {
        html += '<span class="cm-tip-kind cm-tip-' + kind + '">' + kind + '</span>';
      }

      el.innerHTML = html;
      el.dataset.side = n.side || 'a';
      el.style.display = 'block';
      _cmPositionTooltip(e);

      // Click no nome copia para clipboard
      var copyEl = el.querySelector('.cm-tip-copyable');
      if (copyEl) {
        copyEl.onclick = function () { _cmCopyToClipboard(copyEl.dataset.copy); };
      }
    }

    function _cmPositionTooltip(e) {
      var el = _cmTooltipEl;
      if (!el || el.style.display === 'none') return;
      var y = e.clientY - 10;
      var x;
      if (el.dataset.side === 'b') {
        // lado B: tooltip à esquerda do cursor
        x = e.clientX - el.offsetWidth - 14;
        if (x < 0) x = e.clientX + 14;
      } else {
        // lado A: tooltip à direita do cursor
        x = e.clientX + 14;
        if (x + el.offsetWidth > window.innerWidth) x = e.clientX - el.offsetWidth - 14;
      }
      if (y + el.offsetHeight > window.innerHeight) y = e.clientY - el.offsetHeight - 10;
      el.style.left = x + 'px';
      el.style.top  = y + 'px';
    }

    function _cmHideTooltip() {
      clearTimeout(_cmTooltipTimer);
      clearTimeout(_cmTooltipHideTimer);
      // Grace period de 120ms — permite mover o rato do canvas para o tooltip sem fechar
      _cmTooltipHideTimer = setTimeout(function () {
        if (_cmTooltipEl) _cmTooltipEl.style.display = 'none';
      }, 120);
    }

    function _cmHtmlEsc(s) {
      return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

// ─── Tooltip de layer hardcoded ──────────────────────────

    function _cmScheduleHardcodedTooltip(e, node) {
      clearTimeout(_cmTooltipHideTimer);
      clearTimeout(_cmTooltipTimer);
      var alreadyVisible = _cmTooltipEl && _cmTooltipEl.style.display !== 'none';
      _cmTooltipTimer = setTimeout(function () { _cmShowHardcodedTooltip(e, node); }, alreadyVisible ? 40 : 350);
    }

    function _cmShowHardcodedTooltip(e, n) {
      var el = _cmGetTooltipEl();
      var props = (n.hardcoded || []).map(function (h) { return h.property; }).join(', ');
      var html = '<div class="cm-tip-name">' + _cmHtmlEsc(n.label) + '</div>'
               + '<div class="cm-tip-prop" style="color:#9ca3af">sem token: ' + _cmHtmlEsc(props) + '</div>'
               + '<span class="cm-tip-kind" style="background:rgba(107,114,128,0.2);color:#9ca3af;border-color:rgba(107,114,128,0.4)">hardcoded</span>';
      el.innerHTML = html;
      el.dataset.side = n.side || 'a';
      el.style.display = 'block';
      _cmPositionTooltip(e);
    }

// ─── Tooltip de layer broken ref ─────────────────────────

    function _cmScheduleBrokenTooltip(e, node) {
      clearTimeout(_cmTooltipHideTimer);
      clearTimeout(_cmTooltipTimer);
      var alreadyVisible = _cmTooltipEl && _cmTooltipEl.style.display !== 'none';
      _cmTooltipTimer = setTimeout(function () { _cmShowBrokenTooltip(e, node); }, alreadyVisible ? 40 : 350);
    }

    function _cmShowBrokenTooltip(e, n) {
      var el = _cmGetTooltipEl();
      var props = (n.broken || []).map(function (b) { return b.property; }).join(', ');
      var html = '<div class="cm-tip-name">' + _cmHtmlEsc(n.label) + '</div>'
               + '<div class="cm-tip-prop" style="color:#fbbf24">ref. inválida: ' + _cmHtmlEsc(props) + '</div>'
               + '<span class="cm-tip-kind" style="background:rgba(245,158,11,0.15);color:#fbbf24;border-color:rgba(245,158,11,0.4)">broken ref</span>';
      el.innerHTML = html;
      el.dataset.side = n.side || 'a';
      el.style.display = 'block';
      _cmPositionTooltip(e);
    }
