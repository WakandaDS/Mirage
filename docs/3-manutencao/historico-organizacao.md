# Proposta de Organização de Pastas
#mirage #organização

> [!IMPORTANT]
> Proposta para renomear e reorganizar a estrutura de pastas do projecto, tornando-a mais coerente e intuitiva.

---

## Estrutura actual

```
TokenMirage/
├── code.ts                          ← backend (nome genérico)
├── code.js                          ← artefacto de build (compilado)
├── manifest.json
├── package.json
├── tsconfig.json
├── ui.html                          ← artefacto de build (concatenado)
├── icon.png
├── icons/                           ← propósito?
├── dev-server.js                    ← dev tooling na raiz
├── serve.js                         ← dev tooling na raiz
├── screens-preview.html             ← preview na raiz
├── CLAUDE.md
├── TASKS.md
├── src/
│   └── ui/
│       ├── modelo.html              ← template
│       ├── estilos/                 ← ⚠️ nome em PT
│       │   ├── variaveis-tema.css   ← ⚠️ nome em PT
│       │   └── compare-mode.css
│       └── js/
│           ├── 01-estado-global.js  ← ⚠️ nome em PT
│           ├── 02-utilidades.js     ← ⚠️ nome em PT
│           ├── 04-comunicacao-figma.js ← ⚠️ nome em PT
│           ├── 12-controlos-interface.js ← ⚠️ nome em PT, dead code
│           ├── 13-inicializacao.js   ← ⚠️ nome em PT
│           └── 14-compare-mode.js
├── scripts/
│   └── build-ui.js
└── docs/
    └── ...
```

### Problemas identificados

1. **Mistura de idiomas** — nomes de pastas/ficheiros em Português (`estilos`, `utilidades`, `comunicacao`, `inicializacao`) mas código e features em Inglês (`compare-mode`, `CM_COLORS`, `buildCMLayout`)
2. **Ficheiros de dev na raiz** — `dev-server.js`, `serve.js`, `screens-preview.html` poluem a raiz
3. **Artefactos de build na raiz** — `code.js` e `ui.html` são gerados mas vivem ao lado do source
4. **Pasta `icons/` sem uso claro** — verificar se está a ser usada
5. **Numeração inconsistente** — saltos de `04` para `12` (restos do TokenWizard)

---

## Proposta de reorganização

```
TokenMirage/
├── manifest.json
├── package.json
├── tsconfig.json
├── icon.png
├── CLAUDE.md
├── TASKS.md
│
├── dist/                            ← artefactos de build
│   ├── code.js
│   └── ui.html
│
├── src/
│   ├── backend/
│   │   └── code.ts                  ← backend renomeado para clareza
│   │
│   └── ui/
│       ├── template.html            ← renomeado de modelo.html
│       ├── styles/                  ← renomeado de estilos/
│       │   ├── theme.css            ← renomeado de variaveis-tema.css
│       │   └── compare.css          ← renomeado de compare-mode.css
│       └── js/
│           ├── 01-state.js          ← renomeado de 01-estado-global.js
│           ├── 02-utils.js          ← renomeado de 02-utilidades.js
│           ├── 03-messaging.js      ← renomeado de 04-comunicacao-figma.js
│           ├── 04-compare.js        ← renomeado de 14-compare-mode.js
│           └── 05-init.js           ← renomeado de 13-inicializacao.js
│                                    ← 12-controlos-interface.js REMOVIDO (dead code)
│
├── scripts/
│   └── build-ui.js
│
├── tools/                           ← dev tooling isolado
│   ├── dev-server.js
│   └── serve.js
│
└── docs/                            ← documentação Obsidian
    ├── README.md
    ├── arquitectura.md
    ├── features.md
    ├── logica-ligacoes-tokens.md
    ├── analise-codigo-morto.md
    └── refactoring.md
```

---

## Tabela de renomeação

> [!WARNING]
> Estas mudanças requerem actualizar `scripts/build-ui.js`, `tsconfig.json`, `manifest.json`, e `package.json`. Fazer com cuidado.

### Ficheiros fonte

| Actual | Proposto | Motivo |
|--------|----------|--------|
| `code.ts` (raiz) | `src/backend/code.ts` | Separar backend do resto |
| `src/ui/modelo.html` | `src/ui/template.html` | Inglês consistente |
| `src/ui/estilos/` | `src/ui/styles/` | Inglês consistente |
| `estilos/variaveis-tema.css` | `styles/theme.css` | Mais curto e claro |
| `estilos/compare-mode.css` | `styles/compare.css` | Mais curto |
| `js/01-estado-global.js` | `js/01-state.js` | Inglês |
| `js/02-utilidades.js` | `js/02-utils.js` | Inglês |
| `js/04-comunicacao-figma.js` | `js/03-messaging.js` | Inglês + renumerar |
| `js/14-compare-mode.js` | `js/04-compare.js` | Inglês + renumerar |
| `js/13-inicializacao.js` | `js/05-init.js` | Inglês + renumerar |
| `js/12-controlos-interface.js` | ❌ **Remover** | Dead code |

### Artefactos de build

| Actual | Proposto | Motivo |
|--------|----------|--------|
| `code.js` (raiz) | `dist/code.js` | Separar artefactos do source |
| `ui.html` (raiz) | `dist/ui.html` | Idem |

### Dev tooling

| Actual | Proposto | Motivo |
|--------|----------|--------|
| `dev-server.js` (raiz) | `tools/dev-server.js` | Não poluir raiz |
| `serve.js` (raiz) | `tools/serve.js` | Idem |
| `screens-preview.html` (raiz) | `tools/preview.html` | Idem |

---

## Impacto nos ficheiros de configuração

### `manifest.json`
```diff
-  "main": "code.js",
-  "ui": "ui.html"
+  "main": "dist/code.js",
+  "ui": "dist/ui.html"
```

### `tsconfig.json`
```diff
-  "outDir": ".",
+  "outDir": "dist",
+  "rootDir": "src/backend"
```

### `scripts/build-ui.js`
```diff
- const SRC = path.join(ROOT, 'src', 'ui');
- const OUTPUT = path.join(ROOT, 'ui.html');
+ const SRC = path.join(ROOT, 'src', 'ui');
+ const OUTPUT = path.join(ROOT, 'dist', 'ui.html');

  const CSS_FILES = [
-   'estilos/variaveis-tema.css',
-   'estilos/compare-mode.css'
+   'styles/theme.css',
+   'styles/compare.css'
  ];

  const JS_FILES = [
-   'js/01-estado-global.js',
-   'js/02-utilidades.js',
-   'js/04-comunicacao-figma.js',
-   'js/12-controlos-interface.js',
-   'js/14-compare-mode.js',
-   'js/13-inicializacao.js',
+   'js/01-state.js',
+   'js/02-utils.js',
+   'js/03-messaging.js',
+   'js/04-compare.js',
+   'js/05-init.js',
  ];
```

---

## Ordem de execução

> [!TIP]
> Fazer a reorganização **antes** do refactoring do `14-compare-mode.js`. Assim evitamos ter que renomear ficheiros duas vezes.

1. Criar pastas `dist/` e `tools/`
2. Mover e renomear ficheiros
3. Actualizar configs (`manifest.json`, `tsconfig.json`, `build-ui.js`, `package.json`)
4. `npm run build` e testar no Figma
5. Só depois → dividir `04-compare.js` em módulos (ver [[historico-refactoring]])
