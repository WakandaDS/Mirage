# Regras de Audit — TokenMirage

> Edita este ficheiro para activar, desactivar ou adicionar critérios de ignore.
> Documentação detalhada de cada regra: [[rules-reference]]

---

## Hardcoded — Critérios de Ignore

Valores hardcoded que **não devem ser reportados** pelo plugin. Cada regra corresponde a uma condição verificada em `detectHardcoded()` em `src/backend/code.ts`.

---

- [x] **[IGNORE_BOOLEAN_OP]** Nodes dentro de operações booleanas (Union / Subtract / Intersect / Exclude)
  **Descrição:** Shapes que são filhos directos de um `BOOLEAN_OPERATION` têm fills e strokes intrínsecos à definição da forma — não são valores hardcoded adicionados pelo designer, são parte da geometria. Reportá-los gera falsos positivos sistemáticos.
  **Critério:** `node.parent.type === 'BOOLEAN_OPERATION'`
  [[rules-reference#IGNORE_BOOLEAN_OP]]

---

- [x] **[IGNORE_CS_BORDER]** Stroke padrão de Component Set (`#9747ff`)
  **Descrição:** O Figma aplica automaticamente uma borda roxa `#9747ff` em todos os Component Sets. É um artefacto da interface do Figma, não uma decisão de design do ficheiro.
  **Critério:** `node.type === 'COMPONENT_SET'` + `stroke.color === '#9747ff'`
  [[rules-reference#IGNORE_CS_BORDER]]

---

- [x] **[IGNORE_CS_RADIUS]** Corner radius padrão de Component Set (`5px`)
  **Descrição:** O Figma aplica automaticamente `cornerRadius: 5` em todos os Component Sets. Idem ao anterior — artefacto da interface, não decisão de design.
  **Critério:** `node.type === 'COMPONENT_SET'` + `cornerRadius === 5`
  [[rules-reference#IGNORE_CS_RADIUS]]

---

## Novas regras (por implementar)

- [ ] **[IGNORE_WHITE_FILL]** Fills brancos (`#ffffff`) em nodes de fundo
  **Descrição:** *(a definir — descreve aqui o contexto e quando deve ser ignorado)*
  **Critério:** *(a definir)*

---

> Para adicionar uma regra: cria um novo item nesta lista, define a descrição e o critério, e implementa a condição em `detectHardcoded()`.
