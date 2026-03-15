import re

with open("/Volumes/bruno/TokenMirage/src/ui/js/04-compare.js", "r") as f:
    content = f.read()

def get_section(start_marker, end_marker=None):
    start_idx = content.find(start_marker)
    if start_idx == -1:
        return ""
    if end_marker:
        end_idx = content.find(end_marker, start_idx)
        if end_idx == -1:
            end_idx = len(content)
        return content[start_idx:end_idx].strip()
    return content[start_idx:].strip()

# Create the chunks
chunks = {}

chunks["00-constants.js"] = get_section("    // ─── Cores por tipo de match", "    // ─── Estado do canvas")
chunks["01-state.js"] = get_section("    // ─── Estado do canvas", "    // ─── Inicialização")
chunks["02-init.js"] = get_section("    // ─── Inicialização", "    // ─── Autocomplete dos slots")
chunks["03-slots.js"] = (
    get_section("    // ─── Autocomplete dos slots", "    // ─── Selecção de slots") + "\n\n" +
    get_section("    // ─── Selecção de slots", "    // ─── Disparar comparação") + "\n\n" +
    get_section("    // ─── Disparar comparação", "    // ─── Live refresh") + "\n\n" +
    get_section("    // ─── Swap A ↔ B", "    // ─── Renderização do resultado")
)
chunks["04-live-refresh.js"] = get_section("    // ─── Live refresh", "    // ─── Swap A ↔ B")
chunks["05-render-orchestration.js"] = get_section("    // ─── Renderização do resultado", "    // ─── Legenda interactiva")
chunks["06-legend-and-view.js"] = (
    get_section("    // ─── Legenda interactiva", "    // ─── Expand-all") + "\n\n" +
    get_section("    // ─── Expand-all", "    // ─── Reset view") + "\n\n" +
    get_section("    // ─── Reset view", "    // ─── Helpers de filtro")
)
chunks["07-filters-and-isolate.js"] = (
    get_section("    // ─── Helpers de filtro", "    // ─── Helpers de isolate por kind") + "\n\n" +
    get_section("    // ─── Helpers de isolate por kind", "    // ─── Layout do canvas")
)
chunks["08-layout.js"] = get_section("    // ─── Layout do canvas", "    // ─── Desenho do canvas")
chunks["09-rendering-and-helpers.js"] = (
    get_section("    // ─── Desenho do canvas", "    // ─── Interacção com o canvas") + "\n\n" +
    get_section("    // ─── Helpers de canvas") # at the bottom of the file
)
chunks["10-interaction.js"] = (
    get_section("    // ─── Interacção com o canvas", "    // ─── Copy utility") + "\n\n" +
    get_section("    // ─── Hit-test de token nodes", "    // ─── Helpers de canvas")
)
chunks["11-focus-overlay.js"] = get_section("    // ─── Focus Overlay", "    // ─── Tooltip de token")
chunks["12-tooltips-and-copy.js"] = (
    get_section("    // ─── Copy utility", "    // ─── Focus Overlay") + "\n\n" +
    get_section("    // ─── Tooltip de token", "    // ─── Tooltip de layer hardcoded") + "\n\n" +
    get_section("    // ─── Tooltip de layer hardcoded", "    // ─── Tooltip de layer broken ref") + "\n\n" +
    get_section("    // ─── Tooltip de layer broken ref", "    // ─── Hit-test de token nodes")
)

import os
for fname, text in chunks.items():
    with open(f"/Volumes/bruno/TokenMirage/src/ui/js/compare/{fname}", "w") as f:
        f.write(text + "\n")
