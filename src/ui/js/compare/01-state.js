// ─── Estado do canvas ───────────────────────────────────

    var cmCanvas     = null;
    var cmCtx        = null;
    var cmScrollY    = 0;
    var cmTotalH     = 0;
    var cmLayoutA    = null;  // { nodes, tokenNodeMap, height }
    var cmLayoutB    = null;
    var cmPairingMap = {};
    var cmRemovalIds = {};
    var cmAddonIds   = {};

    /**
     * Conjunto de IDs de layer nodes colapsados.
     * Clicar numa layer com filhos alterna o seu estado (colapsar / expandir).
     * Reset automático em cada novo resultado de comparação.
     *
     * ALTERNATIVAS não implementadas, documentadas aqui para referência futura:
     *
     * A — Drill-down (filtro de subárvore):
     *   Clicar numa layer isola a vista para essa layer e os seus descendentes.
     *   Ambos os lados são filtrados para mostrar só a subárvore correspondente.
     *   Útil para comparar partes específicas de dois componentes grandes.
     *   Implementação: guardar `cmFocusId` (id da layer activa), filtrar `walk()`
     *   para iniciar a partir desse nó, adicionar breadcrumb "↑ Voltar" no topo.
     *
     * C — Highlight / dim (destaque):
     *   Clicar numa layer destaca-a (opacidade 100%) e atenua o resto (~20%).
     *   As bezier lines de tokens não pertencentes a essa layer ficam invisíveis.
     *   Útil para focar numa layer específica sem perder o contexto global.
     *   Implementação: guardar `cmHighlightId`, passar flag `dimmed` a cada nó
     *   no redraw e aplicar `cmCtx.globalAlpha = 0.18` nos nós não destacados.
     */
    var cmCollapsed      = {};  // { [nodeId]: true }
    var cmNameDepthMapA  = {};  // { 'depth:name': nodeId } — para sincronizar expansão
    var cmNameDepthMapB  = {};
    var cmIsolateKinds   = [];   // kinds activos para isolate na legenda ([] = sem filtro, max 3)
    var cmFilterLayer    = '';   // texto de filtro por nome de layer (CM-I8)
    var cmFilterToken    = '';   // texto de filtro por nome de token (CM-I9)
    var _cmFilterTimer   = null; // debounce para os inputs de filtro
    var _cmDdBlurTimer        = null;  // debounce para esconder dropdown no blur
    var _cmSearchTimer        = null;  // debounce para enviar SEARCH_COMPONENTS ao backend
    var cmHoveredId           = null;  // ID do nó actualmente sob o cursor (CM-I2)
    var cmHoveredCounterpartId = null; // ID da contraparte do nó hovered
    var _cmTooltipEl          = null;  // elemento DOM do tooltip (CM-I1)
    var _cmTooltipTimer       = null;  // debounce para mostrar tooltip
    var _cmTooltipHideTimer   = null;  // grace period antes de esconder (permite mover rato para o tooltip)
    var _cmHoverTimer         = null;  // debounce para activar hover state (evitar flash no movimento rápido)
    var cmFocusedVariableId   = null;  // variableId do token em foco (double-click)
    var _cmRsX = 0, _cmRsY = 0, _cmRsW = 0, _cmRsH = 0, _cmRsDir = 'se';  // resize handle state
