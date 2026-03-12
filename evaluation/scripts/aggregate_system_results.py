#!/usr/bin/env python3
"""
Aggregate evaluation metrics from system run JSON files and peak memory CSV.

Inputs:
  - evaluation/results/system_runs/*.json
  - evaluation/results/peak_memory.csv

Outputs:
  - evaluation/results/system_summary.csv
  - evaluation/results/system_stability.csv
  - evaluation/results/system_overview.json
"""

from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from pathlib import Path
from statistics import mean, pstdev


ROOT = Path(__file__).resolve().parents[2]
RUNS_DIR = ROOT / "evaluation" / "results" / "system_runs"
PEAK_MEMORY_CSV = ROOT / "evaluation" / "results" / "peak_memory.csv"

SUMMARY_CSV = ROOT / "evaluation" / "results" / "system_summary.csv"
STABILITY_CSV = ROOT / "evaluation" / "results" / "system_stability.csv"
OVERVIEW_JSON = ROOT / "evaluation" / "results" / "system_overview.json"

KEY_ORDER = [
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


def load_runs() -> dict[tuple[str, str], list[dict]]:
    grouped: dict[tuple[str, str], list[tuple[int, dict]]] = defaultdict(list)
    pattern = re.compile(r"([abc])_(small|medium|large)_run(\d+)\.json$")
    for path in sorted(RUNS_DIR.glob("*.json")):
        m = pattern.match(path.name)
        if not m:
            continue
        dataset = m.group(1).upper()
        size = m.group(2).capitalize()
        run_id = int(m.group(3))
        data = json.loads(path.read_text(encoding="utf-8"))
        grouped[(dataset, size)].append((run_id, data))
    ordered: dict[tuple[str, str], list[dict]] = {}
    for key, values in grouped.items():
        ordered[key] = [data for _, data in sorted(values, key=lambda item: item[0])]
    return ordered


def load_memory() -> dict[tuple[str, str], list[float]]:
    grouped: dict[tuple[str, str], list[tuple[int, float]]] = defaultdict(list)
    if not PEAK_MEMORY_CSV.exists():
        return {}
    with PEAK_MEMORY_CSV.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            dataset = str(row.get("dataset", "")).strip().upper()
            size = str(row.get("size", "")).strip().capitalize()
            run_str = str(row.get("run", "run00")).strip().lower().replace("run", "")
            try:
                run_id = int(run_str)
                memory = float(row.get("peak_memory_mb", "nan"))
            except ValueError:
                continue
            grouped[(dataset, size)].append((run_id, memory))
    ordered: dict[tuple[str, str], list[float]] = {}
    for key, values in grouped.items():
        ordered[key] = [value for _, value in sorted(values, key=lambda item: item[0])]
    return ordered


def path_get(obj: dict, keys: list[str]):
    cur = obj
    for key in keys:
        cur = cur[key]
    return cur


def determinism_error_rate(runs: list[dict]) -> float:
    if not runs:
        return 0.0
    ref = runs[0]
    checks = [
        (["bounds", "area"], 1e-6),
        (["density"], 1e-12),
        (["avgEdgeLength"], 1e-9),
        (["nodeCount"], 0.0),
        (["edgeCount"], 0.0),
        (["edgeCrossings"], 0.0),
        (["nodeOverlaps"], 0.0),
    ]
    errors = 0
    for run in runs[1:]:
        mismatch = False
        for key_path, tol in checks:
            a = path_get(ref, key_path)
            b = path_get(run, key_path)
            if a is None or b is None:
                if a != b:
                    mismatch = True
                    break
            else:
                if abs(float(a) - float(b)) > tol:
                    mismatch = True
                    break
        if mismatch:
            errors += 1
    return 100.0 * errors / len(runs)


def summarize(runs_by_key: dict[tuple[str, str], list[dict]], mem_by_key: dict[tuple[str, str], list[float]]):
    summary_rows: list[dict] = []
    stability_rows: list[dict] = []
    overview = {"summary": [], "stability": []}

    for dataset, size in KEY_ORDER:
        runs = runs_by_key.get((dataset, size), [])
        if not runs:
            continue

        nodes = [float(run["nodeCount"]) for run in runs]
        edges = [float(run["edgeCount"]) for run in runs]
        area = [float(run["bounds"]["area"]) for run in runs]
        density = [float(run["density"]) for run in runs]
        avg_len = [float(run["avgEdgeLength"]) for run in runs]
        layout = [float(run["meta"]["layoutMs"]) for run in runs]
        preprocess = [float(run["meta"]["renderStats"]["totalMs"]) for run in runs]
        crossing = [run.get("edgeCrossings") for run in runs]
        overlap = [run.get("nodeOverlaps") for run in runs]
        cross_note = runs[0].get("edgeCrossingsNote")
        overlap_note = runs[0].get("nodeOverlapsNote")

        memory_values = mem_by_key.get((dataset, size), [])
        peak_memory = mean(memory_values) if memory_values else None

        cross_mean = None if any(v is None for v in crossing) else mean(float(v) for v in crossing)
        overlap_mean = None if any(v is None for v in overlap) else mean(float(v) for v in overlap)

        row = {
            "dataset": dataset,
            "size": size,
            "runs": len(runs),
            "nodes": round(mean(nodes)),
            "edges": round(mean(edges)),
            "area_px2": mean(area),
            "density_nodes_per_px2": mean(density),
            "avg_edge_len_px": mean(avg_len),
            "edge_crossings": cross_mean,
            "node_overlaps": overlap_mean,
            "edge_crossings_note": cross_note or "",
            "node_overlaps_note": overlap_note or "",
            "layout_time_ms": mean(layout),
            "preprocess_time_ms": mean(preprocess),
            "end_to_end_time_ms": mean(layout) + mean(preprocess),
            "peak_memory_mb": peak_memory,
        }
        summary_rows.append(row)
        overview["summary"].append(row)

        stable = {
            "dataset": dataset,
            "size": size,
            "runs": len(runs),
            "area_std_dev": pstdev(area),
            "density_std_dev": pstdev(density),
            "avg_edge_len_std_dev": pstdev(avg_len),
            "layout_time_std_dev": pstdev(layout),
            "determinism_error_rate_pct": determinism_error_rate(runs),
        }
        stability_rows.append(stable)
        overview["stability"].append(stable)

    return summary_rows, stability_rows, overview


def write_csv(path: Path, rows: list[dict]):
    if not rows:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    headers = list(rows[0].keys())
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    runs = load_runs()
    memory = load_memory()
    summary_rows, stability_rows, overview = summarize(runs, memory)

    write_csv(SUMMARY_CSV, summary_rows)
    write_csv(STABILITY_CSV, stability_rows)
    OVERVIEW_JSON.write_text(json.dumps(overview, indent=2), encoding="utf-8")

    print(f"Wrote {SUMMARY_CSV}")
    print(f"Wrote {STABILITY_CSV}")
    print(f"Wrote {OVERVIEW_JSON}")


if __name__ == "__main__":
    main()

