/**
 * ============================================================
 *  02-utilidades.js — Funções utilitárias genéricas
 * ============================================================
 *
 *  Funções puras (sem efeitos secundários) usadas por vários
 *  módulos do plugin. Inclui:
 *    - Escape de HTML e atributos (segurança contra XSS)
 *    - Conversão de cores (hex → rgba)
 *    - Mapeamento de coleções para cores da paleta
 *    - Criação de imagens SVG para o canvas
 *
 *  Lê:      PALETTE, collectionColors, collectionIndex
 *  Escreve: collectionColors, collectionIndex
 *  Fornece: escHtml(), escAttr(), hexToRgba(),
 *           getCollectionColor(), makeSvgImg(), showView()
 * ============================================================
 */

    /**
     * Escapa caracteres especiais de HTML para prevenir XSS.
     * Converte &, <, >, " para as entidades HTML correspondentes.
     *
     * @param {string} s - Texto a escapar
     * @returns {string} Texto seguro para inserir em HTML
     *
     * @example escHtml('<script>') → '&lt;script&gt;'
     */
    function escHtml(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    // ⚠️ DEAD CODE — escAttr() nunca é chamada em nenhum ficheiro.
    function escAttr(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;');
    }

    // ⚠️ DEAD CODE — hexToRgba() nunca é chamada em nenhum ficheiro.
    function hexToRgba(hex, a) {
      var r = parseInt(hex.slice(1, 3), 16);
      var g = parseInt(hex.slice(3, 5), 16);
      var b = parseInt(hex.slice(5, 7), 16);
      return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    }

    // ⚠️ DEAD CODE — getCollectionColor() nunca é chamada. Depende de PALETTE (também dead).
    function getCollectionColor(colId) {
      if (!collectionColors[colId]) {
        collectionColors[colId] = PALETTE[collectionIndex % PALETTE.length];
        collectionIndex++;
      }
      return collectionColors[colId];
    }

    // ⚠️ DEAD CODE — makeSvgImg() nunca é chamada em nenhum ficheiro.
    function makeSvgImg(svgStr) {
      var img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
      return img;
    }

