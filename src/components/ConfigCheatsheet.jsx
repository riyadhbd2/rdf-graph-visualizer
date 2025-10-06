import React from 'react'

const cheatSheet = `{
  "title": "My Graph",
  "maxNodes": 40,
  "hidePredicates": ["rdf:type", "rdfs:label"],
  "collapseLiterals": true,
  "mergeParallelEdges": true,
  "groupByType": ["foaf:Person"],
  "nodeLabel": "rdfs:label|foaf:name|@id",
  "edgeLabel": "@predicate",
  "layout": { "elk.algorithm": "layered", "elk.direction": "RIGHT" },
  "filters": { "subjects": [], "predicates": [], "objects": [] }
}`

export default function ConfigCheatsheet() {
  return (
    <details className="mt-4">
      <summary className="cursor-pointer font-medium">Config cheatsheet</summary>
      <pre className="font-mono text-xs bg-gray-100 p-3 rounded mt-2 overflow-x-auto">{cheatSheet}</pre>
    </details>
  )
}
