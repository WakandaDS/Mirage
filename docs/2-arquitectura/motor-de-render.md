# Explicação do Código: Layout e Desenho no Canvas
#mirage #codigo #frontend #rendering

> [!NOTE] Objectivo
> Este documento explica o código Javascript que corre no **Frontend (`14-compare-mode.js`)** do Figma. O foco é a transformação da árvore devolvida pelo backend em coordenadas (X, Y) e o desenho visual das curvas Bezier.

---

## 1. O Motor de Layout: `buildCMLayout()`

O backend devolve uma árvore aninhada (Layer > Filhos > Tokens). Mas o Canvas HTML não sabe o que é uma árvore, só sabe desenhar num ponto (X, Y).
O `buildCMLayout()` espalma essa árvore toda para uma lista de NÓS com posições calculadas, criando uma lista de nós virtuais.

```javascript
// A função recebe a árvore original do backend (tree) e uma margem X inicial.
function buildCMLayout(tree, startX, side) {
  var nodes = []; // Lista espalmada
  var tokenNodeMap = {}; // Dicionário { "varId" : { x:10, y:20 ... } }
  
  // Vamos começar a empilhar nós no eixo Y, descendo a partir daqui:
  var currentY = CMR.pad; // ex: 12px do topo da iframe

  // 1️⃣ Uma função mágica recursiva que vai percorrer os nós
  function traverse(node, depth) {
    if (!node) return;

    // Calculamos o deslocamento X consoante o nível da árvore (depth)
    // Se for um nó filho de Side A, anda para a direita (startX + depth * indent)
    var ind = depth * CMR.ind; 
    var x = (side === 'a') ? startX + ind : startX - ind; // Lado B espelha (anda para trás)
    var isExpanded = !cmCollapsed[side][node.id];

    // ... Cria e adiciona [LayerNode Visual] aqui 

    currentY += CMR.lh + 4; // Avançámos a "caneta" no eixo Y
    
    // 2️⃣ Só desenhamos os filhos se a layer NÃO ESTIVER colapsada
    if (isExpanded) {
      // 3️⃣ Desenhamos todos os filhos que são FILHOS DE LAYER primeiro
      if (node.children) {
        for (var i = 0; i < node.children.length; i++) {
          traverse(node.children[i], depth + 1); // Desce mais fundo
        }
      }

      // 4️⃣ Depois de processar as layers, desenhamos as pontas "os tokens"!
      // Calculamos o X deles para os encostar ao outro lado.
      if (node.tokens) {
        for (var idx = 0; idx < node.tokens.length; idx++) {
          var tok = node.tokens[idx];
          
          // O Side A empurra o X para a borda direita da coluna
          // O Side B empurra o X para a borda esquerda da coluna
          var tx = (side === 'a') ? startX + colW - tw : startX;

          var tNode = {
            id: 'tok_' + tok.variableId,
            type: 'token',       // A UI vai saber que não tem chevron 
            variableId: tok.variableId,
            x: tx,               // X na corda divisória 
            y: currentY,         // Y alinhado perfeitamente na fila visual
            w: tw,               // Largura do retângulo inteiro da fila "Label ...."
            cx: (side === 'a') ? tx + tw - CMR.tr - 2 : tx + CMR.tr + 2, // 🧲 Centro Magnético do Círculo Colorido
            cy: currentY + th / 2, // 🧲 O alvo exato onde vamos prender o bezier!
            side: side
          };

          nodes.push(tNode);
          tokenNodeMap[tok.variableId] = tNode; // 🔑 Guardamos atalho no dicionário!
          
          currentY += th + 1; // Próximo token desce a caneta...
        }
      }
    }
  }

  // Corre a travessia na raiz e acaba com a caneta muito lá em baixo (o ecrã tem scroll)
  traverse(tree, 0);

  // Devolve o mapa 2D final e o Dicionário super rápido
  return { nodes: nodes, tokenNodeMap: tokenNodeMap, totalH: currentY };
}
```

> [!TIP] O Centro Magnético (`cx`, `cy`)
> A variável `cx`/`cy` é o detalhe que brilha mais no layout. Em vez de calcular curvas desde o retângulo do texto, calculamos a corda diretamente desde o **centro exato do círculo colorido**.


---

## 2. A Coreografia do Rendering: `redrawCompareCanvas()`

Sempre que rodamos a roda do rato ou colapsamos algo, corremos isto: 

```javascript
function redrawCompareCanvas() {
  var cv = cmCanvas; // a <canvas> do DOM HTML
  var ctx = cmCtx;   // O Contexto 2D para riscar

  // 1️⃣ Limpamos toda a ardósia e aplicamos o SCROLL do utilizador 
  // O canvas é fixo; nós é que deslocamos o mundo mágico com (-cmScrollY)
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.translate(0, -cmScrollY);

  // 2️⃣ Desenhamos a árvore esquerda com os nossos X,Y pré-calculados
  if (cmLayoutA) {
    for (let n of cmLayoutA.nodes) {
       if (n.type === 'layer') drawCMLayerNode(n);  // Desenha caixa fundo branco + icone
       if (n.type === 'token') drawCMTokenNode(n);  // Desenha label + circulo colorido
    }
  }

  // 3️⃣ Desenhamos a árvore direita com os X,Y pre calculados e os ícones espelhados!
  if (cmLayoutB) { /* ... repete p/ Lado B ... */ }

  // 4️⃣ FINALMENTE AS CORDAS DIVISÓRIAS (BEZIER)
  // O pairingMap foi trazido do Backend lembra-te! O Dicionário tem chaves do tipo "[varId]"
  Object.keys(cmPairingMap).forEach(varId => {
  
    // Como criámos o atalho TokenNodeMap na função de layout em cima, é O(1) achar os X,Y!
    var nodeA = cmLayoutA.tokenNodeMap[varId]; 
    var nodeB = cmLayoutB.tokenNodeMap[varId];

    // 👉 Só desenhamos bezier SE AMBOS ESTIVEREM VISÍVEIS
    // (Pode estar tudo certo, mas o user fechou o colapsible esquerdo)
    if (!nodeA || !nodeB) return; 

    // O centro magnético de que falávamos:
    var startX = nodeA.cx, startY = nodeA.cy; 
    var endX = nodeB.cx, endY = nodeB.cy;

    var kind = cmPairingMap[varId].kind;   // Se for 'drifted'...
    var color = CM_COLORS[kind];           // ...é Laranja

    // Vamos traçar a linha bonita !
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // O truque: empurra os pontos de controlo para a zona morta do meio (gap / 2)
    // para que a linha saia sempre na horizontal perfeita nos circulos, 
    // e só incline a meio caminho!
    var ctrlX1 = startX + (endX - startX) / 2;
    var ctrlX2 = startX + (endX - startX) / 2;
    ctx.bezierCurveTo(ctrlX1, startY, ctrlX2, endY, endX, endY);
    
    ctx.strokeStyle = color; // Laranja
    ctx.lineWidth = 1.5;     
    ctx.stroke();            // Executa tudo agora. BOOM! Renderizado.
  });

  ctx.restore();
}
```

> [!INFO] A curva e o "bezierCurveTo"
> Uma curva Bezier precisa de 4 âncoras para ser feita: 
> 1. Origem: `moveTo(X, Y)`. 
> 2. Ponto de controlo 1: Para onde aponto?
> 3. Ponto de Controlo 2: De onde chega?
> 4. Ponto Final: O Destino `endX, endY`.
>
> Ao metermos `ctrlX1` a meio e `startY`, obrigamos a curva a sair literalmente em linha recta a 180 graus da bolinha de cor, criando a estética F8 polida em S.
