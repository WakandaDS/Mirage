// ─── Renderização do resultado ──────────────────────────

    /**
     * Recebe o diff do backend e renderiza o canvas.
     */
    function renderCompareResult(result) {
      compareResult = result;
      document.getElementById('cm-area').classList.remove('cm-loading');
      _cmUpdateEmptyState();

      // Mapas de lookup para o renderer
      cmPairingMap = {};
      result.pairings.forEach(function (p) { cmPairingMap[p.id] = p; });
      cmRemovalIds = {};
      result.removals.forEach(function (r) { cmRemovalIds[r.id] = true; });
      cmAddonIds = {};
      result.addons.forEach(function (a) { cmAddonIds[a.id] = true; });

      // Reset de estado interactivo — preservar collapsed no live refresh
      var savedCollapsed = _cmLiveRefresh ? cmCollapsed : null;
      _cmLiveRefresh = false;
      cmCollapsed   = savedCollapsed || {};
      cmIsolateKinds = [];
      cmFilterLayer = '';
      cmFilterToken = '';
      var fli = document.getElementById('cm-filter-layer');
      var fti = document.getElementById('cm-filter-token');
      if (fli) fli.value = '';
      if (fti) fti.value = '';

      // Estado inicial: root expandido, todos os outros nós colapsados.
      // O utilizador explora clicando, como na layers tab do Figma.
      function _collapseAllExceptRoot(node, isRoot) {
        if (!isRoot && (node.children.length > 0 || node.tokens.length > 0)) {
          cmCollapsed[node.id] = true;
        }
        node.children.forEach(function (c) { _collapseAllExceptRoot(c, false); });
      }
      if (!savedCollapsed) {
        if (result.treeA) _collapseAllExceptRoot(result.treeA, true);
        if (result.treeB) _collapseAllExceptRoot(result.treeB, true);
      }

      // Mapas nome+profundidade para sincronização de expansão entre lados
      cmNameDepthMapA = {};
      cmNameDepthMapB = {};
      function _buildNameDepthMap(node, map, depth) {
        var key = depth + ':' + node.name;
        if (!map[key]) map[key] = node.id;  // primeira ocorrência vence
        node.children.forEach(function (c) { _buildNameDepthMap(c, map, depth + 1); });
      }
      if (result.treeA) _buildNameDepthMap(result.treeA, cmNameDepthMapA, 0);
      if (result.treeB) _buildNameDepthMap(result.treeB, cmNameDepthMapB, 0);

      renderCMLegend(result);

      if (result.treeA && result.treeB) {
        resizeCompareCanvas();
        _rebuildAndDraw(!savedCollapsed);  // live refresh: preservar scroll
      }
    }

    /**
     * Reconstrói o layout e redesenha.
     * @param {boolean} resetScroll — true apenas quando vem um novo resultado;
     *                                false (default) preserva o scroll actual.
     */
    function _rebuildAndDraw(resetScroll) {
      if (!compareResult || !compareResult.treeA) return;
      var dpr = window.devicePixelRatio || 1;
      var w   = cmCanvas ? cmCanvas.width / dpr : 0;
      if (w === 0) return;

      cmLayoutA = buildCMLayout(compareResult.treeA, 'a', w);
      cmLayoutB = buildCMLayout(compareResult.treeB, 'b', w);
      cmTotalH  = Math.max(cmLayoutA.height, cmLayoutB.height);

      if (resetScroll) {
        cmScrollY = 0;
      } else {
        // Manter posição de scroll, clamped ao novo conteúdo
        var viewH = cmCanvas ? cmCanvas.clientHeight : 0;
        cmScrollY = Math.max(0, Math.min(cmScrollY, Math.max(0, cmTotalH - viewH)));
      }

      redrawCompareCanvas();
    }
