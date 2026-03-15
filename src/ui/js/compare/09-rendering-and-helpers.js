// ─── Desenho do canvas ───────────────────────────────────

    /**
     * Apaga e redesenha todo o canvas (ambos os lados + linhas de ligação).
     */
    function redrawCompareCanvas() {
      if (!cmCtx || !cmCanvas || !cmLayoutA || !cmLayoutB) return;

      var dpr = window.devicePixelRatio || 1;
      var w   = cmCanvas.width  / dpr;
      var h   = cmCanvas.height / dpr;

      cmCtx.save();
      cmCtx.clearRect(0, 0, w, h);
      cmCtx.translate(0, -cmScrollY);

      var allNodes = cmLayoutA.nodes.concat(cmLayoutB.nodes);

      // variableId do token em hover (para destacar a linha de ligação)
      var cmHoveredVarId = null;
      if (cmHoveredId) {
        for (var hi = 0; hi < allNodes.length; hi++) {
          if (allNodes[hi].id === cmHoveredId && allNodes[hi].type === 'token') {
            cmHoveredVarId = allNodes[hi].variableId;
            break;
          }
        }
      }

      // ── Indent guides: linha vertical da layer até ao último token ──
      // Substitui as arestas layer→token; a hierarquia é clara por indentação.
      cmCtx.lineWidth   = 1;
      cmCtx.strokeStyle = 'rgba(255,255,255,0.08)';
      allNodes.forEach(function (n) {
        if (n.type !== 'layer' || n.tokenRefs.length === 0) return;
        var lastTn = n.tokenRefs[n.tokenRefs.length - 1];
        var guideX = (n.side === 'a')
          ? n.x + CMR.ind - 4
          : n.x + n.w - CMR.ind + 4;
        cmCtx.beginPath();
        cmCtx.moveTo(guideX, n.y + n.h);
        cmCtx.lineTo(guideX, lastTn.y + lastTn.h);
        cmCtx.stroke();
      });

      // ── Bezier lines entre tokens matched (A ↔ B) ────────
      Object.keys(cmPairingMap).forEach(function (varId) {
        var p     = cmPairingMap[varId];
        var nodeA = cmLayoutA.tokenNodeMap[varId];
        var nodeB = cmLayoutB.tokenNodeMap[varId];
        if (!nodeA || !nodeB) return;

        if (cmIsolateKinds.length > 0 && cmIsolateKinds.indexOf(p.kind) === -1) return;
        var hovered     = cmHoveredVarId === varId;
        var hoverDimLine = !!(cmHoveredVarId && !hovered);
        var color       = CM_COLORS[p.kind] || CM_COLORS.exact;
        var x1 = nodeA.cx + nodeA.r;
        var y1 = nodeA.cy;
        var x2 = nodeB.cx - nodeB.r;
        var y2 = nodeB.cy;
        var mx = (x1 + x2) / 2;

        cmCtx.beginPath();
        cmCtx.moveTo(x1, y1);
        cmCtx.bezierCurveTo(mx, y1, mx, y2, x2, y2);
        cmCtx.strokeStyle = color;
        cmCtx.globalAlpha = hoverDimLine ? 0.1 : hovered ? 1 : 0.65;
        cmCtx.lineWidth   = hovered ? 2.5 : 1.5;
        cmCtx.stroke();
        cmCtx.globalAlpha = 1;
      });

      // ── Removal lines (tracejado de A para o centro) ──────
      cmCtx.setLineDash([3, 3]);
      Object.keys(cmRemovalIds).forEach(function (varId) {
        var nodeA = cmLayoutA.tokenNodeMap[varId];
        if (!nodeA) return;
        if (cmIsolateKinds.length > 0 && cmIsolateKinds.indexOf('removal') === -1) return;
        var x1 = nodeA.cx + nodeA.r;
        var y1 = nodeA.cy;
        var x2 = x1 + 22;

        cmCtx.beginPath();
        cmCtx.moveTo(x1, y1);
        cmCtx.lineTo(x2, y1);
        cmCtx.strokeStyle = CM_COLORS.removal;
        cmCtx.globalAlpha = 0.4;
        cmCtx.lineWidth   = 1.5;
        cmCtx.stroke();
        cmCtx.globalAlpha = 1;
      });
      cmCtx.setLineDash([]);

      // ── Desenhar nós ──────────────────────────────────────
      allNodes.forEach(function (n) {
        var hoverDim = !!(cmHoveredId && n.id !== cmHoveredId && n.id !== cmHoveredCounterpartId);
        if      (n.type === 'layer')         drawCMLayerNode(n, hoverDim);
        else if (n.type === 'empty')         drawCMEmptyNode(n);
        else if (n.type === 'hardcoded-prop') drawCMHardcodedPropNode(n, hoverDim);
        else                                  drawCMTokenNode(n, hoverDim);
      });

      cmCtx.restore();
    }

    /**
     * Desenha um nó de layer (rounded rect com ícone + nome).
     */
    function drawCMLayerNode(n, hoverDim) {
      var ctx   = cmCtx;
      var isComp = (n.nodeType === 'COMPONENT' || n.nodeType === 'COMPONENT_SET' || n.nodeType === 'INSTANCE' || n.nodeType === 'VARIANT');

      ctx.save();
      if (hoverDim) ctx.globalAlpha = 0.2;

      // Escolher paleta consoante o estado do nó
      var bgFill, bgStroke, iconColor, labelColor, strokeDash;
      if (n.hasBroken) {
        bgFill    = 'rgba(245,158,11,0.12)';
        bgStroke  = 'rgba(245,158,11,0.65)';
        iconColor = 'rgba(245,158,11,0.8)';
        labelColor= 'rgba(255,255,255,0.65)';
        strokeDash= [3, 2];
      } else if (n.hasHardcoded) {
        bgFill    = 'rgba(107,114,128,0.13)';
        bgStroke  = 'rgba(107,114,128,0.45)';
        iconColor = 'rgba(107,114,128,0.75)';
        labelColor= 'rgba(255,255,255,0.5)';
        strokeDash= [3, 2];
      } else if (isComp) {
        bgFill    = 'rgba(151,71,255,0.12)';
        bgStroke  = 'rgba(151,71,255,0.38)';
        iconColor = 'rgba(151,71,255,0.9)';
        labelColor= 'rgba(255,255,255,0.82)';
        strokeDash= [];
      } else {
        bgFill    = 'rgba(255,255,255,0.06)';
        bgStroke  = 'rgba(255,255,255,0.14)';
        iconColor = 'rgba(255,255,255,0.4)';
        labelColor= 'rgba(255,255,255,0.82)';
        strokeDash= [];
      }

      // Background + border (passe único)
      roundRect(ctx, n.x, n.y, n.w, n.h, CMR.lr);
      ctx.fillStyle   = bgFill;
      ctx.fill();
      ctx.strokeStyle = bgStroke;
      ctx.lineWidth   = 1;
      if (strokeDash.length) ctx.setLineDash(strokeDash);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ícone
      var iconMap = { COMPONENT_SET: '❖', COMPONENT: '❖', VARIANT: '◇', INSTANCE: '◈', FRAME: '#', GROUP: '⊞', SECTION: '▣' };
      var icon    = iconMap[n.nodeType] || '·';
      ctx.font          = '10px Inter, -apple-system, sans-serif';
      ctx.textBaseline  = 'middle';
      ctx.fillStyle     = iconColor;

      var hasChevron = n.hasChildren || n.hasTokens;
      // Lado A: ícone à esquerda (x+6), label a seguir (x+20), chevron à direita
      // Lado B: chevron à esquerda (x+4), label a seguir, ícone à direita (x+w-18)
      var iconX, labelX, maxLW;
      if (n.side === 'a') {
        iconX  = n.x + 6;
        labelX = n.x + 20;
        maxLW  = hasChevron ? n.w - 36 : n.w - 26;
      } else {
        iconX  = n.x + n.w - 18;
        labelX = n.x + (hasChevron ? 16 : 6);
        maxLW  = hasChevron ? n.w - 36 : n.w - 26;
      }

      ctx.fillText(icon, iconX, n.y + n.h / 2);

      // Nome
      ctx.fillStyle = labelColor;
      var truncated = truncateText(ctx, n.label, maxLW);
      if (n.side === 'b') {
        // CM-I4b: lado B — label alinhado à direita, antes do ícone
        ctx.textAlign = 'right';
        ctx.fillText(truncated, n.x + n.w - 22, n.y + n.h / 2);
        ctx.textAlign = 'left';
      } else {
        ctx.fillText(truncated, labelX, n.y + n.h / 2);
      }

      // Chevron collapse/expand (▸ colapsado · ▾ expandido)
      if (hasChevron) {
        var chevron  = n.collapsed ? '▸' : '▾';
        var chevronX = (n.side === 'a') ? n.x + n.w - 12 : n.x + 4;
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillText(chevron, chevronX, n.y + n.h / 2);
      }

      // CM-I2: highlight quando é a contraparte do nó hovered
      if (n.id === cmHoveredCounterpartId) {
        ctx.globalAlpha = 1;
        roundRect(ctx, n.x - 3, n.y - 3, n.w + 6, n.h + 6, CMR.lr + 3);
        ctx.fillStyle   = 'rgba(140,100,255,0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(170,130,255,0.95)';
        ctx.lineWidth   = 2;
        ctx.stroke();
      }

      ctx.restore();
    }

    /**
     * Desenha uma linha de propriedade hardcoded (sem token associado).
     * Visual idêntico ao token node mas com círculo cinzento e label = valor.
     */
    function drawCMHardcodedPropNode(n, hoverDim) {
      var ctx   = cmCtx;
      var color = CM_COLORS.hardcoded;

      ctx.save();
      ctx.globalAlpha = hoverDim ? 0.2 : 1;

      // Fundo da linha
      roundRect(ctx, n.x, n.y, n.w, n.h, 3);
      ctx.fillStyle = '#252525';
      ctx.fill();

      // Círculo — oco (apenas borda) para distinguir de token com variável
      ctx.beginPath();
      ctx.arc(n.cx, n.cy, n.r, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      // Label: valor (e.g. "#FF0000", "8px", "80%")
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = 'rgba(107,114,128,0.9)';

      if (n.side === 'a') {
        var maxLW = n.cx - n.r - 4 - (n.x + 4);
        ctx.font = '11px Inter, -apple-system, sans-serif';
        ctx.fillText(truncateText(ctx, n.label, maxLW), n.x + 4, n.cy - 6);
        ctx.font      = '8px Inter, -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(107,114,128,0.55)';
        ctx.fillText(truncateText(ctx, n.property, maxLW), n.x + 4, n.cy + 5);
      } else {
        var maxLW = (n.x + n.w - 4) - (n.cx + n.r + 4);
        ctx.textAlign = 'right';
        ctx.font = '11px Inter, -apple-system, sans-serif';
        ctx.fillText(truncateText(ctx, n.label, maxLW), n.x + n.w - 4, n.cy - 6);
        ctx.font      = '8px Inter, -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(107,114,128,0.55)';
        ctx.fillText(truncateText(ctx, n.property, maxLW), n.x + n.w - 4, n.cy + 5);
        ctx.textAlign = 'left';
      }

      ctx.restore();
    }

    /**
     * CM-I6: nó de estado vazio — layer expandida sem tokens nem filhos.
     */
    function drawCMEmptyNode(n) {
      var ctx = cmCtx;
      ctx.font         = '9px Inter, -apple-system, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = 'rgba(255,255,255,0.2)';
      if (n.side === 'b') {
        ctx.textAlign = 'right';
        ctx.fillText('— sem tokens —', n.x + n.w - 4, n.y + n.h / 2);
        ctx.textAlign = 'left';
      } else {
        ctx.fillText('— sem tokens —', n.x + 4, n.y + n.h / 2);
      }
    }

    /**
     * Devolve o kind de um token node ('exact','renamed','drifted','removal','addon')
     * ou null se o token não pertencer a este lado.
     */
    function _tokenNodeKind(n) {
      var pairing = cmPairingMap[n.variableId];
      if (pairing) return pairing.kind;
      if (cmRemovalIds[n.variableId] && n.side === 'a') return 'removal';
      if (cmAddonIds[n.variableId]   && n.side === 'b') return 'addon';
      return null;
    }

    /**
     * Desenha um nó de token como linha vertical:
     *   Side A: [label ················ ●]  (círculo na borda direita, junto ao centro)
     *   Side B: [● ················ label]  (círculo na borda esquerda, junto ao centro)
     * Atenua o nó se cmIsolateKind estiver activo e o kind não corresponder.
     */
    function drawCMTokenNode(n, hoverDim) {
      var ctx = cmCtx;

      // Determinar cor e kind
      var kind = _tokenNodeKind(n);
      if (!kind) return;  // token que não pertence a este lado — não desenhar

      var color = CM_COLORS[kind] || CM_COLORS.exact;

      ctx.save();
      ctx.globalAlpha = hoverDim ? 0.2 : 1;

      // Fundo da linha
      roundRect(ctx, n.x, n.y, n.w, n.h, 3);
      ctx.fillStyle = '#252525';
      ctx.fill();

      // Círculo
      ctx.beginPath();
      ctx.arc(n.cx, n.cy, n.r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      // Label: último segmento do nome (após /)
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = 'rgba(255,255,255,0.65)';

      if (n.side === 'a') {
        var maxLW = n.cx - n.r - 4 - (n.x + 4);
        ctx.font = '11px Inter, -apple-system, sans-serif';
        ctx.fillText(truncateText(ctx, n.label, maxLW), n.x + 4, n.cy - 6);
        if (n.property) {
          ctx.font      = '8px Inter, -apple-system, sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.fillText(truncateText(ctx, n.property, maxLW), n.x + 4, n.cy + 5);
        }
      } else {
        var maxLW = (n.x + n.w - 4) - (n.cx + n.r + 4);
        ctx.textAlign = 'right';
        ctx.font = '11px Inter, -apple-system, sans-serif';
        ctx.fillText(truncateText(ctx, n.label, maxLW), n.x + n.w - 4, n.cy - 6);
        if (n.property) {
          ctx.font      = '8px Inter, -apple-system, sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.fillText(truncateText(ctx, n.property, maxLW), n.x + n.w - 4, n.cy + 5);
        }
        ctx.textAlign = 'left';
      }

      // CM-I2: highlight quando é a contraparte do nó hovered
      if (n.id === cmHoveredCounterpartId) {
        ctx.globalAlpha = 1;
        var hlColor = CM_COLORS[kind] || 'rgba(170,130,255,1)';
        // Fundo da linha
        roundRect(ctx, n.x - 1, n.y - 1, n.w + 2, n.h + 2, 4);
        ctx.fillStyle = 'rgba(140,100,255,0.15)';
        ctx.fill();
        // Anel extra no círculo
        ctx.beginPath();
        ctx.arc(n.cx, n.cy, n.r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = hlColor;
        ctx.lineWidth   = 2;
        ctx.stroke();
      }

      ctx.restore();
    }

// ─── Helpers de canvas ───────────────────────────────────

    /** Cria o path de um rectângulo com cantos arredondados. */
    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y,     x + w, y + r,     r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x,     y + h, x,     y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x,     y,     x + r, y,          r);
      ctx.closePath();
    }

    /** Trunca texto ao comprimento máximo em píxeis; adiciona '…'. */
    function truncateText(ctx, text, maxW) {
      if (ctx.measureText(text).width <= maxW) return text;
      while (text.length > 0 && ctx.measureText(text + '…').width > maxW) {
        text = text.slice(0, -1);
      }
      return text + '…';
    }
