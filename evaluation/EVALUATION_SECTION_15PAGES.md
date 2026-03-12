# Chapter 8: Evaluation

## 8.1 Chapter Overview
This chapter evaluates the proposed RDF graph visualization system using measured results from nine dataset-size scenarios and repeated runs. The chapter is designed to support thesis-level claims about compactness, readability guardrails, runtime behavior, memory footprint, and reproducibility. The evaluation uses three datasets (LUBM, DBpedia, Wikidata), each sampled into small, medium, and large tiers. Every scenario was executed five times under the same configuration so that both central tendency and stability can be reported.

The analysis is structured around four goals:
1. Verify that the system can produce compact layouts consistently.
2. Confirm that compactness is not achieved by unacceptable visual degradation.
3. Quantify runtime and memory cost across graph sizes.
4. Demonstrate deterministic and repeatable outputs for thesis-grade reproducibility.

The chapter combines tabular reporting with bar-chart visualization. Quantitative interpretation is provided at three levels: per-scenario, per-dataset, and cross-size trends. A dedicated ablation and sensitivity section is included to explain why the chosen design and parameter settings were retained.

## 8.2 Evaluation Questions and Hypotheses

### 8.2.1 Research Questions
The evaluation answers the following research questions:
1. How does layout compactness change as graph size increases from small to medium to large?
2. How do readability guardrails (crossings and overlaps) behave under compact layout settings?
3. What is the runtime cost of deterministic compact layout for each dataset tier?
4. Is the system stable across repeated runs under fixed input and fixed configuration?
5. Which configuration choices have the strongest impact on compactness-quality trade-offs?

### 8.2.2 Hypotheses
The chapter tests four hypotheses:
1. **H1 (Compactness trend):** area and edge length increase with graph size, while density decreases.
2. **H2 (Readability guardrails):** overlap and crossing levels remain within controlled ranges where measurable.
3. **H3 (Performance scaling):** layout time dominates end-to-end time and increases substantially with graph size.
4. **H4 (Reproducibility):** repeated runs in evaluation mode produce deterministic geometric metrics.

## 8.3 Experimental Setup

### 8.3.1 Hardware and Runtime Environment
All experiments were executed on one machine to minimize environment variability:
- Device: MacBook Air (Apple M2, 8 GB RAM, 256 GB SSD)
- OS: macOS 15.3.1 (arm64)
- Node.js: v22.16.0
- npm: 10.9.2
- Core layout engine: ELK layered (`elkjs` 0.9.3)
- RDF parsing library: `n3` 1.17.4

### 8.3.2 System Configuration
The same evaluation configuration was used across scenarios:
- `evaluationMode = true`
- `physicsEnabled = false`
- `layoutAlgorithm = layered`
- `layoutDirection = RIGHT`
- `uniformNodeSize = true`
- `collapseLiterals = true`
- `mergeParallelEdges = true`
- Node label policy: `rdfs:label|foaf:name|@id`
- Edge label policy: `@predicate`

This setup intentionally prioritizes deterministic compact placement over interactive force refinement, because repeatability is a thesis requirement.

### 8.3.3 Measurement Pipeline
Metrics were collected from JSON run exports and memory logs:
- Run-level metrics: `evaluation/results/system_runs/*.json`
- Peak memory logs: `evaluation/results/peak_memory.csv`
- Aggregated summaries:  
  `evaluation/results/system_summary.csv`,  
  `evaluation/results/system_stability.csv`,  
  `evaluation/results/system_overview.json`

Aggregation script:
- `evaluation/scripts/aggregate_system_results.py`

### 8.3.4 Chart Generation Pipeline
All chapter bar charts were generated directly from measured summary files:
- Script: `evaluation/figures/build_system_quant_charts.py`
- Output index: `evaluation/figures/SYSTEM_QUANT_CHARTS.md`
- Chart folder: `evaluation/figures/system_quant_charts/`

This guarantees that figures and tables are consistent with the numeric results.

## 8.4 Datasets and Sampling Strategy

### 8.4.1 Dataset Selection
Three datasets were used:
1. **Dataset A (LUBM):** synthetic benchmark-style RDF, useful for controlled structural growth.
2. **Dataset B (DBpedia):** real-world encyclopedic knowledge graph sample.
3. **Dataset C (Wikidata):** high-diversity real-world knowledge graph sample.

### 8.4.2 Size Tiers
Each dataset was sampled into three tiers:
- Small: ~100 nodes
- Medium: ~500 nodes
- Large: ~2000 nodes

### 8.4.3 Fixed-Input Fairness
For each tier, the same sampled RDF graph was reused across runs. This ensures run-to-run differences come from execution variability (time, memory) and not from graph content changes.

### 8.4.4 Repetition Protocol
Each scenario was executed 5 times:
- `run01` to `run05`
- Total scenarios: 9
- Total measured runs: 45

## 8.5 Metric Definitions and Interpretation

### 8.5.1 Compactness Metrics
1. **Area (px²):** bounding-box area enclosing all placed nodes.
2. **Density (nodes/px²):**  
   \[
   \text{Density} = \frac{\text{Node Count}}{\text{Area}}
   \]
3. **Average Edge Length (px):** mean Euclidean length between connected node centers.

Interpretation:
- Lower area is more compact.
- Higher density is more compact.
- Lower average edge length indicates tighter local structure.

### 8.5.2 Guardrail Metrics
1. **Edge crossings:** number of intersecting edge pairs (excluding shared endpoints).
2. **Node overlaps:** number of overlapping node circles.

Implementation thresholds:
- Crossings are skipped if `edgeCount > 800`.
- Overlaps are skipped if `nodeCount > 500`.

Therefore, medium and large tiers can contain intentional `n/a` values for crossings or overlaps.

### 8.5.3 Performance Metrics
1. **Layout time (ms):** ELK layout computation time.
2. **Preprocess time (ms):** parse + graph build time from run metadata.
3. **End-to-end time (ms):** layout + preprocess.
4. **Peak memory (MB):** maximum resident memory from runtime measurement script.

### 8.5.4 Stability Metrics
1. Area standard deviation across 5 runs.
2. Density standard deviation across 5 runs.
3. Average edge length standard deviation across 5 runs.
4. Layout-time standard deviation across 5 runs.
5. Determinism error rate (%), measured against run01 geometry metrics.

## 8.6 Quantitative Results

### 8.6.1 Compactness and Guardrail Results

**Table 8.1. Compactness and Guardrail Metrics (Mean of 5 Runs)**

| Dataset | Size | Runs | Nodes | Edges | Area (px²) | Density (nodes/px²) | Avg Edge Len (px) | Edge Crossings | Node Overlaps | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| A | Small | 5 | 100 | 223 | 15,398,912.36 | 6.493965e-06 | 1,246.65 | 1,782 | 6 | - |
| A | Medium | 5 | 500 | 1,179 | 259,756,732.81 | 1.924878e-06 | 4,795.47 | n/a | 30 | crossings skipped (`edges > 800`) |
| A | Large | 5 | 2,000 | 4,719 | 3,066,274,349.66 | 6.522574e-07 | 16,764.92 | n/a | n/a | crossings skipped, overlaps skipped (`nodes > 500`) |
| B | Small | 5 | 100 | 246 | 18,470,227.57 | 5.414118e-06 | 1,443.38 | 2,834 | 8 | - |
| B | Medium | 5 | 500 | 1,357 | 412,519,056.25 | 1.212065e-06 | 6,543.89 | n/a | 23 | crossings skipped (`edges > 800`) |
| B | Large | 5 | 2,000 | 5,479 | 4,199,566,183.87 | 4.762397e-07 | 21,995.69 | n/a | n/a | crossings skipped, overlaps skipped (`nodes > 500`) |
| C | Small | 5 | 100 | 271 | 22,658,618.38 | 4.413332e-06 | 1,586.51 | 3,233 | 9 | - |
| C | Medium | 5 | 500 | 1,493 | 395,413,683.48 | 1.264498e-06 | 6,418.43 | n/a | 19 | crossings skipped (`edges > 800`) |
| C | Large | 5 | 2,000 | 6,198 | 5,307,090,496.97 | 3.768543e-07 | 25,821.64 | n/a | n/a | crossings skipped, overlaps skipped (`nodes > 500`) |

### 8.6.2 Performance Results

**Table 8.2. Performance Metrics (Mean of 5 Runs)**

| Dataset | Size | Layout Time (ms) | Preprocess Time (ms) | End-to-End Time (ms) | Peak Memory (MB) |
| --- | --- | ---: | ---: | ---: | ---: |
| A | Small | 765.92 | 15.20 | 781.12 | 176.60 |
| A | Medium | 6,637.44 | 29.84 | 6,667.28 | 179.47 |
| A | Large | 62,843.40 | 63.08 | 62,906.48 | 177.27 |
| B | Small | 767.10 | 16.06 | 783.16 | 182.90 |
| B | Medium | 17,372.50 | 34.90 | 17,407.40 | 180.94 |
| B | Large | 75,936.50 | 69.60 | 76,006.10 | 184.68 |
| C | Small | 922.84 | 14.88 | 937.72 | 181.19 |
| C | Medium | 6,268.11 | 15.13 | 6,283.23 | 178.57 |
| C | Large | 92,999.66 | 68.60 | 93,068.26 | 188.28 |

### 8.6.3 Stability Results

**Table 8.3. Stability Metrics Across Repeated Runs (5 Runs Each)**

| Dataset | Size | Runs | Area Std Dev | Density Std Dev | Avg Edge Len Std Dev | Layout Time Std Dev (ms) | Determinism Error Rate (%) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A | Small | 5 | 0.00 | 0.00 | 0.00 | 192.85 | 0.00 |
| A | Medium | 5 | 0.00 | 0.00 | 0.00 | 814.38 | 0.00 |
| A | Large | 5 | 0.00 | 0.00 | 0.00 | 4,473.54 | 0.00 |
| B | Small | 5 | 0.00 | 0.00 | 0.00 | 41.42 | 0.00 |
| B | Medium | 5 | 0.00 | 0.00 | 0.00 | 210.86 | 0.00 |
| B | Large | 5 | 0.00 | 0.00 | 0.00 | 7,710.22 | 0.00 |
| C | Small | 5 | 0.00 | 0.00 | 0.00 | 88.19 | 0.00 |
| C | Medium | 5 | 0.00 | 0.00 | 0.00 | 71.94 | 0.00 |
| C | Large | 5 | 0.00 | 0.00 | 0.00 | 1,245.07 | 0.00 |

### 8.6.4 Cross-Size Average Summary

**Table 8.4. Mean Behavior by Size Tier (A+B+C Average)**

| Size Tier | Mean Area (px²) | Mean Density (nodes/px²) | Mean Avg Edge Len (px) | Mean Layout Time (ms) | Mean Peak Memory (MB) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Small | 18,842,586.10 | 5.440472e-06 | 1,425.52 | 818.62 | 180.23 |
| Medium | 355,896,490.85 | 1.467147e-06 | 5,919.26 | 10,092.68 | 179.66 |
| Large | 4,190,977,010.16 | 5.017838e-07 | 21,527.42 | 77,259.85 | 183.41 |

### 8.6.5 Dataset-Level Growth Ratios

**Table 8.5. Growth Trends (Small to Medium to Large)**

| Dataset | Area S→M (%) | Area M→L (%) | Density S→M (%) | Density M→L (%) | Edge Len S→M (%) | Edge Len M→L (%) | Layout S→L (x) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A | +1,586.85 | +1,080.44 | -70.36 | -66.11 | +284.67 | +249.60 | 82.05x |
| B | +2,133.43 | +918.03 | -77.61 | -60.71 | +353.37 | +236.13 | 98.99x |
| C | +1,645.09 | +1,242.16 | -71.35 | -70.20 | +304.56 | +302.30 | 100.78x |

## 8.7 Chart-Based Visualization (Bar Charts)

This section maps each quantitative pattern to a bar chart so that trends are visually clear in the final thesis document.

### 8.7.1 Figure Placement Map
Insert the following figures in order:
1. **Figure 8.1**: `evaluation/figures/system_quant_charts/chart-ev-1-area-by-case.svg`
2. **Figure 8.2**: `evaluation/figures/system_quant_charts/chart-ev-2-density-by-case.svg`
3. **Figure 8.3**: `evaluation/figures/system_quant_charts/chart-ev-4-layout-time-by-case.svg`
4. **Figure 8.4**: `evaluation/figures/system_quant_charts/chart-ev-6-peak-memory-by-case.svg`
5. **Figure 8.5**: `evaluation/figures/system_quant_charts/chart-ev-10-determinism-error-by-case.svg`

Optional appendix figures (if supervisor requests more visuals):
- `evaluation/figures/system_quant_charts/chart-ev-3-edge-length-by-case.svg`
- `evaluation/figures/system_quant_charts/chart-ev-5-end-to-end-time-by-case.svg`
- `evaluation/figures/system_quant_charts/chart-ev-7-overlaps-small-medium.svg`
- `evaluation/figures/system_quant_charts/chart-ev-8-crossings-small.svg`
- `evaluation/figures/system_quant_charts/chart-ev-9-layout-stddev-by-case.svg`

### 8.7.2 Figure-by-Figure Interpretation

**Figure 8.1 (Area by case):**  
Shows a monotonic increase from small to large for all datasets. C-L is the maximum area scenario, and A-S is the minimum. The large-tier area expansion is substantial, consistent with layered layout behavior on high-edge-count subgraphs.

**Figure 8.2 (Density by case):**  
Shows inverse behavior relative to area. Density decreases as tier size increases because area grows faster than node count between tiers.

**Figure 8.3 (Layout time by case):**  
Shows superlinear growth with graph size. Layout dominates the runtime budget in all scenarios.

**Figure 8.4 (Peak memory):**  
Peak memory remains within a relatively narrow range compared with the large spread of runtime values, indicating runtime scalability pressure is compute-dominant rather than memory-dominant.

**Figure 8.5 (Determinism error):**  
All bars are zero, confirming reproducible geometry metrics across repeated runs.

Readability guardrails (crossings and overlaps) are still fully reported in Table 8.1 and discussed in Section 8.8.3, even when not shown as separate bar charts in the main chapter.

## 8.8 Detailed Quantitative Discussion

### 8.8.1 Compactness Behavior Across Scales
The compactness profile is consistent with H1. In each dataset:
1. Area rises sharply from small to medium and medium to large.
2. Density declines at each scale transition.
3. Average edge length increases at each scale transition.

This joint pattern confirms that larger graph tiers induce expanded geometric envelopes and longer connection spans, even under compact deterministic settings. Importantly, this does not indicate algorithm failure; it reflects structural pressure from increased node/edge volume and layered separation constraints.

### 8.8.2 Dataset-Specific Compactness Characteristics

**Dataset A (LUBM):**  
This dataset shows the smallest overall edge lengths and area among equivalent tiers. It appears structurally favorable for compact layered layouts, likely due to more regular synthetic schema patterns.

**Dataset B (DBpedia):**  
Compared with A, B has larger area and longer edges at medium and large tiers. This suggests more heterogeneous neighborhood topology and longer relational paths.

**Dataset C (Wikidata):**  
C exhibits the highest complexity profile in this evaluation: largest large-tier area and longest large-tier average edge length. The result is consistent with higher relationship variety and branch expansion in sampled subgraphs.

### 8.8.3 Readability Guardrail Discussion
For small tiers, both crossings and overlaps are measurable and acceptable for dense RDF layouts:
- Crossings: 1,782 to 3,233
- Overlaps: 6 to 9

For medium tiers:
- Crossings are not reported (threshold skip due to `edgeCount > 800`).
- Overlaps remain moderate (19 to 30).

For large tiers:
- Crossings and overlaps are skipped by design thresholds.

This threshold-aware reporting is methodologically honest. Rather than publishing untrustworthy high-cost approximations, the implementation labels them as `n/a` and records why. In thesis writing, this should be explicitly acknowledged as a guardrail measurement boundary, not as missing experiment work.

### 8.8.4 Runtime and Cost Structure
Runtime analysis supports H3:
1. Layout time accounts for 97.95% to 99.93% of end-to-end time.
2. Preprocess time is generally below 70 ms.
3. End-to-end time scales from sub-second (small) to ~1.5 minutes (largest case C-L).

This means algorithmic optimization opportunity is concentrated in layout strategy, not parsing or graph build pipeline.

### 8.8.5 Memory Profile
Mean peak memory ranges from 176.60 MB to 188.28 MB. This narrow band is notable because runtime spans two orders of magnitude across scenarios. It suggests that in the current architecture, increased graph size mostly affects layout computation time rather than triggering proportional memory escalation.

### 8.8.6 Stability and Reproducibility
Stability results strongly support H4:
- Area SD = 0 for all 9 scenarios.
- Density SD = 0 for all 9 scenarios.
- Avg edge length SD = 0 for all 9 scenarios.
- Determinism error rate = 0% in all scenarios.

Layout-time SD is non-zero, which is expected due to runtime environment and scheduling effects, but this does not impact geometric determinism.

### 8.8.7 Scenario-by-Scenario Interpretation
This subsection explains each of the nine scenarios in a compact but direct narrative, so that the chapter can be read independently of the raw tables.

**A-Small (100 nodes, 223 edges):**  
This case is the most compact among all medium-to-low edge-density scenarios. Area remains at ~15.4M px² with density ~6.49e-06 and average edge length ~1247 px. Crossings (1782) are measurable and lower than the other two small-tier datasets. The configuration appears to balance compactness and readability effectively at this scale.

**A-Medium (500 nodes, 1179 edges):**  
Area expands to ~259.8M px² and density drops to ~1.92e-06. Average edge length rises to ~4795 px. Crossings are not reported due to edge threshold, but overlap (30) remains manageable for medium-scale visualization. This transition demonstrates expected growth pressure while preserving deterministic structure.

**A-Large (2000 nodes, 4719 edges):**  
Area reaches ~3.07B px² with density ~6.52e-07 and average edge length ~16,765 px. This is the first case where both crossings and overlaps are skipped by threshold logic. Runtime cost rises sharply to ~62.9s end-to-end, but geometric stability remains exact.

**B-Small (100 nodes, 246 edges):**  
Compared with A-small, this case has larger area and longer average edges, showing that graph structure matters even at equal node count. Crossings increase to 2834 and overlaps to 8. The scenario is still practically readable at interactive zoom levels.

**B-Medium (500 nodes, 1357 edges):**  
Area is ~412.5M px², substantially above A-medium, while density is lower (~1.21e-06). Average edge length is ~6544 px, indicating broader connectivity spans. Overlap is 23, lower than A-medium, suggesting that structure and branching distribution can produce lower collision despite larger geometric footprint.

**B-Large (2000 nodes, 5479 edges):**  
Area expands to ~4.20B px² and average edge length to ~21,996 px. Runtime reaches ~76.0s end-to-end. Peak memory remains moderate (~184.68 MB). This case is useful to show that runtime escalation is not mirrored by equivalent memory escalation.

**C-Small (100 nodes, 271 edges):**  
This scenario has the highest edge count in small tier and correspondingly the highest crossing count (3233) and overlap (9). Area is also the largest among small-tier cases (~22.66M px²). The result is coherent with dense relation neighborhoods in the sampled graph.

**C-Medium (500 nodes, 1493 edges):**  
Area (~395.4M px²) is slightly below B-medium, yet average edge length (~6418 px) remains high. Overlaps (19) are the lowest among medium tiers, suggesting better local separation despite global size. Runtime (~6.28s end-to-end) is notably lower than B-medium, reflecting structural layout complexity differences between datasets.

**C-Large (2000 nodes, 6198 edges):**  
This is the largest-complexity case in the evaluation: area ~5.31B px², density ~3.77e-07, and average edge length ~25,822 px. Runtime is the maximum (~93.1s end-to-end), and peak memory is also the maximum (~188.28 MB). Determinism remains intact.

### 8.8.8 Performance Budget Decomposition
To understand where runtime is spent, this chapter separates layout time from preprocess time.

Across all scenarios:
1. Layout share: 97.95% to 99.93% of end-to-end runtime.
2. Preprocess share: 0.07% to 2.05%.
3. Small tiers show slightly larger preprocess percentage because total runtime is low.
4. Large tiers show negligible preprocess percentage because layout dominates.

This decomposition has direct engineering implications:
1. Parsing and graph construction are not the primary optimization targets.
2. Layout algorithm choice and its option set are the main leverage points.
3. Any future acceleration work should focus on layered graph decomposition, partitioning, incremental layout, or caching of layout substructures.

### 8.8.9 Cross-Tier Structural Trade-Offs
The measured trends indicate three persistent trade-offs.

**Trade-off A: Compactness vs readability pressure**  
As area reduces relative to potential unconstrained layouts, edge concentration and local collisions may rise. This is observable in small-tier crossing values and medium-tier overlap values.

**Trade-off B: Directional compactness vs collision reduction**  
Sensitivity tests showed RIGHT direction is more compact, while DOWN can reduce overlaps. There is no universal direction winner; choice depends on reporting goal.

**Trade-off C: Label richness vs geometric compactness**  
Label policies with long text (e.g., full IRI style) greatly inflate area and overlaps. Compactness claims are therefore valid only when paired with a defined label policy.

### 8.8.10 Why the Report Keeps `n/a` Instead of Guessing
The chapter intentionally preserves `n/a` values for threshold-skipped crossings/overlaps:
1. It avoids inaccurate surrogate estimation for expensive metrics.
2. It keeps the methodology auditable.
3. It prevents overclaiming quality in large-tier cases.

In thesis defense, this is a strength rather than a weakness because the evaluation explicitly states metric boundaries and complements them with qualitative figures.

## 8.9 Qualitative Evaluation

Quantitative metrics capture geometric quality but do not fully capture human interpretation quality. Therefore, visual inspection is used as complementary evidence.

### 8.9.1 Recommended Figure Set
Use the prepared figure slots:
1. Figure 10.1: small-tier compactness comparison panel.
2. Figure 10.2: Dataset A medium (system).
3. Figure 10.3: Dataset A medium (baseline snapshot if available).
4. Figure 10.4: Dataset B large (system).
5. Figure 10.5: Dataset C large (system or baseline snapshot if available).

### 8.9.2 Visual Checklist for Review
When selecting screenshots, ensure each figure clearly shows:
1. Cluster separation.
2. Label readability at default zoom.
3. Presence or absence of obvious node collisions.
4. Relative whitespace utilization.
5. Path/edge routing consistency.

### 8.9.3 Caption Template
Use this caption format for all visual figures:
> Figure X.Y: [Dataset, Size] rendered with [Tool/Mode], Nodes=[N], Edges=[E], Layout=[algorithm], Direction=[RIGHT/DOWN], EvaluationMode=[on/off].

## 8.10 Ablation Study

An ablation study was conducted to quantify the contribution of key design choices. The baseline reference is Dataset A (Medium) with default evaluation configuration.

Baseline values:
- Nodes: 500
- Edges: 1,179
- Area: 259,756,732.81
- Density: 1.924878e-06
- Avg edge length: 4,795.47
- Overlaps: 30

### 8.10.1 Disable Literal Collapsing
Observed values:
- Edges: 395
- Area: 64,654,464.00
- Density: 7.733418e-06
- Avg edge length: 1,445.93
- Overlaps: 210

Relative to baseline:
- Edge count: -66.50%
- Area: -75.11%
- Density: +301.76%
- Overlaps: +600.00%

Interpretation:
- Literal collapsing strongly affects node-cap composition and visual crowding behavior.
- Although area shrinks and density rises, overlap explosion makes readability unacceptable in this configuration.

### 8.10.2 Disable Parallel-Edge Merge
Observed changes:
- Edges: +0.08%
- Area: +0.26%
- Density: -0.26%
- Overlaps: +60.00%

Interpretation:
- Parallel-edge merge has modest effect on compactness metrics but a strong effect on readability via reduced local congestion.

### 8.10.3 Variable Node Size
Observed changes:
- Area: +23.86%
- Density: -19.27%
- Avg edge length: +9.94%
- Overlaps: +76.67%

Interpretation:
- Uniform node sizing is a strong compactness enabler in mixed-label RDF contexts.

### 8.10.4 Normal Mode vs Evaluation Mode
Observed changes in normal mode:
- Area: +341.22%
- Density: -77.34%
- Avg edge length: +104.55%
- Overlaps: -10.00%

Interpretation:
- Normal mode improves some local aesthetics but significantly reduces compactness and reproducibility suitability.
- This directly justifies keeping a separate deterministic evaluation mode for thesis benchmarking.

## 8.11 Sensitivity Analysis

Sensitivity analysis was performed on Dataset B (Medium), varying one parameter at a time.

Baseline:
- Area: 412,519,056.25
- Density: 1.212065e-06
- Avg edge length: 6,543.89
- Overlaps: 23

### 8.11.1 Inter-layer Spacing
Spacing tightened (`24 -> 16`):
- Area: -0.95%
- Density: +0.96%
- Avg edge length: -0.34%
- Overlaps: no change

Spacing loosened (`24 -> 36`):
- Area: +3.14%
- Density: -3.04%
- Avg edge length: +1.44%
- Overlaps: no change

Interpretation:
- Spacing is a moderate sensitivity control; it can fine-tune compactness without destabilizing readability.

### 8.11.2 Label Policy
Label policy changed to long IRI-style labels with variable node size:
- Area: +42.26%
- Density: -29.70%
- Avg edge length: +21.94%
- Overlaps: +86.96%

Interpretation:
- Label policy is one of the highest-impact compactness parameters.
- Compact layout claims must always be interpreted together with label strategy.

### 8.11.3 Layout Direction
Direction changed from RIGHT to DOWN:
- Area: +15.77%
- Density: -13.62%
- Avg edge length: +16.73%
- Overlaps: -86.96%

Interpretation:
- RIGHT direction is more compact for these sampled graphs.
- DOWN direction improves overlap behavior, indicating a compactness-readability trade-off axis.

## 8.12 Threats to Validity

### 8.12.1 Internal Validity
Potential threat:
- Runtime variance from OS scheduling and background load.

Mitigation:
- Five repeated runs per scenario.
- Deterministic layout mode for geometry.
- Reporting both mean and standard deviation.

### 8.12.2 Construct Validity
Potential threat:
- Crossings and overlaps are threshold-skipped in larger graphs.

Mitigation:
- Explicit `n/a` with rule-based reason.
- Complement with qualitative figure-based assessment.

### 8.12.3 External Validity
Potential threat:
- Results are from one hardware platform and one implementation pipeline.

Mitigation:
- Clear environment disclosure.
- Artifact scripts included for rerun on other devices.

### 8.12.4 Conclusion Validity
Potential threat:
- Over-interpreting runtime without accounting for graph structural differences.

Mitigation:
- Per-dataset reporting, per-size reporting, and aggregate tier summaries.
- Avoiding unsupported cross-tool claims unless measured data exists.

## 8.13 Reproducibility and Artifact Checklist

### 8.13.1 Required Files
1. Run data: `evaluation/results/system_runs/*.json`
2. Peak memory: `evaluation/results/peak_memory.csv`
3. Aggregation script: `evaluation/scripts/aggregate_system_results.py`
4. Chart script: `evaluation/figures/build_system_quant_charts.py`
5. Generated charts: `evaluation/figures/system_quant_charts/*.svg`

### 8.13.2 Rebuild Commands
Use:
```bash
python3 evaluation/scripts/aggregate_system_results.py
python3 evaluation/figures/build_system_quant_charts.py
```

### 8.13.3 Thesis Insertion Workflow
1. Paste Tables 8.1-8.5 into your document.
2. Insert Figures 8.1-8.5 from `evaluation/figures/system_quant_charts/`.
3. Keep figure captions consistent with metric names and units.
4. Keep the threshold notes (`n/a` reasons) exactly as reported.

## 8.14 Hypothesis-Wise Final Assessment

### H1 (Compactness trend)
**Supported.**  
Area and edge length increase with size; density decreases across all datasets.

### H2 (Readability guardrails)
**Partially supported with threshold caveat.**  
Small and medium overlaps are controlled, but large-tier crossing/overlap metrics are intentionally skipped by measurement thresholds and therefore require qualitative confirmation.

### H3 (Performance scaling)
**Supported.**  
Runtime is dominated by layout and increases substantially with scale. Preprocess time remains minor.

### H4 (Reproducibility)
**Strongly supported.**  
Determinism error rate is 0% across all 9 scenarios; geometry metrics are identical across repeated runs.

## 8.15 Chapter Conclusion
This evaluation demonstrates that the proposed system achieves deterministic, reproducible, and compact RDF layouts across three datasets and three size tiers. The findings show clear and interpretable scaling patterns: compactness decreases with graph size, runtime is dominated by layout computation, and memory usage remains comparatively stable. The chapter also clarifies practical trade-offs using ablation and sensitivity studies. Evaluation mode, uniform node size, and controlled label policy are shown to be critical for compact, reproducible outputs suitable for thesis-level analysis.

From a thesis perspective, the chapter provides:
1. Full quantitative tables for all dataset tiers.
2. Five core bar charts for visual interpretation (plus optional appendix charts).
3. Stability evidence with repeated runs.
4. Parameter-level evidence explaining design choices.
5. Transparent reporting of metric-computation boundaries.

Together, these results provide a complete evaluation narrative and a reproducible experimental artifact set, ready to be used as the final Evaluation chapter in the thesis document.

## References (Implementation and Data Sources)
1. `evaluation/results/system_summary.csv`
2. `evaluation/results/system_stability.csv`
3. `evaluation/results/peak_memory.csv`
4. `evaluation/results/system_runs/`
5. `evaluation/scripts/aggregate_system_results.py`
6. `evaluation/figures/build_system_quant_charts.py`
7. `evaluation/figures/SYSTEM_QUANT_CHARTS.md`
8. `src/lib/metrics.js`
9. `src/components/GraphView.jsx`
10. `src/App.jsx`
