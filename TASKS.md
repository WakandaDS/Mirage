# Mirage — Tasks

> Plugin Figma standalone de comparação de tokens entre componentes (β).
> Branch de desenvolvimento: `dev` → merge para `main` quando estável.

---

> **Regra de sessão:** Antes de qualquer alteração ao código, o Claude escreve aqui o que vai fazer (tarefa, ficheiros afetados, objetivo). Permite retomar entre sessões sem perder contexto.

---

## Em curso

<!--
Nenhuma tarefa em curso — pronto para próxima sessão.
-->

---

## Bugs abertos

<!--
### BN — [assunto principal]
- (descrição do problema)
- [ ] comportamento actual: ...
- [ ] comportamento esperado: ...
- [ ] como reproduzir: ...
- [ ] ficheiros afectados: ...
- [ ] fix: ...
- **Prioridade:** baixa | média | crítica
-->

Nenhum bug conhecido neste momento.

---

## Features em aberto

### CM-I5 — Scroll sincronizado entre lados
- Os dois lados (A e B) partilham `cmScrollY` mas a altura das subárvores pode divergir — ao colapsar/expandir um lado, as layers correspondentes desalinham-se visualmente.
- [ ] Investigar se âncoras de alinhamento por layer matched fazem sentido, ou se scroll unificado é suficiente.
- [ ] Alternativa: indicadores visuais de "fora de vista" no centro da bezier quando a contraparte está fora do viewport.
- **Prioridade:** baixa

### CM-I7 — Animação de expand/collapse
- Transição suave da altura da subárvore ao expandir ou colapsar um nó de layer.
- [ ] Interpolação de `y` durante N frames no canvas (sem CSS — tudo 2D).
- [ ] Garantir que as bezier lines também animam durante a transição.
- **Prioridade:** baixa

### F8.3 — Component Set vs Component Set
- O plugin compara actualmente dois componentes individuais. Falta suporte para comparar dois component sets inteiros, emparelhando automaticamente os componentes antes do diff.
- [ ] Emparelhamento automático por score composto: nome similarity (40%) + token overlap (35%) + variant structure (25%).
- [ ] Score ≥ 0.7 → emparelhado automaticamente; abaixo → marcado como "unmatched" para decisão manual.
- [ ] UI de revisão de pares: lista de emparelhamentos + interface para resolver os "unmatched".
- [ ] Backend: novo handler `COMPARE_SETS` ou extensão do `COMPARE` existente.
- **Prioridade:** média

### F8.4 — Kind `remapped`
- O spec original previa um quinto kind: `remapped` — nome e valor diferentes, mas posição estrutural e role visual inferidos como equivalentes. Não foi implementado no backend.
- [ ] Definir critério de inferência (posição DFS + tipo de campo + valor próximo?).
- [ ] Implementar em `code.ts` após o diff exact/renamed/drifted.
- [ ] Cor e estilo de linha para o kind `remapped` (ainda não definidos).
- **Prioridade:** baixa — depende do feedback real de uso

### FO — Focus overlay (double-click)
- Duplo-clique num token node chama `_cmOpenFocusOverlay(variableId)` e guarda `cmFocusedVariableId`. A função existe mas o overlay visual não está completamente implementado.
- [ ] Verificar estado actual de `_cmOpenFocusOverlay` no `14-compare-mode.js`.
- [ ] Definir o que o overlay deve mostrar: ambas as instâncias do token (lado A e lado B), valores resolvidos, e possívelmente a bezier line isolada.
- **Prioridade:** baixa

---

## Design / UI

<!--
### DN — [nome da ideia visual]
- (descrição: o que se quer mudar e porquê)
- ![[imagem opcional]]
- > link Figma opcional
- **Estado:** ideia | mockup pronto | em implementação
-->

Nenhuma ideia de design pendente neste momento.

---

## Feito (histórico)

- [x] Backend `code.ts` — `extractTokens()` + `collectLayerTree()` — recolhe todos os token bindings por layer recursivamente
- [x] Backend `code.ts` — handler `COMPARE`: diff completo, produz `{ pairings, removals, addons, treeA, treeB }` com kinds `exact / renamed / drifted / removal / addon`
- [x] Backend `code.ts` — handler `SEARCH_COMPONENTS`: pesquisa componentes por nome na página activa (COMPONENT, COMPONENT_SET, FRAME), máximo 60 resultados
- [x] Backend `code.ts` — handler `GET_SELECTION` + `CANCEL_COMPARE_SELECTION` + listener `selectionchange`
- [x] UI `14-compare-mode.js` — canvas renderer: DPR-aware, `buildCMLayout()`, `redrawCompareCanvas()`, scroll por wheel
- [x] UI — Layer tree DFS com expand/collapse; estado `cmCollapsed`; sincronização A↔B por `depth:name`
- [x] UI — Token nodes como linhas verticais com label + circle; bezier lines codificadas por kind
- [x] UI — Hover: `cmHoveredId` + `cmHoveredCounterpartId`; highlight par + atenuar resto (CM-I2)
- [x] UI — Tooltip ao hover no token node: nome + valor resolvido + property; grace period 120ms / delay 350ms (CM-I1)
- [x] UI — Autocomplete de slots: input + dropdown com ArrowKey, Enter, blur handling, loading state `…`
- [x] UI — Swap A ↔ B (`cm-vs`) com animação CSS de rotação; re-corre comparação automaticamente
- [x] UI — Expand-all ⊞ (`cm-expand-all`) — abre toda a árvore (CM-I3)
- [x] UI — Reset view ↺ (`cm-reset`) — limpa isolate, colapsa ao estado inicial, scroll ao topo (CM-I10)
- [x] UI — Live refresh: intervalo de 3s, `_cmLiveRefresh` preserva `cmCollapsed` e scroll position
- [x] UI — Legenda interactiva: contagens por kind, click-to-isolate, atenua kinds não seleccionados (CM-I11)
- [x] UI — Filtro por nome de layer: debounce 150ms, ancestrais de matches ficam visíveis (CM-I8)
- [x] UI — Filtro por nome de token: lado a lado com CM-I8; layers sem tokens matching são ocultadas (CM-I9)
- [x] UI — Property label subtil 8px/30% por baixo do token name; lado B com `textAlign right` (CM-I4 / CM-I4b)
- [x] UI — Nó `'empty'` com "— sem tokens —" quando layer expandida sem tokens nem filhos (CM-I6)
- [x] UI — Ícone `β` italic no botão de acesso; hover violeta `rgba(151,71,255,0.9)` (CM-13)
- [x] Reestruturação em plugin standalone: separado do TokenWizard, manifest próprio, sem dependências partilhadas
- [x] Refactoring JS: Monólito de 1900 linhas `14-compare-mode.js` dividido em 13 módulos focados em `src/ui/js/compare/`.
- [x] Refactoring Base: Source e build devidamente organizados em pastas semânticas (`src/backend`, `src/ui/styles`, `dist`).
- [x] UI — Component Sets não exibem props `hardcoded` enganadoras (ex: roxo #9747FF ou Radius 5px).
- [x] UI — Hierarchy distinguida por fontes tipográficas do Figma (`Component Set` vs `Component` vs `Variant` solta).
