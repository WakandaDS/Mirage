/**
 * ============================================================
 *  04-comunicacao-figma.js — Mirage: comunicação backend
 * ============================================================
 */

    function post(msg) {
      parent.postMessage({ pluginMessage: msg }, '*');
    }

    window.onmessage = function (e) {
      var msg = e.data.pluginMessage;
      if (!msg) return;

      if (msg.type === 'ERROR') {
        var errEl = document.getElementById('error-message');
        var errView = document.getElementById('error-view');
        if (errEl) errEl.textContent = msg.message;
        if (errView) errView.style.display = 'flex';
        return;
      }

      if (msg.type === 'SELECTION_INFO') {
        fillCompareSlot(msg.nodeId, msg.name);
        return;
      }

      if (msg.type === 'COMPONENTS_LIST') {
        if (typeof _cmRenderDdResults === 'function') _cmRenderDdResults(msg.components || []);
        return;
      }

      if (msg.type === 'DOCUMENT_CHANGED') {
        if (typeof _cmHandleDocumentChanged === 'function') _cmHandleDocumentChanged();
        return;
      }

      if (msg.type === 'COMPARE_READY') {
        console.log('[Mirage] Compare diff recebido:', msg.data);
        try {
          renderCompareResult(msg.data);
        } catch (err) {
          console.error('[Mirage] Erro ao renderizar compare:', err);
          document.getElementById('cm-area').classList.remove('cm-loading');
        }
        return;
      }
    };
