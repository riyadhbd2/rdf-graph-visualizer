#!/usr/bin/env python3
"""
Generate deterministic RDF TTL datasets for thesis screenshots/evaluation runs.

This script creates 9 files:
  - dataset_a_small.ttl / medium / large
  - dataset_b_small.ttl / medium / large
  - dataset_c_small.ttl / medium / large

The generated graphs are connected and target fixed node/edge counts.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import random


OUT_DIR = Path(__file__).resolve().parent


@dataclass(frozen=True)
class Spec:
    name: str
    nodes: int
    edges: int
    predicates: tuple[str, ...]
    seed: int


SPECS: tuple[Spec, ...] = (
    Spec("dataset_a_small", 100, 224, ("ex:knows", "ex:worksWith", "ex:linkedTo"), 101),
    Spec("dataset_a_medium", 500, 1180, ("ex:knows", "ex:worksWith", "ex:linkedTo"), 102),
    Spec("dataset_a_large", 2000, 4720, ("ex:knows", "ex:worksWith", "ex:linkedTo"), 103),
    Spec(
        "dataset_b_small",
        100,
        246,
        ("ex:relatedTo", "ex:mentions", "ex:sameTopic", "ex:connectedTo", "ex:about"),
        201,
    ),
    Spec(
        "dataset_b_medium",
        500,
        1360,
        ("ex:relatedTo", "ex:mentions", "ex:sameTopic", "ex:connectedTo", "ex:about"),
        202,
    ),
    Spec(
        "dataset_b_large",
        2000,
        5480,
        ("ex:relatedTo", "ex:mentions", "ex:sameTopic", "ex:connectedTo", "ex:about"),
        203,
    ),
    Spec(
        "dataset_c_small",
        100,
        272,
        (
            "ex:interactsWith",
            "ex:dependsOn",
            "ex:influences",
            "ex:references",
            "ex:reportsTo",
            "ex:belongsTo",
            "ex:locatedIn",
            "ex:connectedTo",
        ),
        301,
    ),
    Spec(
        "dataset_c_medium",
        500,
        1500,
        (
            "ex:interactsWith",
            "ex:dependsOn",
            "ex:influences",
            "ex:references",
            "ex:reportsTo",
            "ex:belongsTo",
            "ex:locatedIn",
            "ex:connectedTo",
        ),
        302,
    ),
    Spec(
        "dataset_c_large",
        2000,
        6200,
        (
            "ex:interactsWith",
            "ex:dependsOn",
            "ex:influences",
            "ex:references",
            "ex:reportsTo",
            "ex:belongsTo",
            "ex:locatedIn",
            "ex:connectedTo",
        ),
        303,
    ),
)


def generate_graph(spec: Spec) -> tuple[list[str], set[tuple[int, int, str]]]:
    rng = random.Random(spec.seed)
    lines: list[str] = [
        "@prefix ex:   <http://example.org/kg/> .",
        "@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .",
        "",
    ]

    # Labels (hidden as edges in this project, used for node text).
    for i in range(1, spec.nodes + 1):
        lines.append(f'ex:n{i} rdfs:label "Node {i}" .')
    lines.append("")

    edges: set[tuple[int, int, str]] = set()

    # Connected backbone: ring.
    for i in range(1, spec.nodes + 1):
        j = i + 1 if i < spec.nodes else 1
        edges.add((i, j, spec.predicates[0]))

    # Add random edges until exact target.
    while len(edges) < spec.edges:
        s = rng.randint(1, spec.nodes)
        t = rng.randint(1, spec.nodes)
        if s == t:
            continue
        p = spec.predicates[rng.randint(0, len(spec.predicates) - 1)]
        edges.add((s, t, p))

    for s, t, p in sorted(edges):
        lines.append(f"ex:n{s} {p} ex:n{t} .")

    return lines, edges


def write_spec(spec: Spec) -> None:
    lines, edges = generate_graph(spec)
    out_file = OUT_DIR / f"{spec.name}.ttl"
    out_file.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{out_file.name}: nodes={spec.nodes}, edges={len(edges)}")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for spec in SPECS:
        write_spec(spec)


if __name__ == "__main__":
    main()
