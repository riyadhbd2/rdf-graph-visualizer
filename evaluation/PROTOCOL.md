# Evaluation Protocol

Goal: compare compactness and usability of RDF graph visualizations across tools.

1) Datasets and sampling
- Select datasets (see DATASETS.md).
- Sample connected subgraphs at three sizes:
  - Small: ~100 nodes, ~150-300 edges
  - Medium: ~500 nodes, ~800-1500 edges
  - Large: ~2000 nodes, ~3000-6000 edges
- Use the same sampling strategy for every tool.

2) Configuration alignment (all tools)
- Use the same node label template (e.g., rdfs:label or @id).
- Use the same edge label policy (on/off).
- Apply the same filtering (predicates, classes).
- If the tool supports it, disable animation for evaluation.

3) Runs and randomness
- For deterministic layouts: 1 run is enough.
- For force-based layouts: 3-5 runs, report mean and standard deviation.

4) Metrics collection
- Export metrics from this project (Evaluation mode on).
- From other tools, compute the same metrics on exported SVG/PNG using the same method.
- Store results in RESULTS_TEMPLATE.csv.

5) Reporting
- Report metrics by dataset size and tool.
- Include at least one visualization example per dataset size.
- Provide a summary and discussion of trade-offs.

6) Validation checks
- Verify no node overlaps (or report overlap count).
- Verify edge crossings are reported or marked as "n/a" if too large.
- Confirm all tools used the same input graph.
