#!/usr/bin/env python3
"""
Build thesis bar charts from measured system evaluation data.

Inputs:
  - evaluation/results/system_summary.csv
  - evaluation/results/system_stability.csv

Outputs:
  - evaluation/figures/system_quant_charts/*.svg
  - evaluation/figures/SYSTEM_QUANT_CHARTS.md
"""

from __future__ import annotations

import csv
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SUMMARY_CSV = ROOT / "evaluation" / "results" / "system_summary.csv"
STABILITY_CSV = ROOT / "evaluation" / "results" / "system_stability.csv"
OUT_DIR = ROOT / "evaluation" / "figures" / "system_quant_charts"
INDEX_MD = ROOT / "evaluation" / "figures" / "SYSTEM_QUANT_CHARTS.md"

ORDER = [
    ("A", "Small"),
    ("A", "Medium"),
    ("A", "Large"),
    ("B", "Small"),
    ("B", "Medium"),
    ("B", "Large"),
    ("C", "Small"),
    ("C", "Medium"),
    ("C", "Large"),
]

COLORS = {
    "A": "#0f766e",
    "B": "#1d4ed8",
    "C": "#d97706",
}


def to_float(value: str | None) -> float | None:
    if value is None:
        return None
    value = value.strip()
    if value == "":
        return None
    return float(value)


def load_csv(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def row_map(rows: list[dict]) -> dict[tuple[str, str], dict]:
    mapping: dict[tuple[str, str], dict] = {}
    for row in rows:
        mapping[(row["dataset"], row["size"])] = row
    return mapping


def write_bar_chart(
    filename: str,
    title: str,
    ylabel: str,
    labels: list[str],
    values: list[float],
    bar_colors: list[str],
    value_fmt: str = "{:.2f}",
) -> None:
    width = 1600
    height = 920
    m_left = 120
    m_right = 80
    m_top = 115
    m_bottom = 210
    chart_w = width - m_left - m_right
    chart_h = height - m_top - m_bottom

    max_value = max(values) if values else 1.0
    y_max = max_value * 1.15 if max_value > 0 else 1.0

    gap = 18
    n = max(1, len(values))
    bar_w = (chart_w - gap * (n + 1)) / n

    parts: list[str] = []
    parts.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">')
    parts.append(
        "<style>"
        ".title{font:700 30px 'Helvetica Neue',Arial,sans-serif;fill:#0f172a;}"
        ".subtitle{font:500 14px 'Helvetica Neue',Arial,sans-serif;fill:#64748b;}"
        ".tick{font:500 12px 'Helvetica Neue',Arial,sans-serif;fill:#475569;}"
        ".label{font:600 12px 'Helvetica Neue',Arial,sans-serif;fill:#111827;}"
        ".value{font:600 12px 'Helvetica Neue',Arial,sans-serif;fill:#111827;}"
        ".axis{font:600 14px 'Helvetica Neue',Arial,sans-serif;fill:#334155;}"
        "</style>"
    )
    parts.append('<rect x="0" y="0" width="100%" height="100%" fill="#ffffff"/>')
    parts.append(f'<text class="title" x="{m_left}" y="52">{title}</text>')
    parts.append(f'<text class="subtitle" x="{m_left}" y="80">Measured values from 5 runs per dataset-size tier.</text>')

    # Grid and y ticks.
    ticks = 5
    for i in range(ticks + 1):
        y_val = y_max * i / ticks
        y = m_top + chart_h - (y_val / y_max) * chart_h
        parts.append(f'<line x1="{m_left}" y1="{y:.2f}" x2="{width - m_right}" y2="{y:.2f}" stroke="#e2e8f0"/>')
        parts.append(f'<text class="tick" x="{m_left - 10}" y="{y + 4:.2f}" text-anchor="end">{value_fmt.format(y_val)}</text>')

    # Axes.
    parts.append(f'<line x1="{m_left}" y1="{m_top}" x2="{m_left}" y2="{m_top + chart_h}" stroke="#475569" stroke-width="1.3"/>')
    parts.append(f'<line x1="{m_left}" y1="{m_top + chart_h}" x2="{width - m_right}" y2="{m_top + chart_h}" stroke="#475569" stroke-width="1.3"/>')

    # Bars.
    for i, value in enumerate(values):
        x = m_left + gap + i * (bar_w + gap)
        h = (value / y_max) * chart_h if y_max > 0 else 0
        y = m_top + chart_h - h
        color = bar_colors[i]
        label = labels[i]
        parts.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{bar_w:.2f}" height="{h:.2f}" fill="{color}" rx="4"/>')
        parts.append(f'<text class="value" x="{x + bar_w / 2:.2f}" y="{y - 8:.2f}" text-anchor="middle">{value_fmt.format(value)}</text>')
        parts.append(
            f'<text class="label" x="{x + bar_w / 2:.2f}" y="{m_top + chart_h + 24:.2f}" text-anchor="middle" '
            f'transform="rotate(-18 {x + bar_w / 2:.2f} {m_top + chart_h + 24:.2f})">{label}</text>'
        )

    # Axis label.
    axis_x = m_left - 86
    axis_y = m_top + chart_h / 2
    parts.append(f'<text class="axis" x="{axis_x}" y="{axis_y:.2f}" transform="rotate(-90 {axis_x} {axis_y:.2f})">{ylabel}</text>')
    parts.append("</svg>")

    (OUT_DIR / filename).write_text("\n".join(parts), encoding="utf-8")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    summary_rows = row_map(load_csv(SUMMARY_CSV))
    stability_rows = row_map(load_csv(STABILITY_CSV))

    labels = [f"{d}-{s[0]}" for d, s in ORDER]
    colors = [COLORS[d] for d, _ in ORDER]

    def vals(field: str, scale: float = 1.0) -> list[float]:
        out: list[float] = []
        for key in ORDER:
            out.append(float(summary_rows[key][field]) * scale)
        return out

    # 1) Area
    write_bar_chart(
        "chart-ev-1-area-by-case.svg",
        "Chart EV-1 Layout Area by Dataset and Size",
        "Area (px^2)",
        labels,
        vals("area_px2"),
        colors,
        value_fmt="{:.0f}",
    )

    # 2) Density scaled for readability
    write_bar_chart(
        "chart-ev-2-density-by-case.svg",
        "Chart EV-2 Node Density by Dataset and Size",
        "Density (x10^-6 nodes/px^2)",
        labels,
        vals("density_nodes_per_px2", scale=1_000_000),
        colors,
        value_fmt="{:.3f}",
    )

    # 3) Average edge length
    write_bar_chart(
        "chart-ev-3-edge-length-by-case.svg",
        "Chart EV-3 Average Edge Length by Dataset and Size",
        "Average edge length (px)",
        labels,
        vals("avg_edge_len_px"),
        colors,
        value_fmt="{:.0f}",
    )

    # 4) Layout time
    write_bar_chart(
        "chart-ev-4-layout-time-by-case.svg",
        "Chart EV-4 Mean Layout Time by Dataset and Size",
        "Layout time (ms)",
        labels,
        vals("layout_time_ms"),
        colors,
        value_fmt="{:.0f}",
    )

    # 5) End-to-end time
    write_bar_chart(
        "chart-ev-5-end-to-end-time-by-case.svg",
        "Chart EV-5 Mean End-to-End Time by Dataset and Size",
        "End-to-end time (ms)",
        labels,
        vals("end_to_end_time_ms"),
        colors,
        value_fmt="{:.0f}",
    )

    # 6) Peak memory
    write_bar_chart(
        "chart-ev-6-peak-memory-by-case.svg",
        "Chart EV-6 Mean Peak Memory by Dataset and Size",
        "Peak memory (MB)",
        labels,
        vals("peak_memory_mb"),
        colors,
        value_fmt="{:.1f}",
    )

    # 7) Node overlaps where available (small+medium only)
    overlap_order = [
        ("A", "Small"),
        ("A", "Medium"),
        ("B", "Small"),
        ("B", "Medium"),
        ("C", "Small"),
        ("C", "Medium"),
    ]
    overlap_labels = [f"{d}-{s[0]}" for d, s in overlap_order]
    overlap_values = [float(summary_rows[key]["node_overlaps"]) for key in overlap_order]
    overlap_colors = [COLORS[d] for d, _ in overlap_order]
    write_bar_chart(
        "chart-ev-7-overlaps-small-medium.svg",
        "Chart EV-7 Node Overlaps (Small and Medium Tiers)",
        "Node overlap count",
        overlap_labels,
        overlap_values,
        overlap_colors,
        value_fmt="{:.0f}",
    )

    # 8) Edge crossings where available (small only)
    cross_order = [("A", "Small"), ("B", "Small"), ("C", "Small")]
    cross_labels = [f"{d}-{s[0]}" for d, s in cross_order]
    cross_values = [float(summary_rows[key]["edge_crossings"]) for key in cross_order]
    cross_colors = [COLORS[d] for d, _ in cross_order]
    write_bar_chart(
        "chart-ev-8-crossings-small.svg",
        "Chart EV-8 Edge Crossings (Small Tier)",
        "Edge crossing count",
        cross_labels,
        cross_values,
        cross_colors,
        value_fmt="{:.0f}",
    )

    # 9) Layout time standard deviation
    std_values = [float(stability_rows[key]["layout_time_std_dev"]) for key in ORDER]
    write_bar_chart(
        "chart-ev-9-layout-stddev-by-case.svg",
        "Chart EV-9 Layout Time Std Dev by Dataset and Size",
        "Layout time std dev (ms)",
        labels,
        std_values,
        colors,
        value_fmt="{:.1f}",
    )

    # 10) Determinism error rate
    det_values = [float(stability_rows[key]["determinism_error_rate_pct"]) for key in ORDER]
    write_bar_chart(
        "chart-ev-10-determinism-error-by-case.svg",
        "Chart EV-10 Determinism Error Rate by Dataset and Size",
        "Determinism error rate (%)",
        labels,
        det_values,
        colors,
        value_fmt="{:.1f}",
    )

    index_lines = [
        "# System Quantitative Charts",
        "",
        "Generated from measured data (`evaluation/results/system_summary.csv` and `evaluation/results/system_stability.csv`).",
        "",
        "- Figure EV-1: `evaluation/figures/system_quant_charts/chart-ev-1-area-by-case.svg`",
        "- Figure EV-2: `evaluation/figures/system_quant_charts/chart-ev-2-density-by-case.svg`",
        "- Figure EV-3: `evaluation/figures/system_quant_charts/chart-ev-3-edge-length-by-case.svg`",
        "- Figure EV-4: `evaluation/figures/system_quant_charts/chart-ev-4-layout-time-by-case.svg`",
        "- Figure EV-5: `evaluation/figures/system_quant_charts/chart-ev-5-end-to-end-time-by-case.svg`",
        "- Figure EV-6: `evaluation/figures/system_quant_charts/chart-ev-6-peak-memory-by-case.svg`",
        "- Figure EV-7: `evaluation/figures/system_quant_charts/chart-ev-7-overlaps-small-medium.svg`",
        "- Figure EV-8: `evaluation/figures/system_quant_charts/chart-ev-8-crossings-small.svg`",
        "- Figure EV-9: `evaluation/figures/system_quant_charts/chart-ev-9-layout-stddev-by-case.svg`",
        "- Figure EV-10: `evaluation/figures/system_quant_charts/chart-ev-10-determinism-error-by-case.svg`",
    ]
    INDEX_MD.write_text("\n".join(index_lines) + "\n", encoding="utf-8")

    print(f"Charts generated in: {OUT_DIR}")
    print(f"Index written to: {INDEX_MD}")


if __name__ == "__main__":
    main()

