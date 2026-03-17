# Rules Reference — Hardcoded Ignore

Documentação técnica detalhada de cada regra definida em [[rules]].

---

## IGNORE_BOOLEAN_OP

**Estado:** Activo
**Ficheiro:** `src/backend/code.ts` → `detectHardcoded()` linha ~128
**Tipos de node afectados:** Qualquer `SceneNode` cujo pai seja `BOOLEAN_OPERATION`

**Contexto técnico:**
No Figma, uma `BOOLEAN_OPERATION` (Union, Subtract, Intersect, Exclude) agrupa shapes vectoriais para produzir uma forma composta. Os shapes filhos são a geometria em si — os seus fills e strokes definem a aparência da forma resultante. Não faz sentido pedir ao designer que vincule esses valores a tokens porque estão a desempenhar o papel de "tinta" da forma, não de decisão de design semântica.

**Implementação:**
```typescript
if (node.parent && node.parent.type === 'BOOLEAN_OPERATION') return []
```

**Cobre:** Union, Subtract, Intersect, Exclude (todos os subtipos de `BOOLEAN_OPERATION`)

---

## IGNORE_CS_BORDER

**Estado:** Activo
**Ficheiro:** `src/backend/code.ts` → `detectHardcoded()` linha ~156
**Tipos de node afectados:** `COMPONENT_SET`

**Contexto técnico:**
O Figma injeta automaticamente um stroke roxo `#9747ff` em todos os Component Sets como marcador visual na interface de edição. Este valor não existe no design real nem é controlável pelo designer — é gerado pelo próprio Figma.

**Implementação:**
```typescript
if (isComponentSet && hex.toLowerCase() === '#9747ff') return
```

---

## IGNORE_CS_RADIUS

**Estado:** Activo
**Ficheiro:** `src/backend/code.ts` → `detectHardcoded()` linha ~172
**Tipos de node afectados:** `COMPONENT_SET`

**Contexto técnico:**
O Figma aplica `cornerRadius: 5` por defeito em todos os Component Sets. Igual ao caso do stroke — é um valor injetado pela plataforma, não pelo designer.

**Implementação:**
```typescript
if (isComponentSet && cr === 5) return
```
