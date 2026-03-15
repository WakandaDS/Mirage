# Análise de Código Morto
#mirage #limpeza #dead-code

> [!WARNING]
> Estes símbolos foram identificados como **não utilizados** no código. Estão marcados com `// ⚠️ DEAD CODE` nos ficheiros fonte para facilitar a identificação. **Não foram removidos** — testar primeiro.

---

## Resumo

| Ficheiro | Símbolos mortos | Símbolos vivos |
|----------|----------------|----------------|
| `01-estado-global.js` | `PALETTE`, `collectionColors`, `collectionIndex`, `isMaximized` | `compareSlotA`, `compareSlotB`, `comparePendingSlot`, `compareResult` |
| `02-utilidades.js` | `escAttr()`, `hexToRgba()`, `getCollectionColor()`, `makeSvgImg()` | `escHtml()` |
| `12-controlos-interface.js` | **Ficheiro inteiro** — `showView()` | — |
| `04-comunicacao-figma.js` | — | Tudo |
| `13-inicializacao.js` | — | Tudo |
| `14-compare-mode.js` | — | Tudo |

---

## Detalhe por ficheiro

### `01-estado-global.js`

```javascript
// ⚠️ DEAD CODE — PALETTE, collectionColors, collectionIndex
// Usados apenas em 02-utilidades.js (getCollectionColor) que nunca é chamada.
var PALETTE = [...]
var collectionColors = {};
var collectionIndex  = 0;

// ⚠️ DEAD CODE — isMaximized nunca é lida nem escrita em nenhum ficheiro.
var isMaximized = false;
```

> [!NOTE]
> As 4 variáveis vivas (`compareSlotA/B`, `comparePendingSlot`, `compareResult`) são usadas extensivamente em `14-compare-mode.js` e `04-comunicacao-figma.js`.

### `02-utilidades.js`

| Função | Chamada em | Estado |
|--------|-----------|--------|
| `escHtml()` | `14-compare-mode.js` | ✅ Viva |
| `escAttr()` | Nenhum ficheiro | ❌ Morta |
| `hexToRgba()` | Nenhum ficheiro | ❌ Morta |
| `getCollectionColor()` | Nenhum ficheiro | ❌ Morta |
| `makeSvgImg()` | Nenhum ficheiro | ❌ Morta |

> [!TIP]
> A função `escHtml()` (8 linhas) podia ser movida directamente para o `14-compare-mode.js`, eliminando este ficheiro por completo.

### `12-controlos-interface.js`

```javascript
// ⚠️ DEAD CODE — FICHEIRO INTEIRO
// showView() nunca é chamada no código (apenas referida em comentários).
function showView(name) { ... }
```

> [!NOTE]
> `showView()` aparece apenas em **comentários** de headers (`*  Usa: post(), showView(), escHtml()`), nunca em chamadas reais. O compare mode arranca directamente sem alternar vistas.

---

## Origem do código morto

Estes restos vêm de quando o Mirage ainda fazia parte do **TokenWizard** (plugin maior). Na reestruturação para plugin standalone, o código foi copiado mas as dependências já não existem:

- `PALETTE` + `getCollectionColor()` → usados pelo sistema de grafo de nós do TokenWizard
- `hexToRgba()` + `makeSvgImg()` → usados pelo renderer de nós do TokenWizard
- `showView()` → usada para alternar entre múltiplas vistas (tokens, grafo, compare)
- `isMaximized` → controlo de maximização da janela do TokenWizard

---

## Impacto da remoção

```
Código morto total:  ~1.8 KB (variáveis + funções + ficheiro)
                     ~60 linhas de código

ui.html actual:      106 KB
ui.html após:        ~104 KB  (redução marginal de ~1.7%)
```

> [!TIP]
> A redução de tamanho é pequena, mas a **clareza do código** melhora significativamente. Menos ruído = menos confusão ao manter o projecto.

---

## Como testar

1. Fazer build com `npm run build`
2. Carregar no Figma via `manifest.json`
3. Testar: seleccionar dois componentes → comparar → verificar que tudo funciona
4. Se tudo OK, remover os blocos marcados com `// ⚠️ DEAD CODE`
5. Remover `12-controlos-interface.js` do array `JS_FILES` em `scripts/build-ui.js`
6. Rebuild e testar novamente
