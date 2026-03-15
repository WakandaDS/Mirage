// ─── Cores por tipo de match ────────────────────────────

    var CM_COLORS = {
      exact:     '#22c55e',
      renamed:   '#eab308',
      drifted:   '#f97316',
      removal:   '#ef4444',
      addon:     '#3b82f6',
      hardcoded: '#6b7280',
      broken:    '#f59e0b'
    };

    // ─── Constantes de layout do canvas ─────────────────────

    var CMR = {
      pad:  12,   // padding de topo e lateral do canvas
      ind:  14,   // indentação adicional por nível de profundidade
      lw:   108,  // largura do nó de layer
      lh:   22,   // altura do nó de layer
      lr:   4,    // border-radius do nó de layer
      vg:   6,    // gap vertical entre linhas de layer
      th:   33,   // altura de uma linha de token (vertical layout)
      tvg:  3,    // gap vertical entre linhas de token
      tr:   5,    // raio do círculo de token
      cg:   52    // largura da zona central reservada para bezier lines
    };
