# Metrics Definition

Primary compactness metrics:

- Graph area: area of the bounding box (px^2) that encloses all nodes.
- Node density: nodes / area.
- Avg/median edge length: average distance between source/target node centers.

Quality guardrails:

- Edge crossings: number of intersecting edge segments (exclude shared endpoints).
- Node overlaps: count of overlapping node circles (approximate by radius overlap).
- Aspect ratio: width / height of the bounding box (extreme values reduce readability).
- Whitespace ratio: 1 - (sum of node areas / graph area).

Performance metrics (recommended):

- Layout time (ms): time spent in the layout engine.
- Total render time (ms): end-to-end time to parse, filter, build, and render.

Interpretation:

- Higher density and lower area indicate more compact layouts.
- Lower avg edge length generally indicates more compact structure.
- Crossings and overlaps should be minimized to preserve readability.
