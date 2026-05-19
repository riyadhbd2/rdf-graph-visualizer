# RDF Static Visualization for Thesis Evaluation

Browser-based RDF graph visualization system for compact, export-ready, and reproducible Semantic Web diagrams. The project is designed for thesis work where the same tool must support both day-to-day graph inspection and formal evaluation with measurable outputs.

## Thesis Context

This system turns RDF triples into static graph visualizations that can be used in a thesis for screenshots, comparative experiments, metric-driven evaluation, and documentation. The application runs primarily in the browser, accepts local RDF data or SPARQL endpoint results, and produces both visual artifacts and quantitative metrics that can be reused in the Evaluation and Implementation chapters.

## Research Objectives

The project has two parallel goals. First, it provides an interactive interface for loading, filtering, validating, and rendering RDF subgraphs. Second, it supports reproducible evaluation by offering a compact evaluation mode, deterministic layout settings, and metric export for later comparison with other tools.

## Core Capabilities

- Load RDF from `.ttl`, `.nt`, `.n3`, `.rdf`, `.xml`, `.jsonld`, or pre-built graph `.json`
- Query SPARQL endpoints with browser-side requests
- Apply local SPARQL-style filtering to uploaded RDF files
- Validate graph data against SHACL shapes and highlight violations
- Render compact RDF subgraphs with D3 and ELK.js
- Switch between explore mode and evaluation mode
- Export visual outputs as SVG, PNG, JPG, or PDF
- Export metrics as JSON or CSV for thesis analysis

## End-to-End Workflow

1. Start the app locally with Vite.
2. Load an RDF file or connect to a SPARQL endpoint.
3. Optionally apply a SPARQL query to reduce the graph to a relevant subgraph.
4. Optionally upload SHACL shapes to validate the selected data.
5. Adjust labels, simplification rules, layout, and node limits.
6. Render the graph and inspect the result on the SVG canvas.
7. Enable evaluation mode when reproducible metrics are required.
8. Export the figure and download the metrics for thesis reporting.

## Processing Pipeline

The runtime pipeline follows a clear thesis-friendly sequence:

1. Input acquisition from file upload or SPARQL endpoint
2. Triple normalization into a common internal representation
3. Optional local or remote SPARQL filtering
4. Graph construction from triples
5. Optional SHACL validation
6. Layout computation with ELK.js
7. SVG rendering with D3
8. Metric computation on positioned nodes and edges
9. Export of figures and metric files

## Technology Stack

| Layer | Tools |
| --- | --- |
| UI | React 18, Tailwind CSS |
| Visualization | D3, ELK.js |
| RDF Processing | N3 parser |
| Build Tooling | Vite, PostCSS, Autoprefixer |
| Evaluation Assets | Markdown templates, SVG figures, CSV/JSON results, Python helpers |

## Repository Structure

```text
.
├── src/
│   ├── components/              # UI panels, controls, and graph canvas
│   ├── lib/                     # RDF parsing, SPARQL, SHACL, metrics, export
│   ├── App.jsx                  # Main orchestrator
│   └── main.jsx                 # Entry point
├── public/examples/             # Sample RDF, graph JSON, config, SPARQL query
├── evaluation/                  # Thesis evaluation protocol, datasets, figures, results
├── dist/                        # Production build output
├── package.json
└── README.md
```

## Requirements

- Node.js 18 or newer
- npm 9 or newer
- Modern browser with SVG and canvas support

No dedicated backend is required for the main workflow. The only network-dependent feature is SPARQL endpoint querying.

## Installation and Local Run

```bash
npm install
npm run dev
```

After the Vite server starts, open the local URL shown in the terminal.

For a production build:

```bash
npm run build
npm run preview
```

## Example Assets Included

The repository already includes small example files for quick testing:

- `public/examples/foaf.ttl`: sample RDF data
- `public/examples/graph.json`: pre-built graph JSON
- `public/examples/config.json`: example visualization configuration
- `public/examples/select.sparql`: example SPARQL filter query

These files are useful for screenshots, UI demonstrations, and sanity checks before running larger evaluation datasets.

## How to Use the Application

### 1. Render from a local RDF file

Upload a supported RDF file in the input panel, optionally edit the SPARQL query field, and click `Render graph`. For local files, the query is applied as a local filter over the parsed triples before the graph is built.

### 2. Render from a SPARQL endpoint

Provide a SPARQL endpoint URL and a query that returns `?s`, `?p`, and `?o`. The application first tries an HTTP `POST` request and falls back to `GET` if needed. Endpoint access depends on CORS policy and endpoint availability.

### 3. Apply SHACL validation

Upload a SHACL shapes file to validate the currently selected RDF data. When validation is successful, the interface reports conformance status and can highlight nodes with violations directly in the rendered graph.

### 4. Tune visualization controls

The configuration editor and control panel allow you to adjust the graph before or after rendering. Important settings include:

| Option | Purpose |
| --- | --- |
| `collapseLiterals` | Moves literal values into subject node labels to reduce clutter |
| `mergeParallelEdges` | Combines repeated edges between the same source and target |
| `maxNodes` | Limits graph size for readability and controlled experiments |
| `groupByType` | Highlights selected RDF types with grouped styling |
| `nodeLabel` / `edgeLabel` | Controls label templates |
| `evaluationMode` | Uses compact spacing and reproducible layout behavior for metrics |
| `exploreMode` | Enables smoother exploratory interaction when evaluation mode is off |
| `highlightShacl` | Emphasizes nodes with SHACL violations |
| `uniformNodeSize` | Keeps node sizes fixed for cleaner comparisons |

### 5. Export outputs

The rendered graph can be exported as:

- SVG for thesis figures and editing
- PNG or JPG for slides and reports
- PDF for document attachment or print-ready sharing

Computed metrics can be downloaded separately as:

- JSON for archival and reproducibility
- CSV for spreadsheet analysis and comparison tables

## Data Contracts

The system uses a consistent internal representation to keep the workflow reproducible.

### Triple contract

SPARQL results and parsed RDF files are normalized into objects with the fields `s`, `p`, `o`, `oIsLiteral`, and `oLabel`.

### Graph contract

Pre-built graph JSON files should follow the structure below:

```json
{
  "nodes": [
    { "id": "http://example.org/alice", "label": "Alice" }
  ],
  "edges": [
    { "source": "http://example.org/alice", "target": "http://example.org/bob", "predicate": "foaf:knows" }
  ]
}
```

This makes it possible to compare parsed RDF input with pre-generated graph samples using the same renderer.

## Evaluation and Reproducibility

The `evaluation/` folder contains the thesis support material needed to run and document experiments in a structured way. The recommended process is:

1. Select datasets and size tiers using `evaluation/DATASETS.md`
2. Follow the experimental steps in `evaluation/PROTOCOL.md`
3. Enable `Evaluation mode` in the UI before collecting metrics
4. Export metrics from the system as JSON or CSV
5. Record comparison-tool settings in `evaluation/COMPARISON_MATRIX.md`
6. Store or merge results using the templates and scripts in `evaluation/`
7. Draft the thesis Evaluation chapter using `evaluation/REPORT_TEMPLATE.md`

Additional evaluation assets available in the repository include:

- `evaluation/README.md`: overview of the evaluation pack
- `evaluation/METRICS_DEFINITION.md`: definitions and interpretation notes
- `evaluation/THREATS_TO_VALIDITY.md`: checklist for methodological rigor
- `evaluation/IMPLEMENTATION.md`: long-form implementation chapter material
- `evaluation/datasets/`: deterministic RDF datasets for experiments
- `evaluation/results/`: stored experiment outputs
- `evaluation/figures/`: generated charts and thesis figures

If you need to regenerate the synthetic evaluation datasets, the repository also includes:

```bash
python3 evaluation/datasets/generate_thesis_datasets.py
```

## Recommended Thesis Usage Pattern

For a clean thesis workflow, use the project in two modes. During exploration, load a dataset, inspect the layout, adjust labels and filters, and identify the subgraph you want to discuss. During formal evaluation, keep the configuration fixed, switch on evaluation mode, run the same datasets consistently, and export both the rendered figures and metrics so that screenshots, tables, and textual discussion all refer to the same experimental setup.

## Current Limitations

- The browser-side SPARQL flow depends on endpoint CORS support
- Local SPARQL filtering supports a controlled subset rather than the full SPARQL standard
- SHACL support is intentionally lightweight and focused on the subset implemented in `src/lib/shacl.js`
- The tool is best suited to sampled subgraphs, not full-scale knowledge graph rendering in one view

## Project Status

This repository already contains the application code, bundled examples, evaluation datasets, figure-generation assets, and draft evaluation materials needed for thesis writing. The README is intended to serve as the top-level operational guide for both implementation and evaluation work.
