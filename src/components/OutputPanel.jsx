import React from 'react'
import GraphView from './GraphView.jsx'

export default function OutputPanel({ graph, cfg, containerId }) {
  return (
    <div className="rounded-2xl shadow bg-white p-4 lg:col-span-2">
      <h2 className="font-semibold mb-4">2) Output</h2>
      <div id={containerId} className="overflow-auto border rounded-xl bg-white" style={{ height: '70vh' }}>
        {graph ? (
          <GraphView graph={graph} cfg={cfg} />
        ) : (
          <div className="h-full grid place-items-center text-gray-400">No graph yet</div>
        )}
      </div>
    </div>
  )
}
