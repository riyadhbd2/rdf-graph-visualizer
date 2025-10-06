import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import ELK from 'elkjs/lib/elk.bundled.js'

export default function GraphView({ graph, cfg }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!graph) return
    const host = ref.current
    if (!host) return

    host.innerHTML = ''
    const elk = new ELK()
    const elkGraph = {
      id: 'root',
      layoutOptions: cfg.layout || { 'elk.algorithm': 'layered', 'elk.direction': 'RIGHT' },
      children: graph.nodes.map(n => ({
        id: n.id,
        width: 140,
        height: 48,
        labels: [{ text: n.label || n.id }],
      })),
      edges: graph.edges.map((e, i) => ({
        id: 'e' + i,
        sources: [e.source],
        targets: [e.target],
        labels: [{ text: e.predicate }],
      })),
    }

    let isCancelled = false

    elk.layout(elkGraph).then(layout => {
      if (isCancelled) return

      const width = Math.max(800, layout.width || 800)
      const height = Math.max(600, layout.height || 600)
      const svg = d3.select(host)
        .append('svg')
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)

      svg.append('defs').append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 8)
        .attr('refY', 5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto-start-reverse')
        .append('path')
        .attr('d', 'M 0 0 L 10 5 L 0 10 z')
        .attr('fill', '#333')

      const gEdges = svg.append('g').attr('class', 'edges')
      layout.edges.forEach(e => {
        const sections = e.sections || []
        sections.forEach(sec => {
          const pts = [
            { x: sec.startPoint.x, y: sec.startPoint.y },
            ...(sec.bendPoints || []),
            { x: sec.endPoint.x, y: sec.endPoint.y },
          ]
          const line = d3.line().x(d => d.x).y(d => d.y)
          gEdges.append('path')
            .attr('d', line(pts))
            .attr('fill', 'none')
            .attr('stroke', '#333')
            .attr('stroke-width', 1.2)
            .attr('marker-end', 'url(#arrow)')
          if (e.labels && e.labels[0]) {
            const cx = (sec.startPoint.x + sec.endPoint.x) / 2
            const cy = (sec.startPoint.y + sec.endPoint.y) / 2
            gEdges.append('text')
              .attr('x', cx + 4)
              .attr('y', cy - 4)
              .attr('font-size', 11)
              .text(e.labels[0].text)
          }
        })
      })

      const gNodes = svg.append('g').attr('class', 'nodes')
      layout.children.forEach(n => {
        const g = gNodes.append('g').attr('transform', `translate(${n.x},${n.y})`)
        g.append('rect')
          .attr('width', n.width)
          .attr('height', n.height)
          .attr('rx', 12)
          .attr('ry', 12)
          .attr('fill', '#fff')
          .attr('stroke', '#111')
          .attr('stroke-width', 1.3)
        ;(n.labels || []).forEach((lab, i) => {
          g.append('text')
            .attr('x', 10)
            .attr('y', 20 + i * 14)
            .attr('font-size', 12)
            .text(lab.text)
        })
      })
    })

    return () => {
      isCancelled = true
      host.innerHTML = ''
    }
  }, [graph, cfg])

  return <div ref={ref} />
}
