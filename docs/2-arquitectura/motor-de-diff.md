# Explicação do Código: Extracção e Diff de Tokens
#mirage #codigo #backend #diff

> [!NOTE] Objectivo
> Este documento explica passo a passo o código TypeScript que corre no **Backend (`code.ts`)** do Figma. O foco é perceber como o Mirage extrai os tokens e compara os dois componentes.

---

## 1. Como encontramos as propriedades ligadas a variáveis?

No Figma, uma layer pode ter várias propriedades ligadas a variáveis (ex: uma cor de fundo, um border radius). O Figma guarda essa informação na propriedade `boundVariables`. 

No topo do `code.ts`, temos a lista exacta das propriedades que queremos procurar em vez de adivinharmos:

```typescript
// 💡 NOTA PARA LER:
// Estas strings correspondem aos nomes exactos das chaves 
// dentro do objecto `boundVariables` do Figma API.
const BINDABLE_FIELDS: Array<{ key: string; type: string }> = [
  { key: 'fills',             type: 'COLOR' },
  { key: 'strokes',           type: 'COLOR' },
  { key: 'effects',           type: 'EFFECT' }, // Sombras e blurs
  { key: 'opacity',           type: 'FLOAT' }, 
  { key: 'itemSpacing',       type: 'FLOAT' }, // Espaço entre itens em AutoLayout
  { key: 'paddingLeft',       type: 'FLOAT' },
  // ... outras propriedades de padding e typography
];
```

## 2. A Função de Extracção: `extractTokens()`

Esta é a função mais pesada do backend. Para cada nó (layer) que existe dentro do componente que seleccionaste, ela tenta descobrir se esse nó tem tokens associados.

```typescript
async function extractTokens(node: SceneNode): Promise<{ tokens: TokenBinding[], broken: BrokenRef[] }> {
  const result: TokenBinding[] = [];
  const broken: BrokenRef[] = [];

  // 1️⃣ O nó tem alguma variável ligada? Se não, terminamos já aqui a análise deste nó.
  if (!node.boundVariables) return { tokens: result, broken };

  // 2️⃣ Percorremos a nossa lista de campos conhecidos (ver acima).
  for (const field of BINDABLE_FIELDS) {
    const bound = node.boundVariables[field.key as keyof VariableBindings];
    if (!bound) continue; // Este campo não tem variáveis ligadas. Passa ao próximo.
    
    // 💡 IMPORTANTE:
    // No Figma, propriedades como 'fills' ou 'strokes' podem ser um "Array" (várias cores sobrepostas).
    // Enquanto que 'opacity' ou 'cornerRadius' são apenas um "Valor singular".
    // Por isso, criamos um array provisório [bindings] para tratar tudo da mesma forma.
    
    const bindings = Array.isArray(bound) ? bound : [bound];
    
    for (const b of bindings) {
      if (b && b.id) {
        // 3️⃣ Encontramos um ID interno de uma variável (ex: "VariableID:1234")!
        // Agora precisamos pedir ao Figma os dados reais dessa variável (nome, valor).
        const variable = await figma.variables.getVariableByIdAsync(b.id);
        
        if (variable) {
          // 👉 SUCESSO! A variável existe. Resolvemos o valor e guardamos.
          // formatValue() transforma ex: {r:1, g:1, b:1} na string "#FFFFFF"
          const resolvedValue = formatValue(variable.resolveForConsumer(node).value, variable.resolvedType);
          
          result.push({
            variableId: variable.id,   // Chave principal que usamos no diff!
            name: variable.name,       // Ex: "cores/primaria"
            type: variable.resolvedType,
            property: field.key,       // Onde foi aplicada (ex: "fills")
            resolvedValue
          });
        } else {
          // 👉 BROKEN REF! 
          // O nó diz que tem um token associado, mas a `variable` não existe no ficheiro ou library.
          broken.push({
            variableId: b.id,
            property: field.key
          });
        }
      }
    }
  }

  return { tokens: result, broken };
}
```

> [!TIP]
> **Porquê o `await getVariableByIdAsync()`?**  
> A API de variáveis do Figma exige pedidos assíncronos. Isto significa que recolher centenas de tokens de um componente gigante pode demorar uns milissegundos a ir à base de dados do Figma buscar a informação toda, por isso é que a barra "*A Analisar...*" pode ser visível em ficheiros muito pesados.

---

## 3. O Computador do Diff (O coração da lógica F8)

Quando seleccionamos Lado A e Lado B, temos de comparar os Tokens de ambos.
O `code.ts` recebe a mensagem `'COMPARE'` do UI e corre este código:

```typescript
// 1️⃣ Primeiro recolhemos a árvore de camadas e os tokens para cada lado.
const { tree: treeA, tokenMap: tokensA, hardcoded: hcA, broken: bkA } = await collectLayerTree(nodeA, ...);
const { tree: treeB, tokenMap: tokensB, hardcoded: hcB, broken: bkB } = await collectLayerTree(nodeB, ...);

// 2️⃣ Arrays onde vamos arrumar o resultado do diagnóstico
const pairings = []; // Estão nos dois
const removals = []; // Só em A
const addons = [];   // Só em B

// 3️⃣ LÓGICA DE COMPARAÇÃO (Lado A como base)
// Vamos percorrer TODOS os tokens encontrados no componente A
for (const [varId, tA] of tokensA.entries()) {
  
  if (tokensB.has(varId)) {
    // 🔗 PAIRING: O ID do token existe no A e existe no B! Estão ligados.
    const tB = tokensB.get(varId)!;
    
    // Classificamos o nível de alteração (Kind)
    let kind = 'exact';
    if (tA.name !== tB.name) {
      kind = 'renamed'; // O ficheiro mudou de nome, ou a library renomeou a key, mas é a mesma ref.
    } else if (tA.resolvedValue !== tB.resolvedValue) {
      kind = 'drifted'; // Nome igual, ID igual, mas o valor hex/px final é diferente (modos divergentes).
    }
    
    pairings.push({
      variableId: varId,
      nameA: tA.name,
      nameB: tB.name,
      property: tA.property,
      kind
    });
  } else {
    // 💔 MUDANÇA: O token está em A, mas B já não o tem. Foi removido.
    removals.push({
      variableId: varId,
      name: tA.name,
      property: tA.property,
      kind: 'removal'
    });
  }
}

// 4️⃣ LÓGICA DE COMPARAÇÃO (Restos do Lado B)
// Agora percorremos o Lado B para ver o que sobrou (coisas exclusivas do B)
for (const [varId, tB] of tokensB.entries()) {
  if (!tokensA.has(varId)) {
    // ➕ NOVO: O token no B nunca foi visto no A.
    addons.push({
      variableId: varId,
      name: tB.name,
      property: tB.property,
      kind: 'addon'
    });
  }
}

// 5️⃣ Devolvemos a bandeja toda preparada ao UI (HTML) para virar linhas visuais.
figma.ui.postMessage({
  type: 'COMPARE_READY',
  data: { pairings, removals, addons, treeA, treeB } // <-- isto vai entrar no buildCMLayout()!
});
```

> [!IMPORTANT] Repara bem na chave primária!
> A condição mestre é o `tokensB.has(varId)`. 
> Nós não os comparamos pelo `Nome do Token` ("cores/primaria"), mas pelo **ID Interno**. Isto é fantástico porque permite que o Figma renomeie tokens à vontade; o Mirage apanha a ligação e classifica a curva como amarela (Renamed) em vez de corromper o link.
