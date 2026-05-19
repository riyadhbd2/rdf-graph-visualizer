# Evaluation Section Template

## Evaluation Setup
- Datasets and sampling strategy (reference DATASETS.md).
- Size tiers (small, medium, large) and node/edge counts.
- Tools compared and configurations (reference COMPARISON_MATRIX.md).
- Layout determinism and number of runs.

## Metrics
- Compactness metrics: area, density, avg edge length.
- Guardrails: crossings, overlaps, aspect ratio, whitespace ratio.
- Performance: layout time, total render time.

## Results
- Table: metrics by tool and size tier (reference RESULTS_TEMPLATE.csv).
- Figures: example visualizations for each size tier.

## Discussion
- Which tool produces the most compact layouts?
- Trade-offs between compactness and readability.
- Impact of layout algorithm and label settings.

## Threats to Validity
- Sampling bias
- Tool configuration mismatch
- Non-determinism in force layouts
- Metric approximation errors

## Summary
- Key findings
- Limitations
- Future work
