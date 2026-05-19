# Threats to Validity

- Sampling bias: selected subgraphs may not represent the full dataset.
- Configuration mismatch: tools may not support identical settings.
- Non-determinism: force layouts can vary between runs.
- Metric approximation: crossings/overlaps are computed with simplified geometry.
- Hardware variability: performance metrics depend on machine load.

Mitigations:
- Use a documented, repeatable sampling method.
- Align settings and record differences in COMPARISON_MATRIX.md.
- Use multiple runs for non-deterministic layouts.
- Report approximations and thresholds used.
- Report hardware/environment for performance tests.
