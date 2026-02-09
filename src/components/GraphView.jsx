import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import ELK from 'elkjs/lib/elk.bundled.js'

const TYPE_PREDICATES = new Set([
  'rdf:type',
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
])

const DEFAULT_NODE_SIZE = { width: 140, height: 64 }
const PADDING = 80
const MIN_ZOOM = 0.1
const MAX_ZOOM = 3.5
const FIT_PADDING = 0.92
const KIND_COLORS = {
  class: { fill: '#fde68a', stroke: '#f59e0b' },
  literal: { fill: '#dcfce7', stroke: '#16a34a' },
  entity: { fill: '#bfdbfe', stroke: '#2563eb' },
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

function measureNode(label) {
  const lines = String(label || '').split('\n')
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0)
  const width = Math.max(DEFAULT_NODE_SIZE.width, 24 + longest * 7)
  const height = Math.max(DEFAULT_NODE_SIZE.height, 24 + lines.length * 16)
  return { width, height }
}

function getNodeDimensions(label, cfg) {
  if (cfg?.uniformNodeSize !== false) return { ...DEFAULT_NODE_SIZE }
  return measureNode(label)
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

  const layoutOptions = {
    'elk.algorithm': cfg?.layout?.['elk.algorithm'] || 'layered',
    'elk.direction': cfg?.layout?.['elk.direction'] || 'RIGHT',
    'elk.edgeRouting': cfg?.layout?.['elk.edgeRouting'] || 'ORTHOGONAL',
    'elk.layered.spacing.nodeNodeBetweenLayers': '40',
    'elk.spacing.edgeNode': '24',
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

const GraphView = forwardRef(function GraphView({ graph, cfg, enablePhysics = true }, ref) {
  const hostRef = useRef(null)
  const elk = useMemo(() => new ELK(), [])
  const [layout, setLayout] = useState(null)
  const zoomRef = useRef(null)
  const svgRef = useRef(null)
  const boundsRef = useRef(null)
  const minScaleRef = useRef(MIN_ZOOM)
  const simulationRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function computeLayout() {
      if (!graph || !graph.nodes?.length) {
        setLayout(null)
        return
      }
      try {
        const elkGraph = buildElkGraph(graph, cfg)
        const result = await elk.layout(elkGraph)
        if (!cancelled) setLayout(result)
      } catch (error) {
        console.error('ELK layout failed', error)
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

    const nodeLookup = new Map()
    layout.children?.forEach(child => nodeLookup.set(child.id, child))

    const typeTargets = new Set()
    graph.edges?.forEach(edge => {
      if (TYPE_PREDICATES.has(edge.predicate)) typeTargets.add(edge.target)
    })

    const nodes = graph.nodes.map(node => {
      const positioned = nodeLookup.get(node.id) || {}
      const kind = typeTargets.has(node.id) ? 'class' : node.isLiteral ? 'literal' : 'entity'
      const groupColors = colorForGroup(node.group)
      const baseColors = KIND_COLORS[kind] || KIND_COLORS.entity
      return {
        ...node,
        ...positioned,
        kind: kind || 'entity',
        baseFill: groupColors?.fill || baseColors.fill,
        baseStroke: groupColors?.stroke || baseColors.stroke,
        shaclViolations: Array.isArray(node.shaclViolations) ? node.shaclViolations : [],
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

    const xMin = Math.min(...nodes.map(n => (n.x ?? 0))) - PADDING
    const yMin = Math.min(...nodes.map(n => (n.y ?? 0))) - PADDING
    const xMax = Math.max(...nodes.map(n => (n.x ?? 0) + (n.width || DEFAULT_NODE_SIZE.width))) + PADDING
    const yMax = Math.max(...nodes.map(n => (n.y ?? 0) + (n.height || DEFAULT_NODE_SIZE.height))) + PADDING

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

    const linkGroup = zoomLayer.append('g').attr('class', 'links')
    const nodeGroup = zoomLayer.append('g').attr('class', 'nodes')
    const labelGroup = zoomLayer.append('g').attr('class', 'link-labels')

    function linkPathStraight(edgeDatum) {
      const src = typeof edgeDatum.source === 'object' ? edgeDatum.source : nodeLookup.get(edgeDatum.source)
      const tgt = typeof edgeDatum.target === 'object' ? edgeDatum.target : nodeLookup.get(edgeDatum.target)
      if (!src || !tgt) return ''
      const sx = (src.x || 0) + (src.width || DEFAULT_NODE_SIZE.width) / 2
      const sy = (src.y || 0) + (src.height || DEFAULT_NODE_SIZE.height) / 2
      const tx = (tgt.x || 0) + (tgt.width || DEFAULT_NODE_SIZE.width) / 2
      const ty = (tgt.y || 0) + (tgt.height || DEFAULT_NODE_SIZE.height) / 2
      return `M ${sx} ${sy} L ${tx} ${ty}`
    }

    const linkPaths = linkGroup
      .selectAll('path')
      .data(linkData)
      .enter()
      .append('path')
      .attr('id', d => `link-${d.id}`)
      .attr('fill', 'none')
      .attr('stroke', '#cbd5f5')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow-marker)')
      .attr('d', d => (enablePhysics ? linkPathStraight(d) : elkEdgeToPath(d, nodeLookup)))

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

    const node = nodeGroup
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')

    node
      .append('circle')
      .attr('cx', d => (d.x || 0) + (d.width || DEFAULT_NODE_SIZE.width) / 2)
      .attr('cy', d => (d.y || 0) + (d.height || DEFAULT_NODE_SIZE.height) / 2)
      .attr('r', d => Math.max(d.width || DEFAULT_NODE_SIZE.width, d.height || DEFAULT_NODE_SIZE.height) / 2)
      .attr('fill', d => {
        if (highlightShacl && d.shaclViolations.length) return '#fecdd3'
        return d.baseFill
      })
      .attr('stroke', d => {
        if (highlightShacl && d.shaclViolations.length) return '#dc2626'
        return d.baseStroke
      })
      .attr('stroke-width', d => (d.group || d.kind === 'class' ? 3 : 2))
      .attr('filter', 'drop-shadow(0px 2px 3px rgba(15, 23, 42, 0.15))')

    node
      .append('text')
      .attr('x', d => (d.x || 0) + (d.width || DEFAULT_NODE_SIZE.width) / 2)
      .attr('y', d => {
        const lines = (d.label || d.id).split('\n')
        const centerY = (d.y || 0) + (d.height || DEFAULT_NODE_SIZE.height) / 2
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
        return (datum.x || 0) + (datum.width || DEFAULT_NODE_SIZE.width) / 2
      })
      .attr('dy', (line, i) => (i === 0 ? 0 : 16))
      .text(line => line)

    node
      .append('title')
      .text(d => {
        if (d.shaclViolations.length) return d.shaclViolations.join('\n')
        const base = (d.label || d.id).split('\n')[0]
        if (d.group) return `${base}\nGroup: ${d.group}`
        return base
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
              const base = 140 + Math.max(src?.width || 0, tgt?.width || 0) * 0.3
              return base
            })
            .strength(0.12)
        )
        .force('charge', d3.forceManyBody().strength(-220))
        .force(
          'collide',
          d3.forceCollide().radius(d => Math.max(d.width || DEFAULT_NODE_SIZE.width, d.height || DEFAULT_NODE_SIZE.height) / 2 + 18)
        )
        .force('center', d3.forceCenter((xMin + xMax) / 2, (yMin + yMax) / 2))
        .alpha(0.9)
        .alphaDecay(0.08)

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
        node
          .select('circle')
          .attr('cx', d => (d.x || 0) + (d.width || DEFAULT_NODE_SIZE.width) / 2)
          .attr('cy', d => (d.y || 0) + (d.height || DEFAULT_NODE_SIZE.height) / 2)

        node
          .select('text')
          .attr('x', d => (d.x || 0) + (d.width || DEFAULT_NODE_SIZE.width) / 2)
          .attr('y', d => {
            const lines = (d.label || d.id).split('\n')
            const centerY = (d.y || 0) + (d.height || DEFAULT_NODE_SIZE.height) / 2
            return centerY - (lines.length - 1) * 8
          })
          .selectAll('tspan')
          .attr('x', (line, i, nodesArr) => {
            const datum = d3.select(nodesArr[i].parentNode).data()[0]
            return (datum.x || 0) + (datum.width || DEFAULT_NODE_SIZE.width) / 2
          })

        linkPaths.attr('d', d => linkPathStraight(d))
      })

      simulation.on('end', () => {
        fitToContent()
      })
    } else {
      fitToContent()
    }

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop()
        simulationRef.current = null
      }
      host.innerHTML = ''
    }
  }, [layout, graph, cfg, enablePhysics])

  return <div ref={hostRef} className="w-full h-full" />
})

export default GraphView
