const DEFAULT_MAX_EDGE_CROSSINGS = 800
const DEFAULT_MAX_NODE_OVERLAPS = 500

function safeNumber(value) {
  return Number.isFinite(value) ? value : null
}

function computeBounds(nodes) {
  if (!Array.isArray(nodes) || nodes.length === 0) return null
  let xMin = Infinity
  let yMin = Infinity
  let xMax = -Infinity
  let yMax = -Infinity
  for (const node of nodes) {
    const x = Number.isFinite(node.x) ? node.x : 0
    const y = Number.isFinite(node.y) ? node.y : 0
    const w = Number.isFinite(node.width) ? node.width : 0
    const h = Number.isFinite(node.height) ? node.height : 0
    xMin = Math.min(xMin, x)
    yMin = Math.min(yMin, y)
    xMax = Math.max(xMax, x + w)
    yMax = Math.max(yMax, y + h)
  }
  const width = Math.max(0, xMax - xMin)
  const height = Math.max(0, yMax - yMin)
  return { xMin, yMin, xMax, yMax, width, height, area: width * height }
}

function centerOf(node) {
  const x = Number.isFinite(node.x) ? node.x : 0
  const y = Number.isFinite(node.y) ? node.y : 0
  const w = Number.isFinite(node.width) ? node.width : 0
  const h = Number.isFinite(node.height) ? node.height : 0
  return { x: x + w / 2, y: y + h / 2 }
}

function radiusOf(node) {
  const w = Number.isFinite(node.width) ? node.width : 0
  const h = Number.isFinite(node.height) ? node.height : 0
  return Math.max(w, h) / 2
}

function edgeLengths(edges, nodeMap) {
  if (!Array.isArray(edges) || edges.length === 0) return []
  const lengths = []
  edges.forEach(edge => {
    const src = nodeMap.get(edge.source)
    const tgt = nodeMap.get(edge.target)
    if (!src || !tgt) return
    const a = centerOf(src)
    const b = centerOf(tgt)
    const dx = a.x - b.x
    const dy = a.y - b.y
    const dist = Math.hypot(dx, dy)
    if (Number.isFinite(dist)) lengths.push(dist)
  })
  return lengths
}

function statsFrom(values) {
  if (!values.length) {
    return { avg: null, median: null, stdDev: null, min: null, max: null }
  }
  const sorted = [...values].sort((a, b) => a - b)
  const count = sorted.length
  const sum = sorted.reduce((acc, val) => acc + val, 0)
  const avg = sum / count
  const median = count % 2 === 0 ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2 : sorted[(count - 1) / 2]
  const variance = sorted.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / count
  const stdDev = Math.sqrt(variance)
  return { avg, median, stdDev, min: sorted[0], max: sorted[count - 1] }
}

function orientation(a, b, c) {
  const value = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y)
  if (Math.abs(value) < 1e-9) return 0
  return value > 0 ? 1 : -1
}

function segmentsIntersect(a, b, c, d) {
  const o1 = orientation(a, b, c)
  const o2 = orientation(a, b, d)
  const o3 = orientation(c, d, a)
  const o4 = orientation(c, d, b)
  if (o1 === 0 || o2 === 0 || o3 === 0 || o4 === 0) return false
  return o1 !== o2 && o3 !== o4
}

function computeEdgeCrossings(segments) {
  let crossings = 0
  for (let i = 0; i < segments.length; i += 1) {
    const segA = segments[i]
    for (let j = i + 1; j < segments.length; j += 1) {
      const segB = segments[j]
      if (segA.sourceId === segB.sourceId || segA.sourceId === segB.targetId) continue
      if (segA.targetId === segB.sourceId || segA.targetId === segB.targetId) continue
      if (segmentsIntersect(segA.a, segA.b, segB.a, segB.b)) crossings += 1
    }
  }
  return crossings
}

function computeNodeOverlaps(nodes) {
  let overlaps = 0
  for (let i = 0; i < nodes.length; i += 1) {
    const nodeA = nodes[i]
    const a = centerOf(nodeA)
    const ra = radiusOf(nodeA)
    for (let j = i + 1; j < nodes.length; j += 1) {
      const nodeB = nodes[j]
      const b = centerOf(nodeB)
      const rb = radiusOf(nodeB)
      const dx = a.x - b.x
      const dy = a.y - b.y
      if (dx * dx + dy * dy < Math.pow(ra + rb, 2)) overlaps += 1
    }
  }
  return overlaps
}

export function computeGraphMetrics(nodes = [], edges = [], options = {}) {
  if (!Array.isArray(nodes) || nodes.length === 0) return null

  const bounds = computeBounds(nodes)
  const nodeCount = nodes.length
  const edgeCount = Array.isArray(edges) ? edges.length : 0
  const nodeMap = new Map(nodes.map(node => [node.id, node]))

  const lengths = edgeLengths(edges, nodeMap)
  const lengthStats = statsFrom(lengths)

  const nodeAreaTotal = nodes.reduce((acc, node) => {
    const r = radiusOf(node)
    if (!Number.isFinite(r) || r <= 0) return acc
    return acc + Math.PI * r * r
  }, 0)

  const area = bounds?.area ?? 0
  const density = area > 0 ? nodeCount / area : null
  const aspectRatio = bounds && bounds.height > 0 ? bounds.width / bounds.height : null
  const whitespaceRatio = area > 0 ? Math.max(0, 1 - Math.min(1, nodeAreaTotal / area)) : null

  const maxCrossingEdges = options.maxCrossingEdges ?? DEFAULT_MAX_EDGE_CROSSINGS
  let edgeCrossings = null
  let edgeCrossingsNote = null
  if (edgeCount > 0 && edgeCount <= maxCrossingEdges) {
    const segments = edges.reduce((acc, edge) => {
      const src = nodeMap.get(edge.source)
      const tgt = nodeMap.get(edge.target)
      if (!src || !tgt) return acc
      acc.push({
        sourceId: edge.source,
        targetId: edge.target,
        a: centerOf(src),
        b: centerOf(tgt),
      })
      return acc
    }, [])
    edgeCrossings = computeEdgeCrossings(segments)
  } else if (edgeCount > maxCrossingEdges) {
    edgeCrossingsNote = `skipped (edge count > ${maxCrossingEdges})`
  }

  const maxOverlapNodes = options.maxOverlapNodes ?? DEFAULT_MAX_NODE_OVERLAPS
  let nodeOverlaps = null
  let nodeOverlapsNote = null
  if (nodeCount > 0 && nodeCount <= maxOverlapNodes) {
    nodeOverlaps = computeNodeOverlaps(nodes)
  } else if (nodeCount > maxOverlapNodes) {
    nodeOverlapsNote = `skipped (node count > ${maxOverlapNodes})`
  }

  return {
    version: 1,
    nodeCount,
    edgeCount,
    bounds: bounds
      ? {
          xMin: safeNumber(bounds.xMin),
          yMin: safeNumber(bounds.yMin),
          xMax: safeNumber(bounds.xMax),
          yMax: safeNumber(bounds.yMax),
          width: safeNumber(bounds.width),
          height: safeNumber(bounds.height),
          area: safeNumber(bounds.area),
        }
      : null,
    density: safeNumber(density),
    aspectRatio: safeNumber(aspectRatio),
    nodeAreaTotal: safeNumber(nodeAreaTotal),
    whitespaceRatio: safeNumber(whitespaceRatio),
    avgEdgeLength: safeNumber(lengthStats.avg),
    medianEdgeLength: safeNumber(lengthStats.median),
    edgeLengthStdDev: safeNumber(lengthStats.stdDev),
    minEdgeLength: safeNumber(lengthStats.min),
    maxEdgeLength: safeNumber(lengthStats.max),
    edgeCrossings,
    edgeCrossingsNote,
    nodeOverlaps,
    nodeOverlapsNote,
  }
}

function flattenMetrics(metrics, prefix = '', output = {}) {
  if (!metrics || typeof metrics !== 'object') return output
  Object.entries(metrics).forEach(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenMetrics(value, nextKey, output)
    } else {
      output[nextKey] = value
    }
  })
  return output
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function metricsToCsv(metrics) {
  if (!metrics) return ''
  const flat = flattenMetrics(metrics)
  const headers = Object.keys(flat)
  const values = headers.map(key => escapeCsvValue(flat[key]))
  return `${headers.join(',')}\n${values.join(',')}`
}
