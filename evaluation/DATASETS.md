# Datasets and Sampling

Suggested datasets (choose 2-3):

- LUBM (synthetic, scalable): good for size tiers and controlled tests.
- DBpedia (real-world KG): rich schema and labels.
- Wikidata (real-world KG): very large, requires sampling.

Sampling strategy (recommendation):

- Use SPARQL CONSTRUCT queries or BFS-based sampling to extract connected subgraphs.
- Ensure the same node label and predicate filters are applied across tools.
- Keep samples connected to avoid trivial layout differences.

Size tiers:

- Small: ~100 nodes, ~150-300 edges
- Medium: ~500 nodes, ~800-1500 edges
- Large: ~2000 nodes, ~3000-6000 edges

Checklist:

- [ ] Same sampling for all tools
- [ ] Same filters applied
- [ ] Same label template
