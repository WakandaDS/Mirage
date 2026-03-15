# Features do Mirage
#mirage #features

> [!NOTE]
> Catálogo completo de todas as funcionalidades implementadas no plugin, com referência ao código fonte e IDs de tracking do `TASKS.md`.

---

## 🔍 Selecção de Componentes

### Slots A e B
Dois selectores na barra de topo permitem escolher os componentes a comparar.

**Como funciona:**
1. O utilizador clica num slot → plugin envia `GET_SELECTION` ao backend
2. Backend captura `figma.currentPage.selection[0]` e devolve `SELECTION_INFO`
3. Frontend preenche o slot com `{ nodeId, name }`
4. Quando **ambos** os slots estão preenchidos → `runCompare()` automático

**Código:**
- Backend: `code.ts` → handler `GET_SELECTION` (L258-L265)
- Frontend: `14-compare-mode.js` → `selectSlot()`, `fillCompareSlot()`, `updateSlotUI()` (L420-L473)

### Autocomplete por pesquisa
Input de texto nos slots com dropdown de resultados do Figma.

**Como funciona:**
1. Utilizador escreve ≥ 3 caracteres → debounce 200ms → envia `SEARCH_COMPONENTS`
2. Backend pesquisa com `figma.root.findAll()` (COMPONENT, COMPONENT_SET, FRAME) → max 60 resultados
3. Frontend renderiza dropdown com `_cmRenderDdResults()`
4. Navegação: ArrowUp/Down, Enter para seleccionar, Escape para fechar

**Código:**
- Backend: `code.ts` → handler `SEARCH_COMPONENTS` (L276-L293)
- Frontend: `14-compare-mode.js` → `_cmSetupSlotInput()`, `_cmRenderDdResults()`, `_cmNavDd()` (L207-L327)

### Swap A ↔ B
Botão central troca os dois componentes e re-corre a comparação.

**Código:** `14-compare-mode.js` → `_cmSwapSlots()` (L539-L554)

---

## ⚡ Motor de Diff

### Extracção de tokens
O backend percorre recursivamente a árvore de layers e extrai todos os `boundVariables` de cada nó.

**Campos extraídos:**
- `variableId`, `variableName`, `property`, `resolvedValue`, `variableType`
- Propriedades cobertas: fills, strokes, effects, opacity, cornerRadius, padding, spacing, dimensions, typography, strokeWeight, visible

**Código:** `code.ts` → `extractTokens()` (L80-L123), `BINDABLE_FIELDS` (L35-L46)

### Detecção de hardcoded
Identifica propriedades com valores definidos mas **sem** token binding.

**Detecta:**
- fills/strokes SOLID sem binding (mostra cor hex)
- opacity ≠ 1 sem binding (mostra %)
- cornerRadius > 0 sem binding (mostra px)

**Código:** `code.ts` → `detectHardcoded()` (L125-L171)

### Detecção de broken refs
Referências a variáveis Figma que já não existem (deletadas ou de library desconectada).

**Código:** `code.ts` → dentro de `extractTokens()` — quando `getVariableByIdAsync()` retorna null (L96-L98)

### Classificação por diff
Compara os dois mapas de tokens e classifica cada variableId.

> [!IMPORTANT]
> Ver [[logica-ligacoes-tokens]] para explicação completa com diagramas.

| Kind | Condição |
|------|----------|
| `exact` | Mesmo variableId, mesmo nome, mesmo valor |
| `renamed` | Mesmo variableId, nomes diferentes |
| `drifted` | Mesmo variableId, mesmo nome, valores diferentes |
| `removal` | variableId só existe em A |
| `addon` | variableId só existe em B |

**Código:** `code.ts` → handler `COMPARE` (L295-L338)

---

## 🎨 Canvas Renderer

### Layout engine
Constrói posições (x, y, w, h) para todos os nós via DFS na árvore de layers.

**Estrutura do layout:**
```
Side A:                              Side B:
  [Layer] ────────── [token ●]  ←bezier→  [● token] ────────── [Layer]
  [Layer] ────────── [token ●]             [● token] ────────── [Layer]
       └ [Child Layer]                          [Child Layer] ┘
```

- Lado A: layers à esquerda, tokens à direita (alinhados ao centro)
- Lado B: espelhado — layers à direita, tokens à esquerda
- Zona central: bezier lines entre pairings

**Constantes de layout (objecto `CMR`):**
| Prop | Valor | Significado |
|------|-------|-------------|
| `pad` | 12 | Padding do canvas |
| `ind` | 14 | Indentação por nível |
| `lw` | 108 | Largura do nó de layer |
| `lh` | 22 | Altura do nó de layer |
| `th` | 33 | Altura de uma linha de token |
| `cg` | 52 | Largura da zona central |
| `tr` | 5 | Raio do círculo de token |

**Código:** `14-compare-mode.js` → `buildCMLayout()` (L856-L1007)

### Desenho de nós

| Tipo de nó | Função | Visual |
|------------|--------|--------|
| Layer | `drawCMLayerNode()` | Rounded rect com ícone + nome + chevron |
| Token | `drawCMTokenNode()` | Linha com label + círculo colorido |
| Hardcoded | `drawCMHardcodedPropNode()` | Linha com círculo oco cinzento |
| Empty | `drawCMEmptyNode()` | Texto "— sem tokens —" |

**Paleta visual de layers:**
- Componente/Instance: violeta (`rgba(151,71,255,...)`)
- Broken ref: âmbar (`rgba(245,158,11,...)`, tracejado)
- Hardcoded: cinzento (`rgba(107,114,128,...)`, tracejado)
- Default: branco subtil (`rgba(255,255,255,...)`)

**Código:** `14-compare-mode.js` (L1118-L1372)

### Bezier lines
Linhas curvas entre tokens matched, codificadas por cor.

**Código:** `14-compare-mode.js` → `redrawCompareCanvas()` (L1055-L1080)

### Indent guides
Linhas verticais subtis da layer até ao último token, indicando hierarquia.

**Código:** `14-compare-mode.js` → dentro de `redrawCompareCanvas()` (L1039-L1053)

---

## 🖱️ Interacção

### Expand / Collapse (click)
Clicar numa layer com filhos alterna entre expandido e colapsado. A acção é **sincronizada** entre os dois lados (A e B) por `depth:name`.

**Mecanismo de sincronização:**
1. Ao receber resultado, constrói `cmNameDepthMapA` e `cmNameDepthMapB`: `{ "0:ComponentName": nodeId, "1:Frame": nodeId, ... }`
2. Ao expandir/colapsar uma layer no lado A, encontra a contraparte em B com o mesmo `depth:name`
3. Aplica a mesma acção à contraparte

**Estado inicial:** Root expandido, todos os outros colapsados.

**Código:** `14-compare-mode.js` → `handleCMCanvasClick()` (L1413-L1463), `_getCounterpartId()` (L1470-L1483)

### Expand All ⊞ (CM-I3)
Botão que expande toda a árvore de ambos os lados.

**Código:** `14-compare-mode.js` → `_cmExpandAll()` (L749-L753)

### Reset View ↺ (CM-I10)
Repõe: root expandido, tudo colapsado, scroll ao topo, isolate desactivado, filtros limpos.

**Código:** `14-compare-mode.js` → `_cmResetView()` (L763-L791)

### Hover Highlight (CM-I2)
Ao passar sobre um token ou layer, destaca o nó + contraparte e atenua tudo o resto.

**Timings:**
- Activação: delay de **120ms** (evita flash)
- Dentro do range Y de uma linha de token: mantém hover (cobre gaps)

**Código:** `14-compare-mode.js` → `handleCMCanvasHover()` (L1489-L1552)

### Tooltip (CM-I1)
Popup ao hover sobre token com: nome, property, valor resolvido, kind badge.

**Timings:**
- Primeira aparição: **350ms** delay
- Troca entre tokens: **40ms** (quase imediato)
- Grace period ao sair: **120ms** (permite mover rato para o tooltip)

**Funcionalidades extras:**
- Click no nome → copia para clipboard
- Tooltip de layer hardcoded → mostra propriedades sem token
- Tooltip de layer broken → mostra referências inválidas

**Código:** `14-compare-mode.js` → `_cmScheduleTooltip()`, `_cmShowTooltip()`, `_cmPositionTooltip()` (L1776-L1891)

### Focus Overlay (double-click) — FO
Duplo-clique num token abre um overlay com mini-canvas, info A vs B, e kind badge.

> [!WARNING]
> Feature parcialmente implementada — a UI do overlay existe mas pode não estar completa. Ver `TASKS.md` → FO.

**Código:** `14-compare-mode.js` → `_cmOpenFocusOverlay()`, `_cmGetFocusOverlay()` (L1597-L1752)

### Copy to Clipboard
Click no nome do token (tooltip ou focus overlay) copia a referência para o clipboard. Toast de confirmação.

**Código:** `14-compare-mode.js` → `_cmCopyToClipboard()`, `_cmShowCopyToast()` (L1556-L1593)

---

## 📊 Legenda Interactiva (CM-I11)

Barra inferior com contagens por kind. Cada item é clicável para **isolate** — filtrar o canvas para mostrar apenas tokens desse kind.

**Regras:**
- Máximo 3 kinds activos em simultâneo
- Click num kind activo desactiva-o
- Click num kind com 3 já activos → remove o mais antigo (shift)
- Kinds com count 0 são omitidos

**Código:** `14-compare-mode.js` → `renderCMLegend()` (L685-L741)

---

## 🔎 Filtros (CM-I8 / CM-I9)

### Filtro por nome de layer (CM-I8)
Input de texto que filtra a árvore por nome de layer. Ancestrais de matches ficam visíveis.

### Filtro por nome de token (CM-I9)
Input de texto que filtra tokens por nome de variável. Layers sem tokens matching são ocultadas.

**Timings:** Debounce de **150ms** no input.

> [!NOTE]
> A barra de filtros está **comentada** no `modelo.html` (comentário HTML nas linhas 58-63). Os inputs estão escondidos mas a lógica JS está activa.

**Código:**
- JS: `14-compare-mode.js` → `_layerMatchesFilter()`, `_tokenMatchesFilter()` (L799-L815)
- HTML: `modelo.html` L58-L63 (comentado)

---

## 🔄 Live Refresh

Monitoriza alterações no documento Figma e re-corre a comparação automaticamente.

**Como funciona:**
1. Frontend envia `SET_LIVE { active: true }` ao arrancar
2. Backend regista listener `figma.on('documentchange', ...)` com `loadAllPagesAsync()`
3. Quando um nó monitorizado muda → backend envia `DOCUMENT_CHANGED`
4. Frontend faz debounce de **400ms** e re-corre `runCompare()` com `_cmLiveRefresh = true`

**Preservação de estado:** Quando `_cmLiveRefresh` está activo, `cmCollapsed` e `cmScrollY` são preservados.

**Código:**
- Backend: `code.ts` → `_registerDocumentChangeHandler()` (L222-L231)
- Frontend: `14-compare-mode.js` → `_cmSetLive()`, `_cmHandleDocumentChanged()` (L522-L535)

---

## 📐 Resize

Handles nos cantos e laterais da janela permitem redimensionar o plugin.

**Handles:** `se` (canto), `e` (direita), `s` (baixo), `w` (esquerda)

**Persistência:** Tamanho guardado em `localStorage` (`tm-win-size`) e restaurado ao arrancar.

**Código:** `14-compare-mode.js` → `_cmResizeDrag()`, `_cmResizeEnd()` (L184-L200)

---

## 📱 Responsive

Breakpoints CSS que adaptam a UI a janelas pequenas.

| Breakpoint | Efeito |
|------------|--------|
| ≤ 499px largura | Padding e gaps reduzidos |
| ≤ 399px largura | Esconde badge β, expand-all, labels dos slots |
| ≤ 319px largura | Esconde botão reset |
| ≤ 379px altura | Esconde barra de filtros |
| ≤ 299px altura | Esconde nomes na legenda (só cores) |

**Código:** `compare-mode.css` (L643-L673)
