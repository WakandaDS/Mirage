# TokenMirage — Knowledge Base
#mirage #documentação #hub

> **Bem-vindo à Wiki do Mirage 📚**  
> Plugin Figma (β v0.1.0) para comparar _design tokens_ entre componentes Figma de forma visual.
> Documentação organizada para ser lida e mantida no **Obsidian**, tirando partido de wikilinks, tags e estruturas visuais ricas.

---

## 🧭 Navegação Rápida

### 1️⃣ Guias Práticos
| Documento | Conteúdo |
|-----------|----------|
| [[introducao-features]] | Catálogo completo de todas as funcionalidades operacionais do plugin. |
| [[logica-ligacoes-tokens]] | Como funcionam os matches (diffs) e as _bezier lines_ no ecrã. |

### 2️⃣ Arquitectura e Under-the-hood 🔬
| Documento | Conteúdo |
|-----------|----------|
| [[visao-geral]] | Modelo de dois processos (Backend/Frontend), event loop e convenções globais. |
| [[motor-de-diff]] | _Deep dive_ no `code.ts` — Lógica de extracção e geração das propriedades. |
| [[motor-de-render]] | _Deep dive_ no frontend — Motor matemático gerador do Layout e de Curvas Bezier. |

### 3️⃣ Manutenção e Operações 🛠️
| Documento | Conteúdo |
|-----------|----------|
| [[codigo-morto]] | Código orfão identificado (restos do TokenWizard) para análise. |
| [[historico-organizacao]] | Registo da re-organização de pastas (_dist, src/backend, tools_). |
| [[historico-refactoring]] | Registo do desmantelamento do código central de 1931 linhas em pequenos ficheiros de módulo. |

---

## 🔗 Referências Úteis

- **Design Figma**: [Mirage no Figma](https://www.figma.com/design/4U8p52wkahXQdItFuzljCI/Mirage?node-id=11-32)
- **Roadmap / Tasks**: Ver o `TASKS.md` na raiz do projecto.

---

## 📁 Árvore de Ficheiros Actuais

Graças ao recente _refactoring_ registado em [[historico-refactoring]] e [[historico-organizacao]], o core do projeto obedece hoje à seguinte anatomia isolada e _bundle-free_:

```
TokenMirage/
├── manifest.json              ← Manifesto do plugin
├── package.json               ← Scripts de NPM
├── tsconfig.json              ← Configs do TS para es2015
├── tools/                     ← Ferramentas locais
├── dist/                      ← (Artefactos do Build)
│   ├── code.js                
│   └── ui.html                
├── src/
│   ├── backend/
│   │   └── code.ts            ← Sandbox Figma API (Extração e Diffing)
│   └── ui/
│       ├── template.html      ← Ponto de inserção HTML
│       ├── styles/
│       │   ├── theme.css      ← Vars CSS (Catppuccin Mocha)
│       │   └── compare.css    ← Estilos da interface
│       └── js/
│           ├── compare/       ← (12 Ficheiros minúsculos para Compare Mode)
│           ├── 01-state.js    ← Globais
│           ├── 02-utils.js    ← Helpers puros
│           ├── 03-messaging.js← Interface de Mensagem (PostMessage)
│           └── 05-init.js     ← Bootloader do frontend
├── scripts/
│   └── build-ui.js            ← Script custom que unifica o Frontend
└── docs/                      ← O hub de conhecimento atual
```
