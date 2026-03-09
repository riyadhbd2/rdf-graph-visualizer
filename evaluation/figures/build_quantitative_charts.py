#!/usr/bin/env python3
"""
Generate quantitative evaluation bar charts (SVG) from current thesis table values.

Output directory:
  evaluation/figures/quant_charts/
"""

from __future__ import annotations

from pathlib import Path
from statistics import mean


OUT_DIR = Path(__file__).resolve().parent / "quant_charts"

TOOLS = [
    "This system",
    "WebVOWL",
    "LodLive",
    "GraphDB Visual Graph",
    "Protege (OntoGraf)",
    "Ontodia",
]

COLORS = {
    "This system": "#0f766e",
    "WebVOWL": "#1d4ed8",
    "LodLive": "#7c3aed",
    "GraphDB Visual Graph": "#d97706",
    "Protege (OntoGraf)": "#b91c1c",
    "Ontodia": "#374151",
}

# Compactness metrics for A/B/C x S/M/L.
COMPACTNESS = {
    "A-S": {
        "This system": dict(area=172800, density=0.000579, edge=78.6, crossings=24, overlaps=0),
        "WebVOWL": dict(area=241500, density=0.000414, edge=101.2, crossings=36, overlaps=2),
        "LodLive": dict(area=263000, density=0.000380, edge=108.5, crossings=41, overlaps=3),
        "GraphDB Visual Graph": dict(area=229000, density=0.000437, edge=95.1, crossings=33, overlaps=1),
        "Protege (OntoGraf)": dict(area=251000, density=0.000398, edge=104.0, crossings=39, overlaps=2),
        "Ontodia": dict(area=218000, density=0.000459, edge=90.4, crossings=30, overlaps=1),
    },
    "A-M": {
        "This system": dict(area=1080000, density=0.000463, edge=86.7, crossings=142, overlaps=2),
        "WebVOWL": dict(area=1520000, density=0.000329, edge=114.2, crossings=198, overlaps=8),
        "LodLive": dict(area=1660000, density=0.000301, edge=121.6, crossings=224, overlaps=12),
        "GraphDB Visual Graph": dict(area=1440000, density=0.000347, edge=108.9, crossings=186, overlaps=6),
        "Protege (OntoGraf)": dict(area=1590000, density=0.000314, edge=117.3, crossings=211, overlaps=9),
        "Ontodia": dict(area=1360000, density=0.000368, edge=103.1, crossings=173, overlaps=5),
    },
    "A-L": {
        "This system": dict(area=5320000, density=0.000376, edge=102.5, crossings=1180, overlaps=11),
        "WebVOWL": dict(area=7860000, density=0.000254, edge=136.8, crossings=1685, overlaps=38),
        "LodLive": dict(area=8520000, density=0.000235, edge=145.7, crossings=1822, overlaps=46),
        "GraphDB Visual Graph": dict(area=7420000, density=0.000270, edge=130.4, crossings=1579, overlaps=29),
        "Protege (OntoGraf)": dict(area=8160000, density=0.000245, edge=140.1, crossings=1741, overlaps=41),
        "Ontodia": dict(area=6980000, density=0.000287, edge=124.6, crossings=1498, overlaps=24),
    },
    "B-S": {
        "This system": dict(area=186000, density=0.000538, edge=84.1, crossings=31, overlaps=1),
        "WebVOWL": dict(area=257000, density=0.000389, edge=107.8, crossings=47, overlaps=3),
        "LodLive": dict(area=281000, density=0.000356, edge=115.6, crossings=53, overlaps=4),
        "GraphDB Visual Graph": dict(area=245000, density=0.000408, edge=101.5, crossings=43, overlaps=2),
        "Protege (OntoGraf)": dict(area=268000, density=0.000373, edge=110.2, crossings=50, overlaps=3),
        "Ontodia": dict(area=232000, density=0.000431, edge=97.6, crossings=39, overlaps=2),
    },
    "B-M": {
        "This system": dict(area=1180000, density=0.000424, edge=95.4, crossings=188, overlaps=4),
        "WebVOWL": dict(area=1680000, density=0.000298, edge=122.7, crossings=252, overlaps=11),
        "LodLive": dict(area=1830000, density=0.000273, edge=130.1, crossings=287, overlaps=15),
        "GraphDB Visual Graph": dict(area=1580000, density=0.000316, edge=116.8, crossings=237, overlaps=9),
        "Protege (OntoGraf)": dict(area=1750000, density=0.000286, edge=126.0, crossings=269, overlaps=13),
        "Ontodia": dict(area=1490000, density=0.000336, edge=111.2, crossings=221, overlaps=8),
    },
    "B-L": {
        "This system": dict(area=5890000, density=0.000339, edge=113.8, crossings=1510, overlaps=18),
        "WebVOWL": dict(area=8670000, density=0.000231, edge=147.2, crossings=2134, overlaps=45),
        "LodLive": dict(area=9430000, density=0.000212, edge=156.4, crossings=2290, overlaps=54),
        "GraphDB Visual Graph": dict(area=8210000, density=0.000244, edge=140.1, crossings=2011, overlaps=37),
        "Protege (OntoGraf)": dict(area=9020000, density=0.000222, edge=150.0, crossings=2198, overlaps=49),
        "Ontodia": dict(area=7730000, density=0.000259, edge=133.7, crossings=1890, overlaps=32),
    },
    "C-S": {
        "This system": dict(area=201000, density=0.000498, edge=89.7, crossings=36, overlaps=1),
        "WebVOWL": dict(area=281000, density=0.000356, edge=115.9, crossings=55, overlaps=4),
        "LodLive": dict(area=307000, density=0.000326, edge=124.8, crossings=62, overlaps=6),
        "GraphDB Visual Graph": dict(area=268000, density=0.000373, edge=110.6, crossings=50, overlaps=3),
        "Protege (OntoGraf)": dict(area=292000, density=0.000342, edge=119.4, crossings=58, overlaps=5),
        "Ontodia": dict(area=254000, density=0.000394, edge=104.2, crossings=46, overlaps=3),
    },
    "C-M": {
        "This system": dict(area=1290000, density=0.000388, edge=101.9, crossings=236, overlaps=6),
        "WebVOWL": dict(area=1850000, density=0.000270, edge=131.4, crossings=318, overlaps=14),
        "LodLive": dict(area=2020000, density=0.000248, edge=139.8, crossings=357, overlaps=19),
        "GraphDB Visual Graph": dict(area=1740000, density=0.000287, edge=125.7, crossings=296, overlaps=12),
        "Protege (OntoGraf)": dict(area=1930000, density=0.000259, edge=135.1, crossings=334, overlaps=17),
        "Ontodia": dict(area=1640000, density=0.000305, edge=119.6, crossings=279, overlaps=10),
    },
    "C-L": {
        "This system": dict(area=6580000, density=0.000304, edge=123.6, crossings=1968, overlaps=27),
        "WebVOWL": dict(area=9720000, density=0.000206, edge=159.3, crossings=2784, overlaps=63),
        "LodLive": dict(area=10580000, density=0.000189, edge=169.2, crossings=2991, overlaps=74),
        "GraphDB Visual Graph": dict(area=9210000, density=0.000217, edge=151.7, crossings=2610, overlaps=55),
        "Protege (OntoGraf)": dict(area=10120000, density=0.000198, edge=162.6, crossings=2862, overlaps=69),
        "Ontodia": dict(area=8670000, density=0.000231, edge=145.2, crossings=2451, overlaps=47),
    },
}

# Performance metrics for A/B/C x S/M/L.
PERFORMANCE = {
    "A-S": {
        "This system": dict(layout=95, total=260, memory=220),
        "WebVOWL": dict(layout=140, total=360, memory=300),
        "LodLive": dict(layout=170, total=420, memory=340),
        "GraphDB Visual Graph": dict(layout=120, total=300, memory=280),
        "Protege (OntoGraf)": dict(layout=155, total=390, memory=330),
        "Ontodia": dict(layout=130, total=330, memory=290),
    },
    "A-M": {
        "This system": dict(layout=410, total=980, memory=420),
        "WebVOWL": dict(layout=690, total=1530, memory=620),
        "LodLive": dict(layout=820, total=1830, memory=700),
        "GraphDB Visual Graph": dict(layout=560, total=1260, memory=560),
        "Protege (OntoGraf)": dict(layout=760, total=1700, memory=680),
        "Ontodia": dict(layout=620, total=1410, memory=590),
    },
    "A-L": {
        "This system": dict(layout=1810, total=3980, memory=1010),
        "WebVOWL": dict(layout=3140, total=6410, memory=1560),
        "LodLive": dict(layout=3660, total=7280, memory=1740),
        "GraphDB Visual Graph": dict(layout=2580, total=5220, memory=1390),
        "Protege (OntoGraf)": dict(layout=3420, total=6870, memory=1680),
        "Ontodia": dict(layout=2870, total=5710, memory=1470),
    },
    "B-S": {
        "This system": dict(layout=118, total=305, memory=250),
        "WebVOWL": dict(layout=175, total=430, memory=350),
        "LodLive": dict(layout=210, total=510, memory=390),
        "GraphDB Visual Graph": dict(layout=150, total=360, memory=320),
        "Protege (OntoGraf)": dict(layout=190, total=470, memory=380),
        "Ontodia": dict(layout=162, total=390, memory=335),
    },
    "B-M": {
        "This system": dict(layout=505, total=1210, memory=480),
        "WebVOWL": dict(layout=840, total=1830, memory=710),
        "LodLive": dict(layout=980, total=2120, memory=790),
        "GraphDB Visual Graph": dict(layout=710, total=1510, memory=650),
        "Protege (OntoGraf)": dict(layout=910, total=1980, memory=770),
        "Ontodia": dict(layout=770, total=1650, memory=680),
    },
    "B-L": {
        "This system": dict(layout=2260, total=4720, memory=1140),
        "WebVOWL": dict(layout=3740, total=7410, memory=1830),
        "LodLive": dict(layout=4280, total=8260, memory=2010),
        "GraphDB Visual Graph": dict(layout=3190, total=6120, memory=1610),
        "Protege (OntoGraf)": dict(layout=4060, total=7920, memory=1950),
        "Ontodia": dict(layout=3450, total=6690, memory=1700),
    },
    "C-S": {
        "This system": dict(layout=136, total=352, memory=275),
        "WebVOWL": dict(layout=195, total=470, memory=380),
        "LodLive": dict(layout=235, total=560, memory=430),
        "GraphDB Visual Graph": dict(layout=165, total=395, memory=350),
        "Protege (OntoGraf)": dict(layout=210, total=520, memory=420),
        "Ontodia": dict(layout=178, total=420, memory=365),
    },
    "C-M": {
        "This system": dict(layout=610, total=1450, memory=560),
        "WebVOWL": dict(layout=930, total=2060, memory=780),
        "LodLive": dict(layout=1090, total=2360, memory=870),
        "GraphDB Visual Graph": dict(layout=790, total=1700, memory=720),
        "Protege (OntoGraf)": dict(layout=1010, total=2230, memory=850),
        "Ontodia": dict(layout=860, total=1860, memory=750),
    },
    "C-L": {
        "This system": dict(layout=2840, total=5890, memory=1360),
        "WebVOWL": dict(layout=4210, total=8240, memory=1980),
        "LodLive": dict(layout=4820, total=9230, memory=2190),
        "GraphDB Visual Graph": dict(layout=3600, total=6920, memory=1760),
        "Protege (OntoGraf)": dict(layout=4540, total=8800, memory=2120),
        "Ontodia": dict(layout=3910, total=7460, memory=1860),
    },
}

# Determinism error rates from stability tables.
DETERMINISM_RATE = {
    "This system": 0.0,
    "WebVOWL": 100.0,
    "LodLive": 100.0,
    "GraphDB Visual Graph": 80.0,
    "Protege (OntoGraf)": 100.0,
    "Ontodia": 80.0,
}


def collect_means(source: dict, key: str) -> list[tuple[str, float]]:
    rows: list[tuple[str, float]] = []
    for tool in TOOLS:
        values = [source[s][tool][key] for s in source]
        rows.append((tool, mean(values)))
    return rows


def write_bar_chart(
    filename: str,
    title: str,
    ylabel: str,
    data: list[tuple[str, float]],
    value_fmt: str = "{:.2f}",
    y_ticks: int = 5,
) -> None:
    width, height = 1500, 900
    m_left, m_right, m_top, m_bottom = 120, 80, 110, 190
    chart_w = width - m_left - m_right
    chart_h = height - m_top - m_bottom

    max_value = max(v for _, v in data)
    if max_value <= 0:
        max_value = 1.0
    y_max = max_value * 1.12

    bar_gap = 26
    n = len(data)
    bar_w = (chart_w - bar_gap * (n + 1)) / n

    parts: list[str] = []
    parts.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">'
    )
    parts.append(
        "<style>"
        ".title{font:700 30px 'Helvetica Neue',Arial,sans-serif;fill:#0f172a;}"
        ".axis{font:500 14px 'Helvetica Neue',Arial,sans-serif;fill:#334155;}"
        ".tick{font:500 12px 'Helvetica Neue',Arial,sans-serif;fill:#475569;}"
        ".label{font:600 13px 'Helvetica Neue',Arial,sans-serif;fill:#111827;}"
        ".value{font:600 12px 'Helvetica Neue',Arial,sans-serif;fill:#0f172a;}"
        ".subtitle{font:500 13px 'Helvetica Neue',Arial,sans-serif;fill:#64748b;}"
        "</style>"
    )
    parts.append('<rect x="0" y="0" width="100%" height="100%" fill="#ffffff"/>')
    parts.append(f'<text class="title" x="{m_left}" y="52">{title}</text>')
    parts.append(
        f'<text class="subtitle" x="{m_left}" y="78">Derived from current quantitative tables (A/B/C x Small/Medium/Large).</text>'
    )

    # Grid + Y ticks.
    for i in range(y_ticks + 1):
        yv = y_max * i / y_ticks
        py = m_top + chart_h - (yv / y_max) * chart_h
        parts.append(f'<line x1="{m_left}" y1="{py:.2f}" x2="{width - m_right}" y2="{py:.2f}" stroke="#e2e8f0" />')
        parts.append(f'<text class="tick" x="{m_left - 10}" y="{py + 4:.2f}" text-anchor="end">{value_fmt.format(yv)}</text>')

    # Axes.
    parts.append(
        f'<line x1="{m_left}" y1="{m_top + chart_h}" x2="{width - m_right}" y2="{m_top + chart_h}" stroke="#475569" stroke-width="1.2"/>'
    )
    parts.append(
        f'<line x1="{m_left}" y1="{m_top}" x2="{m_left}" y2="{m_top + chart_h}" stroke="#475569" stroke-width="1.2"/>'
    )

    # Bars.
    for i, (label, value) in enumerate(data):
        x = m_left + bar_gap + i * (bar_w + bar_gap)
        h = (value / y_max) * chart_h
        y = m_top + chart_h - h
        color = COLORS.get(label, "#334155")
        parts.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{bar_w:.2f}" height="{h:.2f}" fill="{color}" rx="4"/>')
        parts.append(f'<text class="value" x="{x + bar_w / 2:.2f}" y="{y - 8:.2f}" text-anchor="middle">{value_fmt.format(value)}</text>')
        parts.append(
            f'<text class="label" x="{x + bar_w / 2:.2f}" y="{m_top + chart_h + 24:.2f}" text-anchor="middle" '
            f'transform="rotate(-20 {x + bar_w / 2:.2f} {m_top + chart_h + 24:.2f})">{label}</text>'
        )

    # Axis label.
    parts.append(f'<text class="axis" x="{m_left - 85}" y="{m_top + chart_h / 2:.2f}" transform="rotate(-90 {m_left - 85} {m_top + chart_h / 2:.2f})">{ylabel}</text>')

    parts.append("</svg>")
    (OUT_DIR / filename).write_text("\n".join(parts), encoding="utf-8")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    avg_area = collect_means(COMPACTNESS, "area")
    avg_density = collect_means(COMPACTNESS, "density")
    avg_edge = collect_means(COMPACTNESS, "edge")
    avg_crossings = collect_means(COMPACTNESS, "crossings")
    avg_overlaps = collect_means(COMPACTNESS, "overlaps")
    avg_layout = collect_means(PERFORMANCE, "layout")
    avg_memory = collect_means(PERFORMANCE, "memory")
    det_rate = [(tool, DETERMINISM_RATE[tool]) for tool in TOOLS]

    # Scale density for readability.
    avg_density_scaled = [(tool, value * 1_000_000) for tool, value in avg_density]

    write_bar_chart(
        "chart-8-1-mean-area-by-tool.svg",
        "Chart 8.1 Mean Layout Area by Tool",
        "Area (px^2)",
        avg_area,
        value_fmt="{:.0f}",
    )
    write_bar_chart(
        "chart-8-2-mean-density-by-tool.svg",
        "Chart 8.2 Mean Node Density by Tool",
        "Density (x10^-6 nodes/px^2)",
        avg_density_scaled,
        value_fmt="{:.1f}",
    )
    write_bar_chart(
        "chart-8-3-mean-edge-length-by-tool.svg",
        "Chart 8.3 Mean Edge Length by Tool",
        "Average edge length (px)",
        avg_edge,
        value_fmt="{:.1f}",
    )
    write_bar_chart(
        "chart-8-4-mean-crossings-by-tool.svg",
        "Chart 8.4 Mean Edge Crossings by Tool",
        "Crossings (count)",
        avg_crossings,
        value_fmt="{:.0f}",
    )
    write_bar_chart(
        "chart-8-5-mean-overlaps-by-tool.svg",
        "Chart 8.5 Mean Node Overlaps by Tool",
        "Overlaps (count)",
        avg_overlaps,
        value_fmt="{:.1f}",
    )
    write_bar_chart(
        "chart-8-6-mean-layout-time-by-tool.svg",
        "Chart 8.6 Mean Layout Time by Tool",
        "Layout time (ms)",
        avg_layout,
        value_fmt="{:.0f}",
    )
    write_bar_chart(
        "chart-8-7-mean-peak-memory-by-tool.svg",
        "Chart 8.7 Mean Peak Memory by Tool",
        "Peak memory (MB)",
        avg_memory,
        value_fmt="{:.0f}",
    )
    write_bar_chart(
        "chart-8-8-determinism-error-rate.svg",
        "Chart 8.8 Determinism Error Rate by Tool",
        "Determinism error rate (%)",
        det_rate,
        value_fmt="{:.0f}",
    )

    print("Generated charts in:", OUT_DIR)


if __name__ == "__main__":
    main()
