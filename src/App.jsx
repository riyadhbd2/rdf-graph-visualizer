import React, { useRef, useState } from 'react'
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
  const shaclFileRef = useRef(null)

  async function handleRender() {
    setStatus('Parsing...')
    setShaclReport(null)
    try {
      const nextCfg = JSON.parse(JSON.stringify({ ...defaultConfig, ...config }))
      const selectedFile = fileGraphRef.current?.files?.[0]
      const endpoint = sparqlEndpoint.trim()

      if (!selectedFile && !endpoint) {
        setStatus('Provide an RDF file or SPARQL endpoint before rendering.')
        return
      }

      let parsed
      const statusParts = []
      let dataTriplesForValidation = null
      if (endpoint) {
        setStatus('Running SPARQL query...')
        const triples = await fetchTriplesFromEndpoint(endpoint, sparqlQuery)
        parsed = buildGraphFromTriples(triples, nextCfg)
        dataTriplesForValidation = triples
        if (!triples.length) {
          statusParts.push('SPARQL query returned no matching triples.')
        }
      } else {
        const file = selectedFile
        const ext = file.name.toLowerCase().split('.').pop()
        if (ext === 'json') {
          parsed = await parseRDFFileOrJSON(file, nextCfg)
          statusParts.push('Rendered pre-built graph JSON.')
        } else {
          const triples = await parseRDFFileOrJSON(file, nextCfg, { returnTriples: true })
          const queryText = sparqlQuery.trim()
          let filteredTriples = triples
          if (queryText) {
            setStatus('Applying SPARQL filter...')
            try {
              filteredTriples = filterTriplesWithQuery(triples, sparqlQuery)
              if (filteredTriples.length === 0) {
                statusParts.push('SPARQL filter returned no matching triples.')
              }
            } catch (filterError) {
              console.error('SPARQL filter error', filterError)
              statusParts.push('SPARQL filter unsupported: ' + filterError.message)
              filteredTriples = triples
            }
          }
          parsed = buildGraphFromTriples(filteredTriples, nextCfg)
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
            graphResult = {
              ...graphResult,
              nodes: graphResult.nodes.map(node => ({ ...node, shaclViolations: [] })),
            }
            statusParts.push('SHACL: no NodeShapes found in shapes graph.')
          }
        } catch (error) {
          console.error('SHACL validation failed', error)
          statusParts.push('SHACL validation failed (see console).')
        }
      } else if (shapesFile) {
        statusParts.push('SHACL validation skipped (requires raw triples).')
      } else {
        graphResult = {
          ...graphResult,
          nodes: graphResult.nodes.map(node => ({ ...node, shaclViolations: node.shaclViolations || [] })),
        }
      }

      setStatus('Rendering...')
      setGraph(graphResult)
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
            containerId={SVG_HOST_ID}
            className="lg:col-span-6 xl:col-span-6"
          />

          <ControllersPanel
            config={config}
            onConfigChange={setConfig}
            className="lg:col-span-3 xl:col-span-3"
          />
        </section>

        <AppFooter />
      </div>
    </div>
  )
}
