import React from 'react'
import ConfigCheatsheet from './ConfigCheatsheet.jsx'
export default function InputPanel({
  fileGraphRef,
  onRender,
  onExport,
  exportFormat,
  onExportFormatChange,
  shaclFileRef,
  config,
  onConfigChange,
  status,
  sparqlEndpoint,
  onEndpointChange,
  sparqlQuery,
  onQueryChange,
  className = '',
}) {
  return (
    <div className={`rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Inputs</p>
          <h2 className="text-lg font-semibold text-slate-900">Configure &amp; Render</h2>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-700 border border-sky-200">
          Static SVG
        </span>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="text-sm text-slate-700">
            RDF file (.ttl, .nt, .n3, .rdf/.xml, .jsonld) or graph JSON (.json)
          </span>
          <input
            ref={fileGraphRef}
            type="file"
            accept=".ttl,.nt,.n3,.rdf,.xml,.jsonld,.json"
            className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </label>

        <label className="block">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">SPARQL query</span>
            <span className="text-xs text-slate-400">Filters uploaded file or endpoint results</span>
          </div>
          <textarea
            value={sparqlQuery}
            onChange={event => onQueryChange(event.target.value)}
            rows={6}
            className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-700">SPARQL endpoint (optional)</span>
          <input
            type="url"
            value={sparqlEndpoint}
            onChange={event => onEndpointChange(event.target.value)}
            placeholder="https://example.org/sparql"
            className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-700">SHACL shapes (optional, TTL/NT/RDF/XML/JSON-LD)</span>
          <input
            ref={shaclFileRef}
            type="file"
            accept=".ttl,.nt,.rdf,.xml,.jsonld,.json"
            className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </label>

        <ConfigCheatsheet config={config} onChange={onConfigChange} />

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onRender}
            className="px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-semibold shadow-sm hover:bg-sky-700 transition"
          >
            Render graph
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <select
              id="export-format"
              value={exportFormat}
              onChange={event => onExportFormatChange(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
            >
              <option value="svg">SVG</option>
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
              <option value="pdf">PDF</option>
            </select>
            <button
              type="button"
              onClick={() => onExport(exportFormat)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-200 transition"
            >
              Download
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-100 px-3 py-2">
          {status || 'Awaiting input…'}
        </p>
      </div>
    </div>
  )
}
