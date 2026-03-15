// ─── Helpers de filtro (CM-I8 / CM-I9) ──────────────────

    /**
     * Devolve true se o nó ou qualquer descendente tiver nome que contém ft.
     * Usado para manter os ancestrais visíveis quando há um match em descendente.
     */
    function _layerMatchesFilter(node, ft) {
      if (node.name.toLowerCase().indexOf(ft) !== -1) return true;
      return node.children.some(function (c) { return _layerMatchesFilter(c, ft); });
    }

    /**
     * Devolve true se o nó ou qualquer descendente tiver tokens cujo nome contém ft.
     */
    function _tokenMatchesFilter(node, ft) {
      if (node.tokens.some(function (t) {
        return (t.variableName || '').toLowerCase().indexOf(ft) !== -1;
      })) return true;
      return node.children.some(function (c) { return _tokenMatchesFilter(c, ft); });
    }

// ─── Helpers de isolate por kind ────────────────────────

    /**
     * Devolve o kind de um token dado o seu variableId e o lado do canvas.
     * Consulta cmPairingMap, cmRemovalIds e cmAddonIds (populados no render).
     */
    function _tokenKindForFilter(variableId, side) {
      if (cmPairingMap[variableId]) return cmPairingMap[variableId].kind;
      if (cmRemovalIds[variableId] && side === 'a') return 'removal';
      if (cmAddonIds[variableId]   && side === 'b') return 'addon';
      return null;
    }

    /**
     * Devolve true se o nó (ou qualquer descendente) tiver conteúdo
     * visível dado o filtro cmIsolateKinds activo.
     * Quando cmIsolateKinds está vazio, devolve sempre true.
     */
    function _nodeHasVisibleContent(node, side) {
      if (cmIsolateKinds.length === 0) return true;
      if (node.tokens.some(function (t) {
        var k = _tokenKindForFilter(t.variableId, side);
        return k !== null && cmIsolateKinds.indexOf(k) !== -1;
      })) return true;
      if (cmIsolateKinds.indexOf('hardcoded') !== -1 && node.hardcoded && node.hardcoded.length > 0) return true;
      if (cmIsolateKinds.indexOf('broken')    !== -1 && node.broken    && node.broken.length    > 0) return true;
      return node.children.some(function (c) { return _nodeHasVisibleContent(c, side); });
    }
