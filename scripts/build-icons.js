#!/usr/bin/env node
/**
 * build-icons.js
 * Reads SVG files from /icons and injects them into ui.html
 * between marker comments.
 *
 * Usage: node scripts/build-icons.js
 *
 * SVG files can use any fill color — the script generates:
 *   - Canvas versions (fill="white") for graph node rendering
 *   - A ICON_PATHS map with raw path data for detail panel (dynamic fill)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ICONS_DIR = path.join(ROOT, 'icons');
const ICONES_JS = path.join(ROOT, 'src', 'ui', 'js', '03-icones.js');

const CANVAS_START = '/* ICONS:CANVAS:START */';
const CANVAS_END = '/* ICONS:CANVAS:END */';
const PATHS_START = '/* ICONS:PATHS:START */';
const PATHS_END = '/* ICONS:PATHS:END */';

// Read all SVG files from icons/ folder
function readIcons() {
  const files = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.svg'));
  const icons = {};
  for (const file of files) {
    const name = path.basename(file, '.svg').toLowerCase();
    const svg = fs.readFileSync(path.join(ICONS_DIR, file), 'utf-8').trim();
    icons[name] = svg;
  }
  return icons;
}

// Extract path data from SVG string (supports multiple paths)
function extractPaths(svg) {
  const paths = [];
  const re = /<path\s([^>]*)\/?>/g;
  let m;
  while ((m = re.exec(svg)) !== null) {
    const attrs = m[1];
    const d = attrs.match(/d="([^"]+)"/);
    const fillRule = attrs.match(/fill-rule="([^"]+)"/);
    const clipRule = attrs.match(/clip-rule="([^"]+)"/);
    if (d) {
      const p = { d: d[1] };
      if (fillRule) p.fillRule = fillRule[1];
      if (clipRule) p.clipRule = clipRule[1];
      paths.push(p);
    }
  }
  return paths;
}

// Replace fill on <path> elements with target color (preserves fill="none" on <svg>)
function recolorPaths(svg, color) {
  return svg.replace(/(<path[^>]*)\bfill="[^"]*"/g, `$1fill="${color}"`);
}

// Collapse SVG to single line for embedding
function oneLine(svg) {
  return svg.replace(/\n\s*/g, '');
}

// Generate canvas icon lines (makeSvgImg with fill="white")
function genCanvasBlock(icons) {
  const lines = [];
  for (const [name, svg] of Object.entries(icons)) {
    const whiteSvg = oneLine(recolorPaths(svg, 'white'));
    const varName = 'iconImg' + name.charAt(0).toUpperCase() + name.slice(1);
    lines.push(`    var ${varName} = makeSvgImg('${whiteSvg.replace(/'/g, "\\'")}');`);
  }
  return lines.join('\n');
}

// Generate ICON_PATHS map for detail panel (dynamic fill)
function genPathsBlock(icons) {
  const entries = [];
  for (const [name, svg] of Object.entries(icons)) {
    const paths = extractPaths(svg);
    entries.push(`      ${name}: ${JSON.stringify(paths)}`);
  }
  return '    var ICON_PATHS = {\n' + entries.join(',\n') + '\n    };';
}

// Inject generated code between markers in ui.html
function inject(html, startMarker, endMarker, code) {
  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) {
    console.error(`Markers not found: ${startMarker} / ${endMarker}`);
    process.exit(1);
  }
  return html.slice(0, startIdx + startMarker.length) + '\n' + code + '\n    ' + html.slice(endIdx);
}

// Helper to build inline SVG from ICON_PATHS entry
function genHelperBlock() {
  return `    function iconSvgFromPaths(name, fill, style) {
      var paths = ICON_PATHS[name];
      if (!paths) return '';
      var inner = '';
      for (var i = 0; i < paths.length; i++) {
        var p = paths[i];
        inner += '<path d="' + p.d + '" fill="' + fill + '"';
        if (p.fillRule) inner += ' fill-rule="' + p.fillRule + '" clip-rule="' + (p.clipRule || p.fillRule) + '"';
        inner += '/>';
      }
      return '<svg viewBox="0 0 24 24" fill="none" style="' + (style || '') + '" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>';
    }`;
}

// Main
function main() {
  const icons = readIcons();
  const iconNames = Object.keys(icons);
  console.log(`Found ${iconNames.length} icons: ${iconNames.join(', ')}`);

  let src = fs.readFileSync(ICONES_JS, 'utf-8');

  // Inject canvas icons
  src = inject(src, CANVAS_START, CANVAS_END, genCanvasBlock(icons));

  // Inject ICON_PATHS + helper
  const pathsCode = genPathsBlock(icons) + '\n' + genHelperBlock();
  src = inject(src, PATHS_START, PATHS_END, pathsCode);

  fs.writeFileSync(ICONES_JS, src, 'utf-8');
  console.log('✓ 03-icones.js updated with icons from /icons folder');
}

main();
