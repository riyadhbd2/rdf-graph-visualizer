#!/usr/bin/env python3
"""
Builds Figure 10 SVG panels from raw screenshots.

Input directory:
  evaluation/figures/figure10_raw/

Output directory:
  evaluation/figures/figure10_final/
"""

from pathlib import Path


BASE = Path(__file__).resolve().parent
RAW_DIR = BASE / "figure10_raw"
OUT_DIR = BASE / "figure10_final"


def svg_header(width: int, height: int) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}">\n'
        '<style>\n'
        '  .title { font: 700 22px "Helvetica Neue", Arial, sans-serif; fill: #0f172a; }\n'
        '  .label { font: 600 14px "Helvetica Neue", Arial, sans-serif; fill: #1e293b; }\n'
        '  .hint { font: 500 12px "Helvetica Neue", Arial, sans-serif; fill: #475569; }\n'
        '  .frame { fill: #f8fafc; stroke: #cbd5e1; stroke-width: 2; }\n'
        '</style>\n'
    )


def image_panel(x: int, y: int, w: int, h: int, label: str, raw_name: str) -> str:
    raw_path = f"../figure10_raw/{raw_name}"
    return (
        f'<rect class="frame" x="{x}" y="{y}" width="{w}" height="{h}" rx="10"/>\n'
        f'<image href="{raw_path}" x="{x + 8}" y="{y + 26}" width="{w - 16}" height="{h - 34}" '
        'preserveAspectRatio="xMidYMid meet"/>\n'
        f'<text class="label" x="{x + 10}" y="{y + 18}">{label}</text>\n'
    )


def write_fig_10_1():
    width, height = 1900, 1260
    panel_w, panel_h = 600, 560
    gap_x, gap_y = 30, 30
    x0, y0 = 20, 70

    cells = [
        ("(a) This system", "a_small_system.png"),
        ("(b) WebVOWL", "a_small_webvowl.png"),
        ("(c) LodLive", "a_small_lodlive.png"),
        ("(d) GraphDB Visual Graph", "a_small_graphdb.png"),
        ("(e) Protégé (OntoGraf)", "a_small_protege_ontograf.png"),
        ("(f) Ontodia", "a_small_ontodia.png"),
    ]

    parts = [svg_header(width, height)]
    parts.append(
        '<text class="title" x="20" y="38">Figure 10.1: Dataset A (LUBM, Small) compactness comparison across tools</text>\n'
    )

    for i, (label, raw_name) in enumerate(cells):
        row, col = divmod(i, 3)
        x = x0 + col * (panel_w + gap_x)
        y = y0 + row * (panel_h + gap_y)
        parts.append(image_panel(x, y, panel_w, panel_h, label, raw_name))

    parts.append("</svg>\n")
    (OUT_DIR / "figure-10-1-comparison-a-small.svg").write_text("".join(parts), encoding="utf-8")


def write_single_figure(filename: str, title: str, label: str, raw_name: str):
    width, height = 1400, 900
    parts = [svg_header(width, height)]
    parts.append(f'<text class="title" x="20" y="38">{title}</text>\n')
    parts.append(image_panel(20, 70, 1360, 800, label, raw_name))
    parts.append("</svg>\n")
    (OUT_DIR / filename).write_text("".join(parts), encoding="utf-8")


def ensure_dirs():
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)


def main():
    ensure_dirs()
    write_fig_10_1()
    write_single_figure(
        "figure-10-2-a-medium-system.svg",
        "Figure 10.2: Dataset A (LUBM, Medium), system output",
        "(a) This system",
        "a_medium_system.png",
    )
    write_single_figure(
        "figure-10-3-a-medium-webvowl.svg",
        "Figure 10.3: Dataset A (LUBM, Medium), WebVOWL output",
        "(a) WebVOWL",
        "a_medium_webvowl.png",
    )
    write_single_figure(
        "figure-10-4-b-large-system.svg",
        "Figure 10.4: Dataset B (DBpedia, Large), system output",
        "(a) This system",
        "b_large_system.png",
    )
    write_single_figure(
        "figure-10-5-c-large-graphdb.svg",
        "Figure 10.5: Dataset C (Wikidata, Large), GraphDB Visual Graph output",
        "(a) GraphDB Visual Graph",
        "c_large_graphdb.png",
    )
    print("Templates generated in:", OUT_DIR)
    print("Put raw screenshots in:", RAW_DIR)


if __name__ == "__main__":
    main()
