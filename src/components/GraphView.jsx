import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import ELK from 'elkjs/lib/elk.bundled.js'
import { computeGraphMetrics } from '../lib/metrics.js'

const TYPE_PREDICATES = new Set([
  'rdf:type',
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
])

const DEFAULT_NODE_SIZE = { width: 140, height: 64 }
const EVAL_NODE_SIZE = { width: 110, height: 52 }
const DEFAULT_PADDING = 80
const EVAL_PADDING = 40
const MIN_ZOOM = 0.1
const MAX_ZOOM = 3.5
const FIT_PADDING = 0.92
const KIND_COLORS = {
  class: { fill: '#fde68a', stroke: '#f59e0b' },
  literal: { fill: '#dcfce7', stroke: '#16a34a' },
  entity: { fill: '#bfdbfe', stroke: '#2563eb' },
  blank: { fill: '#e5e7eb', stroke: '#6b7280' },
}
const GROUP_PALETTE = [
  { fill: '#bfdbfe', stroke: '#2563eb' },
  { fill: '#a5f3fc', stroke: '#0ea5e9' },
  { fill: '#fcd34d', stroke: '#d97706' },
  { fill: '#bbf7d0', stroke: '#16a34a' },
  { fill: '#fecdd3', stroke: '#f43f5e' },
  { fill: '#ddd6fe', stroke: '#7c3aed' },
  { fill: '#fde68a', stroke: '#b45309' },
]

function getBaseNodeSize(cfg) {
  return cfg?.evaluationMode ? EVAL_NODE_SIZE : DEFAULT_NODE_SIZE
}

function getPadding(cfg) {
  return cfg?.evaluationMode ? EVAL_PADDING : DEFAULT_PADDING
}

function measureNode(label, baseSize) {
  const lines = String(label || '').split('\n')
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0)
  const width = Math.max(baseSize.width, 24 + longest * 7)
  const height = Math.max(baseSize.height, 24 + lines.length * 16)
  return { width, height }
}

function getNodeDimensions(label, cfg) {
  const baseSize = getBaseNodeSize(cfg)
  if (cfg?.uniformNodeSize !== false) return { ...baseSize }
  return measureNode(label, baseSize)
}

function colorForGroup(group) {
  if (!group) return null
  let hash = 0
  for (let i = 0; i < group.length; i += 1) {
    hash = (hash << 5) - hash + group.charCodeAt(i)
    hash |= 0 // keep 32-bit
  }
  const index = Math.abs(hash) % GROUP_PALETTE.length
  return GROUP_PALETTE[index]
}

const SVG_NS = 'http://www.w3.org/2000/svg'

function shapeTagForKind(kind) {
  if (kind === 'class' || kind === 'literal') return 'rect'
  if (kind === 'blank') return 'polygon'
  return 'circle'
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getFitScale(dx, dy, width, height) {
  const scale = FIT_PADDING / Math.max(dx / width, dy / height)
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale))
}

function buildElkGraph(graph, cfg) {
  const elkChildren = graph.nodes.map(node => {
    const dims = getNodeDimensions(node.label || node.id, cfg)
    return { id: node.id, width: dims.width, height: dims.height }
  })

  const elkEdges = graph.edges.map((edge, index) => ({
    id: `e-${index}`,
    sources: [edge.source],
    targets: [edge.target],
    labels: [{ text: edge.predicate }],
  }))

  const layout = cfg?.layout || {}
  const evaluationMode = cfg?.evaluationMode === true
  const betweenLayers =
    layout['elk.layered.spacing.nodeNodeBetweenLayers'] ??
    (evaluationMode ? '24' : '40')
  const edgeNode = layout['elk.spacing.edgeNode'] ?? (evaluationMode ? '14' : '24')
  const edgeRouting = evaluationMode ? 'ORTHOGONAL' : (layout['elk.edgeRouting'] || 'SPLINES')

  const layoutOptions = {
    'elk.algorithm': layout['elk.algorithm'] || 'layered',
    'elk.direction': layout['elk.direction'] || 'RIGHT',
    'elk.edgeRouting': edgeRouting,
    'elk.layered.spacing.nodeNodeBetweenLayers': String(betweenLayers),
    'elk.spacing.edgeNode': String(edgeNode),
    'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
  }

  return {
    id: 'root',
    layoutOptions,
    children: elkChildren,
    edges: elkEdges,
  }
}

function elkEdgeToPath(edge, nodeLookup) {
  if (edge.sections?.length) {
    const section = edge.sections[0]
    const points = [
      section.startPoint,
      ...(section.bendPoints || []),
      section.endPoint,
    ].filter(Boolean)
    if (points.length) {
      return `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`
    }
  }
  const source = nodeLookup.get(edge.sources?.[0])
  const target = nodeLookup.get(edge.targets?.[0])
  if (!source || !target) return ''
  return `M ${source.x} ${source.y} L ${target.x} ${target.y}`
}

function elkEdgeToSmoothPath(edge, nodeLookup) {
  if (edge.sections?.length) {
    const section = edge.sections[0]
    const points = [
      section.startPoint,
      ...(section.bendPoints || []),
      section.endPoint,
    ].filter(Boolean)
    if (points.length >= 2) {
      const line = d3
        .line()
        .x(p => p.x)
        .y(p => p.y)
        .curve(d3.curveCatmullRom.alpha(0.6))
      return line(points) || ''
    }
  }
  const source = nodeLookup.get(edge.sources?.[0])
  const target = nodeLookup.get(edge.targets?.[0])
  if (!source || !target) return ''
  const points = [
    { x: source.x, y: source.y },
    { x: target.x, y: target.y },
  ]
  const fallback = d3
    .line()
    .x(p => p.x)
    .y(p => p.y)
    .curve(d3.curveCatmullRom.alpha(0.6))
  return fallback(points) || ''
}

const GraphView = forwardRef(function GraphView(
  { graph, cfg, enablePhysics = true, onMetrics },
  ref
) {
  const hostRef = useRef(null)
  const elk = useMemo(() => new ELK(), [])
  const [layout, setLayout] = useState(null)
  const zoomRef = useRef(null)
  const svgRef = useRef(null)
  const boundsRef = useRef(null)
  const minScaleRef = useRef(MIN_ZOOM)
  const simulationRef = useRef(null)
  const layoutMetaRef = useRef({ layoutMs: null })
  const autoViewRef = useRef(true)
  const tooltipStateRef = useRef({ id: null, open: false })

  function nowMs() {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now()
    }
    return Date.now()
  }

  useEffect(() => {
    autoViewRef.current = true
  }, [graph])

  useEffect(() => {
    let cancelled = false
    async function computeLayout() {
      if (!graph || !graph.nodes?.length) {
        setLayout(null)
        return
      }
      try {
        const elkGraph = buildElkGraph(graph, cfg)
        const start = nowMs()
        const result = await elk.layout(elkGraph)
        const layoutMs = nowMs() - start
        layoutMetaRef.current = { layoutMs }
        if (!cancelled) setLayout(result)
      } catch (error) {
        console.error('ELK layout failed', error)
        layoutMetaRef.current = { layoutMs: null }
        if (!cancelled) setLayout(null)
      }
    }
    computeLayout()
    return () => {
      cancelled = true
    }
  }, [graph, cfg, elk])

  useImperativeHandle(
    ref,
    () => ({
      fitToContent,
      resetZoom,
    }),
    []
  )

  function fitToContent() {
    const host = hostRef.current
    const svg = svgRef.current
    const zoom = zoomRef.current
    const bounds = boundsRef.current
    if (!host || !svg || !zoom || !bounds) return

    const [[x0, y0], [x1, y1]] = bounds
    const width = host.clientWidth || 960
    const height = host.clientHeight || 640
    const dx = Math.max(1, x1 - x0)
    const dy = Math.max(1, y1 - y0)
    const fitScale = getFitScale(dx, dy, width, height)
    const minScale = Math.min(1, fitScale)
    minScaleRef.current = minScale

    zoom.scaleExtent([minScale, MAX_ZOOM])
    zoom.translateExtent(bounds)
    zoom.extent([
      [0, 0],
      [width, height],
    ])

    const translate = [
      width / 2 - fitScale * (x0 + dx / 2),
      height / 2 - fitScale * (y0 + dy / 2),
    ]

    svg
      .transition()
      .duration(350)
      .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(fitScale))
  }

  function resetZoom() {
    const svg = svgRef.current
    const zoom = zoomRef.current
    if (!svg || !zoom) return
    svg.transition().duration(200).call(zoom.transform, d3.zoomIdentity)
  }

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    host.innerHTML = ''
    if (!layout || !graph) return
    if (simulationRef.current) {
      simulationRef.current.stop()
      simulationRef.current = null
    }

    const highlightShacl = cfg?.highlightShacl !== false
    const baseNodeSize = getBaseNodeSize(cfg)
    const padding = getPadding(cfg)

    const emitMetrics = nodesSnapshot => {
      if (typeof onMetrics !== 'function') return
      const metrics = computeGraphMetrics(nodesSnapshot, graph.edges || [])
      if (!metrics) {
        onMetrics(null)
        return
      }
      const meta = {
        evaluationMode: cfg?.evaluationMode === true,
        physicsEnabled: Boolean(enablePhysics),
        layoutAlgorithm: cfg?.layout?.['elk.algorithm'] || 'layered',
        layoutDirection: cfg?.layout?.['elk.direction'] || 'RIGHT',
        uniformNodeSize: cfg?.uniformNodeSize !== false,
        collapseLiterals: cfg?.collapseLiterals !== false,
        mergeParallelEdges: cfg?.mergeParallelEdges !== false,
        maxNodes: Number.isFinite(cfg?.maxNodes) ? cfg.maxNodes : null,
        nodeLabelTemplate: cfg?.nodeLabel || '',
        edgeLabelTemplate: cfg?.edgeLabel || '',
        title: graph?.title || '',
        layoutMs: layoutMetaRef.current?.layoutMs ?? null,
      }
      onMetrics({ ...metrics, meta })
    }

    const resetZoomToDefault = () => {
      const svg = svgRef.current
      const zoom = zoomRef.current
      if (!svg || !zoom) return
      svg.call(zoom.transform, d3.zoomIdentity)
    }

    const resetViewIfNeeded = () => {
      if (!autoViewRef.current) return
      autoViewRef.current = false
      resetZoomToDefault()
    }

    const computeBoundsFromNodes = nodesSnapshot => {
      if (!Array.isArray(nodesSnapshot) || nodesSnapshot.length === 0) return null
      const xMin = Math.min(...nodesSnapshot.map(n => (n.x ?? 0))) - padding
      const yMin = Math.min(...nodesSnapshot.map(n => (n.y ?? 0))) - padding
      const xMax = Math.max(...nodesSnapshot.map(n => (n.x ?? 0) + (n.width || baseNodeSize.width))) + padding
      const yMax = Math.max(...nodesSnapshot.map(n => (n.y ?? 0) + (n.height || baseNodeSize.height))) + padding
      const width = Math.max(1, xMax - xMin)
      const height = Math.max(1, yMax - yMin)
      return { xMin, yMin, xMax, yMax, width, height }
    }

    const updateViewportBounds = nodesSnapshot => {
      const bounds = computeBoundsFromNodes(nodesSnapshot)
      if (!bounds) return null
      const svg = svgRef.current
      const zoom = zoomRef.current
      const host = hostRef.current
      if (!svg || !zoom || !host) return bounds

      boundsRef.current = [
        [bounds.xMin, bounds.yMin],
        [bounds.xMax, bounds.yMax],
      ]
      svg.attr('viewBox', `${bounds.xMin} ${bounds.yMin} ${bounds.width} ${bounds.height}`)

      const width = host.clientWidth || bounds.width || 960
      const height = host.clientHeight || bounds.height || 640
      zoom.translateExtent(boundsRef.current)
      zoom.extent([
        [0, 0],
        [width, height],
      ])
      return bounds
    }

    const nodeLookup = new Map()
    layout.children?.forEach(child => nodeLookup.set(child.id, child))

    const typeTargets = new Set()
    graph.edges?.forEach(edge => {
      if (TYPE_PREDICATES.has(edge.predicate)) typeTargets.add(edge.target)
    })

    const nodeStats = new Map()
    const ensureStats = id => {
      if (!nodeStats.has(id)) {
        nodeStats.set(id, {
          inCount: 0,
          outCount: 0,
          totalCount: 0,
          predicateCounts: new Map(),
          topPredicates: [],
        })
      }
      return nodeStats.get(id)
    }
    graph.edges?.forEach(edge => {
      const predicate = edge.predicate || edge.predicateIri || ''
      const srcStats = ensureStats(edge.source)
      srcStats.outCount += 1
      srcStats.totalCount += 1
      if (predicate) {
        srcStats.predicateCounts.set(predicate, (srcStats.predicateCounts.get(predicate) || 0) + 1)
      }
      const tgtStats = ensureStats(edge.target)
      tgtStats.inCount += 1
      tgtStats.totalCount += 1
      if (predicate) {
        tgtStats.predicateCounts.set(predicate, (tgtStats.predicateCounts.get(predicate) || 0) + 1)
      }
    })
    for (const stats of nodeStats.values()) {
      stats.topPredicates = Array.from(stats.predicateCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([predicate, count]) => ({ predicate, count }))
    }

    const nodes = graph.nodes.map(node => {
      const positioned = nodeLookup.get(node.id) || {}
      const originX = Number.isFinite(positioned.x) ? positioned.x : 0
      const originY = Number.isFinite(positioned.y) ? positioned.y : 0
      const isBlank = String(node.id || '').startsWith('_:')
      const kind = isBlank
        ? 'blank'
        : typeTargets.has(node.id)
          ? 'class'
          : node.isLiteral
            ? 'literal'
            : 'entity'
      const groupColors = colorForGroup(node.group)
      const baseColors = KIND_COLORS[kind] || KIND_COLORS.entity
      return {
        ...node,
        ...positioned,
        originX,
        originY,
        kind: kind || 'entity',
        baseFill: groupColors?.fill || baseColors.fill,
        baseStroke: groupColors?.stroke || baseColors.stroke,
        shaclViolations: Array.isArray(node.shaclViolations) ? node.shaclViolations : [],
        stats: nodeStats.get(node.id) || {
          inCount: 0,
          outCount: 0,
          totalCount: 0,
          topPredicates: [],
        },
      }
    })

    const edgesFromLayout = (layout.edges || []).map(edge => {
      const idx = Number.parseInt(String(edge.id || '').replace('e-', ''), 10)
      const predicate = Number.isFinite(idx)
        ? graph.edges[idx]?.predicate
        : edge.labels?.[0]?.text
      return {
        ...edge,
        predicate: predicate || edge.labels?.[0]?.text || '',
      }
    })

    const physicsEdges = (graph.edges || []).map((edge, index) => ({
      id: `p-${index}`,
      predicate: edge.predicate,
      source: edge.source,
      target: edge.target,
    }))

    const linkData = enablePhysics ? physicsEdges : edgesFromLayout

    const xMin = Math.min(...nodes.map(n => (n.x ?? 0))) - padding
    const yMin = Math.min(...nodes.map(n => (n.y ?? 0))) - padding
    const xMax = Math.max(...nodes.map(n => (n.x ?? 0) + (n.width || baseNodeSize.width))) + padding
    const yMax = Math.max(...nodes.map(n => (n.y ?? 0) + (n.height || baseNodeSize.height))) + padding

    const viewWidth = Math.max(1, xMax - xMin)
    const viewHeight = Math.max(1, yMax - yMin)
    const viewportWidth = host.clientWidth || viewWidth || 960
    const viewportHeight = host.clientHeight || viewHeight || 640
    const fitScale = getFitScale(viewWidth, viewHeight, viewportWidth, viewportHeight)
    const minScale = Math.min(1, fitScale)
    minScaleRef.current = minScale

    const svg = d3
      .select(host)
      .append('svg')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr('viewBox', `${xMin} ${yMin} ${viewWidth} ${viewHeight}`)
      .attr('width', viewportWidth)
      .attr('height', viewportHeight)

    svgRef.current = svg
    boundsRef.current = [
      [xMin, yMin],
      [xMax, yMax],
    ]

    const zoomLayer = svg.append('g')

    const tooltip = d3
      .select(host)
      .append('div')
      .attr('data-graph-tooltip', 'true')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('opacity', '0')
      .style('background', 'rgba(15, 23, 42, 0.92)')
      .style('color', '#f8fafc')
      .style('padding', '8px 10px')
      .style('border-radius', '8px')
      .style('font-size', '12px')
      .style('line-height', '1.4')
      .style('max-width', '320px')
      .style('box-shadow', '0 6px 18px rgba(15, 23, 42, 0.35)')
      .style('z-index', '20')

    function formatTooltipHtml(d) {
      const title = escapeHtml(d.label || d.id)
      const idLine = escapeHtml(d.id || '')
      const kindLine = escapeHtml(d.kind || 'entity')
      const groupLine = d.group ? escapeHtml(d.group) : ''
      const stats = d.stats || {}
      const inCount = Number.isFinite(stats.inCount) ? stats.inCount : 0
      const outCount = Number.isFinite(stats.outCount) ? stats.outCount : 0
      const totalCount = Number.isFinite(stats.totalCount) ? stats.totalCount : 0
      const topPredicates = Array.isArray(stats.topPredicates) ? stats.topPredicates : []
      const predicateBlock = topPredicates.length
        ? `<div style="margin-top:6px;color:#e2e8f0;">Top predicates: ${topPredicates
            .map(entry => `${escapeHtml(entry.predicate)} (${entry.count})`)
            .join(', ')}</div>`
        : `<div style="margin-top:6px;color:#e2e8f0;">Top predicates: n/a</div>`
      const violations = Array.isArray(d.shaclViolations) ? d.shaclViolations : []
      const violationBlock = violations.length
        ? `<div style="margin-top:6px;color:#fecaca;">${violations.map(v => escapeHtml(v)).join('<br/>')}</div>`
        : ''
      const groupBlock = groupLine
        ? `<div style="margin-top:4px;color:#cbd5f5;">Group: ${groupLine}</div>`
        : ''
      return `
        <div style="font-weight:600;font-size:13px;">${title}</div>
        <div style="color:#cbd5f5;">${idLine}</div>
        <div style="margin-top:4px;color:#e2e8f0;">Type: ${kindLine}</div>
        <div style="margin-top:4px;color:#e2e8f0;">Degree: In ${inCount} · Out ${outCount} · Total ${totalCount}</div>
        ${groupBlock}
        ${predicateBlock}
        ${violationBlock}
      `
    }

    function positionTooltip(event) {
      const [x, y] = d3.pointer(event, host)
      const tooltipNode = tooltip.node()
      if (!tooltipNode) return
      const tipWidth = tooltipNode.offsetWidth || 0
      const tipHeight = tooltipNode.offsetHeight || 0
      const hostWidth = host.clientWidth || viewportWidth
      const hostHeight = host.clientHeight || viewportHeight
      let left = x + 12
      let top = y + 12
      const maxLeft = hostWidth - tipWidth - 8
      const maxTop = hostHeight - tipHeight - 8
      if (left > maxLeft) left = Math.max(8, x - tipWidth - 12)
      if (top > maxTop) top = Math.max(8, y - tipHeight - 12)
      tooltip.style('left', `${left}px`).style('top', `${top}px`)
    }

    function hideTooltip() {
      tooltip.style('opacity', '0')
      tooltipStateRef.current = { id: null, open: false }
    }

    const clampTransform = transform => {
      const hostBounds = host.getBoundingClientRect()
      const width = hostBounds.width || viewportWidth
      const height = hostBounds.height || viewportHeight
      const [minPoint, maxPoint] = boundsRef.current || [
        [xMin, yMin],
        [xMax, yMax],
      ]
      const minX = minPoint[0]
      const minY = minPoint[1]
      const maxX = maxPoint[0]
      const maxY = maxPoint[1]

      const contentWidth = (maxX - minX) * transform.k
      const contentHeight = (maxY - minY) * transform.k

      if (!Number.isFinite(contentWidth) || !Number.isFinite(contentHeight)) return transform

      const minTranslateX = width - contentWidth - minX * transform.k
      const maxTranslateX = -minX * transform.k
      const minTranslateY = height - contentHeight - minY * transform.k
      const maxTranslateY = -minY * transform.k

      let tx = transform.x
      let ty = transform.y

      if (contentWidth < width) {
        tx = (width - contentWidth) / 2 - minX * transform.k
      } else {
        tx = Math.min(Math.max(tx, minTranslateX), maxTranslateX)
      }

      if (contentHeight < height) {
        ty = (height - contentHeight) / 2 - minY * transform.k
      } else {
        ty = Math.min(Math.max(ty, minTranslateY), maxTranslateY)
      }

      return d3.zoomIdentity.translate(tx, ty).scale(transform.k)
    }

    const zoom = d3
      .zoom()
      .scaleExtent([minScale, MAX_ZOOM])
      .translateExtent([
        [xMin, yMin],
        [xMax, yMax],
      ])
      .extent([
        [0, 0],
        [viewportWidth, viewportHeight],
      ])
      .constrain(transform => clampTransform(transform))
      .on('start', () => {
        hideTooltip()
      })
      .on('zoom', event => {
        zoomLayer.attr('transform', event.transform)
      })

    zoomRef.current = zoom
    svg.call(zoom)

    const defs = svg.append('defs')
    defs
      .append('marker')
      .attr('id', 'arrow-marker')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 5)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', '#4b5563')

    const gradients = [
      { id: 'grad-entity', from: '#dbeafe', to: '#93c5fd' },
      { id: 'grad-class', from: '#fef3c7', to: '#fcd34d' },
      { id: 'grad-literal', from: '#dcfce7', to: '#86efac' },
      { id: 'grad-blank', from: '#f3f4f6', to: '#d1d5db' },
    ]

    const grad = defs
      .selectAll('linearGradient')
      .data(gradients)
      .enter()
      .append('linearGradient')
      .attr('id', d => d.id)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%')

    grad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', d => d.from)

    grad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', d => d.to)

    const linkGroup = zoomLayer.append('g').attr('class', 'links')
    const nodeGroup = zoomLayer.append('g').attr('class', 'nodes')
    const labelGroup = zoomLayer.append('g').attr('class', 'link-labels')
    const showEdgeLabels = cfg?.showEdgeLabels === true

    function linkPathStraight(edgeDatum) {
      const src = typeof edgeDatum.source === 'object' ? edgeDatum.source : nodeLookup.get(edgeDatum.source)
      const tgt = typeof edgeDatum.target === 'object' ? edgeDatum.target : nodeLookup.get(edgeDatum.target)
      if (!src || !tgt) return ''
      const sx = (src.x || 0) + (src.width || baseNodeSize.width) / 2
      const sy = (src.y || 0) + (src.height || baseNodeSize.height) / 2
      const tx = (tgt.x || 0) + (tgt.width || baseNodeSize.width) / 2
      const ty = (tgt.y || 0) + (tgt.height || baseNodeSize.height) / 2
      return `M ${sx} ${sy} L ${tx} ${ty}`
    }

    function linkPathSmooth(edgeDatum) {
      const src = typeof edgeDatum.source === 'object' ? edgeDatum.source : nodeLookup.get(edgeDatum.source)
      const tgt = typeof edgeDatum.target === 'object' ? edgeDatum.target : nodeLookup.get(edgeDatum.target)
      if (!src || !tgt) return ''
      const sx = (src.x || 0) + (src.width || baseNodeSize.width) / 2
      const sy = (src.y || 0) + (src.height || baseNodeSize.height) / 2
      const tx = (tgt.x || 0) + (tgt.width || baseNodeSize.width) / 2
      const ty = (tgt.y || 0) + (tgt.height || baseNodeSize.height) / 2
      const dx = tx - sx
      const dy = ty - sy
      const len = Math.hypot(dx, dy) || 1
      const curve = Math.min(36, len * 0.2)
      const nx = -dy / len
      const ny = dx / len
      const mx = (sx + tx) / 2 + nx * curve
      const my = (sy + ty) / 2 + ny * curve
      const line = d3
        .line()
        .x(p => p.x)
        .y(p => p.y)
        .curve(d3.curveCatmullRom.alpha(0.6))
      return line([{ x: sx, y: sy }, { x: mx, y: my }, { x: tx, y: ty }]) || ''
    }

    const edgeRouting = cfg?.evaluationMode ? 'ORTHOGONAL' : (cfg?.layout?.['elk.edgeRouting'] || 'SPLINES')
    const useSmoothEdges = edgeRouting === 'SPLINES'

    const linkPaths = linkGroup
      .selectAll('path')
      .data(linkData)
      .enter()
      .append('path')
      .attr('id', d => `link-${d.id}`)
      .attr('fill', 'none')
      .attr('stroke', '#cbd5f5')
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('marker-end', 'url(#arrow-marker)')
      .attr('d', d => {
        if (enablePhysics) return useSmoothEdges ? linkPathSmooth(d) : linkPathStraight(d)
        if (useSmoothEdges) return elkEdgeToSmoothPath(d, nodeLookup)
        return elkEdgeToPath(d, nodeLookup)
      })

    if (showEdgeLabels) {
      labelGroup
        .selectAll('text')
        .data(linkData)
        .enter()
        .append('text')
        .attr('font-size', 11)
        .attr('fill', '#1f2937')
        .append('textPath')
        .attr('href', d => `#link-${d.id}`)
        .attr('startOffset', '50%')
        .attr('text-anchor', 'middle')
        .text(d => d.predicate)
    }

    const node = nodeGroup
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')

    const shape = node
      .append(d => document.createElementNS(SVG_NS, shapeTagForKind(d.kind)))
      .attr('class', 'node-shape')
      .attr('fill', d => {
        if (highlightShacl && d.shaclViolations.length) return '#fecdd3'
        if (d.group) return d.baseFill
        const gradientId = d.kind ? `url(#grad-${d.kind})` : null
        return gradientId || d.baseFill
      })
      .attr('stroke', d => {
        if (highlightShacl && d.shaclViolations.length) return '#dc2626'
        return d.baseStroke
      })
      .attr('stroke-width', d => (d.group || d.kind === 'class' ? 3 : 2))
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('filter', null)

    function updateNodeShapes(selection) {
      selection.each(function (d) {
        const el = d3.select(this)
        const w = d.width || baseNodeSize.width
        const h = d.height || baseNodeSize.height
        const x = d.x || 0
        const y = d.y || 0
        const cx = x + w / 2
        const cy = y + h / 2
        if (d.kind === 'class') {
          el.attr('x', x).attr('y', y).attr('width', w).attr('height', h).attr('rx', 8).attr('ry', 8)
        } else if (d.kind === 'literal') {
          const pill = Math.min(h / 2, 24)
          el.attr('x', x).attr('y', y).attr('width', w).attr('height', h).attr('rx', pill).attr('ry', pill)
        } else if (d.kind === 'blank') {
          const points = [
            [cx, y],
            [x + w, cy],
            [cx, y + h],
            [x, cy],
          ]
            .map(p => p.join(' '))
            .join(' ')
          el.attr('points', points)
        } else {
          el.attr('cx', cx).attr('cy', cy).attr('r', Math.max(w, h) / 2)
        }
      })
    }

    updateNodeShapes(shape)

    node
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (event.defaultPrevented) return
        if (tooltipStateRef.current.open && tooltipStateRef.current.id === d.id) {
          hideTooltip()
          return
        }
        tooltipStateRef.current = { id: d.id, open: true }
        tooltip.style('opacity', '1').html(formatTooltipHtml(d))
        positionTooltip(event)
      })
      .on('touchstart', (event, d) => {
        if (event.defaultPrevented) return
        tooltipStateRef.current = { id: d.id, open: true }
        tooltip.style('opacity', '1').html(formatTooltipHtml(d))
        positionTooltip(event)
      })

    node
      .append('text')
      .attr('x', d => (d.x || 0) + (d.width || baseNodeSize.width) / 2)
      .attr('y', d => {
        const lines = (d.label || d.id).split('\n')
        const centerY = (d.y || 0) + (d.height || baseNodeSize.height) / 2
        return centerY - (lines.length - 1) * 8
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', d => (d.kind === 'class' ? 13 : 12))
      .attr('font-weight', d => (d.kind === 'class' ? 600 : 500))
      .attr('fill', '#111827')
      .selectAll('tspan')
      .data(d => (d.label || d.id).split('\n'))
      .enter()
      .append('tspan')
      .attr('x', (d, i, nodesArr) => {
        const datum = d3.select(nodesArr[i].parentNode).data()[0]
        return (datum.x || 0) + (datum.width || baseNodeSize.width) / 2
      })
      .attr('dy', (line, i) => (i === 0 ? 0 : 16))
      .text(line => line)

    svg.on('click', event => {
      const target = event.target
      if (target && target.closest && target.closest('.node')) return
      hideTooltip()
    })

    if (enablePhysics) {
      const simulation = d3
        .forceSimulation(nodes)
        .force(
          'link',
          d3
            .forceLink(linkData)
            .id(d => d.id)
            .distance(d => {
              const src = typeof d.source === 'object' ? d.source : nodeLookup.get(d.source)
              const tgt = typeof d.target === 'object' ? d.target : nodeLookup.get(d.target)
              const base = 110 + Math.max(src?.width || 0, tgt?.width || 0) * 0.2
              return base
            })
            .strength(0.18)
        )
        .force('charge', d3.forceManyBody().strength(-80))
        .force(
          'collide',
          d3
            .forceCollide()
            .radius(d => Math.max(d.width || baseNodeSize.width, d.height || baseNodeSize.height) / 2 + 8)
        )
        .force('x', d3.forceX(d => d.originX || 0).strength(0.08))
        .force('y', d3.forceY(d => d.originY || 0).strength(0.08))
        .force('center', d3.forceCenter((xMin + xMax) / 2, (yMin + yMax) / 2))
        .velocityDecay(0.4)
        .alpha(0.7)
        .alphaDecay(0.12)

      simulationRef.current = simulation

      const dragBehavior = d3
        .drag()
        .on('start', (event, d) => {
          event.sourceEvent?.stopPropagation()
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })

      node.call(dragBehavior)

      simulation.on('tick', () => {
        updateNodeShapes(shape)

        node
          .select('text')
          .attr('x', d => (d.x || 0) + (d.width || baseNodeSize.width) / 2)
          .attr('y', d => {
            const lines = (d.label || d.id).split('\n')
            const centerY = (d.y || 0) + (d.height || baseNodeSize.height) / 2
            return centerY - (lines.length - 1) * 8
          })
          .selectAll('tspan')
          .attr('x', (line, i, nodesArr) => {
            const datum = d3.select(nodesArr[i].parentNode).data()[0]
            return (datum.x || 0) + (datum.width || baseNodeSize.width) / 2
          })

        linkPaths.attr('d', d => (useSmoothEdges ? linkPathSmooth(d) : linkPathStraight(d)))
      })

      simulation.on('end', () => {
        updateViewportBounds(nodes)
        emitMetrics(nodes)
        resetViewIfNeeded()
      })
    } else {
      updateViewportBounds(nodes)
      emitMetrics(nodes)
      resetViewIfNeeded()
    }

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop()
        simulationRef.current = null
      }
      host.innerHTML = ''
    }
  }, [layout, graph, cfg, enablePhysics, onMetrics])

  return <div ref={hostRef} className="relative w-full h-full" />
})

export default GraphView
