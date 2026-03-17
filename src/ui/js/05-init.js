/**
 * ============================================================
 *  13-inicializacao.js — Mirage: inicialização do plugin
 * ============================================================
 *
 *  O script corre no final do <body>, após o DOM estar pronto.
 *  Chamar initCompareMode() directamente — sem DOMContentLoaded,
 *  que pode já ter disparado no contexto de iframe do Figma.
 * ============================================================
 */

    initCompareMode();

    // ─── Drag handle ─────────────────────────────────────────────────
    ;(function () {
      var handle = document.getElementById('cm-drag-handle')
      if (!handle) return
      var dragStart = null

      handle.addEventListener('pointerdown', function (e) {
        e.preventDefault()
        dragStart = { x: e.screenX, y: e.screenY }
        handle.setPointerCapture(e.pointerId)
        handle.classList.add('dragging')
      })

      handle.addEventListener('pointermove', function (e) {
        if (!dragStart) return
        var dx = e.screenX - dragStart.x
        var dy = e.screenY - dragStart.y
        dragStart = { x: e.screenX, y: e.screenY }
        parent.postMessage({ pluginMessage: { type: 'MOVE', dx: dx, dy: dy } }, '*')
      })

      handle.addEventListener('pointerup', function () {
        dragStart = null
        handle.classList.remove('dragging')
      })
    })()
