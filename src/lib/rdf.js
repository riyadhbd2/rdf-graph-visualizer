import { Parser as N3Parser } from 'n3'

const RDF_TYPE_IRI = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'

export const defaultConfig = {
  title: 'RDF Graph',
  maxNodes: 40,
  hidePredicates: ['rdfs:label'],
  collapseLiterals: true,
  mergeParallelEdges: true,
  groupByType: [],
  nodeLabel: 'rdfs:label|foaf:name|@id',
  edgeLabel: '@predicate',
  layout: { 'elk.algorithm': 'layered', 'elk.direction': 'RIGHT' },
  filters: { subjects: [], predicates: [], objects: [] },
  highlightShacl: true,
  uniformNodeSize: true,
}

function normalizeTemplate(template) {
  if (!template) return []
  return String(template)
    .split('|')
    .map(entry => entry.trim())
    .filter(Boolean)
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

function buildSubjectIndex(triples = []) {
  const subjects = new Map()
  for (const triple of triples) {
    if (!subjects.has(triple.s)) {
      subjects.set(triple.s, { predicates: new Map(), types: new Set() })
    }
    const entry = subjects.get(triple.s)
    const predicateKeys = [triple.p, iriShort(triple.p)].filter(Boolean)
    predicateKeys.forEach(key => {
      if (!entry.predicates.has(key)) entry.predicates.set(key, [])
      entry.predicates.get(key).push(triple)
    })
    if (triple.p === RDF_TYPE_IRI || iriShort(triple.p) === 'rdf:type') {
      entry.types.add(triple.o)
      const shortType = iriShort(triple.o)
      if (shortType) entry.types.add(shortType)
    }
  }
  return subjects
}

function resolveNodeLabel(nodeId, cfg, subjectIndex, collapsedLiteralLines = []) {
  const template = normalizeTemplate(cfg?.nodeLabel || '')
  const entry = subjectIndex.get(nodeId)

  const pickPredicateValue = predicateKey => {
    const matches = entry?.predicates?.get(predicateKey)
    if (!matches || !matches.length) return null
    const literal = matches.find(t => t.oIsLiteral)
    if (literal) return literal.oLabel || literal.o
    const first = matches[0]
    return iriShort(first.o) || first.o
  }

  let label = ''
  for (const token of template) {
    if (token === '@id') {
      label = iriShort(nodeId) || nodeId
      break
    }
    if (token === '@iri') {
      label = nodeId
      break
    }
    if (token === '@type') {
      const types = Array.from(entry?.types || []).filter(Boolean)
      if (types.length) {
        const preferred = types.find(val => val.includes(':')) || types[0]
        label = preferred
        break
      }
    }
    const value = pickPredicateValue(token)
    if (value) {
      label = value
      break
    }
  }

  if (!label) label = iriShort(nodeId) || nodeId
  if (collapsedLiteralLines.length) {
    label += '\n' + collapsedLiteralLines.join('\n')
  }
  return label
}

function resolveEdgeLabel(edge, cfg) {
  const template = normalizeTemplate(cfg?.edgeLabel || '@predicate')
  const pShort = iriShort(edge.predicateIri || edge.predicate) || edge.predicate
  const tokenValues = {
    '@predicate': pShort,
    '@predicateIri': edge.predicateIri || edge.predicate,
    '@source': iriShort(edge.source) || edge.source,
    '@target': iriShort(edge.target) || edge.target,
  }
  const candidates = template.length ? template : ['@predicate']
  for (const token of candidates) {
    const value = tokenValues[token]
    if (value) return String(value)
  }
  return pShort || edge.predicate || ''
}

function resolveGroupForNode(nodeId, cfg, subjectIndex) {
  const groupTargets = Array.isArray(cfg?.groupByType) ? cfg.groupByType : []
  if (!groupTargets.length) return null
  const targetSet = new Set(groupTargets)
  const entry = subjectIndex.get(nodeId)
  const types = Array.from(entry?.types || [])
  for (const type of types) {
    if (targetSet.has(type) || targetSet.has(iriShort(type))) {
      return iriShort(type) || type
    }
  }
  return null
}

function looksLikeGraphJson(data) {
  return data && typeof data === 'object' && Array.isArray(data.nodes) && Array.isArray(data.edges)
}

function looksLikeJsonLd(data) {
  if (!data || typeof data !== 'object') return false
  if (Array.isArray(data)) return data.some(entry => entry && typeof entry === 'object')
  return Boolean(data['@graph'] || data['@context'] || data['@id'])
}

function extractContextMap(data) {
  const context = Array.isArray(data) ? data.find(entry => entry && entry['@context'])?.['@context'] : data['@context']
  if (!context) return {}
  const map = {}
  const addEntry = (key, value) => {
    if (typeof key !== 'string' || typeof value !== 'string') return
    map[key] = value
  }
  if (Array.isArray(context)) {
    context.forEach(entry => {
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        Object.entries(entry).forEach(([k, v]) => addEntry(k, v))
      }
    })
  } else if (typeof context === 'object') {
    Object.entries(context).forEach(([k, v]) => addEntry(k, v))
  }
  return map
}

function expandCurie(value, prefixes) {
  if (typeof value !== 'string') return value
  const colonIndex = value.indexOf(':')
  if (colonIndex <= 0) return value
  const prefix = value.slice(0, colonIndex)
  const local = value.slice(colonIndex + 1)
  if (!prefixes[prefix]) return value
  return prefixes[prefix] + local
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
  const collapsedLiterals = new Map()
  const subjectIndex = buildSubjectIndex(triples)

  function ensureNode(id, isLiteral = false) {
    if (!nodes.has(id)) nodes.set(id, { id, isLiteral })
    return nodes.get(id)
  }

  for (const t of triples) {
    const pShort = iriShort(t.p)
    const predicateHidden = hideP.has(pShort) || hideP.has(t.p)

    ensureNode(t.s)

    if (cfg.collapseLiterals && t.oIsLiteral) {
      if (!collapsedLiterals.has(t.s)) collapsedLiterals.set(t.s, [])
      collapsedLiterals.get(t.s).push(`${pShort}: ${t.oLabel}`)
      continue
    }

    ensureNode(t.o, t.oIsLiteral)

    if (predicateHidden) continue

    const label = resolveEdgeLabel(
      { source: t.s, target: t.o, predicate: pShort, predicateIri: t.p },
      cfg
    )

    edges.push({
      source: t.s,
      target: t.o,
      predicate: label,
      predicateIri: t.p,
    })
  }

  // merge parallel edges
  let merged = edges
  if (cfg.mergeParallelEdges) {
    const map = new Map()
    for (const e of edges) {
      const k = e.source + '->' + e.target
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(e)
    }
    merged = []
    for (const [k, list] of map.entries()) {
      const [source, target] = k.split('->')
      const labels = Array.from(
        new Set(list.map(entry => entry.predicate).filter(Boolean))
      )
      merged.push({
        source,
        target,
        predicate: labels.join(', '),
        predicateIri: list[0]?.predicateIri,
      })
    }
  }

  const limitedNodes = Array.from(nodes.values()).slice(0, cfg.maxNodes || 40)
  const allowed = new Set(limitedNodes.map(n => n.id))
  const limitedEdges = merged.filter(e => allowed.has(e.source) && allowed.has(e.target))

  for (const n of limitedNodes) {
    const collapsedLines = collapsedLiterals.get(n.id) || []
    n.label = resolveNodeLabel(n.id, cfg, subjectIndex, collapsedLines)
    n.group = resolveGroupForNode(n.id, cfg, subjectIndex)
    if (!n.label) n.label = iriShort(n.id)
  }

  const graph = { nodes: limitedNodes, edges: limitedEdges }
  if (cfg.title) graph.title = cfg.title
  return graph
}

export function buildGraphFromTriples(triples, cfg) {
  const filtered = applyFilters(triples, cfg)
  return triplesToGraph(filtered, cfg)
}

function parseTTLtoTriples(text) {
  const parser = new N3Parser()
  const quads = parser.parse(text)
  return quads.map(quad => ({
    s: quad.subject.id || quad.subject.value,
    p: quad.predicate.id || quad.predicate.value,
    o: quad.object.id || quad.object.value,
    oIsLiteral: quad.object.termType === 'Literal',
    oLabel: quad.object.value,
  }))
}

function parseRDFXMLtoTriples(text) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'application/xml')
  if (doc.querySelector('parsererror')) {
    throw new Error('Invalid RDF/XML content.')
  }
  const RDF_NS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
  const triples = []
  let blankIndex = 0

  function resolveSubject(el) {
    const about = el.getAttributeNS(RDF_NS, 'about') || el.getAttribute('rdf:about')
    if (about) return about
    const id = el.getAttributeNS(RDF_NS, 'ID') || el.getAttribute('rdf:ID')
    if (id) return '#' + id
    const nodeID = el.getAttributeNS(RDF_NS, 'nodeID') || el.getAttribute('rdf:nodeID')
    if (nodeID) return '_:' + nodeID
    blankIndex += 1
    return '_:b' + blankIndex
  }

  function resolveObject(child) {
    const resource = child.getAttributeNS(RDF_NS, 'resource') || child.getAttribute('rdf:resource')
    if (resource) {
      return { value: resource, isLiteral: false }
    }
    const nodeID = child.getAttributeNS(RDF_NS, 'nodeID') || child.getAttribute('rdf:nodeID')
    if (nodeID) {
      return { value: '_:' + nodeID, isLiteral: false }
    }
    const textContent = child.textContent.trim()
    return { value: textContent, isLiteral: true }
  }

  const descriptions = Array.from(doc.getElementsByTagNameNS('*', 'Description'))
  const topLevelTyped = Array.from(doc.documentElement?.children || []).filter(
    el => !(el.namespaceURI === RDF_NS && el.localName === 'RDF')
  )
  const resources = Array.from(new Set([...descriptions, ...topLevelTyped]))

  resources.forEach(el => {
    const subject = resolveSubject(el)
    const isDescription = el.namespaceURI === RDF_NS && el.localName === 'Description'
    const typePredicate = el.namespaceURI ? el.namespaceURI + el.localName : el.tagName
    if (typePredicate && !isDescription) {
      triples.push({
        s: subject,
        p: RDF_NS + 'type',
        o: typePredicate,
        oIsLiteral: false,
        oLabel: typePredicate,
      })
    }
    Array.from(el.children).forEach(child => {
      const predicate = child.namespaceURI ? child.namespaceURI + child.localName : child.tagName
      const { value, isLiteral } = resolveObject(child)
      triples.push({
        s: subject,
        p: predicate,
        o: value,
        oIsLiteral: isLiteral,
        oLabel: value,
      })
    })
  })

  return triples
}

function parseJSONLDToTriples(text) {
  const data = typeof text === 'string' ? JSON.parse(text) : text
  const prefixes = extractContextMap(data)
  const items = Array.isArray(data) ? data : (data['@graph'] || [data])
  const triples = []
  const ensureArray = val => (Array.isArray(val) ? val : [val])

  items.forEach(entry => {
    if (!entry || typeof entry !== 'object') return
    const subject = entry['@id'] || entry.id || null
    if (!subject) return

    Object.entries(entry).forEach(([key, value]) => {
      if (key === '@id' || key === '@context') return
      if (key === '@type') {
        ensureArray(value).forEach(typeVal => {
          if (typeof typeVal === 'string') {
            const expandedType = expandCurie(typeVal, prefixes)
            triples.push({
              s: subject,
              p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
              o: expandedType,
              oIsLiteral: false,
              oLabel: expandedType,
            })
          } else if (typeVal && typeof typeVal === 'object') {
            const typeId = expandCurie(typeVal['@id'] || typeVal.id, prefixes)
            const literal = typeVal['@value'] || typeVal.value
            if (typeId) {
              triples.push({
                s: subject,
                p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
                o: typeId,
                oIsLiteral: false,
                oLabel: typeId,
              })
            } else if (literal !== undefined) {
              const label = String(literal)
              triples.push({
                s: subject,
                p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
                o: label,
                oIsLiteral: true,
                oLabel: label,
              })
            }
          }
        })
        return
      }

      const predicate = expandCurie(key, prefixes)

      ensureArray(value).forEach(val => {
        if (val === null || val === undefined) return
        if (typeof val === 'object') {
          const id = expandCurie(val['@id'] || val.id, prefixes)
          const literal = val['@value'] ?? val.value
          if (id) {
            triples.push({ s: subject, p: predicate, o: id, oIsLiteral: false, oLabel: id })
          } else if (literal !== undefined) {
            triples.push({ s: subject, p: predicate, o: literal, oIsLiteral: true, oLabel: String(literal) })
          }
        } else {
          triples.push({ s: subject, p: predicate, o: String(val), oIsLiteral: true, oLabel: String(val) })
        }
      })
    })
  })

  return triples
}

export async function parseRDFFileOrJSON(file, cfg, options = {}) {
  const { returnTriples = false } = options
  const ext = file.name.toLowerCase().split('.').pop()
  const text = await file.text()
  if (ext === 'json') {
    const parsedJson = JSON.parse(text)
    const isGraphJson = looksLikeGraphJson(parsedJson)
    const isJsonLd = looksLikeJsonLd(parsedJson)
    if (returnTriples) {
      if (isJsonLd) return parseJSONLDToTriples(parsedJson)
      throw new Error('JSON files must be JSON-LD when SPARQL filtering is requested.')
    }
    if (isGraphJson) return parsedJson
    if (isJsonLd) {
      const triples = parseJSONLDToTriples(parsedJson)
      return buildGraphFromTriples(triples, cfg)
    }
    throw new Error('Unsupported JSON structure. Provide a graph JSON ({nodes,edges}) or JSON-LD RDF data.')
  }
  let triples
  if (ext === 'ttl' || ext === 'nt' || ext === 'n3') {
    triples = parseTTLtoTriples(text)
  } else if (ext === 'rdf' || ext === 'xml') {
    triples = parseRDFXMLtoTriples(text)
  } else if (ext === 'jsonld') {
    triples = parseJSONLDToTriples(text)
  } else {
    throw new Error(`Unsupported file format: .${ext}`)
  }
  if (returnTriples) return triples
  return buildGraphFromTriples(triples, cfg)
}
