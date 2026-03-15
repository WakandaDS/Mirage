// ─── Live refresh ────────────────────────────────────────

    var _cmLiveActive   = false;
    var _cmLiveRefresh  = false;  // true durante refresh automático — preserva collapsed
    var _cmLiveDebounce = null;   // debounce para DOCUMENT_CHANGED

    function _cmSetLive(on) {
      _cmLiveActive = on;
      if (!on) { clearTimeout(_cmLiveDebounce); _cmLiveDebounce = null; }
      post({ type: 'SET_LIVE', active: on });
    }

    function _cmHandleDocumentChanged() {
      if (!_cmLiveActive || !compareSlotA || !compareSlotB) return;
      clearTimeout(_cmLiveDebounce);
      _cmLiveDebounce = setTimeout(function () {
        _cmLiveRefresh = true;
        runCompare();
      }, 400);
    }
