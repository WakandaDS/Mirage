/**
 * ============================================================
 *  01-estado-global.js — Mirage: variáveis de estado global
 * ============================================================
 *
 *  Apenas o estado necessário para o Mirage standalone.
 *  Sem grafo, sem simulação física, sem câmara.
 * ============================================================
 */

    // ─── Paleta de cores para coleções ─────────────────────
    // ⚠️ DEAD CODE — PALETTE, collectionColors, collectionIndex
    // Usados apenas em 02-utilidades.js (getCollectionColor) que nunca é chamada.
    // Candidatos a remoção.
    var PALETTE = [
      '#89b4fa', '#a6e3a1', '#f9e2af', '#f38ba8',
      '#cba6f7', '#94e2d5', '#fab387', '#74c7ec',
      '#b4befe', '#eba0ac', '#f2cdcd', '#f5c2e7'
    ];

    var collectionColors = {};
    var collectionIndex  = 0;

    // ─── Estado do Compare Mode ─────────────────────────────

    /** Componente A seleccionado: { nodeId, name } ou null */
    var compareSlotA = null;

    /** Componente B seleccionado: { nodeId, name } ou null */
    var compareSlotB = null;

    /** Slot à espera de selecção do utilizador: 'a' | 'b' | null */
    var comparePendingSlot = null;

    /** Resultado do diff recebido do backend */
    var compareResult = null;

    // ⚠️ DEAD CODE — isMaximized nunca é lida nem escrita em nenhum ficheiro.
    var isMaximized = false;
