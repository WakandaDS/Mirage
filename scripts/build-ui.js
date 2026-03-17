#!/usr/bin/env node
/**
 * ============================================================
 *  build-ui.js — Montagem do ui.html a partir de ficheiros fonte
 * ============================================================
 *
 *  Este script lê o template HTML (modelo.html), concatena todos
 *  os ficheiros CSS e JS da pasta src/ui/ na ordem correcta,
 *  e gera o ficheiro final ui.html na raiz do projecto.
 *
 *  O Figma Plugin exige um único ficheiro HTML — este script
 *  permite desenvolver em ficheiros separados e montar tudo
 *  automaticamente no build.
 *
 *  Uso: node scripts/build-ui.js
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'ui');
const OUTPUT = path.join(ROOT, 'dist', 'ui.html');

/**
 * 💡 ORDEM IMPORTANTE
 *
 * JS_FILES: a ordem define a concatenação.
 * - Variáveis globais primeiro
 * - utilidades e construtores
 * - eventos iterativos no fim
 */
const CSS_FILES = [
  'styles/theme.css',
  'styles/compare.css'
];

const JS_FILES = [
  'js/01-state.js',
  'js/02-utils.js',
  'js/03-messaging.js',

  // Módulos do Compare Mode
  'js/compare/00-constants.js',
  'js/compare/01-state.js',
  'js/compare/02-init.js',
  'js/compare/03-slots.js',
  'js/compare/04-live-refresh.js',
  'js/compare/05-render-orchestration.js',
  'js/compare/06-legend-and-view.js',
  'js/compare/07-filters-and-isolate.js',
  'js/compare/08-layout.js',
  'js/compare/09-rendering-and-helpers.js',
  'js/compare/10-interaction.js',
  'js/compare/11-focus-overlay.js',
  'js/compare/12-tooltips-and-copy.js',

  'js/05-init.js',
];

/**
 * Lê um ficheiro fonte relativo à pasta src/ui/
 * @param {string} relativePath - Caminho relativo ao ficheiro
 * @returns {string} Conteúdo do ficheiro
 */
function readSourceFile(relativePath) {
  const fullPath = path.join(SRC, relativePath);
  if (!fs.existsSync(fullPath)) {
    console.error('ERRO: Ficheiro não encontrado:', fullPath);
    process.exit(1);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * Injeta conteúdo entre dois marcadores no template HTML.
 * Os marcadores são comentários como /* CSS:START * / e /* CSS:END * /
 *
 * @param {string} html - Template HTML completo
 * @param {string} startMarker - Marcador de início (ex: "/* CSS:START * /")
 * @param {string} endMarker - Marcador de fim (ex: "/* CSS:END * /")
 * @param {string} content - Conteúdo a injetar
 * @returns {string} HTML com conteúdo injetado
 */
function inject(html, startMarker, endMarker, content) {
  const si = html.indexOf(startMarker);
  const ei = html.indexOf(endMarker);
  if (si === -1 || ei === -1) {
    console.error('ERRO: Marcador não encontrado:', startMarker);
    process.exit(1);
  }
  return html.slice(0, si + startMarker.length) + '\n' + content + '\n    ' + html.slice(ei);
}

// ─── Execução principal ────────────────────────────────────

function main() {
  console.log('A montar ui.html...');

  // 1. Ler o template HTML
  let html = readSourceFile('template.html');

  // 2. Concatenar todos os ficheiros CSS
  const cssContent = CSS_FILES.map(function (file) {
    const name = path.basename(file, '.css');
    const content = readSourceFile(file);
    return '    /* ─── ' + name + ' ─────────────────────── */\n' + content;
  }).join('\n\n');

  html = inject(html, '/* CSS:START */', '/* CSS:END */', cssContent);
  console.log('  ✓ CSS: ' + CSS_FILES.length + ' ficheiros concatenados');

  // 3. Concatenar todos os ficheiros JS
  const jsContent = JS_FILES.map(function (file) {
    const name = path.basename(file, '.js');
    const content = readSourceFile(file);
    return '    // ═══ ' + name + ' ═══════════════════════════\n' + content;
  }).join('\n\n');

  html = inject(html, '/* JS:START */', '/* JS:END */', jsContent);
  console.log('  ✓ JS:  ' + JS_FILES.length + ' ficheiros concatenados');

  // 4. Escrever o ficheiro final (garantir que a pasta dist/ existe)
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, html, 'utf-8');
  const sizeKB = (Buffer.byteLength(html, 'utf-8') / 1024).toFixed(1);
  console.log('  ✓ ui.html gerado (' + sizeKB + ' KB)');
}

main();
