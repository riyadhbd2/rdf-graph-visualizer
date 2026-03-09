import React, { useState } from 'react'
import { exportTextFile } from '../lib/exporters.js'
import { metricsToCsv } from '../lib/metrics.js'

export default function ControllersPanel({
  config,
  onConfigChange,
  metrics,
  renderStats,
  graphTitle,
  className = '',
}) {
  if (!config || !onConfigChange) return null

  const layout = config.layout || {}
  const [metricsFormat, setMetricsFormat] = useState('json')
  const [showMetrics, setShowMetrics] = useState(false)

  function updateConfig(next) {
    onConfigChange({ ...config, ...next })
  }

  function updateLayout(key, value) {
    const nextLayout = { ...layout, [key]: value }
    updateConfig({ layout: nextLayout })
  }

  function formatNumber(value, digits = 2) {
    if (!Number.isFinite(value)) return 'n/a'
    return Number(value).toFixed(digits)
  }

  function handleExportMetrics() {
    if (!metrics) return
    const mergedMetrics = {
      ...metrics,
      meta: { ...(metrics.meta || {}), renderStats: renderStats || null },
    }
    const base = (graphTitle || metrics?.meta?.title || 'rdf-graph')
      .toString()
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase()
    const filenameBase = `${base}-metrics`
    if (metricsFormat === 'csv') {
      const csv = metricsToCsv(mergedMetrics)
      exportTextFile(csv, `${filenameBase}.csv`, 'text/csv;charset=utf-8')
    } else {
      const json = JSON.stringify(mergedMetrics, null, 2)
      exportTextFile(json, `${filenameBase}.json`, 'application/json;charset=utf-8')
    }
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
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Explore</p>
          <label className="flex items-center justify-between gap-2">
            <span>Smooth explore mode</span>
            <input
              type="checkbox"
              checked={config.exploreMode !== false}
              onChange={e => updateConfig({ exploreMode: e.target.checked })}
              disabled={config.evaluationMode}
            />
          </label>
          <p className="text-[11px] leading-snug text-slate-500">
            Gentle physics for flexible layouts (disabled in evaluation mode).
          </p>
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
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Evaluation</p>
          <label className="flex items-center justify-between gap-2">
            <span>Evaluation mode</span>
            <input
              type="checkbox"
              checked={Boolean(config.evaluationMode)}
              onChange={e => updateConfig({ evaluationMode: e.target.checked })}
            />
          </label>
          <p className="text-[11px] leading-snug text-slate-500">
            Uses compact spacing and deterministic layout for metrics.
          </p>
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

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Evaluation metrics</p>
          <p className="text-[11px] leading-snug text-slate-500">
            {config.evaluationMode ? 'Evaluation mode on' : 'Evaluation mode off'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMetrics(prev => !prev)}
              className="px-3 py-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-200 transition"
            >
              {showMetrics ? 'Hide metrics' : 'Show metrics'}
            </button>
            <select
              value={metricsFormat}
              onChange={event => setMetricsFormat(event.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs bg-white"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
            <button
              type="button"
              onClick={handleExportMetrics}
              disabled={!metrics}
              className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-semibold disabled:opacity-40"
            >
              Download metrics
            </button>
          </div>
          {showMetrics ? (
            metrics ? (
              <div className="grid grid-cols-1 gap-1 text-xs">
                <div className="flex items-center justify-between">
                  <span>Area (px^2)</span>
                  <span className="font-medium">{formatNumber(metrics.bounds?.area, 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Density (nodes/px^2)</span>
                  <span className="font-medium">{formatNumber(metrics.density, 6)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Avg edge length</span>
                  <span className="font-medium">{formatNumber(metrics.avgEdgeLength, 2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Edge crossings</span>
                  <span className="font-medium">
                    {metrics.edgeCrossingsNote ? 'n/a' : metrics.edgeCrossings}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Node overlaps</span>
                  <span className="font-medium">
                    {metrics.nodeOverlapsNote ? 'n/a' : metrics.nodeOverlaps}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Aspect ratio</span>
                  <span className="font-medium">{formatNumber(metrics.aspectRatio, 2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Whitespace ratio</span>
                  <span className="font-medium">{formatNumber(metrics.whitespaceRatio, 3)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Layout time (ms)</span>
                  <span className="font-medium">{formatNumber(metrics.meta?.layoutMs, 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total render (ms)</span>
                  <span className="font-medium">{formatNumber(renderStats?.totalMs, 0)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Metrics will appear after rendering.</p>
            )
          ) : null}
          {showMetrics && metrics?.edgeCrossingsNote ? (
            <p className="text-[11px] text-slate-500">Edge crossings: {metrics.edgeCrossingsNote}</p>
          ) : null}
          {showMetrics && metrics?.nodeOverlapsNote ? (
            <p className="text-[11px] text-slate-500">Node overlaps: {metrics.nodeOverlapsNote}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
