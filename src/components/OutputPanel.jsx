import React, { useRef, useState } from 'react'
import GraphView from './GraphView.jsx'

export default function OutputPanel({ graph, config, shaclReport, containerId, className = '' }) {
  const viewRef = useRef(null)
  const [physicsEnabled, setPhysicsEnabled] = useState(true)

  return (
    <div className={`rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-xl p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Canvas</p>
          <h2 className="text-lg font-semibold text-slate-900">Rendered graph</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-500">
            Nodes: {graph?.nodes?.length || 0}
          </span>
          <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-500">
            Edges: {graph?.edges?.length || 0}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => viewRef.current?.fitToContent?.()}
              className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
            >
              Fit
            </button>
            <button
              type="button"
              onClick={() => viewRef.current?.resetZoom?.()}
              className="px-3 py-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-200 transition"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setPhysicsEnabled(prev => !prev)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                physicsEnabled
                  ? 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {physicsEnabled ? 'Physics On' : 'Physics Off'}
            </button>
          </div>
        </div>
      </div>

      <div id={containerId} className="overflow-auto border border-slate-200 rounded-xl bg-white shadow-inner" style={{ height: '70vh' }}>
        {graph ? (
          <GraphView ref={viewRef} graph={graph} cfg={config} enablePhysics={physicsEnabled} />
        ) : (
          <div className="h-full grid place-items-center text-slate-400 text-sm">No graph yet</div>
        )}
      </div>
      {shaclReport ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          {shaclReport.conforms
            ? 'SHACL validation: conforms.'
            : `SHACL validation: ${shaclReport.totalViolations} violation(s).`}
        </div>
      ) : null}
    </div>
  )
}
