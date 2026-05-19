# Requirement Analysis

## Document Control
Version: 1.0  
Date: 2026-02-25  
Owner: Thesis Author  
Scope: RDF graph visualization system focused on compact, static, and reproducible renderings

## Table of Contents
1. Introduction
2. Terms, Definitions, and Acronyms
3. Scope and System Context
4. Stakeholders and User Classes
5. Requirements Elicitation Method
6. Problem Statement, Goals, and Success Criteria
7. Assumptions, Constraints, and Dependencies
8. User Scenarios and Use Cases
9. Functional Requirements
10. Data Requirements
11. Visualization Requirements
12. Interaction Requirements
13. Evaluation Requirements and Metrics
14. Non-Functional Requirements
15. Quality Attribute Scenarios
16. Requirements Prioritization
17. Requirement Traceability
18. Verification and Validation Plan
19. Risks and Mitigations
20. Acceptance Criteria
21. Future and Optional Requirements
22. References

---

## 1. Introduction

RDF (Resource Description Framework) defines a graph-based data model in which each statement is a triple of subject, predicate, and object. Nodes can be IRIs, literals, or blank nodes, and edges represent predicates. This model is standardized by RDF 1.1 and supported by multiple serializations such as Turtle, N-Triples, RDF/XML, and JSON-LD. [1], [4]-[6] RDF graphs are commonly accessed and filtered via SPARQL 1.1 queries and may be validated using SHACL shapes. [2], [3], [7]

The goal of this system is to provide a compact, deterministic RDF visualization that supports rigorous thesis evaluation. Compactness is treated as a measurable property of the layout, with explicit metrics for area, density, and edge length. For everyday use, the system also provides a smooth exploration mode that improves visual flow without altering evaluation results. The requirement analysis therefore separates reproducibility goals from interactive usability goals.

Graph visualization research shows that readability is affected by factors such as edge crossings, node overlap, label clutter, and layout stability. These factors are captured by explicit metrics and inform the design of compactness measures and layout constraints. [8] At the same time, scalability research in layout algorithms (multi-level, GPU-accelerated, and dimensionality reduction methods) indicates how large graphs should be handled to avoid performance breakdowns. [9]-[11] This requirement analysis integrates these considerations into a comprehensive, testable specification.

---

## 2. Terms, Definitions, and Acronyms

### 2.1 Terms and Definitions
- RDF: Resource Description Framework; a graph data model expressed as triples. [1]
- IRI: Internationalized Resource Identifier used to identify RDF resources. [1]
- Literal: RDF object value, optionally typed or language-tagged. [1]
- Blank node: Anonymous RDF node without an IRI. [1]
- SPARQL: Standard RDF query language and protocol. [2], [3]
- SHACL: Shapes Constraint Language for RDF validation. [7]
- Compactness: A layout property combining area, density, and edge length measures.
- Deterministic layout: A layout that produces identical coordinates for identical inputs.
- Explore mode: A layout mode optimized for smooth interaction rather than strict determinism.

### 2.2 Acronyms
- CPU: Central Processing Unit
- GPU: Graphics Processing Unit
- UI: User Interface
- UX: User Experience
- KPI: Key Performance Indicator
- RDF/XML: RDF XML serialization
- JSON-LD: JSON for Linked Data

---

## 3. Scope and System Context

### 3.1 In-Scope Features
- Parsing RDF data from standard serializations (Turtle, N-Triples, RDF/XML, JSON-LD). [1], [4]-[6]
- Querying RDF data from SPARQL endpoints. [2], [3]
- Building a graph model with node type semantics (IRI, literal, blank node).
- Rendering node-link diagrams with configurable compactness.
- Deterministic evaluation mode and smooth exploration mode.
- Optional SHACL validation with violation annotations. [7]
- Export of static images and evaluation metrics.

### 3.2 Out-of-Scope Features
- Full OWL reasoning or inference beyond explicit triples.
- Editing RDF data inside the visualization.
- Multi-user collaboration or shared sessions.
- Persistent server-side storage of user data.

### 3.3 System Context
The system is a browser-based application. It accepts data from local files or SPARQL endpoints and performs layout and rendering locally. External systems are:
- File system (read-only data input, local export output).
- SPARQL endpoints (HTTP-based query). [3]
- Optional SHACL shapes file for validation. [7]

### 3.4 System Overview and Pipeline
The system pipeline is organized into four stages:
1. Ingestion: Accepts files or endpoint queries and converts responses to triples.
2. Normalization: Cleans and normalizes triples (prefix mapping, label selection, literal handling).
3. Layout and rendering: Builds nodes and edges, applies layout algorithms, and renders SVG.
4. Evaluation and export: Computes metrics, logs timing, and exports graphics or metrics.

The pipeline must remain transparent and traceable so that evaluation results can be reproduced and audited. Configuration settings (node limit, label rules, layout parameters) must be recorded as part of the evaluation metadata.

### 3.5 Operational Environment
The system is expected to run on a modern desktop browser with standard SVG and Canvas support. The target hardware is a commodity laptop (dual-core or better CPU, 8GB RAM). While GPU methods inspire performance targets, GPU hardware must not be required for baseline operation. [9], [10]

### 3.6 External Interfaces
- File interface: Accepts RDF files, reports parse errors, and supports export of images and metrics.
- SPARQL interface: Sends queries via the SPARQL 1.1 protocol. [3]
- SHACL interface: Accepts shapes graphs and returns validation results. [7]

---

## 4. Stakeholders and User Classes

### 4.1 Primary Stakeholders
1. Thesis Author / Researcher
   - Needs deterministic outputs for evaluation and publication.
   - Requires exportable metrics and traceable configuration.

2. Ontology Engineer / Knowledge Graph Curator
   - Needs quick inspection of RDF graphs and constraints.
   - Uses SPARQL to filter subsets and SHACL to validate. [2], [7]

3. Educator / Technical Writer
   - Requires clean, compact, static figures for documentation.
   - Needs readable labels with minimal clutter.

### 4.2 Secondary Stakeholders
1. Software Maintainer
   - Requires modular architecture and testable components.
   - Requires clear separation between parsing, layout, rendering, and export.

2. General End User
   - Prefers intuitive interaction, smooth zoom/pan, and clear node type distinctions.

---

## 5. Requirements Elicitation Method

Requirements were derived using:
- Standards analysis: RDF 1.1, SPARQL 1.1, JSON-LD 1.1, SHACL. [1]-[7]
- Literature review on readability and layout scalability. [8]-[14]
- Comparative assessment of existing RDF visualization tools.
- Prototyping of compactness settings and deterministic output workflows.

### 5.1 Comparative Tool Analysis
Existing RDF visualization tools were examined for default layouts, interaction controls, and export capabilities. The analysis prioritized compactness, determinism, and evaluation export. Common gaps included lack of explicit compactness metrics, limited reproducibility, and inconsistent outputs across runs. These gaps motivated explicit evaluation mode requirements and metric exports.

### 5.2 Prototype Trials
Prototype implementations were used to test deterministic layouts, node type encodings, and compactness settings. Observations from these prototypes shaped requirements for label control, literal collapsing, and layout stability.

### 5.3 Evaluation Alignment
The requirements explicitly include evaluation metrics and data export to ensure that the system supports academic reporting. Readability and layout quality metrics from literature are used as justification for compactness measures. [8]

---

## 6. Problem Statement, Goals, and Success Criteria

### 6.1 Problem Statement
RDF graphs can be large, heterogeneous, and difficult to interpret in node-link diagrams. Existing tools often prioritize interaction over reproducibility, while research evaluation needs stable outputs and explicit compactness metrics. The challenge is to build a system that is both evaluation-ready and usable for real-world inspection.

### 6.2 Goals
- Provide deterministic, compact layouts for evaluation and publication.
- Support SPARQL-based filtering and SHACL-based validation.
- Allow configurable visual encodings of node types and labels.
- Enable smooth interactive exploration without altering evaluation results.
- Export graphics and metrics suitable for thesis reporting.

### 6.3 Success Criteria
The project is successful if:
- The same input and configuration always produce identical layouts and metrics.
- Compactness metrics improve when compactness settings are tightened.
- Users can identify node types and relationships with minimal clutter.
- The system handles real RDF datasets without crashes or unusable delays.

### 6.4 Research Questions and Evaluation Alignment
The requirement analysis supports the following research questions:
- How can compactness be quantified for RDF node-link diagrams?
- How does deterministic layout affect reproducibility and evaluation reliability?
- What configuration tradeoffs produce the best balance between compactness and readability?

These questions are addressed by explicit metrics, evaluation mode, and export features. Compactness and readability metrics from the literature guide the selection of measurable factors. [8]

---

## 7. Assumptions, Constraints, and Dependencies

### 7.1 Assumptions
- Input data conforms to RDF 1.1 concepts and syntaxes. [1], [4]-[6]
- SPARQL endpoints follow SPARQL 1.1 protocol. [2], [3]
- Users are willing to filter large datasets when necessary.
- The system runs in a modern browser with standard SVG support.

### 7.2 Constraints
- Evaluation mode must be deterministic and reproducible.
- Outputs must remain compact even at moderate node counts.
- Memory usage must stay within typical browser constraints.
- Performance targets must be met on commodity laptops.

### 7.3 Dependencies
- RDF parsing library supporting Turtle, N-Triples, RDF/XML, JSON-LD. [4]-[6]
- Layout library capable of deterministic rendering.
- Optional SHACL validation library. [7]

---

## 8. User Scenarios and Use Cases

### 8.1 Use Case: Upload and Render Local RDF File
Preconditions:
- User has a valid RDF file in a supported format. [4]-[6]

Main Flow:
1. User selects a file from local storage.
2. System parses the file into triples.
3. System builds a graph and renders a deterministic layout.
4. User inspects the graph and optionally exports it.

Postconditions:
- Graph is visible and metrics are available if evaluation mode is enabled.

### 8.2 Use Case: Query a SPARQL Endpoint
Preconditions:
- Endpoint is available and supports SPARQL 1.1. [2], [3]

Main Flow:
1. User enters endpoint URL and a SPARQL query.
2. System executes the query and fetches the result triples.
3. System builds a graph and renders it.

Alternate Flow:
- If the query fails, the system displays a clear error message and preserves the previous state.

### 8.3 Use Case: Filter Local Graph with SPARQL
Preconditions:
- A local graph is already loaded.

Main Flow:
1. User writes a SPARQL filter query.
2. System executes the query on local triples.
3. System rebuilds the graph with the filtered subgraph.

### 8.4 Use Case: Validate with SHACL
Preconditions:
- A shapes graph is provided. [7]

Main Flow:
1. System validates the data graph against SHACL shapes.
2. Violations are attached to nodes.
3. Visual annotations show violations in the graph.

### 8.5 Use Case: Evaluation Mode Export
Preconditions:
- Evaluation mode is enabled.

Main Flow:
1. System performs deterministic layout.
2. Compactness metrics are computed.
3. Metrics and images are exported as CSV/JSON and SVG/PNG.

### 8.6 Use Case: Smooth Exploration Mode
Preconditions:
- Explore mode is enabled.

Main Flow:
1. System applies flexible layout forces to improve readability.
2. User pans and zooms smoothly.
3. Node click reveals details without layout reset.

### 8.7 Use Case: Presentation-Ready Static Output
Preconditions:
- User has configured labels and colors.

Main Flow:
1. User selects export format (SVG/PDF).
2. System produces a clean static diagram.

### 8.8 Use Case: Large Graph Handling
Preconditions:
- Graph exceeds default node limits.

Main Flow:
1. System warns about size and suggests filtering.
2. User reduces node limit or applies SPARQL filter.
3. System renders a manageable subgraph.

### 8.9 Use Case: Toggle Compactness Settings
Preconditions:
- Graph is loaded.

Main Flow:
1. User changes node spacing, label visibility, or literal collapse.
2. System recomputes layout in evaluation or explore mode.
3. Metrics update to reflect new compactness.

### 8.10 Use Case: Save and Load Configuration
Preconditions:
- Graph is loaded.

Main Flow:
1. User saves current configuration.
2. System stores configuration locally.
3. User reloads configuration in a later session.

### 8.11 Use Case: Compare Two Layouts
Preconditions:
- Two configurations are available.

Main Flow:
1. User runs layout A in evaluation mode and exports metrics.
2. User runs layout B and exports metrics.
3. User compares metrics to assess compactness.

### 8.12 Use Case: Inspect SHACL Violations Summary
Preconditions:
- Validation has been performed. [7]

Main Flow:
1. User opens violation summary panel.
2. System lists violations by shape and node.
3. User clicks an entry to highlight the node.

---

## 9. Functional Requirements

### 9.1 Data Ingestion and Parsing

**FR-01** The system shall accept RDF files in Turtle, N-Triples, RDF/XML, and JSON-LD formats.  
Rationale: These are standard RDF 1.1 serializations. [1], [4]-[6]  
Priority: Must  
Verification: Test

**FR-02** The system shall reject unsupported formats with a clear error message.  
Priority: Must  
Verification: Test

**FR-03** The system shall parse RDF into triples with subject, predicate, and object preserved.  
Rationale: RDF semantics require explicit triple representation. [1]  
Priority: Must  
Verification: Test

**FR-04** The system shall support UTF-8 encoded RDF content and language-tagged literals.  
Rationale: RDF literals may include language tags and Unicode content. [1]  
Priority: Must  
Verification: Test

### 9.2 SPARQL Querying

**FR-05** The system shall support SPARQL 1.1 queries against endpoints.  
Rationale: Standard RDF query interaction. [2], [3]  
Priority: Must  
Verification: Integration Test

**FR-06** The system shall allow local SPARQL-like filtering on loaded triples.  
Rationale: Enables subgraph extraction without remote calls. [2]  
Priority: Must  
Verification: Test

**FR-07** The system shall display query errors without clearing the current graph.  
Priority: Must  
Verification: Test

### 9.3 Graph Model and Semantics

**FR-08** The system shall map each triple to nodes (subject, object) and an edge (predicate).  
Rationale: RDF graph semantics. [1]  
Priority: Must  
Verification: Inspection

**FR-09** The system shall encode node type (IRI, literal, blank node) and expose it in UI.  
Rationale: Node types carry semantic meaning. [1]  
Priority: Must  
Verification: Test

**FR-10** The system shall allow configurable node label selection (e.g., rdfs:label, @id).  
Priority: Must  
Verification: Test

**FR-11** The system shall optionally collapse repeated literals to reduce visual clutter.  
Priority: Should  
Verification: Test

### 9.4 Layout and Rendering

**FR-12** The system shall provide deterministic layout for evaluation mode.  
Rationale: Required for reproducibility. [8]  
Priority: Must  
Verification: Test

**FR-13** The system shall provide an exploration layout mode optimized for smooth interaction.  
Rationale: Users need interactive flexibility. [12], [13]  
Priority: Should  
Verification: Test

**FR-14** The system shall support configurable spacing, node size, and edge routing.  
Rationale: Compactness requires adjustable parameters.  
Priority: Must  
Verification: Test

**FR-15** The system shall render large graphs within defined performance thresholds.  
Rationale: Large-scale layouts require scalable methods. [9]-[11]  
Priority: Must  
Verification: Performance Test

### 9.5 Interaction

**FR-16** The system shall support zoom and pan with viewport constraints.  
Priority: Must  
Verification: Test

**FR-17** The system shall show a node detail panel on click, including degree and top predicates.  
Priority: Should  
Verification: Test

**FR-18** The system shall allow toggling edge labels on/off.  
Priority: Should  
Verification: Test

**FR-19** The system shall provide a reset-view function that restores default zoom.  
Priority: Must  
Verification: Test

### 9.6 Validation

**FR-20** The system shall validate RDF data against SHACL shapes when provided.  
Rationale: SHACL is the standard constraint language. [7]  
Priority: Must  
Verification: Test

**FR-21** The system shall annotate nodes with SHACL violations in the UI.  
Priority: Must  
Verification: Test

### 9.7 Evaluation and Metrics

**FR-22** The system shall compute compactness metrics for evaluation mode.  
Rationale: Metrics support formal evaluation. [8]  
Priority: Must  
Verification: Test

**FR-23** The system shall export metrics as CSV and JSON.  
Priority: Must  
Verification: Test

**FR-24** The system shall record configuration and timing metadata with metrics.  
Priority: Must  
Verification: Test

### 9.8 Export and Reporting

**FR-25** The system shall export graphs as SVG, PNG, JPG, and PDF.  
Priority: Must  
Verification: Test

**FR-26** The system shall export images with consistent fonts and scaling.  
Priority: Should  
Verification: Inspection

### 9.9 Configuration and State

**FR-27** The system shall allow saving and loading visualization configurations.  
Priority: Should  
Verification: Test

**FR-28** The system shall expose compactness-related settings in the UI.  
Priority: Must  
Verification: Test

**FR-29** The system shall preserve the last successful graph on parsing or query errors.  
Priority: Must  
Verification: Test

### 9.10 Logging and Diagnostics

**FR-30** The system shall log parse, layout, and render times for each graph.  
Priority: Must  
Verification: Test

**FR-31** The system shall provide a diagnostic summary for failed parses or queries.  
Priority: Should  
Verification: Test

### 9.11 User Interface and Controls

**FR-32** The system shall provide grouped controls for data, layout, and evaluation settings.  
Priority: Must  
Verification: Inspection

**FR-33** The system shall allow switching between evaluation mode and explore mode.  
Priority: Must  
Verification: Test

**FR-34** The system shall expose a node limit control with immediate effect on rendering.  
Priority: Must  
Verification: Test

**FR-35** The system shall allow toggling node type color schemes.  
Priority: Should  
Verification: Test

**FR-36** The system shall provide an explicit "render" or "apply" action for expensive operations.  
Priority: Should  
Verification: Inspection

### 9.12 Data Interoperability

**FR-37** The system shall allow exporting the current subgraph in an RDF format.  
Priority: Could  
Verification: Test

**FR-38** The system shall allow copying SPARQL queries and results metadata.  
Priority: Could  
Verification: Inspection

**FR-39** The system shall preserve namespace prefixes when exporting or displaying labels.  
Priority: Should  
Verification: Test

**FR-40** The system shall display dataset metadata (source, size, timestamp).  
Priority: Should  
Verification: Inspection

### 9.13 Accessibility and Internationalization

**FR-41** The system shall allow high-contrast color presets.  
Priority: Should  
Verification: Inspection

**FR-42** The system shall support labels with non-Latin scripts.  
Priority: Must  
Verification: Test

**FR-43** The system shall allow keyboard navigation to key controls.  
Priority: Should  
Verification: Inspection

---

## 10. Data Requirements

### 10.1 Input Data
- Supported formats: Turtle, N-Triples, RDF/XML, JSON-LD. [4]-[6]
- SPARQL endpoint query support. [2], [3]
- UTF-8 encoding with language-tagged literals and typed literals. [1]

### 10.2 Data Quality Requirements
- The parser shall detect malformed triples and report the line or context.
- The system shall ignore duplicate triples by default, with optional toggles.
- The system shall preserve namespaces and prefixes for readable labels.

### 10.3 Metadata Requirements
- Each dataset shall have a dataset ID, load timestamp, and source type (file or endpoint).
- Metrics export shall include dataset ID, node count, edge count, and config hash.

### 10.4 Size and Scalability Requirements
- The system shall enforce a configurable node limit with user override.
- For graphs exceeding the limit, the system shall recommend filtering or subsampling.

### 10.5 Data Normalization and Namespace Handling
The system shall normalize IRIs for display by extracting prefixes or labels, while preserving the full IRI for traceability. Prefix maps should be derived from the dataset or user-provided mappings. Normalization must be reversible so that exporting metrics or subgraphs does not lose information. This requirement is critical for readability because full IRIs are often too long for compact layouts.

### 10.6 Data Provenance and Traceability
The system shall record the origin of data (local file or endpoint) and the exact query used for retrieval. This provenance information must be included in evaluation exports to support reproducibility and auditability. SPARQL protocol requirements inform how endpoint interactions are documented. [3]

### 10.7 SPARQL Result Handling
When querying endpoints, results may be returned in different SPARQL result formats. The system shall normalize these results to a consistent internal triple representation. [2], [3]

---

## 11. Visualization Requirements

### 11.1 Node Encodings
- Class nodes: rectangle with a warm color (e.g., amber).
- Entity nodes: circle with a cool color (e.g., blue).
- Literal nodes: pill shape with green tone.
- Blank nodes: diamond with neutral gray.

Clear visual encodings reduce cognitive load and align with readability best practices. [8]

### 11.2 Edge Encodings
- Edge thickness must be consistent and configurable.
- Edge labels should be optional and off by default for dense graphs.
- Evaluation mode should use deterministic routing; explore mode can use smooth curves. [12], [13]

### 11.3 Compactness
Compactness is defined by a combination of:
- Bounding box area (minimize)
- Node density (maximize)
- Average edge length (minimize)

These components correspond to readability considerations such as node spread and clutter. [8]

### 11.4 Clutter Reduction
- Optional edge bundling may be enabled for exploration, but must be disabled in evaluation mode to avoid ambiguity. [14]
- Literal collapsing and label hiding should be available to reduce clutter.

### 11.5 Layout Scalability
Large graphs require scalable layout algorithms. Multi-level and GPU methods motivate performance expectations and inform design targets. [9]-[11]

### 11.6 Labeling Strategy
Labels should follow a hierarchy: rdfs:label (if available), then short IRI fragment, then full IRI. Labels must not overlap nodes excessively, and label display should be configurable by zoom level. This prevents clutter while keeping semantic detail available for inspection.

### 11.7 Layout Stability and Mental Map
Explore mode should preserve stability so that users maintain a mental map of the graph while interacting. Dynamic graph drawing research emphasizes the importance of minimizing disruptive movement. [10]

### 11.8 Export Fidelity and Print Requirements
Exports must preserve node shapes, colors, and label positions. SVG outputs should be scalable without loss of quality. PDF export should ensure fonts embed correctly so that labels remain readable in thesis documents.

### 11.9 Visual Scalability
When node counts are high, the visualization should degrade gracefully by reducing label density, collapsing literals, and emphasizing higher-level structures. This ensures that compactness remains meaningful even as node density increases.

---

## 12. Interaction Requirements

### 12.1 Navigation
- The user shall zoom and pan smoothly.
- Zoom out must keep the graph within the viewport to avoid disorientation.
- The reset button restores default zoom and pan.

### 12.2 Selection and Inspection
- Clicking a node shall display details (ID, type, degree, top predicates, violations).
- Clicking the background shall clear selection.
- The detail panel shall not trigger layout changes.

### 12.3 Search and Filtering
- The system shall support text search across node labels.
- The system shall highlight matching nodes and optionally isolate subgraphs.

### 12.4 Mental Map Preservation
Explore mode should avoid large jumps and preserve user mental maps when possible, similar to dynamic layout approaches. [10]

### 12.5 Keyboard and Accessibility Interaction
Key actions such as reset, toggle labels, and open metrics should be accessible via keyboard shortcuts. Tooltips and panels should be reachable via keyboard focus, supporting accessibility and efficient usage.

### 12.6 Multi-Selection and Path Highlighting
The system should support selecting multiple nodes and highlighting the edges between them. This enables users to inspect paths, subgraphs, and relationship chains without cluttering the entire view.

### 12.7 Session State and History
The system should maintain a short history of layout states, allowing users to revert recent parameter changes. This supports experimentation with compactness settings and reduces the need for manual resets.

---

## 13. Evaluation Requirements and Metrics

### 13.1 Metrics Definitions
For a layout with node set V and edge set E:

- Bounding box area:
  area = (maxX - minX) * (maxY - minY)

- Density:
  density = |V| / area

- Average edge length:
  avgEdgeLen = (1 / |E|) * sum(length(e) for e in E)

- Edge crossings:
  crossings = count of edge intersections (excluding shared endpoints)

- Node overlaps:
  overlaps = count of node bounding boxes that intersect

- Aspect ratio:
  aspect = (maxX - minX) / (maxY - minY)

- Whitespace ratio:
  whitespace = 1 - (sum(nodeArea) / area)

These metrics align with readability studies that emphasize edge crossings, node spread, and clutter. [8]

### 13.2 Evaluation Mode Requirements
- Deterministic layout is mandatory.
- Metrics must be computed on the final stable layout.
- Metrics must be exported with configuration metadata.

### 13.3 Benchmarking Requirements
- The system shall support repeating evaluations with the same data and configuration.
- Variance in metrics between runs must be 0 in evaluation mode.
- Performance data (parse time, layout time, render time) must be recorded.

### 13.4 Benchmark Datasets and Protocol
Evaluation requires a fixed set of benchmark datasets to ensure comparability. Datasets should include small, medium, and large graphs from different domains. Each dataset must have documented size, source, and preprocessing steps. The evaluation protocol defines which configurations are applied, how many repetitions are run, and how metrics are aggregated.

### 13.5 Statistical Reporting
Metric reports should include mean, median, and standard deviation across repeated runs. When comparing configurations, effect sizes or percentage improvements should be reported. This ensures that compactness claims are supported by measurable evidence.

### 13.6 Visual Evidence
For each benchmark dataset, representative rendered images must be included in the evaluation report to complement numeric metrics. These images provide qualitative confirmation of compactness and readability improvements.

---

## 14. Non-Functional Requirements

### 14.1 Performance (NFR)

**NFR-01** Small graphs (<=100 nodes) shall render in <= [T_SMALL] ms.  
Verification: Performance Test

**NFR-02** Medium graphs (<=500 nodes) shall render in <= [T_MED] ms.  
Verification: Performance Test

**NFR-03** Large graphs (<=2000 nodes) shall render in <= [T_LARGE] ms.  
Rationale: Large-scale layouts motivate explicit timing targets. [9]-[11]

**NFR-04** UI interactions (pan/zoom) shall remain responsive with frame time <= [T_FRAME] ms.  
Verification: Performance Test

### 14.2 Scalability

**NFR-05** The system shall handle graphs with thousands of nodes by applying limits and filtering.  
Rationale: Scalability is a known challenge in force-directed layouts. [9]-[11]

**NFR-06** Layout memory usage shall remain below [MEM_LIMIT] for target datasets.  
Verification: Profiling

### 14.3 Usability and Accessibility

**NFR-07** Controls shall be discoverable and grouped logically.

**NFR-08** Node colors shall be distinguishable under common color-blind conditions.

**NFR-09** Text labels shall remain legible at default zoom.

**NFR-10** The system shall provide accessible color presets and high-contrast mode.

### 14.4 Reliability

**NFR-11** Parsing errors shall not crash the application.

**NFR-12** SPARQL query failures shall preserve the last valid state.

### 14.5 Maintainability

**NFR-13** Parsing, layout, rendering, and export modules shall be decoupled.

**NFR-14** Configuration shall be centralized and schema-validated.

### 14.6 Portability

**NFR-15** The system shall run in major desktop browsers without plugins.

**NFR-16** Exports shall be platform-independent.

### 14.7 Security and Privacy

**NFR-17** Local files shall never be uploaded without user action.

**NFR-18** Endpoint requests shall only be sent to user-provided URLs. [3]

### 14.8 Reproducibility

**NFR-19** Evaluation mode shall produce identical exports for identical inputs and configs.

**NFR-20** Random seeds shall be fixed and logged in evaluation mode.

### 14.9 Compliance with Standards

**NFR-21** Parsing and data handling shall comply with RDF 1.1 and SPARQL 1.1 standards. [1]-[3]

**NFR-22** Validation outputs shall align with SHACL definitions. [7]

---

## 15. Quality Attribute Scenarios

| ID | Stimulus | Environment | Response | Measure |
| --- | --- | --- | --- | --- |
| QAS-01 | Load 50-node file | Local browser | Render deterministic layout | <= [T_SMALL] ms |
| QAS-02 | Load 500-node file | Local browser | Render layout | <= [T_MED] ms |
| QAS-03 | Enable explore mode | Local browser | Smooth layout without major jumps | Converges <= [T_EXPLORE] ms |
| QAS-04 | Toggle compactness | Local browser | Density increases, area decreases | Delta density >= [DELTA_D] |
| QAS-05 | Run evaluation twice | Local browser | Identical metrics | 0% variance |
| QAS-06 | Upload invalid RDF | Local browser | Error shown, previous graph preserved | No crash |
| QAS-07 | Run SHACL validation | Local browser | Violations shown on nodes | 100% mapped |
| QAS-08 | Export SVG | Local browser | File renders correctly in viewer | Pass inspection |
| QAS-09 | Pan and zoom rapidly | Local browser | Interaction remains fluid | <= [T_FRAME] ms |
| QAS-10 | Switch to high-contrast | Local browser | Nodes remain distinct | Pass visual check |
| QAS-11 | Load large graph | Local browser | Warning and limit applied | Limit enforced |
| QAS-12 | Save and reload config | Local browser | Layout reproduces | 0% variance |

---

## 16. Requirements Prioritization

| Category | Must | Should | Could | Won't (this release) |
| --- | --- | --- | --- | --- |
| Data ingestion | FR-01, FR-03, FR-04 | FR-02 | - | - |
| SPARQL | FR-05, FR-06 | FR-07 | - | - |
| Layout | FR-12, FR-14, FR-15 | FR-13 | - | - |
| Interaction | FR-16, FR-19 | FR-17, FR-18 | - | - |
| Validation | FR-20, FR-21 | - | - | - |
| Evaluation | FR-22, FR-23, FR-24 | - | - | - |
| Export | FR-25 | FR-26 | FR-37 | - |
| Config | FR-28, FR-29 | FR-27 | - | - |
| Diagnostics | FR-30 | FR-31 | - | - |
| Accessibility | FR-42 | FR-41, FR-43 | - | - |

---

## 17. Requirement Traceability

| Requirement | Design Element | Test Method |
| --- | --- | --- |
| FR-01 | Parser module | File parsing tests |
| FR-05 | SPARQL client | Endpoint integration test |
| FR-12 | Evaluation mode | Determinism test |
| FR-16 | Zoom system | UI interaction test |
| FR-20 | SHACL pipeline | Validation test |
| FR-22 | Metrics module | Metric correctness test |
| FR-25 | Export module | Export format test |
| FR-34 | Node limit control | UI logic test |
| NFR-01 | Renderer | Performance test |
| NFR-19 | Export pipeline | Reproducibility test |

---

## 18. Verification and Validation Plan

### 18.1 Unit Tests
- RDF parsing tests for supported formats. [4]-[6]
- Graph construction tests (node types, edge labels). [1]
- Metric computation tests with known toy graphs. [8]

### 18.2 Integration Tests
- SPARQL endpoint query and response parsing. [2], [3]
- SHACL validation workflow. [7]
- Export generation for SVG/PNG/PDF.

### 18.3 Performance Tests
- Time-to-render for small/medium/large graphs.
- Interaction latency during zoom/pan.
- Memory usage profiling during large graph layout.

### 18.4 Usability Tests
- Task: Identify node type and key relations in a sample graph.
- Task: Export a static diagram and metrics report.
- Task: Switch between evaluation and explore mode without confusion.

### 18.5 Regression Tests
- Repeatable evaluation runs with identical outputs.
- Snapshot testing for layout determinism.
- Configuration save and load verification.

### 18.6 Cross-Platform Tests
- Verify behavior in major browsers (Chrome, Firefox, Edge).
- Validate exported SVG and PDF in common viewers.

---

## 19. Risks and Mitigations

1. Risk: Large graphs become unreadable.
   Mitigation: Node limits, filtering, compactness metrics. [8]

2. Risk: Layout performance degrades for large graphs.
   Mitigation: Scalable layout guidance and explicit thresholds. [9]-[11]

3. Risk: Explore mode affects evaluation results.
   Mitigation: Separate evaluation and exploration configurations.

4. Risk: Edge labels clutter the view.
   Mitigation: Default-off labels, configurable toggles.

5. Risk: Ambiguity from bundling.
   Mitigation: Restrict bundling to exploration mode. [14]

6. Risk: Validation errors overwhelm users.
   Mitigation: Summaries plus drill-down details.

7. Risk: SPARQL endpoints are slow or unavailable.
   Mitigation: Timeouts and local caching.

8. Risk: Determinism is broken by platform differences.
   Mitigation: Fixed seeds, deterministic ordering, and logged config.

9. Risk: Exports differ across platforms due to font changes.
   Mitigation: Embed fonts or use fallback-safe fonts.

---

## 20. Acceptance Criteria

The system is accepted if:
1. All Must requirements are implemented and tested.
2. Deterministic evaluation outputs are consistent across runs.
3. Compactness metrics are exported with configuration metadata.
4. Graphs can be exported to SVG/PNG/JPG/PDF without layout shifts.
5. SPARQL queries and SHACL validation work on representative datasets.
6. Usability tests confirm that node types are distinguishable and controls are discoverable.

---

## 21. Future and Optional Requirements

### 21.1 Roadmap
- Phase 1: Deterministic evaluation pipeline and compactness metrics.
- Phase 2: Smooth exploration mode with refined interactions.
- Phase 3: Advanced features (clustering, semantic zoom, multi-layout comparison).

### 21.2 Extended Requirement Rationale
Compactness is not a single measure but a balance of competing factors. Minimizing area may lead to excessive edge crossings, while minimizing edge length can cause node overlap and label collisions. Readability research emphasizes the need to balance these aesthetics, which is why the system separates compactness metrics and allows configurable weighting. [8] In evaluation mode, the system prioritizes repeatability over interactive flexibility; in explore mode, it emphasizes smoothness and user comfort. This dual-mode architecture is central to meeting both research and usability goals.

Layout scalability requirements are justified by the known computational complexity of force-directed layouts. Multi-level and dimensionality reduction approaches show how layout can be made feasible for large graphs, guiding the definition of performance targets. [9]-[11] Even if these algorithms are not fully implemented, they inform performance thresholds and ensure that the system remains usable as graph sizes grow.

Edge bundling and layout smoothing can enhance readability but also risk ambiguity. The system therefore limits such techniques to explore mode and avoids them in evaluation mode, preserving metric comparability and visual clarity. [14] This aligns with the requirement that evaluation results must be reproducible and interpretable.

The emphasis on standards compliance (RDF, SPARQL, SHACL) ensures interoperability with existing datasets and tools. [1]-[7] This compliance is critical for long-term maintainability and for the credibility of the evaluation results in an academic setting.

---

### 21.3 Detailed Requirement Catalog and Rationale

#### 21.3.1 Data Ingestion and Normalization Rationale
The data ingestion requirements emphasize standard RDF formats because interoperability is essential for reproducible research. RDF 1.1 and its serializations define how triples are represented and exchanged; any deviation can introduce ambiguity or data loss. [1], [4]-[6] The system therefore treats parsing accuracy as a primary requirement and mandates clear error reporting to prevent silent corruption.

Normalization is equally important. Raw RDF IRIs are often long and difficult to display, but they carry the authoritative identity for resources. By requiring reversible normalization (short labels for display, full IRIs preserved internally), the system ensures both readability and traceability. This approach aligns with the thesis objective of compactness without sacrificing semantic correctness.

Local filtering and SPARQL endpoint querying are both required because real-world datasets are too large to render in full. SPARQL 1.1 supports selective extraction of subgraphs, and the system must support both local and remote use to enable reproducible evaluations across datasets. [2], [3] This dual-path requirement also allows testing of compactness across controlled subsets of data.

#### 21.3.2 Graph Model and Semantics Rationale
RDF semantics dictate the mapping between triples and nodes. Each triple contributes a directed edge from subject to object, labeled by the predicate. This requirement ensures that the visualization accurately reflects the underlying RDF model. [1] Additional requirements for node typing (IRI, literal, blank node) are necessary because these categories affect how the user interprets the graph. Literals, for example, are often terminal values rather than relational entities, and blank nodes frequently represent complex structures.

Node labels must be configurable because datasets vary widely in labeling conventions. Some datasets use rdfs:label, others use schema:name, and many include only IRIs. Without configurable label selection, the visualization would be either cluttered or too sparse. The label hierarchy requirement (label -> fragment -> full IRI) is therefore critical for compactness and interpretability.

#### 21.3.3 Layout, Compactness, and Readability Rationale
Compactness is central to the thesis and must be operationalized through measurable properties. Readability research highlights the role of edge crossings, node overlap, and clutter in perceived quality. [8] Compactness metrics (area, density, edge length) therefore serve as proxies for readability and are required outputs in evaluation mode.

Deterministic layout is required because evaluation demands reproducible outputs. Without determinism, comparisons across datasets or configurations would be unreliable. Determinism also supports academic reporting because figures and metrics can be reproduced for verification. The system must therefore fix layout seeds, ordering, and parameters during evaluation.

Explore mode is required for usability. While deterministic layouts support evaluation, they can feel rigid for everyday interaction. Recent force-directed research proposes improved forces and solvers that converge quickly and produce smoother results. [12], [13] These ideas justify a separate exploration mode where smoothness, not determinism, is prioritized. Dynamic graph drawing research also supports maintaining a stable mental map by minimizing abrupt movement. [10]

Scalability requirements are justified by known performance limitations of force-directed layouts. Multi-level and GPU approaches demonstrate that large graphs require hierarchical or approximate strategies to remain interactive. [9] Dimensionality reduction methods such as DRGraph show how large graphs can be laid out efficiently while preserving structural patterns. [11] These references motivate explicit performance targets even if the system does not implement every advanced algorithm.

Edge bundling can reduce visual clutter in dense graphs, but it can also obscure individual relationships. Research on less ambiguous bundling techniques suggests that bundling should be applied cautiously. [14] Therefore the requirement restricts bundling to exploration mode and avoids it in evaluation mode, protecting comparability and interpretability.

#### 21.3.4 Interaction and Usability Rationale
Interaction requirements are grounded in the need for both discovery and control. Users must be able to zoom and pan smoothly to explore large graphs. A reset control ensures that users can return to a known state, which is important for usability and evaluation consistency. Selection and inspection workflows must expose node details without cluttering the view, which is why click-based panels are preferred over persistent labels.

Search and filtering requirements support targeted analysis. In practical RDF work, users often know a specific class or entity of interest. Search highlights and local filters reduce cognitive load and make the system practical for day-to-day inspection.

Session history and undo behavior are not strictly necessary for evaluation, but they greatly improve experimentation with compactness settings. Because compactness is influenced by multiple parameters, users need a way to explore configurations without losing prior results. This justifies the requirement for at least a short history of configuration changes.

Keyboard accessibility and high-contrast options are required to ensure inclusivity and usability across users. These requirements also improve the robustness of the tool during demonstrations or classroom use, where diverse audiences may be present.

#### 21.3.5 Evaluation and Reporting Rationale
Evaluation requirements focus on reproducibility and comparability. The system must compute metrics that are stable and meaningful. Readability research emphasizes that users perceive quality based on a combination of spatial and structural factors, which motivates the inclusion of area, density, and edge length. [8] The system therefore computes a family of metrics rather than relying on a single score.

Benchmarking protocols are included because evaluation must be consistent across datasets and configurations. Without a fixed protocol, compactness improvements could be attributed to uncontrolled factors such as dataset selection or unrecorded settings. The requirement to log configuration and timing metadata ensures that each evaluation can be reproduced and audited.

Statistical reporting is required to avoid over-interpreting single runs. Even in deterministic mode, environmental factors such as browser performance can affect timing metrics. Reporting means, medians, and variance provides a more robust basis for claims. Visual evidence (screenshots) complements numeric metrics and allows readers to judge interpretability qualitatively.

#### 21.3.6 Export, Reproducibility, and Archiving Rationale
Exports are essential for academic reporting. SVG and PDF are required for vector-quality figures, while PNG and JPG support quick sharing. Export fidelity requirements ensure that diagrams appear identical across environments, reducing the risk of mismatched visuals in a thesis document.

Reproducibility extends beyond layout. The system must export configuration metadata alongside metrics so that future readers can replicate the exact conditions. This is aligned with academic reproducibility standards and ensures that compactness improvements can be validated.

The requirement for consistent fonts and scaling in export is often overlooked but critical for thesis documents. Without consistent rendering, text may shift or become illegible, undermining the clarity of the evaluation.

#### 21.3.7 Accessibility, Internationalization, and Inclusivity
RDF datasets are international by nature and often contain multilingual labels. The requirement for non-Latin script support ensures that the system can visualize data from diverse domains. High-contrast color presets and keyboard navigation also expand accessibility to users with visual or motor impairments.

These requirements are not only ethical but practical: they improve the general robustness of the tool and increase its suitability for academic and educational contexts where inclusivity is expected.

#### 21.3.8 Ethical and Practical Considerations
The system must respect data privacy. Local files should remain local, and endpoint queries should be explicitly initiated by the user. These constraints reduce the risk of accidentally exposing sensitive data and align with standard ethical practices for data handling.

Practical constraints include performance limitations in browsers and the inherent complexity of graph visualization. By explicitly acknowledging these constraints and embedding mitigation strategies (node limits, filtering, deterministic mode), the requirements establish realistic boundaries for the project while still enabling rigorous evaluation.

---

### 21.4 Extended Use Case Narratives

#### UC-A1: Local File Ingestion and Deterministic Rendering
Goal: Load a local RDF file, render it deterministically, and prepare it for evaluation.  
Preconditions: The user has an RDF file in a supported format and evaluation mode is enabled. [4]-[6]  
Main flow: The user selects a file from the local system. The parser validates syntax, normalizes namespaces, and produces triples. The system builds the graph model, assigns node types, and applies deterministic layout. The user inspects the resulting graph and opens the metrics panel to verify compactness values.  
Alternate flow: If parsing fails, the system reports the error location and preserves the last valid graph state.  
Postconditions: The graph is rendered deterministically, and metrics are available for export.  
Rationale: This scenario validates the core requirement for reproducible rendering and confirms that data ingestion supports evaluation workflows. [1], [8]

#### UC-A2: SPARQL Endpoint Query and Subgraph Rendering
Goal: Retrieve a targeted subgraph from a SPARQL endpoint and visualize it compactly.  
Preconditions: The endpoint supports SPARQL 1.1 and is reachable. [2], [3]  
Main flow: The user enters the endpoint URL, writes a query, and submits it. The system sends the query via the SPARQL protocol, receives results, and normalizes them to triples. A graph is built and rendered. The user evaluates the subgraph and adjusts node limits if necessary.  
Alternate flow: If the endpoint returns an error, the system displays a diagnostic summary and keeps the previous graph state intact.  
Postconditions: A subgraph is rendered and ready for inspection or evaluation.  
Rationale: This scenario supports practical workflows where datasets are too large to load in full and demonstrates compliance with the SPARQL protocol. [3]

#### UC-A3: Compactness Tuning and Metric Feedback
Goal: Adjust compactness parameters and observe metric changes.  
Preconditions: A graph is loaded in evaluation mode.  
Main flow: The user changes node spacing, label visibility, and literal collapse settings. The system recomputes layout deterministically and recalculates compactness metrics. The user compares density and edge length values across configurations and selects the most compact configuration that preserves readability.  
Alternate flow: If the user enables edge labels and the view becomes cluttered, the user toggles labels off and repeats the evaluation.  
Postconditions: The chosen configuration is saved and reported.  
Rationale: This scenario demonstrates how compactness is operationalized and measured, aligning with readability metrics. [8]

#### UC-A4: Evaluation Run with Exported Metrics and Figures
Goal: Produce a complete evaluation artifact for a thesis report.  
Preconditions: Evaluation mode is enabled and the dataset is fixed.  
Main flow: The user triggers a render, waits for layout completion, and exports metrics as CSV/JSON along with SVG/PDF images. The system records configuration settings, dataset metadata, and render timings in the exported files. The user inserts these artifacts into the evaluation chapter.  
Postconditions: A reproducible evaluation package is generated.  
Rationale: This scenario ensures that the system outputs are suitable for academic reporting and can be reproduced by reviewers.

#### UC-A5: SHACL Validation with Violation Inspection
Goal: Validate an RDF graph against SHACL shapes and inspect violations.  
Preconditions: A data graph is loaded and a shapes graph is available. [7]  
Main flow: The user loads a shapes file and runs validation. The system attaches violations to nodes and renders visual indicators. The user clicks a node to see detailed violations and navigates between violations using the summary panel.  
Alternate flow: If validation fails due to malformed shapes, the system reports the error and allows the user to proceed without validation.  
Postconditions: Violations are visible and can be included in analysis or documentation.  
Rationale: Validation supports data quality assessment and enriches evaluation by highlighting constraints. [7]

#### UC-A6: Explore Mode for Interactive Understanding
Goal: Explore a graph interactively without changing evaluation results.  
Preconditions: A graph is loaded; explore mode is enabled.  
Main flow: The system applies flexible forces for a smooth layout, allowing the user to drag nodes, zoom, and pan. The layout stabilizes without major jumps, preserving the mental map. The user inspects relationships through click-based details.  
Postconditions: The user gains an intuitive understanding of the graph without altering evaluation settings.  
Rationale: This scenario validates the dual-mode design where exploration is separated from evaluation. [10], [12], [13]

#### UC-A7: Large Graph Handling with Node Limits and Filtering
Goal: Visualize a large dataset without overwhelming the interface.  
Preconditions: The dataset exceeds the default node limit.  
Main flow: The system warns the user about size and suggests filtering. The user reduces the node limit and applies a SPARQL filter. The system renders the reduced subgraph and recomputes metrics.  
Alternate flow: The user requests a higher node limit for exploration, but evaluation mode remains restricted to ensure comparability.  
Postconditions: A manageable subgraph is rendered and metrics are available.  
Rationale: This scenario demonstrates scalability constraints and how filtering supports compactness and usability. [9]-[11]

#### UC-A8: Configuration Management and Reproducibility
Goal: Save a configuration and reproduce it later.  
Preconditions: A graph is rendered with a chosen configuration.  
Main flow: The user saves the configuration, including layout parameters and label rules. Later, the user reloads the same dataset and restores the configuration. The system produces identical layout coordinates and metrics.  
Postconditions: Reproducibility is confirmed for evaluation purposes.  
Rationale: This scenario supports thesis reproducibility and demonstrates deterministic behavior.

#### UC-A9: Export for Thesis Figures with Visual Verification
Goal: Produce publication-quality figures for the thesis.  
Preconditions: Graph is rendered in evaluation mode.  
Main flow: The user exports SVG and PDF outputs, then opens them in external viewers to verify appearance. The system ensures fonts, colors, and label positions match the on-screen view. If a mismatch is detected, the user adjusts export settings and repeats.  
Postconditions: Final figures are ready for insertion into the thesis.  
Rationale: High-quality exports are required for academic reporting and cannot rely on screenshots alone.

---

### 21.5 Metric Rationale and Example Calculations
Compactness metrics are designed to be simple enough to compute consistently while still reflecting readability factors identified in the literature. [8] The following examples illustrate how metrics are interpreted in practice.

Example graph: 8 nodes and 10 edges. The bounding box spans from (0,0) to (400,300), giving area = 120000. Density is therefore 8 / 120000 = 0.0000667 nodes per pixel. If the average edge length is 95 pixels, then the layout is relatively compact compared to a layout where the average edge length is 160 pixels under the same node count.

Edge crossings are counted by testing intersections between edge segments that do not share endpoints. If a layout has 7 crossings, a competing layout with 3 crossings is generally more readable even if its area is slightly larger. [8] This motivates reporting multiple metrics rather than a single compactness score.

Whitespace ratio captures the proportion of empty area relative to node area. For example, if the sum of node bounding box areas is 15000 and the bounding box area is 120000, whitespace ratio is 1 - (15000 / 120000) = 0.875. A lower whitespace ratio suggests tighter packing, but if it becomes too low it may indicate overlap or label collisions. Thus, whitespace ratio is useful when combined with overlap checks.

Aspect ratio is included because extremely wide or tall layouts are difficult to place in documents. An aspect ratio close to 1 is ideal for compact figures, while ratios above 2 or below 0.5 may require scaling that reduces label readability. This metric therefore supports thesis figure preparation and guides layout parameter selection.

To ensure reproducibility, each metric calculation is recorded along with the exact layout configuration. This includes node size, label visibility, literal collapse, and edge routing settings. These parameters directly affect the computed values and must be known to interpret results.

### 21.6 Dataset Profiles and Selection Criteria
The evaluation requires datasets that reflect different structural properties of RDF graphs. The system must therefore support a dataset selection protocol with the following criteria:

1. Size tiers: small (<=100 nodes), medium (100-500 nodes), large (500-2000 nodes). This ensures that compactness is tested across scale levels and that performance requirements are exercised.
2. Literal density: datasets with high literal counts test label clutter and literal collapse features, while low-literal datasets emphasize entity relationships.
3. Class-instance balance: datasets with many class nodes test the clarity of node type encodings and the usability of class-specific shapes.
4. Heterogeneous predicate distribution: graphs with diverse predicate types test edge labeling and top-predicate summaries in node details.
5. Domain diversity: selecting datasets from multiple domains (bibliographic, geographic, biomedical, organizational) ensures that results are not biased to one ontology structure.

The dataset protocol also requires fixed preprocessing steps. For example, namespace prefixes should be normalized consistently across datasets, and blank nodes should be preserved instead of expanded into temporary IRIs. Consistent preprocessing ensures that layout metrics reflect the graph structure rather than arbitrary formatting differences.

### 21.7 Comparative Baseline Tool Requirements
The thesis evaluation includes comparisons with other RDF visualization tools. To ensure fairness, the system must support the following comparison requirements:

- Comparable input: the same RDF dataset and filtering criteria must be applied across all tools. [2]\n- Comparable output: screenshots or exports should be produced at the same resolution and with labels in similar positions.\n- Comparable metrics: when other tools do not expose metrics, the evaluation should compute metrics on exported images or extracted coordinates.\n- Comparable configuration: default settings should be documented and, where possible, matched in terms of node size, label density, and edge routing.

These requirements prevent misleading conclusions based on differing defaults or inconsistent preprocessing. They also provide a structured framework for reporting improvements in compactness and readability.

---

### 21.8 Extended UI and Controller Specification
The user interface should separate data operations, layout controls, and evaluation controls to reduce cognitive load. A recommended structure is:

- Data section: file upload, endpoint query, and dataset metadata display.\n- Layout section: evaluation mode toggle, explore mode toggle, spacing and node size controls, label visibility, literal collapse.\n- Interaction section: reset view, zoom limits, edge label toggle, and search.\n- Evaluation section: show metrics button, export metrics, export figures.

Each control must include a short description or tooltip explaining its effect on compactness or readability. This is especially important for parameters that influence multiple metrics (for example, node size affects area, density, and whitespace). The UI should also include a read-only summary of the current configuration so that users can verify settings before exporting metrics.

The metrics panel should remain hidden by default and open only on demand. This avoids clutter during exploration while still making evaluation data accessible. The panel should present metrics in a stable order, group related metrics (area, density, edge length, crossings), and provide a short interpretation hint for each metric. For example, the density row may include a note such as \"higher is more compact\" while the crossings row notes that fewer crossings generally improve readability. [8]

The configuration save/load workflow should allow the user to name presets and store them locally. Preset metadata should include a timestamp and a short description. This supports reproducibility by making it easy to reapply a configuration in future evaluation sessions.

The UI must also provide explicit feedback for expensive operations. For example, applying a layout on a 500+ node graph may take several seconds; the UI should show a progress indicator and prevent repeated clicks from queuing redundant renders. This protects performance and ensures that evaluation runs are not corrupted by overlapping operations.

### 21.9 Operational Profiles and Performance Budgets
Operational profiles define the expected workloads for the system and justify performance budgets. Three profiles are recommended:

Profile A (small): 20-100 nodes, 20-150 edges. Expected render time <= [T_SMALL] ms and interactive frame time <= [T_FRAME] ms. This profile is typical for quick examples and documentation figures.

Profile B (medium): 100-500 nodes, 150-1000 edges. Expected render time <= [T_MED] ms. This profile represents realistic ontology extracts and should remain usable without aggressive filtering.

Profile C (large): 500-2000 nodes, 1000-5000 edges. Expected render time <= [T_LARGE] ms. This profile is the upper bound for browser-based evaluation and requires node limits, filtering, and careful parameter tuning.

Performance budgets for each profile are informed by layout scalability research. Multi-level and GPU-accelerated layouts demonstrate how large graphs can be handled efficiently, while dimensionality reduction methods show that structural preservation can be maintained under approximation. [9]-[11] These insights do not mandate specific algorithms but inform realistic expectations for layout performance and memory usage.

Operational profiles also define export workloads. For example, Profile C exports may require downscaling or label reduction to prevent excessively large files. The system should log export duration and file sizes so that evaluation reports can include overhead considerations.

---

### 21.10 Requirement Checklist and Compliance Notes
This checklist summarizes the major requirement categories and provides compliance notes to guide implementation and review. It is intentionally verbose so that reviewers can trace each requirement to a concrete system behavior.

1. Standards compliance: The system must parse RDF and handle SPARQL queries in a way that is consistent with the official W3C recommendations. [1]-[3] Compliance is verified through conformance tests on representative RDF and SPARQL inputs. Any deviation must be documented, especially if it affects graph structure or query behavior.

2. Data integrity: Triples must be preserved exactly. Blank nodes, language tags, and datatypes must survive parsing and graph construction. This requirement ensures that layout and compactness metrics are computed on the true graph structure rather than a distorted representation. [1]

3. Layout determinism: Evaluation mode must produce identical coordinates across repeated runs, including across different machines and browsers whenever possible. This requires fixed seeds, deterministic ordering, and controlled numerical precision. Determinism is the foundation of reproducible metrics and is tested by repeated render runs with identical input.

4. Compactness metrics: Area, density, edge length, crossings, overlaps, aspect ratio, and whitespace must be computed and exported consistently. [8] The metrics panel must present these values in a stable order so that comparisons across configurations are straightforward. A failure to compute any metric should be reported explicitly instead of silently omitted.

5. Interaction constraints: Zoom, pan, and selection should never break layout stability. Users must be able to inspect node details without triggering layout recalculations. This is crucial for maintaining a stable evaluation environment while still supporting interactive analysis.

6. Export integrity: SVG, PNG, JPG, and PDF exports must preserve layout geometry, label positions, and colors. Any downscaling or label suppression must be declared in the export metadata. This avoids discrepancies between on-screen inspection and printed thesis figures.

7. Performance thresholds: Each operational profile must meet its performance budget. If a profile is exceeded, the system must surface a warning and suggest mitigation (filtering, node limits, or alternative configurations). [9]-[11]

8. Accessibility and inclusivity: The system must support multilingual labels, high-contrast color presets, and keyboard navigation for primary controls. These requirements are critical for broader adoption and for academic settings where accessibility is a standard expectation.

9. Validation and diagnostics: SHACL validation results must be visible and traceable to specific nodes. Errors in parsing, querying, or validation must be explained clearly, and previous graph states must be preserved to avoid data loss. [7]

This checklist is intended to be reviewed before final evaluation runs. Any unmet items must be explicitly documented as limitations in the thesis.

---

### 21.11 Reviewer Checklist for the Requirement Analysis
This checklist is intended for thesis supervisors and reviewers to validate that the requirement analysis is complete and aligned with the project goals.

1. Standards alignment: Does the system explicitly support RDF 1.1 concepts, RDF serializations, SPARQL 1.1, and SHACL? Are the related requirements and references clearly cited? [1]-[7]

2. Compactness definition: Is compactness defined through measurable metrics such as area, density, and edge length? Are these metrics connected to readability evidence? [8]

3. Reproducibility: Does evaluation mode guarantee deterministic layout and consistent metric outputs across runs? Are configuration parameters recorded with exports?

4. Usability vs evaluation separation: Is there a clear separation between explore mode and evaluation mode, with constraints to prevent exploration features from contaminating evaluation results? [10], [12], [13]

5. Scalability strategy: Are there explicit limits, filtering strategies, or performance budgets that address large graphs? Is scalability justified by research on efficient layouts? [9]-[11]

6. Export readiness: Does the system support vector exports and ensure that outputs match the on-screen layout? Are exports suitable for direct insertion into a thesis document?

7. Verification plan: Are tests defined for parsing, layout determinism, metrics, and export correctness? Is there a plan for cross-platform validation?

If any of these items are incomplete, the requirement analysis should be revised before proceeding with final evaluation and reporting.

---

## 22. References

[1] R. Cyganiak, D. Wood, and M. Lanthaler, "RDF 1.1 Concepts and Abstract Syntax," W3C Recommendation, Feb. 25, 2014. [Online]. Available: http://www.w3.org/TR/rdf11-concepts/

[2] S. Harris and A. Seaborne, "SPARQL 1.1 Query Language," W3C Recommendation, Mar. 21, 2013. [Online]. Available: http://www.w3.org/TR/sparql11-query/

[3] L. Feigenbaum, G. T. Williams, K. G. Clark, and E. Torres, "SPARQL 1.1 Protocol," W3C Recommendation, Mar. 21, 2013. [Online]. Available: http://www.w3.org/TR/sparql11-protocol/

[4] E. Prud'hommeaux and G. Carothers, "RDF 1.1 Turtle," W3C Recommendation, Feb. 25, 2014. [Online]. Available: http://www.w3.org/TR/turtle/

[5] G. Carothers and A. Seaborne, "RDF 1.1 N-Triples," W3C Recommendation, Feb. 25, 2014. [Online]. Available: http://www.w3.org/TR/n-triples/

[6] G. Kellogg, P.-A. Champin, and D. Longley, "JSON-LD 1.1: A JSON-based Serialization for Linked Data," W3C Recommendation, Jul. 16, 2020. [Online]. Available: https://www.w3.org/TR/json-ld11/

[7] H. Knublauch and D. Kontokostas, "Shapes Constraint Language (SHACL)," W3C Recommendation, Jul. 20, 2017. [Online]. Available: https://www.w3.org/TR/shacl/

[8] H. Haleem, Y. Wang, A. Puri, S. Wadhwa, and H. Qu, "Evaluating the Readability of Force Directed Graph Layouts: A Deep Learning Approach," IEEE Comput. Graph. Appl., vol. 39, no. 4, pp. 40-53, Jul.-Aug. 2019, doi: 10.1109/MCG.2018.2881501.

[9] Y. Frishman and A. Tal, "Multi-level graph layout on the GPU," IEEE Trans. Vis. Comput. Graph., vol. 13, no. 6, pp. 1310-1319, Nov.-Dec. 2007, doi: 10.1109/TVCG.2007.70580.

[10] Y. Frishman and A. Tal, "Online dynamic graph drawing," IEEE Trans. Vis. Comput. Graph., vol. 14, no. 4, pp. 727-740, Jul.-Aug. 2008, doi: 10.1109/TVCG.2008.11.

[11] M. Zhu, W. Chen, Y. Hu, Y. Hou, L. Liu, and K. Zhang, "DRGraph: An Efficient Graph Layout Algorithm for Large-scale Graphs by Dimensionality Reduction," IEEE Trans. Vis. Comput. Graph., vol. 27, no. 2, pp. 1666-1676, Mar. 2021, doi: 10.1109/TVCG.2020.3030447.

[12] F. Zhong, M. Xue, J. Zhang, R. Ban, O. Deussen, and Y. Wang, "Force-Directed Graph Layouts Revisited: A New Force Based on the T-Distribution," IEEE Trans. Vis. Comput. Graph., 2023, doi: 10.1109/TVCG.2023.3238821.

[13] M. Xue, Z. Wang, F. Zhong, Y. Wang, M. Xu, O. Deussen, and Y. Wang, "Taurus: Towards a Unified Force Representation and Universal Solver for Graph Layout," IEEE Trans. Vis. Comput. Graph., vol. 29, no. 1, pp. 886-895, Jan. 2023, doi: 10.1109/TVCG.2022.3209371.

[14] M. Wallinger, D. Archambault, D. Auber, M. Nollenburg, and J. Peltonen, "Edge-Path Bundling: A Less Ambiguous Edge Bundling Approach," IEEE Trans. Vis. Comput. Graph., vol. 28, no. 1, pp. 313-323, Jan. 2022, doi: 10.1109/TVCG.2021.3114795.
