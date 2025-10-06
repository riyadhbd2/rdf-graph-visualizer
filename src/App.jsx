import React, { useRef, useState } from 'react'
import { parseRDFFileOrJSON, defaultConfig } from './lib/rdf.js'
import AppHeader from './components/AppHeader.jsx'
import InputPanel from './components/InputPanel.jsx'
import OutputPanel from './components/OutputPanel.jsx'
import AppFooter from './components/AppFooter.jsx'

const SVG_HOST_ID = 'graph-svg-container'

export default function App() {
  const [graph, setGraph] = useState(null)
  const [cfg, setCfg] = useState(defaultConfig)
  const [status, setStatus] = useState('')
  const fileGraphRef = useRef(null)
  const fileConfigRef = useRef(null)

  async function handleRender() {
    setStatus('Parsing...')
    try {
      const nextCfg = { ...defaultConfig }
      if (fileConfigRef.current?.files?.[0]) {
        const txt = await fileConfigRef.current.files[0].text()
        try {
          Object.assign(nextCfg, JSON.parse(txt))
        } catch (error) {
          console.error('Invalid config JSON', error)
        }
      }
      if (!fileGraphRef.current?.files?.[0]) {
        setStatus('Please choose a graph file (TTL/NT/JSON).')
        return
      }
      const file = fileGraphRef.current.files[0]
      const parsed = await parseRDFFileOrJSON(file, nextCfg)
      setStatus('Rendering...')
      setCfg(nextCfg)
      setGraph(parsed)
      setStatus('Done.')
    } catch (error) {
      console.error(error)
      setStatus('Failed to render graph. See console for details.')
    }
  }

  function handleDownload() {
    const svg = document.querySelector(`#${SVG_HOST_ID} svg`)
    if (!svg) return
    const src = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([src], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rdf-graph.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <AppHeader />

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InputPanel
          fileGraphRef={fileGraphRef}
          fileConfigRef={fileConfigRef}
          onRender={handleRender}
          onDownload={handleDownload}
          status={status}
        />

        <OutputPanel graph={graph} cfg={cfg} containerId={SVG_HOST_ID} />
      </section>

      <AppFooter />
    </div>
  )
}
