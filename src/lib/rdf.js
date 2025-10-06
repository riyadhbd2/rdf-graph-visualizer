import { Parser as N3Parser } from 'n3'

export const defaultConfig = {
  title: 'RDF Graph',
  maxNodes: 40,
  hidePredicates: ['rdf:type', 'rdfs:label'],
  collapseLiterals: true,
  mergeParallelEdges: true,
  groupByType: [],
  nodeLabel: 'rdfs:label|foaf:name|@id',
  edgeLabel: '@predicate',
  layout: { 'elk.algorithm': 'layered', 'elk.direction': 'RIGHT' },
  filters: { subjects: [], predicates: [], objects: [] },
}

function iriShort(iri) {
  const known = {
    'http://www.w3.org/2000/01/rdf-schema#': 'rdfs:',
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#': 'rdf:',
    'http://xmlns.com/foaf/0.1/': 'foaf:',
  }
  for (const [base, pref] of Object.entries(known)) {
    if (iri?.startsWith?.(base)) return pref + iri.slice(base.length)
  }
  return iri || ''
}

function applyFilters(triples, cfg) {
  const S = new Set(cfg.filters?.subjects || [])
  const P = new Set(cfg.filters?.predicates || [])
  const O = new Set(cfg.filters?.objects || [])
  if (S.size + P.size + O.size === 0) return triples
  return triples.filter(t =>
    (S.size ? S.has(t.s) : true) &&
    (P.size ? P.has(t.p) : true) &&
    (O.size ? O.has(t.o) : true)
  )
}

function triplesToGraph(triples, cfg) {
  const hideP = new Set(cfg.hidePredicates || [])
  const nodes = new Map()
  const edges = []

  function ensureNode(id, label) {
    if (!nodes.has(id)) nodes.set(id, { id, label: label || iriShort(id) })
    return nodes.get(id)
  }

  for (const t of triples) {
    const pShort = iriShort(t.p)
    if (hideP.has(pShort) || hideP.has(t.p)) continue

    const sNode = ensureNode(t.s)
    if (cfg.collapseLiterals && t.oIsLiteral) {
      sNode.label = sNode.label || iriShort(sNode.id)
      sNode.label += `\n${iriShort(t.p)}: ${t.oLabel}`
      continue
    } else {
      ensureNode(t.o)
    }
    edges.push({ source: t.s, target: t.o, predicate: pShort })
  }

  // merge parallel edges
  let merged = edges
  if (cfg.mergeParallelEdges) {
    const map = new Map()
    for (const e of edges) {
      const k = e.source + '->' + e.target
      if (!map.has(k)) map.set(k, new Set())
      map.get(k).add(e.predicate)
    }
    merged = []
    for (const [k, set] of map.entries()) {
      const [source, target] = k.split('->')
      merged.push({ source, target, predicate: Array.from(set).join(', ') })
    }
  }

  const limitedNodes = Array.from(nodes.values()).slice(0, cfg.maxNodes || 40)
  const allowed = new Set(limitedNodes.map(n => n.id))
  const limitedEdges = merged.filter(e => allowed.has(e.source) && allowed.has(e.target))

  for (const n of limitedNodes) if (!n.label) n.label = iriShort(n.id)
  return { nodes: limitedNodes, edges: limitedEdges }
}

function parseTTLtoTriples(text) {
  const parser = new N3Parser()
  const triples = []
  parser.parse(text, (error, quad) => {
    if (error) console.error(error)
    if (quad) {
      triples.push({
        s: quad.subject.id || quad.subject.value,
        p: quad.predicate.id || quad.predicate.value,
        o: quad.object.id || quad.object.value,
        oIsLiteral: quad.object.termType === 'Literal',
        oLabel: quad.object.value,
      })
    }
  })
  return triples
}

export async function parseRDFFileOrJSON(file, cfg) {
  const ext = file.name.toLowerCase().split('.').pop()
  const text = await file.text()
  if (ext === 'json') {
    return JSON.parse(text)
  } else {
    const triples = parseTTLtoTriples(text)
    const filtered = applyFilters(triples, cfg)
    return triplesToGraph(filtered, cfg)
  }
}
