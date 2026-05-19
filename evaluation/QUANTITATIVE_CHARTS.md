# Quantitative Charts (Section 8)

Use the following chart files in Section 8 (Quantitative Results):

1. **Chart 8.1** Mean layout area by tool  
   File: `evaluation/figures/quant_charts/chart-8-1-mean-area-by-tool.svg`
2. **Chart 8.2** Mean node density by tool  
   File: `evaluation/figures/quant_charts/chart-8-2-mean-density-by-tool.svg`
3. **Chart 8.3** Mean edge length by tool  
   File: `evaluation/figures/quant_charts/chart-8-3-mean-edge-length-by-tool.svg`
4. **Chart 8.4** Mean edge crossings by tool  
   File: `evaluation/figures/quant_charts/chart-8-4-mean-crossings-by-tool.svg`
5. **Chart 8.5** Mean node overlaps by tool  
   File: `evaluation/figures/quant_charts/chart-8-5-mean-overlaps-by-tool.svg`
6. **Chart 8.6** Mean layout time by tool  
   File: `evaluation/figures/quant_charts/chart-8-6-mean-layout-time-by-tool.svg`
7. **Chart 8.7** Mean peak memory by tool  
   File: `evaluation/figures/quant_charts/chart-8-7-mean-peak-memory-by-tool.svg`
8. **Chart 8.8** Determinism error rate by tool  
   File: `evaluation/figures/quant_charts/chart-8-8-determinism-error-rate.svg`

Regenerate charts with:

```bash
python3 evaluation/figures/build_quantitative_charts.py
```

Notes:
- These charts are generated from the current Section 8 table values.
- If table numbers change, regenerate the charts.
