// ─── Legenda interactiva com contagens e isolate ────────

    /**
     * Definição estática das kinds por ordem de exibição.
     */
    var CM_LEGEND_KINDS = [
      { key: 'exact',     label: 'Exact',       color: '#22c55e', dashed: false },
      { key: 'renamed',   label: 'Renamed',     color: '#eab308', dashed: false },
      { key: 'drifted',   label: 'Drifted',     color: '#f97316', dashed: false },
      { key: 'removal',   label: 'Removal',     color: '#ef4444', dashed: true  },
      { key: 'addon',     label: 'Add-on',      color: '#3b82f6', dashed: false },
      { key: 'hardcoded', label: 'Hardcoded',   color: '#6b7280', dashed: true  },
      { key: 'broken',    label: 'Broken ref',  color: '#f59e0b', dashed: true  },
    ];

    /**
     * Gera a legenda dinamicamente com contagens por kind.
     * Cada item é clicável para activar/desactivar o isolate desse kind.
     * Kinds com count 0 são omitidos.
     */
    function renderCMLegend(result) {
      var el = document.getElementById('cm-legend');
      if (!el) return;

      function _countLayerProp(node, prop) {
        if (!node) return 0;
        var c = (node[prop] && node[prop].length > 0) ? 1 : 0;
        node.children.forEach(function (child) { c += _countLayerProp(child, prop); });
        return c;
      }
      var counts = {
        exact:     0, renamed: 0, drifted: 0,
        removal:   result.removals.length,
        addon:     result.addons.length,
        hardcoded: _countLayerProp(result.treeA, 'hardcoded') + _countLayerProp(result.treeB, 'hardcoded'),
        broken:    _countLayerProp(result.treeA, 'broken')    + _countLayerProp(result.treeB, 'broken'),
      };
      result.pairings.forEach(function (p) {
        if (counts[p.kind] !== undefined) counts[p.kind]++;
      });

      el.innerHTML = '';

      CM_LEGEND_KINDS.forEach(function (k) {
        var count = counts[k.key] || 0;
        if (count === 0) return;

        var span = document.createElement('span');
        span.className = 'cm-leg' + (cmIsolateKinds.indexOf(k.key) !== -1 ? ' cm-leg-active' : '');
        span.dataset.kind = k.key;

        var lineStyle = k.dashed
          ? 'color:' + k.color
          : 'background:' + k.color;

        span.innerHTML =
          '<span class="cm-leg-line' + (k.dashed ? ' cm-dashed' : '') + '" style="' + lineStyle + '"></span>' +
          '<span class="cm-leg-name">' + k.label + '</span>' +
          '<span class="cm-leg-count">' + count + '</span>';

        span.addEventListener('click', function () {
          var idx = cmIsolateKinds.indexOf(k.key);
          if (idx !== -1) {
            cmIsolateKinds.splice(idx, 1);
          } else {
            if (cmIsolateKinds.length >= 3) cmIsolateKinds.shift();
            cmIsolateKinds.push(k.key);
          }
          el.querySelectorAll('.cm-leg').forEach(function (s) {
            s.classList.toggle('cm-leg-active', cmIsolateKinds.indexOf(s.dataset.kind) !== -1);
          });
          _rebuildAndDraw();
        });

        el.appendChild(span);
      });
    }

// ─── Expand-all (CM-I3) ─────────────────────────────────

    /**
     * Expande todos os nós de ambos os lados de uma vez:
     * limpa cmCollapsed por completo e redesenha.
     */
    function _cmExpandAll() {
      if (!compareResult) return;
      cmCollapsed = {};
      _rebuildAndDraw();
    }

// ─── Reset view (CM-I10) ────────────────────────────────

    /**
     * Repõe a vista ao estado inicial:
     *  — root expandido, tudo o resto colapsado
     *  — scroll ao topo
     *  — isolate desactivado
     */
    function _cmResetView() {
      if (!compareResult) return;

      cmIsolateKinds = [];
      var el = document.getElementById('cm-legend');
      if (el) el.querySelectorAll('.cm-leg').forEach(function (s) {
        s.classList.remove('cm-leg-active');
      });

      // Limpar filtros
      cmFilterLayer = '';
      cmFilterToken = '';
      var fli = document.getElementById('cm-filter-layer');
      var fti = document.getElementById('cm-filter-token');
      if (fli) fli.value = '';
      if (fti) fti.value = '';

      cmCollapsed = {};
      function _collapseAllExceptRoot(node, isRoot) {
        if (!isRoot && (node.children.length > 0 || node.tokens.length > 0)) {
          cmCollapsed[node.id] = true;
        }
        node.children.forEach(function (c) { _collapseAllExceptRoot(c, false); });
      }
      if (compareResult.treeA) _collapseAllExceptRoot(compareResult.treeA, true);
      if (compareResult.treeB) _collapseAllExceptRoot(compareResult.treeB, true);

      _rebuildAndDraw(true);
    }
