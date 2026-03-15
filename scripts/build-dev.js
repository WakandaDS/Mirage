#!/usr/bin/env node
/**
 * ============================================================
 *  build-dev.js — Gera dev.html para preview no browser
 * ============================================================
 *
 *  Lê o ui.html gerado e adiciona:
 *    1. Mock do objecto `parent` (simula o iframe do Figma)
 *    2. Dados de exemplo realistas (MOCK_DATA)
 *    3. Disparo automático de SCAN_READY ao carregar a página
 *
 *  Resultado: dev.html na raiz — abre directamente no browser,
 *  sem precisar do Figma instalado.
 *
 *  Uso: node scripts/build-dev.js
 *       (ou via: npm run build:dev)
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const UI_HTML = path.join(ROOT, 'ui.html');
const DEV_HTML = path.join(ROOT, 'dev.html');

// ─── Dados de mock realistas ────────────────────────────────
// Simula um component set "Button" com 4 variantes e 2 coleções de tokens.
const MOCK_DATA = {
  componentName: 'Button',
  componentId: 'mock:compset:001',
  selectionType: 'component_set',
  variantCount: 4,
  variantProperties: {
    'Size':  ['Small', 'Large'],
    'State': ['Default', 'Hover']
  },
  variants: [
    { id: 'mock:v:001', name: 'Size=Small, State=Default', tokenIds: [
      { id: 'tok:color:primary', property: 'fills' },
      { id: 'tok:radius:sm',     property: 'cornerRadius' }
    ]},
    { id: 'mock:v:002', name: 'Size=Small, State=Hover', tokenIds: [
      { id: 'tok:color:hover',   property: 'fills' },
      { id: 'tok:radius:sm',     property: 'cornerRadius' }
    ]},
    { id: 'mock:v:003', name: 'Size=Large, State=Default', tokenIds: [
      { id: 'tok:color:primary', property: 'fills' },
      { id: 'tok:radius:lg',     property: 'cornerRadius' }
    ]},
    { id: 'mock:v:004', name: 'Size=Large, State=Hover', tokenIds: [
      { id: 'tok:color:hover',   property: 'fills' },
      { id: 'tok:radius:lg',     property: 'cornerRadius' }
    ]}
  ],
  layers: {
    'layer:root': {
      id: 'layer:root', name: 'Button', path: 'Button',
      type: 'FRAME', parentId: null, children: ['layer:bg', 'layer:label'],
      tokens: [
        { variableId: 'tok:color:primary', property: 'fills' },
        { variableId: 'tok:radius:sm',     property: 'cornerRadius' }
      ]
    },
    'layer:bg': {
      id: 'layer:bg', name: 'Background', path: 'Button / Background',
      type: 'RECTANGLE', parentId: 'layer:root', children: [],
      tokens: [
        { variableId: 'tok:color:primary', property: 'fills' },
        { variableId: 'tok:space:md',      property: 'paddingLeft' }
      ]
    },
    'layer:label': {
      id: 'layer:label', name: 'Label', path: 'Button / Label',
      type: 'TEXT', parentId: 'layer:root', children: [],
      tokens: [
        { variableId: 'tok:color:text',    property: 'fills' },
        { variableId: 'tok:font:size:sm',  property: 'fontSize' }
      ]
    }
  },
  tokens: {
    'tok:color:primary': {
      variableId: 'tok:color:primary',
      variableName: 'color/brand/primary',
      collectionName: 'Core Tokens',
      collectionId: 'col:core',
      layerIds: ['layer:root', 'layer:bg'],
      isRemote: false,
      resolvedValue: '#5C6AC4'
    },
    'tok:color:hover': {
      variableId: 'tok:color:hover',
      variableName: 'color/brand/hover',
      collectionName: 'Core Tokens',
      collectionId: 'col:core',
      layerIds: [],
      isRemote: false,
      resolvedValue: '#4959BD'
    },
    'tok:color:text': {
      variableId: 'tok:color:text',
      variableName: 'color/text/on-brand',
      collectionName: 'Core Tokens',
      collectionId: 'col:core',
      layerIds: ['layer:label'],
      isRemote: false,
      resolvedValue: '#FFFFFF'
    },
    'tok:radius:sm': {
      variableId: 'tok:radius:sm',
      variableName: 'radius/sm',
      collectionName: 'Semantic Tokens',
      collectionId: 'col:semantic',
      layerIds: ['layer:root'],
      isRemote: false,
      resolvedValue: '4'
    },
    'tok:radius:lg': {
      variableId: 'tok:radius:lg',
      variableName: 'radius/lg',
      collectionName: 'Semantic Tokens',
      collectionId: 'col:semantic',
      layerIds: [],
      isRemote: false,
      resolvedValue: '12'
    },
    'tok:space:md': {
      variableId: 'tok:space:md',
      variableName: 'spacing/md',
      collectionName: 'Semantic Tokens',
      collectionId: 'col:semantic',
      layerIds: ['layer:bg'],
      isRemote: false,
      resolvedValue: '16'
    },
    'tok:font:size:sm': {
      variableId: 'tok:font:size:sm',
      variableName: 'font/size/sm',
      collectionName: 'Core Tokens',
      collectionId: 'col:core',
      layerIds: ['layer:label'],
      isRemote: true,
      resolvedValue: '14'
    }
  },
  variableCatalog: [
    {
      id: 'col:core',
      name: 'Core Tokens',
      variables: [
        { id: 'tok:color:primary', name: 'color/brand/primary', resolvedValue: '#5C6AC4' },
        { id: 'tok:color:hover',   name: 'color/brand/hover',   resolvedValue: '#4959BD' },
        { id: 'tok:color:text',    name: 'color/text/on-brand', resolvedValue: '#FFFFFF' },
        { id: 'tok:font:size:sm',  name: 'font/size/sm',        resolvedValue: '14' }
      ]
    },
    {
      id: 'col:semantic',
      name: 'Semantic Tokens',
      variables: [
        { id: 'tok:radius:sm', name: 'radius/sm',  resolvedValue: '4' },
        { id: 'tok:radius:lg', name: 'radius/lg',  resolvedValue: '12' },
        { id: 'tok:space:md',  name: 'spacing/md', resolvedValue: '16' }
      ]
    }
  ]
};

// ─── Bloco de mock injectado antes de </body> ───────────────
const MOCK_SCRIPT = `
  <!-- ═══════════════════════════════════════════════════════
       DEV MOCK — Simula o backend do Figma no browser.
       Este bloco NÃO existe no ui.html de produção.
       ═══════════════════════════════════════════════════════ -->
  <script>
    // Dados de mock disponíveis como variável JS (usados no FOCUS handler)
    var MOCK_DATA = ${JSON.stringify(MOCK_DATA, null, 4)};

    // Substituir post() para capturar mensagens ao invés de as enviar
    // ao Figma (que não existe no contexto do browser).
    function post(msg) {
      console.log('[DEV MOCK] Mensagem para o backend:', msg);
      if (msg.type === 'RESIZE') {
        console.log('[DEV MOCK] RESIZE ignorado no browser');
      }
      // Simular FOCUS: re-scan com selectionType='variant' (como o Figma faria)
      if (msg.type === 'FOCUS') {
        console.log('[DEV MOCK] FOCUS → simular re-scan com selectionType=variant');
        setTimeout(function () {
          window.dispatchEvent(new MessageEvent('message', {
            data: {
              pluginMessage: {
                type: 'SCAN_READY',
                data: Object.assign({}, MOCK_DATA, { selectionType: 'variant' })
              }
            }
          }));
        }, 200);
      }
    }

    // Injectar dados de mock assim que a página carrega
    window.addEventListener('load', function () {
      // Simular SCANNING (estado de carregamento)
      window.dispatchEvent(new MessageEvent('message', {
        data: { pluginMessage: { type: 'SCANNING' } }
      }));

      // Após 600ms, enviar SCAN_READY com dados reais de mock
      setTimeout(function () {
        window.dispatchEvent(new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'SCAN_READY',
              data: Object.assign({}, MOCK_DATA, { selectionType: 'component_set' })
            }
          }
        }));
      }, 600);
    });
  </script>
`;

// ─── Execução principal ─────────────────────────────────────

function main() {
  console.log('A gerar dev.html...');

  let html = fs.readFileSync(UI_HTML, 'utf-8');

  // Injectar o mock script imediatamente antes de </body>
  html = html.replace('</body>', MOCK_SCRIPT + '\n</body>');

  fs.writeFileSync(DEV_HTML, html, 'utf-8');
  const sizeKB = (Buffer.byteLength(html, 'utf-8') / 1024).toFixed(1);
  console.log('  ✓ dev.html gerado (' + sizeKB + ' KB)');
  console.log('  → Abre dev.html no browser ou usa: npx serve . -p 3000');
}

main();
