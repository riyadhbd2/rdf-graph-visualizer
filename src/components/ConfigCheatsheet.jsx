import React from 'react'

function toListString(list = []) {
  return Array.isArray(list) ? list.join(', ') : ''
}

function parseList(value) {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

export default function ConfigCheatsheet({ config, onChange }) {
  if (!config || !onChange) return null

  const layout = config.layout || {}
  const filters = config.filters || { subjects: [], predicates: [], objects: [] }

  function handleFieldUpdate(key, value) {
    onChange({ ...config, [key]: value })
  }

  function handleBooleanUpdate(key, checked) {
    onChange({ ...config, [key]: checked })
  }

  function handleArrayUpdate(key, value) {
    handleFieldUpdate(key, parseList(value))
  }

  function handleLayoutUpdate(key, value) {
    const nextLayout = { ...layout, [key]: value }
    onChange({ ...config, layout: nextLayout })
  }

  function handleFiltersUpdate(key, value) {
    const nextFilters = { ...filters, [key]: parseList(value) }
    onChange({ ...config, filters: nextFilters })
  }

  return (
    <details className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <summary className="cursor-pointer font-medium text-gray-800">Config editor</summary>
      <div className="mt-4 space-y-4 text-sm text-gray-700">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-medium">Title</span>
            <input
              type="text"
              value={config.title || ''}
              onChange={event => handleFieldUpdate('title', event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Max nodes</span>
            <input
              type="number"
              min={1}
              value={config.maxNodes || 0}
              onChange={event => handleFieldUpdate('maxNodes', Number(event.target.value) || 0)}
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="font-medium">Hidden predicates (comma-separated)</span>
            <input
              type="text"
              value={toListString(config.hidePredicates)}
              onChange={event => handleArrayUpdate('hidePredicates', event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(config.collapseLiterals)}
              onChange={event => handleBooleanUpdate('collapseLiterals', event.target.checked)}
            />
            <span className="font-medium">Collapse literals onto subject nodes</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(config.mergeParallelEdges)}
              onChange={event => handleBooleanUpdate('mergeParallelEdges', event.target.checked)}
            />
            <span className="font-medium">Merge parallel edges</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.highlightShacl !== false}
              onChange={event => handleBooleanUpdate('highlightShacl', event.target.checked)}
            />
            <span className="font-medium">Highlight SHACL violations</span>
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="font-medium">Group by type (comma-separated IRIs)</span>
            <input
              type="text"
              value={toListString(config.groupByType)}
              onChange={event => handleArrayUpdate('groupByType', event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Node label template</span>
            <input
              type="text"
              value={config.nodeLabel || ''}
              onChange={event => handleFieldUpdate('nodeLabel', event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Edge label template</span>
            <input
              type="text"
              value={config.edgeLabel || ''}
              onChange={event => handleFieldUpdate('edgeLabel', event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="font-medium">Layout algorithm</span>
              <input
                type="text"
                value={layout['elk.algorithm'] || ''}
                onChange={event => handleLayoutUpdate('elk.algorithm', event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-medium">Layout direction</span>
              <input
                type="text"
                value={layout['elk.direction'] || ''}
                onChange={event => handleLayoutUpdate('elk.direction', event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
          </div>
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-medium text-gray-800">Filters (comma-separated)</h4>
            <label className="flex flex-col gap-1">
              <span className="font-medium">Subjects</span>
              <input
                type="text"
                value={toListString(filters.subjects)}
                onChange={event => handleFiltersUpdate('subjects', event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-medium">Predicates</span>
              <input
                type="text"
                value={toListString(filters.predicates)}
                onChange={event => handleFiltersUpdate('predicates', event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-medium">Objects</span>
              <input
                type="text"
                value={toListString(filters.objects)}
                onChange={event => handleFiltersUpdate('objects', event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
          </div>
        </div>
        <div>
          <h4 className="mb-1 font-medium text-gray-800">Preview</h4>
          <pre className="max-h-64 overflow-auto rounded-lg bg-white p-3 font-mono text-xs text-gray-700 shadow-inner">
{JSON.stringify(config, null, 2)}
          </pre>
        </div>
      </div>
    </details>
  )
}
