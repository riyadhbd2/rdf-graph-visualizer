import React, { useEffect, useRef, useState } from 'react'
import { parseRDFFileOrJSON, defaultConfig, buildGraphFromTriples } from './lib/rdf.js'
import AppHeader from './components/AppHeader.jsx'
import InputPanel from './components/InputPanel.jsx'
import OutputPanel from './components/OutputPanel.jsx'
import AppFooter from './components/AppFooter.jsx'
import ControllersPanel from './components/ControllersPanel.jsx'
import { fetchTriplesFromEndpoint, defaultSparqlQuery } from './lib/sparql.js'
import { filterTriplesWithQuery } from './lib/sparqlLocal.js'
import { validateShacl } from './lib/shacl.js'
import { exportSvgElement } from './lib/exporters.js'

const SVG_HOST_ID = 'graph-svg-container'

export default function App() {
  const [graph, setGraph] = useState(null)
  const [status, setStatus] = useState('')
  const fileGraphRef = useRef(null)
  const [sparqlEndpoint, setSparqlEndpoint] = useState('')
  const [sparqlQuery, setSparqlQuery] = useState(defaultSparqlQuery)
  const [exportFormat, setExportFormat] = useState('svg')
  const [config, setConfig] = useState(() => JSON.parse(JSON.stringify(defaultConfig)))
  const [shaclReport, setShaclReport] = useState(null)
  const [renderStats, setRenderStats] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const shaclFileRef = useRef(null)
  const sourceCacheRef = useRef(null)
  const shaclViolationsRef = useRef(null)

  function nowMs() {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now()
    }
    return Date.now()
  }

  function applyNodeLimit(nextGraph, maxNodes) {
    if (!nextGraph || !Array.isArray(nextGraph.nodes)) return nextGraph
    const limit = Number.isFinite(maxNodes) && maxNodes > 0 ? maxNodes : null
    if (!limit || nextGraph.nodes.length <= limit) return nextGraph
    const limitedNodes = nextGraph.nodes.slice(0, limit)
    const allowed = new Set(limitedNodes.map(node => node.id))
    const limitedEdges = (nextGraph.edges || []).filter(edge => allowed.has(edge.source) && allowed.has(edge.target))
    return { ...nextGraph, nodes: limitedNodes, edges: limitedEdges }
  }

  function applyShaclViolations(nextGraph) {
    const violations = shaclViolationsRef.current
    if (!violations || !nextGraph || !Array.isArray(nextGraph.nodes)) return nextGraph
    if (typeof violations.get !== 'function') return nextGraph
    return {
      ...nextGraph,
      nodes: nextGraph.nodes.map(node => ({
        ...node,
        shaclViolations: violations.get(node.id) || [],
      })),
    }
  }

  function rebuildGraphFromSource(source, cfg) {
    if (!source) return null
    if (source.kind === 'triples') {
      return buildGraphFromTriples(source.data || [], cfg)
    }
    if (source.kind === 'graph') {
      return applyNodeLimit(source.data, cfg?.maxNodes)
    }
    return null
  }

  useEffect(() => {
    if (!sourceCacheRef.current) return
    const rebuilt = rebuildGraphFromSource(sourceCacheRef.current, config)
    if (!rebuilt) return
    const graphWithShacl = applyShaclViolations(rebuilt)
    setGraph(graphWithShacl)
    setRenderStats(prev =>
      prev
        ? {
            ...prev,
            nodesCount: graphWithShacl?.nodes?.length ?? prev.nodesCount,
            edgesCount: graphWithShacl?.edges?.length ?? prev.edgesCount,
          }
        : prev
    )
  }, [config.maxNodes])

  async function handleRender() {
    setStatus('Parsing...')
    setShaclReport(null)
    setRenderStats(null)
    setMetrics(null)
    shaclViolationsRef.current = null
    try {
      const nextCfg = JSON.parse(JSON.stringify({ ...defaultConfig, ...config }))
      const selectedFile = fileGraphRef.current?.files?.[0]
      const endpoint = sparqlEndpoint.trim()
      const startedAt = nowMs()
      let parseMs = null
      let filterMs = null
      let buildMs = null
      let totalMs = null
      let triplesCount = null
      let source = null

      if (!selectedFile && !endpoint) {
        setStatus('Provide an RDF file or SPARQL endpoint before rendering.')
        return
      }

      let parsed
      const statusParts = []
      let dataTriplesForValidation = null
      if (endpoint) {
        source = 'sparql'
        setStatus('Running SPARQL query...')
        const fetchStart = nowMs()
        const triples = await fetchTriplesFromEndpoint(endpoint, sparqlQuery)
        parseMs = nowMs() - fetchStart
        const buildStart = nowMs()
        parsed = buildGraphFromTriples(triples, nextCfg)
        buildMs = nowMs() - buildStart
        triplesCount = triples.length
        sourceCacheRef.current = { kind: 'triples', data: triples }
        dataTriplesForValidation = triples
        if (!triples.length) {
          statusParts.push('SPARQL query returned no matching triples.')
        }
      } else {
        source = 'file'
        const file = selectedFile
        const ext = file.name.toLowerCase().split('.').pop()
        if (ext === 'json') {
          const parseStart = nowMs()
          parsed = await parseRDFFileOrJSON(file, nextCfg)
          parseMs = nowMs() - parseStart
          statusParts.push('Rendered pre-built graph JSON.')
          try {
            const triples = await parseRDFFileOrJSON(file, nextCfg, { returnTriples: true })
            sourceCacheRef.current = { kind: 'triples', data: triples }
            triplesCount = triples.length
          } catch (error) {
            sourceCacheRef.current = { kind: 'graph', data: parsed }
          }
        } else {
          const parseStart = nowMs()
          const triples = await parseRDFFileOrJSON(file, nextCfg, { returnTriples: true })
          parseMs = nowMs() - parseStart
          const queryText = sparqlQuery.trim()
          let filteredTriples = triples
          if (queryText) {
            setStatus('Applying SPARQL filter...')
            try {
              const filterStart = nowMs()
              filteredTriples = filterTriplesWithQuery(triples, sparqlQuery)
              filterMs = nowMs() - filterStart
              if (filteredTriples.length === 0) {
                statusParts.push('SPARQL filter returned no matching triples.')
              }
            } catch (filterError) {
              console.error('SPARQL filter error', filterError)
              statusParts.push('SPARQL filter unsupported: ' + filterError.message)
              filteredTriples = triples
            }
          }
          const buildStart = nowMs()
          parsed = buildGraphFromTriples(filteredTriples, nextCfg)
          buildMs = nowMs() - buildStart
          triplesCount = filteredTriples.length
          sourceCacheRef.current = { kind: 'triples', data: filteredTriples }
          dataTriplesForValidation = filteredTriples
          if (!queryText && filteredTriples.length === 0) {
            statusParts.push('No triples found in the uploaded file.')
          }
        }
      }

      let graphResult = parsed
      const shapesFile = shaclFileRef.current?.files?.[0]
      if (shapesFile && dataTriplesForValidation?.length) {
        try {
          const shapesTriples = await parseRDFFileOrJSON(shapesFile, nextCfg, { returnTriples: true })
          const report = validateShacl(dataTriplesForValidation, shapesTriples)
          if (report) {
            const nodeViolations = report.nodeViolations
            shaclViolationsRef.current = nodeViolations
            graphResult = {
              ...graphResult,
              nodes: graphResult.nodes.map(node => ({
                ...node,
                shaclViolations: nodeViolations.get(node.id) || [],
              })),
              shaclReport: {
                conforms: report.conforms,
                totalViolations: report.totalViolations,
                messages: report.messages,
              },
            }
            setShaclReport({
              conforms: report.conforms,
              totalViolations: report.totalViolations,
              messages: report.messages,
              byNode: Object.fromEntries(Array.from(nodeViolations.entries())),
            })
            if (report.conforms) {
              statusParts.push('SHACL: conforms.')
            } else {
              statusParts.push(`SHACL: ${report.totalViolations} violation(s).`)
            }
          } else {
            shaclViolationsRef.current = null
            graphResult = {
              ...graphResult,
              nodes: graphResult.nodes.map(node => ({ ...node, shaclViolations: [] })),
            }
            statusParts.push('SHACL: no NodeShapes found in shapes graph.')
          }
        } catch (error) {
          console.error('SHACL validation failed', error)
          shaclViolationsRef.current = null
          statusParts.push('SHACL validation failed (see console).')
        }
      } else if (shapesFile) {
        statusParts.push('SHACL validation skipped (requires raw triples).')
      } else {
        shaclViolationsRef.current = null
        graphResult = {
          ...graphResult,
          nodes: graphResult.nodes.map(node => ({ ...node, shaclViolations: node.shaclViolations || [] })),
        }
      }

      graphResult = applyNodeLimit(graphResult, nextCfg.maxNodes)

      setStatus('Rendering...')
      setGraph(graphResult)
      totalMs = nowMs() - startedAt
      setRenderStats({
        source,
        parseMs,
        filterMs,
        buildMs,
        totalMs,
        triplesCount,
        nodesCount: graphResult?.nodes?.length ?? null,
        edgesCount: graphResult?.edges?.length ?? null,
      })
      if (!statusParts.length) statusParts.push('Done.')
      setStatus(statusParts.join(' | '))
    } catch (error) {
      console.error(error)
      setStatus('Failed to render graph. See console for details.')
    }
  }

  async function handleExport(format) {
    const svg = document.querySelector(`#${SVG_HOST_ID} svg`)
    if (!svg) {
      setStatus('No graph to export yet.')
      return
    }
    try {
      setStatus(`Preparing ${format.toUpperCase()} download...`)
      await exportSvgElement(svg, format, 'rdf-graph')
      setStatus('Download ready.')
    } catch (error) {
      console.error(error)
      setStatus('Failed to export graph. See console for details.')
    }
  }

  return (
    <div className="min-h-screen text-slate-900 pb-10">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <AppHeader />

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-6">
          <InputPanel
            fileGraphRef={fileGraphRef}
            onRender={handleRender}
            onExport={handleExport}
            exportFormat={exportFormat}
            onExportFormatChange={setExportFormat}
            shaclFileRef={shaclFileRef}
            config={config}
            onConfigChange={setConfig}
            status={status}
            sparqlEndpoint={sparqlEndpoint}
            onEndpointChange={setSparqlEndpoint}
            sparqlQuery={sparqlQuery}
            onQueryChange={setSparqlQuery}
            className="lg:col-span-3 xl:col-span-3"
          />

          <OutputPanel
            graph={graph}
            config={config}
            shaclReport={shaclReport}
            renderStats={renderStats}
            onMetrics={setMetrics}
            containerId={SVG_HOST_ID}
            className="lg:col-span-6 xl:col-span-6"
          />

          <ControllersPanel
            config={config}
            onConfigChange={setConfig}
            metrics={metrics}
            renderStats={renderStats}
            graphTitle={graph?.title}
            className="lg:col-span-3 xl:col-span-3"
          />
        </section>

        <AppFooter />
      </div>
    </div>
  )
}
