figma.showUI(__html__, { width: 720, height: 600, themeColors: true })
figma.ui.resize(720, 600)

// ─── Types ────────────────────────────────────────────────────────

interface TokenBinding {
  property: string
  variableId: string
  variableName: string
  collectionName: string
  collectionId: string
  resolvedValue: string
  isRemote: boolean
  variableType: string
}

interface LayerTreeNode {
  id: string
  name: string
  nodeType: string
  tokens: {
    variableId: string
    variableName: string
    property: string
    resolvedValue: string
    variableType: string
  }[]
  children: LayerTreeNode[]
  hardcoded: { property: string, value: string }[]
  broken: { property: string, variableId: string }[]
}

// ─── Helpers ──────────────────────────────────────────────────────

const BINDABLE_FIELDS = [
  'fills', 'strokes', 'effects',
  'opacity',
  'cornerRadius', 'topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'itemSpacing', 'counterAxisSpacing',
  'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
  'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
  'paragraphSpacing',
  'strokeWeight', 'strokeTopWeight', 'strokeRightWeight', 'strokeBottomWeight', 'strokeLeftWeight',
  'visible',
] as const

async function formatValue(val: unknown, depth = 0): Promise<string> {
  if (depth > 5) return '(Too deep)'
  if (val === null || val === undefined) return ''
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>
    if ('r' in obj && 'g' in obj && 'b' in obj) {
      const r = Math.round((obj.r as number) * 255)
      const g = Math.round((obj.g as number) * 255)
      const b = Math.round((obj.b as number) * 255)
      const a = 'a' in obj ? (obj.a as number) : 1
      if (a < 1) return `rgba(${r},${g},${b},${a.toFixed(2)})`
      return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
    }
    if ('type' in obj && obj.type === 'VARIABLE_ALIAS' && 'id' in obj) {
      try {
        const aliasVar = await figma.variables.getVariableByIdAsync(obj.id as string)
        if (aliasVar) {
          const aliasCol = await figma.variables.getVariableCollectionByIdAsync(aliasVar.variableCollectionId)
          if (aliasCol && aliasVar.valuesByMode) {
            const baseVal = aliasVar.valuesByMode[aliasCol.defaultModeId]
            if (baseVal !== undefined) return await formatValue(baseVal, depth + 1)
          }
        }
      } catch (e) { console.error('[Mirage] Error parsing alias', e) }
      return `→ ${obj.id}`
    }
    return JSON.stringify(val)
  }
  return String(val)
}

async function extractTokens(
  node: SceneNode
): Promise<{ tokens: TokenBinding[], broken: { property: string, variableId: string }[] }> {
  const tokens: TokenBinding[] = []
  const broken: { property: string, variableId: string }[] = []
  const bound = (node as any).boundVariables
  if (!bound) return { tokens, broken }

  for (const field of BINDABLE_FIELDS) {
    const binding = bound[field]
    if (!binding) continue
    const bindings: Array<{ id: string }> = Array.isArray(binding) ? binding : [binding]
    for (const b of bindings) {
      if (!b || !b.id) continue
      try {
        const v = await figma.variables.getVariableByIdAsync(b.id)
        if (!v) {
          broken.push({ property: field as string, variableId: b.id })
          continue
        }
        const collection = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId)
        const isRemote = v.remote || !collection
        let resolvedValue = ''
        if (collection && v.valuesByMode) {
          const val = v.valuesByMode[collection.defaultModeId]
          if (val !== undefined) resolvedValue = await formatValue(val)
        }
        tokens.push({
          property: field as string,
          variableId: b.id,
          variableName: v.name,
          collectionName: collection?.name || 'Library Externa',
          collectionId: v.variableCollectionId,
          resolvedValue,
          isRemote,
          variableType: v.resolvedType,
        })
      } catch (e) {
        console.error('[Mirage] extractTokens failed for', b.id, e)
      }
    }
  }
  return { tokens, broken }
}

function detectHardcoded(node: SceneNode): { property: string, value: string }[] {
  const hardcoded: { property: string, value: string }[] = []
  const bound: Record<string, any> = (node as any).boundVariables || {}
  const isComponentSet = node.type === 'COMPONENT_SET'

  // Ignorar nodes dentro de operações booleanas (Union, Subtract, Intersect, Exclude)
  // — os fills/strokes destes nodes são parte da definição da forma, não hardcoded reais
  if (node.parent && node.parent.type === 'BOOLEAN_OPERATION') return hardcoded

  function colorHex(c: { r: number, g: number, b: number }): string {
    return '#'
      + Math.round(c.r * 255).toString(16).padStart(2, '0')
      + Math.round(c.g * 255).toString(16).padStart(2, '0')
      + Math.round(c.b * 255).toString(16).padStart(2, '0')
  }

  // fills — cada SOLID sem binding individual
  const fills = (node as any).fills
  if (Array.isArray(fills)) {
    const bf = Array.isArray(bound.fills) ? bound.fills : []
    fills.forEach((f: any, i: number) => {
      if (f.type === 'SOLID' && f.visible !== false && !bf[i]?.id) {
        hardcoded.push({ property: 'fills', value: colorHex(f.color) })
      }
    })
  }

  // strokes — cada SOLID sem binding individual
  const strokes = (node as any).strokes
  if (Array.isArray(strokes)) {
    const bs = Array.isArray(bound.strokes) ? bound.strokes : []
    strokes.forEach((s: any, i: number) => {
      if (s.type === 'SOLID' && s.visible !== false && !bs[i]?.id) {
        const hex = colorHex(s.color)
        // Ignorar a borda roxa padrão do Figma para Component Sets
        if (isComponentSet && hex.toLowerCase() === '#9747ff') return
        hardcoded.push({ property: 'strokes', value: hex })
      }
    })
  }

  // opacity — valor != 1 sem binding
  const opacity = (node as any).opacity
  if (typeof opacity === 'number' && opacity !== 1 && !bound.opacity) {
    hardcoded.push({ property: 'opacity', value: Math.round(opacity * 100) + '%' })
  }

  // cornerRadius — valor > 0 sem binding
  const cr = (node as any).cornerRadius
  if (typeof cr === 'number' && cr > 0 && !bound.cornerRadius) {
    // Ignorar o radius 5 padrão do Figma para Component Sets
    if (!(isComponentSet && cr === 5)) {
      hardcoded.push({ property: 'cornerRadius', value: cr + 'px' })
    }
  }

  return hardcoded
}

async function collectLayerTree(
  node: SceneNode,
  tokenMap: Map<string, { name: string; type: string; resolvedValue: string }>
): Promise<LayerTreeNode | null> {
  const { tokens: rawTokens, broken } = await extractTokens(node)
  for (const t of rawTokens) {
    if (!tokenMap.has(t.variableId)) {
      tokenMap.set(t.variableId, { name: t.variableName, type: t.property, resolvedValue: t.resolvedValue })
    }
  }
  const childNodes: LayerTreeNode[] = []
  if ('children' in node) {
    for (const child of (node as ChildrenMixin).children as SceneNode[]) {
      const childTree = await collectLayerTree(child, tokenMap)
      if (childTree) childNodes.push(childTree)
    }
  }
  const hardcoded = detectHardcoded(node)
  if (rawTokens.length === 0 && childNodes.length === 0 && hardcoded.length === 0 && broken.length === 0) return null
  
  const isVariant = node.type === 'COMPONENT' && node.parent && node.parent.type === 'COMPONENT_SET'
  
  return {
    id: node.id,
    name: node.name,
    nodeType: isVariant ? 'VARIANT' : node.type,
    tokens: rawTokens.map(t => ({
      variableId: t.variableId,
      variableName: t.variableName,
      property: t.property,
      resolvedValue: t.resolvedValue,
      variableType: t.variableType || 'COLOR',
    })),
    children: childNodes,
    hardcoded,
    broken,
  }
}

// ─── Message handling ─────────────────────────────────────────────

let waitingForCompareSelection = false
let _liveActive   = false
let _liveNodeIds  = new Set<string>()
let _liveHandlerRegistered = false

function collectNodeIds(tree: LayerTreeNode | null, ids: Set<string>) {
  if (!tree) return
  ids.add(tree.id)
  tree.children.forEach(c => collectNodeIds(c, ids))
}

async function _registerDocumentChangeHandler() {
  if (_liveHandlerRegistered) return
  await figma.loadAllPagesAsync()
  figma.on('documentchange', (event) => {
    if (!_liveActive) return
    const relevant = event.documentChanges.some(c => _liveNodeIds.has(c.id))
    if (relevant) figma.ui.postMessage({ type: 'DOCUMENT_CHANGED' })
  })
  _liveHandlerRegistered = true
}

figma.on('selectionchange', () => {
  if (waitingForCompareSelection) {
    waitingForCompareSelection = false
    const sel = figma.currentPage.selection
    if (!sel.length) {
      figma.ui.postMessage({ type: 'SELECTION_INFO', nodeId: null, name: null })
    } else {
      figma.ui.postMessage({ type: 'SELECTION_INFO', nodeId: sel[0].id, name: sel[0].name })
    }
  }
})

figma.ui.onmessage = async (msg: {
  type: string
  nodeIdA?: string
  nodeIdB?: string
  nodeId?: string
  query?: string
  width?: number
  height?: number
}) => {
  try {
    if (msg.type === 'RESIZE' && msg.width && msg.height) {
      figma.ui.resize(msg.width, msg.height)
    }

    if (msg.type === 'SELECT_NODE' && msg.nodeId) {
      const node = await figma.getNodeByIdAsync(msg.nodeId)
      if (node && node.type !== 'DOCUMENT' && node.type !== 'PAGE') {
        const sceneNode = node as SceneNode
        // Garantir que estamos na página certa
        let parent: BaseNode | null = sceneNode.parent
        while (parent && parent.type !== 'PAGE') parent = parent.parent
        if (parent && parent.type === 'PAGE' && parent.id !== figma.currentPage.id) {
          await figma.setCurrentPageAsync(parent as PageNode)
        }
        figma.currentPage.selection = [sceneNode]
        figma.viewport.scrollAndZoomIntoView([sceneNode])
      }
    }

    if (msg.type === 'GET_SELECTION') {
      const sel = figma.currentPage.selection
      if (sel.length) {
        figma.ui.postMessage({ type: 'SELECTION_INFO', nodeId: sel[0].id, name: sel[0].name })
      } else {
        waitingForCompareSelection = true
      }
    }

    if (msg.type === 'CANCEL_COMPARE_SELECTION') {
      waitingForCompareSelection = false
    }

    if (msg.type === 'SET_LIVE') {
      _liveActive = !!(msg as any).active
      if (_liveActive) await _registerDocumentChangeHandler()
    }

    if (msg.type === 'SEARCH_COMPONENTS' && typeof msg.query === 'string') {
      const TYPES = new Set(['COMPONENT', 'COMPONENT_SET', 'FRAME'])
      const q = msg.query.toLowerCase()
      // figma.root.findAll em dynamic-page ignora páginas não carregadas —
      // sem loadAllPagesAsync para não reventar memória em ficheiros grandes.
      // A página corrente é sempre pesquisada; as restantes aparecem se já estiverem na memória.
      const matches = figma.root.findAll(
        node => TYPES.has(node.type) && node.name.toLowerCase().indexOf(q) !== -1
      ).slice(0, 60)
      figma.ui.postMessage({
        type: 'COMPONENTS_LIST',
        components: matches.map(n => {
          let page: BaseNode = n
          while (page.parent && page.parent.type !== 'DOCUMENT') page = page.parent
          return { nodeId: n.id, name: n.name, type: n.type, page: page.name }
        }),
      })
    }

    if (msg.type === 'COMPARE' && msg.nodeIdA && msg.nodeIdB) {
      const nodeA = await figma.getNodeByIdAsync(msg.nodeIdA) as SceneNode | null
      const nodeB = await figma.getNodeByIdAsync(msg.nodeIdB) as SceneNode | null

      if (!nodeA || !nodeB) {
        figma.ui.postMessage({ type: 'ERROR', message: 'Não foi possível encontrar os componentes seleccionados.' })
        return
      }

      const tokensA = new Map<string, { name: string; type: string; resolvedValue: string }>()
      const tokensB = new Map<string, { name: string; type: string; resolvedValue: string }>()
      const [treeA, treeB] = await Promise.all([
        collectLayerTree(nodeA, tokensA),
        collectLayerTree(nodeB, tokensB),
      ])

      const pairings: { id: string; nameA: string; nameB: string; type: string; kind: string }[] = []
      const removals: { id: string; name: string; type: string }[] = []
      const addons:   { id: string; name: string; type: string }[] = []

      for (const [varId, tA] of tokensA.entries()) {
        if (tokensB.has(varId)) {
          const tB = tokensB.get(varId)!
          let kind = 'exact'
          if (tA.name !== tB.name) kind = 'renamed'
          else if (tA.resolvedValue !== tB.resolvedValue) kind = 'drifted'
          pairings.push({ id: varId, nameA: tA.name, nameB: tB.name, type: tA.type, kind })
        } else {
          removals.push({ id: varId, name: tA.name, type: tA.type })
        }
      }
      for (const [varId, tB] of tokensB.entries()) {
        if (!tokensA.has(varId)) {
          addons.push({ id: varId, name: tB.name, type: tB.type })
        }
      }

      figma.ui.postMessage({ type: 'COMPARE_READY', data: { pairings, removals, addons, treeA, treeB } })

      // Actualizar o conjunto de IDs monitorizados pelo live
      _liveNodeIds = new Set<string>()
      collectNodeIds(treeA, _liveNodeIds)
      collectNodeIds(treeB, _liveNodeIds)
    }

  } catch (err) {
    figma.ui.postMessage({ type: 'ERROR', message: String(err) })
  }
}
