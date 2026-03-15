// ─── Interacção com o canvas ─────────────────────────────

    /**
     * Converte coordenadas do evento de rato em coordenadas lógicas do canvas
     * (CSS pixels, com scroll aplicado).
     */
    function _cmEventCoords(e) {
      var rect = cmCanvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top + cmScrollY
      };
    }

    /**
     * Devolve o primeiro layer node que contém o ponto (lx, ly), ou null.
     * Só considera nós com filhos ou tokens (únicos que respondem a click).
     */
    function _cmHitLayerNode(lx, ly) {
      if (!cmLayoutA || !cmLayoutB) return null;
      var allNodes = cmLayoutA.nodes.concat(cmLayoutB.nodes);
      for (var i = 0; i < allNodes.length; i++) {
        var n = allNodes[i];
        if (n.type !== 'layer' || (!n.hasChildren && !n.hasTokens)) continue;
        if (lx >= n.x && lx <= n.x + n.w && ly >= n.y && ly <= n.y + n.h) {
          return n;
        }
      }
      return null;
    }

    /**
     * Click no canvas: colapsa ou expande a layer node clicada,
     * sincronizando com a contraparte no lado oposto (match por nome+profundidade).
     *
     * Colapsar — esconde tokens e subárvore de uma vez.
     * Expandir  — revela um nível: tokens da própria layer visíveis,
     *             filhos diretos com subárvore começam colapsados.
     */
    function handleCMCanvasClick(e) {
      var pos       = _cmEventCoords(e);
      // Click em token node — copiar nome completo
      var tokenNode = _cmHitTokenNode(pos.x, pos.y);
      if (tokenNode) {
        _cmCopyToClipboard(tokenNode.label);
        return;
      }
      var node = _cmHitLayerNode(pos.x, pos.y);
      if (!node) return;

      var counterpartId = _getCounterpartId(node.id, node.side);
      var otherSide     = node.side === 'a' ? 'b' : 'a';

      if (cmCollapsed[node.id]) {
        delete cmCollapsed[node.id];
        _collapseDirectChildren(node.id, node.side);
        if (counterpartId) {
          delete cmCollapsed[counterpartId];
          _collapseDirectChildren(counterpartId, otherSide);
        }
      } else {
        cmCollapsed[node.id] = true;
        if (counterpartId) cmCollapsed[counterpartId] = true;
      }

      _rebuildAndDraw();
    }

    /**
     * Coloca os filhos diretos de um nó em cmCollapsed (expand de um nível).
     */
    function _collapseDirectChildren(nodeId, side) {
      var tree = (side === 'a') ? compareResult.treeA : compareResult.treeB;
      if (!tree) return;
      function findAndCollapse(node) {
        if (node.id === nodeId) {
          node.children.forEach(function (child) {
            if (child.children.length > 0 || child.tokens.length > 0) {
              cmCollapsed[child.id] = true;
            }
          });
          return true;
        }
        for (var i = 0; i < node.children.length; i++) {
          if (findAndCollapse(node.children[i])) return true;
        }
        return false;
      }
      findAndCollapse(tree);
    }

    /**
     * Dado um nodeId num lado, devolve o id da contraparte no lado oposto.
     * Match por profundidade + nome (primeiro nó com mesmo nome à mesma profundidade).
     * Devolve null se não existir contraparte.
     */
    function _getCounterpartId(nodeId, side) {
      var ownTree      = (side === 'a') ? compareResult.treeA : compareResult.treeB;
      var counterMap   = (side === 'a') ? cmNameDepthMapB     : cmNameDepthMapA;
      if (!ownTree || !counterMap) return null;

      var found = null;
      function findDepthName(node, depth) {
        if (node.id === nodeId) { found = depth + ':' + node.name; return; }
        node.children.forEach(function (c) { if (!found) findDepthName(c, depth + 1); });
      }
      findDepthName(ownTree, 0);

      return found ? (counterMap[found] || null) : null;
    }

    /**
     * Hover no canvas: cursor pointer sobre layer node colapsável,
     * cursor default no resto.
     */
    function handleCMCanvasHover(e) {
      if (!cmLayoutA || !cmLayoutB) return;
      var pos       = _cmEventCoords(e);
      var tokenNode = _cmHitTokenNode(pos.x, pos.y);
      var layerNode = tokenNode ? null : _cmHitLayerNode(pos.x, pos.y);
      var hitNode   = tokenNode || layerNode;
      var hitId     = hitNode ? hitNode.id : null;

      cmCanvas.style.cursor = layerNode ? 'pointer' : 'default';

      // CM-I1: tooltip em token nodes; esconder nos outros
      if (tokenNode) {
        _cmScheduleTooltip(e, tokenNode);
      } else if (layerNode && layerNode.hasBroken) {
        _cmScheduleBrokenTooltip(e, layerNode);
      } else if (layerNode && layerNode.hasHardcoded) {
        _cmScheduleHardcodedTooltip(e, layerNode);
      } else {
        _cmHideTooltip();
      }

      // CM-I2: highlight + dimming com delay para não flicker no movimento rápido
      clearTimeout(_cmHoverTimer);
      if (hitId === cmHoveredId) return;  // sem mudança — nada a fazer

      if (!hitNode) {
        // Se o cursor está dentro do range Y de qualquer linha de token (incluindo gap abaixo),
        // manter hover — cobre gaps entre rows e centro entre A e B na mesma row
        if (cmHoveredId) {
          var allN = (cmLayoutA ? cmLayoutA.nodes : []).concat(cmLayoutB ? cmLayoutB.nodes : []);
          for (var ti = 0; ti < allN.length; ti++) {
            var tn = allN[ti];
            if (tn.type === 'token' && pos.y >= tn.y && pos.y <= tn.y + tn.h + CMR.tvg) {
              return;  // dentro do range Y de uma linha de token — não limpar hover
            }
          }
        }
        // Saiu da zona de tokens — limpar imediatamente
        _cmHoverTimer = null;
        cmHoveredId           = null;
        cmHoveredCounterpartId = null;
        redrawCompareCanvas();
      } else {
        _cmHoverTimer = setTimeout(function () {
          cmHoveredId = hitId;
          if (hitNode.type === 'token') {
            var otherLayout = hitNode.side === 'a' ? cmLayoutB : cmLayoutA;
            cmHoveredCounterpartId = null;
            if (otherLayout) {
              for (var i = 0; i < otherLayout.nodes.length; i++) {
                var on = otherLayout.nodes[i];
                if (on.type === 'token' && on.variableId === hitNode.variableId) {
                  cmHoveredCounterpartId = on.id;
                  break;
                }
              }
            }
          } else {
            cmHoveredCounterpartId = _getCounterpartId(hitNode.id, hitNode.side);
          }
          redrawCompareCanvas();
        }, 120);
      }
    }

// ─── Hit-test de token nodes ─────────────────────────────

    function _cmHitTokenNode(lx, ly) {
      if (!cmLayoutA || !cmLayoutB) return null;
      var allNodes = cmLayoutA.nodes.concat(cmLayoutB.nodes);
      for (var i = 0; i < allNodes.length; i++) {
        var n = allNodes[i];
        if (n.type !== 'token') continue;
        if (lx >= n.x && lx <= n.x + n.w && ly >= n.y && ly <= n.y + n.h) return n;
      }
      return null;
    }
