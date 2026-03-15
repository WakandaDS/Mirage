#!/usr/bin/env node
/**
 * ============================================================
 *  watch-ui.js — Observador de ficheiros src/ui/
 * ============================================================
 *
 *  Observa alterações em qualquer ficheiro dentro de src/ui/
 *  e corre automaticamente build-ui.js quando detecta mudanças.
 *
 *  Usa fs.watch nativo do Node (sem dependências externas).
 *  Um debounce de 200ms evita rebuilds duplos (ex: quando o
 *  editor guarda o ficheiro em dois passos).
 *
 *  Uso: node scripts/watch-ui.js
 *       (ou via: npm run watch:ui)
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src', 'ui');
const BUILD_SCRIPT = path.join(__dirname, 'build-ui.js');

/** Timeout do debounce — evita rebuilds duplicados */
var debounceTimer = null;

/**
 * Corre o build-ui.js e mostra o resultado.
 * Em caso de erro, exibe a mensagem mas não encerra o watcher.
 */
function rebuild() {
  var timestamp = new Date().toLocaleTimeString('pt-PT');
  console.log('\n[' + timestamp + '] Alteração detectada — a reconstruir ui.html...');
  try {
    execSync('node "' + BUILD_SCRIPT + '"', { stdio: 'inherit' });
  } catch (e) {
    console.error('Erro no build:', e.message);
  }
}

/**
 * Trata uma alteração de ficheiro com debounce de 200ms.
 * @param {string} filename - Nome do ficheiro alterado
 */
function handleChange(filename) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(function () {
    debounceTimer = null;
    if (filename) console.log('  Ficheiro alterado:', filename);
    rebuild();
  }, 200);
}

// ─── Iniciar observação recursiva ──────────────────────────

console.log('[watch-ui] A observar ' + SRC_DIR);
console.log('[watch-ui] Ctrl+C para parar\n');

// Build inicial ao arrancar
rebuild();

// Observar src/ui/ recursivamente (Node >= 19.x suporta recursive nativo)
// Em versões mais antigas, observa cada subdirectório manualmente.
try {
  fs.watch(SRC_DIR, { recursive: true }, function (event, filename) {
    handleChange(filename);
  });
} catch (e) {
  // Fallback: observar cada pasta separadamente (Node < 19 no Linux)
  var subdirs = [SRC_DIR];
  fs.readdirSync(SRC_DIR).forEach(function (entry) {
    var full = path.join(SRC_DIR, entry);
    if (fs.statSync(full).isDirectory()) subdirs.push(full);
  });
  subdirs.forEach(function (dir) {
    fs.watch(dir, function (event, filename) {
      handleChange(filename ? path.join(path.relative(SRC_DIR, dir), filename) : null);
    });
  });
}
