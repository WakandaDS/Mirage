// ─── Layout do canvas ───────────────────────────────────

    /**
     * Constrói o array de nós posicionados para um lado do grafo.
     * DFS: cada layer ocupa uma linha vertical; tokens ficam ao lado
     * da sua layer, virados para o centro do canvas.
     *
     * @param {Object}   tree    - Árvore de layers do backend
     * @param {'a'|'b'}  side
     * @param {number}   canvasW - Largura lógica do canvas
     * @returns {{ nodes, tokenNodeMap, height }}
     */
    function buildCMLayout(tree, side, canvasW) {
      var nodes        = [];
      var tokenNodeMap = {};  // variableId → primeiro token node deste lado
      var y            = CMR.pad;
      var halfW        = canvasW / 2;
      var centerLeft   = halfW - CMR.cg / 2;   // limite direito de A
      var centerRight  = halfW + CMR.cg / 2;   // limite esquerdo de B

      function walk(node, depth) {
        // ── Filtros activos ──────────────────────────────
        var ftLayer = cmFilterLayer ? cmFilterLayer.toLowerCase() : '';
        var ftToken = cmFilterToken ? cmFilterToken.toLowerCase() : '';

        // Pular subárvore inteira se não houver match
        if (ftLayer && !_layerMatchesFilter(node, ftLayer)) return;
        if (ftToken && !_tokenMatchesFilter(node, ftToken)) return;

        // Pular subárvore se isolate filter activo e não houver conteúdo visível
        if (cmIsolateKinds.length > 0 && !_nodeHasVisibleContent(node, side)) return;

        // Tokens a mostrar (filtrado por nome se ftToken activo)
        var tokensToShow = ftToken
          ? node.tokens.filter(function (t) {
              return (t.variableName || '').toLowerCase().indexOf(ftToken) !== -1;
            })
          : node.tokens;

        // Filtrar tokens por kind isolado
        if (cmIsolateKinds.length > 0) {
          tokensToShow = tokensToShow.filter(function (t) {
            var k = _tokenKindForFilter(t.variableId, side);
            return k !== null && cmIsolateKinds.indexOf(k) !== -1;
          });
        }

        // Hardcoded — mostrar apenas se 'hardcoded' estiver no filtro (ou sem filtro)
        var hardcodedToShow = (cmIsolateKinds.length === 0 || cmIsolateKinds.indexOf('hardcoded') !== -1)
          ? (node.hardcoded || [])
          : [];

        var hasChildren  = node.children.length > 0;
        var hasHardcoded = !!(node.hardcoded && node.hardcoded.length > 0);
        var hasTokens    = tokensToShow.length > 0 || hardcodedToShow.length > 0;
        // Quando filtros activos, forçar expansão para revelar resultados
        var collapsed   = !!(cmCollapsed[node.id] && !ftLayer && !ftToken && cmIsolateKinds.length === 0);

        // ── Nó de layer ──────────────────────────────────
        var lx = (side === 'a')
          ? CMR.pad + depth * CMR.ind
          : canvasW - CMR.pad - CMR.lw - depth * CMR.ind;

        var ln = {
          id:          node.id,
          type:        'layer',
          nodeType:    node.nodeType,
          label:       node.name,
          side:        side,
          depth:       depth,
          x: lx,  y: y,
          w: CMR.lw, h: CMR.lh,
          tokenRefs:   [],
          hasChildren: hasChildren,
          hasTokens:   hasTokens,
          collapsed:   collapsed,
          hardcoded:   node.hardcoded || [],
          hasHardcoded: !!(node.hardcoded && node.hardcoded.length > 0),
          broken:      node.broken || [],
          hasBroken:   !!(node.broken && node.broken.length > 0)
        };
        nodes.push(ln);
        y += CMR.lh + CMR.vg;

        // ── Tokens e filhos (saltados se colapsado) ──────────
        if (!collapsed) {
          // Tokens: linha vertical por token, alinhados ao centro
          // Side A: row de (lx + ind) até centerLeft; círculo na borda direita
          // Side B: row de centerRight até (lx + lw - ind); círculo na borda esquerda
          tokensToShow.forEach(function (t) {
            var tx, tw, cx;
            if (side === 'a') {
              tx = lx + CMR.ind;
              tw = centerLeft - tx;
              cx = centerLeft - CMR.tr - 2;
            } else {
              tx = centerRight;
              tw = (lx + CMR.lw - CMR.ind) - centerRight;
              cx = centerRight + CMR.tr + 2;
            }

            var tn = {
              id:            node.id + '--t--' + t.variableId,
              type:          'token',
              variableId:    t.variableId,
              label:         t.variableName,
              property:      t.property,
              resolvedValue: t.resolvedValue || '',
              side:          side,
              x: tx, y: y, w: tw, h: CMR.th,
              cx: cx, cy: y + CMR.th / 2,
              r:  CMR.tr,
              parentId: node.id
            };
            nodes.push(tn);
            ln.tokenRefs.push(tn);

            if (!tokenNodeMap[t.variableId]) {
              tokenNodeMap[t.variableId] = tn;
            }

            y += CMR.th + CMR.tvg;
          });

          // Propriedades hardcoded — linha por valor, sem token associado
          hardcodedToShow.forEach(function (h) {
            var htx, htw, hcx;
            if (side === 'a') {
              htx = lx + CMR.ind; htw = centerLeft - htx; hcx = centerLeft - CMR.tr - 2;
            } else {
              htx = centerRight; htw = (lx + CMR.lw - CMR.ind) - centerRight; hcx = centerRight + CMR.tr + 2;
            }
            var hn = {
              id:       node.id + '--hc--' + h.property + '--' + h.value,
              type:     'hardcoded-prop',
              property: h.property,
              label:    h.value,
              side:     side,
              x: htx, y: y, w: htw, h: CMR.th,
              cx: hcx, cy: y + CMR.th / 2,
              r:  CMR.tr,
              parentId: node.id
            };
            nodes.push(hn);
            ln.tokenRefs.push(hn);
            y += CMR.th + CMR.tvg;
          });

          // CM-I6: estado vazio — layer sem tokens visíveis, sem hardcoded visível e sem filhos
          if (tokensToShow.length === 0 && hardcodedToShow.length === 0 && node.children.length === 0) {
            var ex = (side === 'a') ? lx + CMR.ind : centerRight;
            var ew = (side === 'a') ? centerLeft - ex : (lx + CMR.lw - CMR.ind) - centerRight;
            nodes.push({ type: 'empty', side: side, x: ex, y: y, w: ew, h: CMR.th });
            y += CMR.th + CMR.tvg;
          }

          node.children.forEach(function (child) {
            walk(child, depth + 1);
          });
        }
      }

      walk(tree, 0);
      return { nodes: nodes, tokenNodeMap: tokenNodeMap, height: y + CMR.pad };
    }
