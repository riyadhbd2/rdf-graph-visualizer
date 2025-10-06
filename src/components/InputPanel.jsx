import React from 'react'
import ConfigCheatsheet from './ConfigCheatsheet.jsx'

export default function InputPanel({ fileGraphRef, fileConfigRef, onRender, onDownload, status }) {
  return (
    <div className="rounded-2xl shadow bg-white p-4">
      <h2 className="font-semibold mb-4">1) Input</h2>
      <div className="space-y-3">
        <label className="block">
          <span className="text-sm text-gray-700">RDF (Turtle/N-Triples) <em>or</em> Graph JSON</span>
          <input ref={fileGraphRef} type="file" accept=".ttl,.nt,.json" className="mt-1 block w-full" />
        </label>
        <label className="block">
          <span className="text-sm text-gray-700">Config (JSON)</span>
          <input ref={fileConfigRef} type="file" accept=".json" className="mt-1 block w-full" />
        </label>
        <div className="flex gap-2">
          <button onClick={onRender} className="px-4 py-2 rounded-xl bg-black text-white">Render</button>
          <button onClick={onDownload} className="px-4 py-2 rounded-xl bg-gray-200">Download SVG</button>
        </div>
        <p className="text-sm text-gray-500">{status}</p>
      </div>

      <ConfigCheatsheet />
    </div>
  )
}
