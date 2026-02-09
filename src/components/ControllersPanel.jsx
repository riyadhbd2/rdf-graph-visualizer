import React from 'react'

export default function ControllersPanel({ config, onConfigChange, className = '' }) {
  if (!config || !onConfigChange) return null

  const layout = config.layout || {}

  function updateConfig(next) {
    onConfigChange({ ...config, ...next })
  }

  function updateLayout(key, value) {
    const nextLayout = { ...layout, [key]: value }
    updateConfig({ layout: nextLayout })
  }

  return (
    <div className={`rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-xl p-4 ${className}`}>
      <h2 className="text-lg font-semibold text-slate-900 mb-4 text-center">Controllers</h2>

      <div className="space-y-4 text-sm text-slate-700">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Layout</p>
          <label className="block">
            <span className="text-xs text-slate-500">Direction</span>
            <select
              value={layout['elk.direction'] || 'RIGHT'}
              onChange={e => updateLayout('elk.direction', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
            >
              <option value="RIGHT">Left → Right</option>
              <option value="DOWN">Top → Bottom</option>
              <option value="LEFT">Right → Left</option>
              <option value="UP">Bottom → Top</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Algorithm</span>
            <select
              value={layout['elk.algorithm'] || 'layered'}
              onChange={e => updateLayout('elk.algorithm', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
            >
              <option value="layered">Layered</option>
              <option value="mrtree">Tree</option>
              <option value="force">Force</option>
              <option value="stress">Stress</option>
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Simplify</p>
          <label className="flex items-center justify-between gap-2">
            <span>Merge parallel edges</span>
            <input
              type="checkbox"
              checked={Boolean(config.mergeParallelEdges)}
              onChange={e => updateConfig({ mergeParallelEdges: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between gap-2">
            <span>Collapse literals</span>
            <input
              type="checkbox"
              checked={Boolean(config.collapseLiterals)}
              onChange={e => updateConfig({ collapseLiterals: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between gap-2">
            <span>Highlight SHACL</span>
            <input
              type="checkbox"
              checked={config.highlightShacl !== false}
              onChange={e => updateConfig({ highlightShacl: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between gap-2">
            <span>Uniform node size</span>
            <input
              type="checkbox"
              checked={config.uniformNodeSize !== false}
              onChange={e => updateConfig({ uniformNodeSize: e.target.checked })}
            />
          </label>
          <label className="block">
            <div className="flex items-center justify-between">
              <span>Max nodes</span>
              <span className="text-xs text-slate-500">{config.maxNodes || 0}</span>
            </div>
            <input
              type="range"
              min={10}
              max={150}
              step={5}
              value={config.maxNodes || 40}
              onChange={e => updateConfig({ maxNodes: Number(e.target.value) || 40 })}
              className="w-full accent-sky-500"
            />
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Labels</p>
          <label className="block">
            <span className="text-xs text-slate-500">Node label template</span>
            <input
              type="text"
              value={config.nodeLabel || ''}
              onChange={e => updateConfig({ nodeLabel: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Edge label template</span>
            <input
              type="text"
              value={config.edgeLabel || ''}
              onChange={e => updateConfig({ edgeLabel: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
            />
          </label>
        </div>
      </div>
    </div>
  )
}
