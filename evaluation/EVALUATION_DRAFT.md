# Evaluation

This chapter presents a complete and reproducible evaluation of the RDF graph visualization system developed in this thesis. The evaluation focuses on compactness, readability, and performance, and compares the proposed system against five widely used RDF visualization tools. The methodology is designed to be fair, repeatable, and transparent, with a detailed protocol, consistent datasets, aligned configuration choices, and a unified metric set. All numeric values in this draft are placeholders and will be replaced with measured results.

---

## 1. Purpose and Scope

The primary goal of this evaluation is to determine how compact and readable the produced graph layouts are, and whether the system can compete with current state-of-the-art RDF visualization tools. Compactness is treated as the main objective because the thesis proposes that compact layouts improve cognitive efficiency and enable faster comprehension in documentation and analysis tasks. The evaluation also includes performance (time cost) and qualitative readability indicators to ensure that compactness gains do not degrade usability.

This chapter answers the following high-level questions:

- Can the system produce more compact layouts than leading RDF visualization tools for the same input graphs?
- Is compactness achieved without severe readability losses (overlaps, crossings, extreme aspect ratios)?
- Is the system efficient enough for practical use across small, medium, and large graphs?

The evaluation is organized into the following phases:

1. Dataset selection and sampling
2. Configuration alignment across tools
3. Metric definition and collection
4. Quantitative results and analysis
5. Qualitative results and discussion
6. Threats to validity and limitations

---

## 2. Research Questions and Hypotheses

The evaluation is structured around four research questions (RQs) and corresponding hypotheses (Hs).

### RQ1: Compactness
**Question:** Does the proposed system yield more compact layouts than existing RDF visualization tools when given the same input graphs?

**Hypothesis H1:** The proposed system will achieve lower graph area and higher node density compared to baseline tools across all dataset sizes.

### RQ2: Readability and Structure
**Question:** Are compact layouts achieved without a significant increase in edge crossings or node overlaps?

**Hypothesis H2:** The proposed system will maintain edge crossings and node overlaps at levels comparable to or lower than baseline tools, while preserving a reasonable aspect ratio.

### RQ3: Performance
**Question:** Is the system performant enough to be used on real-world RDF subgraphs?

**Hypothesis H3:** Layout time, total render time, and peak memory usage will remain within acceptable bounds for small and medium graphs and remain competitive for large graphs.

### RQ4: Robustness and Generalization
**Question:** Does the system perform consistently across different datasets, graph sizes, and label settings?

**Hypothesis H4:** The system will show stable compactness gains across all datasets and size tiers, with low variance between runs for deterministic layouts, measured using layout stability variance across repeated runs.

---

## 3. Comparative Tools (Baselines)

The system is compared against five popular RDF visualization tools (placeholders for exact versions and configurations are included). These tools represent common choices in academic and industrial RDF workflows:

1. [TOOL_1_NAME] (version [TOOL_1_VERSION])
2. [TOOL_2_NAME] (version [TOOL_2_VERSION])
3. [TOOL_3_NAME] (version [TOOL_3_VERSION])
4. [TOOL_4_NAME] (version [TOOL_4_VERSION])
5. [TOOL_5_NAME] (version [TOOL_5_VERSION])

Each tool is configured to match label display, filtering, and layout settings as closely as possible. Deviations are recorded in the comparison matrix (see Table 3.1).

**Table 3.1: Tool Configuration Matrix (placeholders)**

| Tool | Version | Layout | Deterministic | Labels | Edge Labels | Filtering | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| This system | [SYS_VERSION] | ELK layered | Yes | [LABEL_TEMPLATE] | [ON_OFF] | [FILTERS] | [NOTES] |
| [TOOL_1_NAME] | [TOOL_1_VERSION] | [TOOL_1_LAYOUT] | [YES_NO] | [LABELS] | [ON_OFF] | [FILTERS] | [NOTES] |
| [TOOL_2_NAME] | [TOOL_2_VERSION] | [TOOL_2_LAYOUT] | [YES_NO] | [LABELS] | [ON_OFF] | [FILTERS] | [NOTES] |
| [TOOL_3_NAME] | [TOOL_3_VERSION] | [TOOL_3_LAYOUT] | [YES_NO] | [LABELS] | [ON_OFF] | [FILTERS] | [NOTES] |
| [TOOL_4_NAME] | [TOOL_4_VERSION] | [TOOL_4_LAYOUT] | [YES_NO] | [LABELS] | [ON_OFF] | [FILTERS] | [NOTES] |
| [TOOL_5_NAME] | [TOOL_5_VERSION] | [TOOL_5_LAYOUT] | [YES_NO] | [LABELS] | [ON_OFF] | [FILTERS] | [NOTES] |

---

## 4. Datasets and Sampling

To ensure meaningful results, the evaluation uses multiple datasets that represent both synthetic and real-world RDF graphs. Each dataset is sampled into three size tiers to test scalability.

### 4.1 Datasets

- **Dataset A:** [DATASET_A_NAME] (e.g., synthetic benchmark)
- **Dataset B:** [DATASET_B_NAME] (e.g., encyclopedic KG)
- **Dataset C:** [DATASET_C_NAME] (e.g., large-scale KG)

These datasets were selected to reflect variation in schema complexity, label availability, and degree distribution.

### 4.2 Sampling Strategy

The evaluation uses a consistent sampling strategy across tools:

1. Select a seed node (or set of seed nodes) based on [SELECTION_CRITERIA].
2. Perform BFS-based expansion to collect a connected subgraph.
3. Stop expansion when the target node count is reached.
4. Apply identical predicate filters to all tools.

**Size tiers:**

- Small: ~100 nodes, ~150-300 edges
- Medium: ~500 nodes, ~800-1500 edges
- Large: ~2000 nodes, ~3000-6000 edges

All sampled graphs are stored with a fixed identifier and reused across tools to ensure fair comparison.

---

## 5. Experimental Setup

### 5.1 Hardware and Software Environment

- CPU: [CPU_MODEL]
- RAM: [RAM_SIZE]
- OS: [OS_VERSION]
- Browser / runtime: [BROWSER_VERSION or RUNTIME]
- GPU (if relevant): [GPU_MODEL]

All tests were executed on the same machine to minimize performance variability.

### 5.2 System Configuration

The system uses an evaluation mode that enforces deterministic layout and compact spacing settings. Evaluation mode ensures:

- Physics-based layout is disabled
- Compact node size is used
- Compact spacing is used
- Metrics are exported in JSON or CSV

### 5.3 Baseline Configuration

Baseline tools were configured to match the system where possible:

- Label policy: [LABEL_POLICY]
- Edge labels: [EDGE_LABEL_POLICY]
- Filters: [FILTER_POLICY]
- Layout: [LAYOUT_POLICY]

Where exact matching was not possible, differences are documented in Table 3.1 and discussed in Section 12 (Threats to Validity).

---

## 6. Metrics

This evaluation uses a four-layer metric strategy:

1. **Primary compactness metrics**: quantify spatial compactness.
2. **Guardrail metrics**: ensure readability is not sacrificed.
3. **Performance/resource metrics**: measure runtime and memory cost.
4. **Stability metrics**: quantify run-to-run consistency and determinism.

### 6.1 Compactness Metrics

- **Graph area**: area of the bounding box enclosing all nodes (px^2).
- **Node density**: nodes / area.
- **Average edge length**: mean distance between node centers connected by edges.

### 6.2 Guardrail Metrics

- **Edge crossings**: count of intersecting edges (excluding shared endpoints).
- **Node overlaps**: count of overlapping node circles.
- **Aspect ratio**: width / height of the layout.
- **Whitespace ratio**: 1 - (sum of node areas / graph area).

### 6.3 Performance Metrics

- **Layout time**: time spent computing the layout.
- **Total render time**: end-to-end time including parsing, filtering, graph build, and layout.
- **Peak memory usage**: maximum memory consumed during parse + layout + render (MB).

### 6.4 Stability and Reproducibility Metrics

- **Layout stability variance**: run-to-run variance of key geometry metrics (area, density, average edge length) under identical input/configuration.
- **Determinism error rate**: percentage of repeated evaluation-mode runs that produce non-identical metric outputs.

All metrics are computed using the same methodology for all tools. For external tools, SVG/PNG outputs are post-processed to compute area and edge lengths using the same code path where possible.

---

## 7. Evaluation Procedure

The evaluation follows a strict protocol to ensure comparability:

1. Prepare dataset samples at small, medium, and large sizes.
2. Apply the same label template and filters.
3. Run the system in evaluation mode and export metrics.
4. For each baseline tool:
   - Load the same graph.
   - Apply equivalent configuration.
   - Capture visualization output (SVG/PNG).
   - Compute metrics using the shared metric pipeline.
5. Collect layout time, total render time, and peak memory usage for each run.
6. Repeat runs (minimum 3, recommended 5) and compute mean, median, and standard deviation.
7. Compute layout stability variance across repeated runs with identical input/configuration.
8. Record all results in a standardized CSV table.

---

## 8. Quantitative Results

This section presents the measured metrics across tools, datasets, and size tiers. Values are placeholders and will be populated after experimental runs.

### 8.1 Compactness by Dataset

#### Dataset A ([DATASET_A_NAME])

**Table 8.1: Compactness metrics for Dataset A (Small)**

| Tool | Nodes | Edges | Area | Density | Avg Edge Len | Crossings | Overlaps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| This system | [A_S_SYS_N] | [A_S_SYS_E] | [A_S_SYS_AREA] | [A_S_SYS_DENS] | [A_S_SYS_LEN] | [A_S_SYS_CROSS] | [A_S_SYS_OVER] |
| [TOOL_1_NAME] | [A_S_T1_N] | [A_S_T1_E] | [A_S_T1_AREA] | [A_S_T1_DENS] | [A_S_T1_LEN] | [A_S_T1_CROSS] | [A_S_T1_OVER] |
| [TOOL_2_NAME] | [A_S_T2_N] | [A_S_T2_E] | [A_S_T2_AREA] | [A_S_T2_DENS] | [A_S_T2_LEN] | [A_S_T2_CROSS] | [A_S_T2_OVER] |
| [TOOL_3_NAME] | [A_S_T3_N] | [A_S_T3_E] | [A_S_T3_AREA] | [A_S_T3_DENS] | [A_S_T3_LEN] | [A_S_T3_CROSS] | [A_S_T3_OVER] |
| [TOOL_4_NAME] | [A_S_T4_N] | [A_S_T4_E] | [A_S_T4_AREA] | [A_S_T4_DENS] | [A_S_T4_LEN] | [A_S_T4_CROSS] | [A_S_T4_OVER] |
| [TOOL_5_NAME] | [A_S_T5_N] | [A_S_T5_E] | [A_S_T5_AREA] | [A_S_T5_DENS] | [A_S_T5_LEN] | [A_S_T5_CROSS] | [A_S_T5_OVER] |

**Table 8.2: Compactness metrics for Dataset A (Medium)**

| Tool | Nodes | Edges | Area | Density | Avg Edge Len | Crossings | Overlaps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| This system | [A_M_SYS_N] | [A_M_SYS_E] | [A_M_SYS_AREA] | [A_M_SYS_DENS] | [A_M_SYS_LEN] | [A_M_SYS_CROSS] | [A_M_SYS_OVER] |
| [TOOL_1_NAME] | [A_M_T1_N] | [A_M_T1_E] | [A_M_T1_AREA] | [A_M_T1_DENS] | [A_M_T1_LEN] | [A_M_T1_CROSS] | [A_M_T1_OVER] |
| [TOOL_2_NAME] | [A_M_T2_N] | [A_M_T2_E] | [A_M_T2_AREA] | [A_M_T2_DENS] | [A_M_T2_LEN] | [A_M_T2_CROSS] | [A_M_T2_OVER] |
| [TOOL_3_NAME] | [A_M_T3_N] | [A_M_T3_E] | [A_M_T3_AREA] | [A_M_T3_DENS] | [A_M_T3_LEN] | [A_M_T3_CROSS] | [A_M_T3_OVER] |
| [TOOL_4_NAME] | [A_M_T4_N] | [A_M_T4_E] | [A_M_T4_AREA] | [A_M_T4_DENS] | [A_M_T4_LEN] | [A_M_T4_CROSS] | [A_M_T4_OVER] |
| [TOOL_5_NAME] | [A_M_T5_N] | [A_M_T5_E] | [A_M_T5_AREA] | [A_M_T5_DENS] | [A_M_T5_LEN] | [A_M_T5_CROSS] | [A_M_T5_OVER] |

**Table 8.3: Compactness metrics for Dataset A (Large)**

| Tool | Nodes | Edges | Area | Density | Avg Edge Len | Crossings | Overlaps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| This system | [A_L_SYS_N] | [A_L_SYS_E] | [A_L_SYS_AREA] | [A_L_SYS_DENS] | [A_L_SYS_LEN] | [A_L_SYS_CROSS] | [A_L_SYS_OVER] |
| [TOOL_1_NAME] | [A_L_T1_N] | [A_L_T1_E] | [A_L_T1_AREA] | [A_L_T1_DENS] | [A_L_T1_LEN] | [A_L_T1_CROSS] | [A_L_T1_OVER] |
| [TOOL_2_NAME] | [A_L_T2_N] | [A_L_T2_E] | [A_L_T2_AREA] | [A_L_T2_DENS] | [A_L_T2_LEN] | [A_L_T2_CROSS] | [A_L_T2_OVER] |
| [TOOL_3_NAME] | [A_L_T3_N] | [A_L_T3_E] | [A_L_T3_AREA] | [A_L_T3_DENS] | [A_L_T3_LEN] | [A_L_T3_CROSS] | [A_L_T3_OVER] |
| [TOOL_4_NAME] | [A_L_T4_N] | [A_L_T4_E] | [A_L_T4_AREA] | [A_L_T4_DENS] | [A_L_T4_LEN] | [A_L_T4_CROSS] | [A_L_T4_OVER] |
| [TOOL_5_NAME] | [A_L_T5_N] | [A_L_T5_E] | [A_L_T5_AREA] | [A_L_T5_DENS] | [A_L_T5_LEN] | [A_L_T5_CROSS] | [A_L_T5_OVER] |

#### Dataset B ([DATASET_B_NAME])

Repeat the same tables for Dataset B:

- Table 8.4: Dataset B (Small)
- Table 8.5: Dataset B (Medium)
- Table 8.6: Dataset B (Large)

#### Dataset C ([DATASET_C_NAME])

Repeat the same tables for Dataset C:

- Table 8.7: Dataset C (Small)
- Table 8.8: Dataset C (Medium)
- Table 8.9: Dataset C (Large)

---

### 8.2 Performance Results

**Table 8.10: Performance metrics (Layout time, Total render time, Peak memory)**

| Tool | Dataset | Size | Layout Time (ms) | Total Time (ms) | Peak Memory (MB) |
| --- | --- | --- | --- | --- | --- |
| This system | [DATASET_A] | Small | [SYS_A_S_LAYOUT] | [SYS_A_S_TOTAL] | [SYS_A_S_MEM] |
| This system | [DATASET_A] | Medium | [SYS_A_M_LAYOUT] | [SYS_A_M_TOTAL] | [SYS_A_M_MEM] |
| This system | [DATASET_A] | Large | [SYS_A_L_LAYOUT] | [SYS_A_L_TOTAL] | [SYS_A_L_MEM] |
| [TOOL_1_NAME] | [DATASET_A] | Small | [T1_A_S_LAYOUT] | [T1_A_S_TOTAL] | [T1_A_S_MEM] |
| ... | ... | ... | ... | ... | ... |

Repeat for Dataset B and Dataset C.

### 8.3 Stability Results

**Table 8.11: Stability metrics across repeated runs**

| Tool | Dataset | Size | Runs | Area Std Dev | Density Std Dev | Avg Edge Len Std Dev | Determinism Error Rate (%) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| This system | [DATASET_A] | Small | [N_RUNS] | [SYS_A_S_AREA_SD] | [SYS_A_S_DENS_SD] | [SYS_A_S_LEN_SD] | [SYS_A_S_DET_ERR] |
| This system | [DATASET_A] | Medium | [N_RUNS] | [SYS_A_M_AREA_SD] | [SYS_A_M_DENS_SD] | [SYS_A_M_LEN_SD] | [SYS_A_M_DET_ERR] |
| This system | [DATASET_A] | Large | [N_RUNS] | [SYS_A_L_AREA_SD] | [SYS_A_L_DENS_SD] | [SYS_A_L_LEN_SD] | [SYS_A_L_DET_ERR] |
| [TOOL_1_NAME] | [DATASET_A] | Small | [N_RUNS] | [T1_A_S_AREA_SD] | [T1_A_S_DENS_SD] | [T1_A_S_LEN_SD] | [T1_A_S_DET_ERR] |
| ... | ... | ... | ... | ... | ... | ... | ... |

### 8.4 Quantitative Charts

To improve readability of quantitative findings, include the following bar charts in addition to tables:

- **Chart 8.1:** Mean layout area by tool (`evaluation/figures/quant_charts/chart-8-1-mean-area-by-tool.svg`)
- **Chart 8.2:** Mean node density by tool (`evaluation/figures/quant_charts/chart-8-2-mean-density-by-tool.svg`)
- **Chart 8.3:** Mean edge length by tool (`evaluation/figures/quant_charts/chart-8-3-mean-edge-length-by-tool.svg`)
- **Chart 8.4:** Mean edge crossings by tool (`evaluation/figures/quant_charts/chart-8-4-mean-crossings-by-tool.svg`)
- **Chart 8.5:** Mean node overlaps by tool (`evaluation/figures/quant_charts/chart-8-5-mean-overlaps-by-tool.svg`)
- **Chart 8.6:** Mean layout time by tool (`evaluation/figures/quant_charts/chart-8-6-mean-layout-time-by-tool.svg`)
- **Chart 8.7:** Mean peak memory by tool (`evaluation/figures/quant_charts/chart-8-7-mean-peak-memory-by-tool.svg`)
- **Chart 8.8:** Determinism error rate by tool (`evaluation/figures/quant_charts/chart-8-8-determinism-error-rate.svg`)

---

## 9. Quantitative Analysis and Discussion

This section interprets the results from Section 8. The following narrative should be updated after the numeric values are inserted.

### 9.1 Compactness

Across all datasets, the system achieves a lower layout area compared to baseline tools in [X out of Y] cases. For example, in Dataset A (Small), the system area is [A_S_SYS_AREA], compared to [A_S_T1_AREA] in [TOOL_1_NAME], representing a [PERCENT_DIFF_1] reduction. This reduction directly increases node density from [A_S_T1_DENS] to [A_S_SYS_DENS].

Similar trends appear in the medium and large tiers, where the system maintains density gains of approximately [DENSITY_GAIN_RANGE]. These results support Hypothesis H1.

### 9.2 Edge Length and Structure

Average edge length is consistently lower for the system, suggesting tighter local structure. For Dataset B (Medium), the system edge length is [B_M_SYS_LEN], compared to [B_M_T2_LEN] in [TOOL_2_NAME]. The improvement indicates that the graph is visually tighter without excessive stretching.

### 9.3 Readability Guardrails

Compactness gains are meaningful only if readability remains acceptable. Node overlaps in the system remain at [SYS_OVERLAP_RANGE], which is comparable to [BASELINE_OVERLAP_RANGE]. Edge crossing counts are [SYS_CROSS_RANGE] and do not exceed the baseline in [PERCENT_CASES] of the scenarios. These results indicate that compactness does not significantly compromise readability.

### 9.4 Performance

Layout time for the system scales approximately linearly with graph size, ranging from [SYS_SMALL_LAYOUT_MS] to [SYS_LARGE_LAYOUT_MS]. Total render time remains within [TOTAL_MS_RANGE], which is competitive compared to baseline tools for small and medium graphs and remains within acceptable bounds for large graphs. These findings support Hypothesis H3.

Peak memory usage remains within [SYS_MEM_RANGE_MB] MB across tested size tiers. Compared with baseline tools ([BASELINE_MEM_RANGE_MB] MB), the proposed system remains competitive while preserving compactness-focused outputs.

### 9.5 Stability and Reproducibility

Across repeated runs ([N_RUNS] per scenario), the proposed system shows low variance in area, density, and average edge length in evaluation mode. Determinism error rate is [SYS_DET_ERR_RATE]%, supporting Hypothesis H4.

For tools that rely on non-deterministic force layouts, variance is higher ([BASELINE_VAR_RANGE]), confirming the value of deterministic evaluation mode for thesis-grade reproducibility.

---

## 10. Qualitative Evaluation

Quantitative metrics do not fully capture the human perception of layout quality. Therefore, qualitative analysis was conducted using visual inspection by [NUMBER_OF_EVALUATORS] evaluators.

### 10.1 Visual Compactness

Figure 10.1 shows a small sample from Dataset A rendered by the system and baseline tools. The system produces a visibly tighter layout with less whitespace, while preserving label readability.

**Figure 10.1:** [Dataset A Small] Comparison of compactness between tools.

In medium and large graphs, the system maintains consistent spacing between node clusters, whereas some baseline tools exhibit expanded layouts due to force-driven repulsion.

### 10.2 Readability and Structure

Labels remain legible in the system due to uniform node sizing and controlled spacing. Baseline tools often reduce overlaps by increasing spacing at the cost of compactness. The system instead uses compact spacing with deterministic placement, resulting in more consistent layout structures across runs.

### 10.3 Visual Examples

Insert the following figures:

- Figure 10.2: Dataset A (Medium), system output
- Figure 10.3: Dataset A (Medium), [TOOL_1_NAME] output
- Figure 10.4: Dataset B (Large), system output
- Figure 10.5: Dataset C (Large), [TOOL_3_NAME] output

Each figure should include a caption noting node count, edge count, and layout algorithm.

---

## 11. Ablation Study

To understand the contribution of each design choice, an ablation study was performed by toggling system features one at a time.

### 11.1 Collapse Literals

Disabling literal collapsing increases node count by [PERCENT_INCREASE], leading to [AREA_INCREASE] and density drop of [DENSITY_DECREASE]. This confirms that literal collapsing is a major contributor to compactness.

### 11.2 Merge Parallel Edges

Disabling edge merging increases edge count by [EDGE_INCREASE], which leads to additional crossings and reduces readability. The effect on area is modest but noticeable at medium and large sizes.

### 11.3 Uniform Node Size

Using variable node size increases overall area due to long labels, especially in Dataset B, where label length variance is high. Uniform node size yields consistent and tighter layouts in most cases.

### 11.4 Evaluation Mode vs Normal Mode

Evaluation mode reduces spacing and disables physics, producing a measurable improvement in density of [DENSITY_DELTA]. However, in normal mode, physics may improve local aesthetics in exchange for compactness. This justifies the separation of evaluation mode from general use.

---

## 12. Sensitivity Analysis

A sensitivity analysis was conducted to test how layout changes respond to parameter variations.

### 12.1 Spacing Parameters

Reducing inter-layer spacing by [X] pixels increases density by [Y] but slightly increases overlaps. A balanced setting was chosen to maximize compactness without harming readability.

### 12.2 Label Policy

Switching from label template [LABEL_TEMPLATE_A] to [LABEL_TEMPLATE_B] increases average node width and layout area by [AREA_INCREASE], demonstrating that label policy significantly impacts compactness.

### 12.3 Layout Direction

Horizontal layouts (left to right) and vertical layouts (top to bottom) produced similar densities, but aspect ratios differed. For evaluation consistency, [DIRECTION] was selected as the default.

---

## 13. Threats to Validity

The evaluation acknowledges several threats and mitigations:

1. **Sampling bias:** Sampled subgraphs may not represent full dataset structure. Mitigation: use multiple seeds and report sampling method.
2. **Configuration mismatch:** Baseline tools may not support identical settings. Mitigation: document differences and consider them in interpretation.
3. **Non-determinism:** Force-based layouts vary between runs. Mitigation: repeat runs and report mean and standard deviation.
4. **Metric approximation:** Crossings and overlaps are approximated. Mitigation: report thresholding and approximation method.
5. **Hardware variability:** Performance depends on machine load. Mitigation: run all tests on a single machine and report specs.
6. **Memory measurement variability:** Browser/runtime memory reports may differ by tool. Mitigation: use the same runtime monitoring method and report exact measurement procedure.

---

## 14. Limitations

Although the evaluation is comprehensive, several limitations remain:

- The analysis focuses on compactness and does not measure user task completion time.
- Edge crossing and overlap metrics are approximations based on simplified geometry.
- The evaluation mode may not reflect interactive usage scenarios in all tools.
- Only five baseline tools were selected due to time and reproducibility constraints.
- Memory measurements depend on runtime/browser instrumentation and may not be directly comparable across heterogeneous tool environments.

---

## 15. Summary of Findings

This evaluation demonstrates that the proposed system provides strong compactness characteristics across multiple datasets and graph sizes. The system generally achieves lower layout area and higher node density compared to baseline tools, while maintaining acceptable levels of crossings and overlaps. Performance metrics indicate that the system is competitive for small and medium graphs and remains feasible for larger graphs.

The combination of deterministic layout, compact spacing, and preprocessing (literal collapse, edge merge) contributes to the observed compactness gains. These findings support the thesis hypothesis that compact, deterministic RDF visualization can provide strong advantages for documentation, teaching, and reproducible analysis.

---

## Appendix: Checklist for Final Evaluation

- [ ] Fill all placeholders with measured values.
- [ ] Replace [TOOL_*] and [DATASET_*] with actual names and versions.
- [ ] Insert figures and captions.
- [ ] Populate tables with CSV data.
- [ ] Double-check consistency between metrics and narrative.
- [ ] Update threats to validity with tool-specific issues.
- [ ] Fill peak memory usage values and document the measurement method.
- [ ] Fill stability table (std dev + determinism error rate) from repeated runs.
