import React from 'react'

export default function AppHeader() {
  return (
    <header className="text-center mb-12">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-200">Thesis Prototype</p>
      <h1 className="text-4xl md:text-5xl font-bold mt-3 bg-gradient-to-r from-sky-400 via-teal-300 to-amber-200 text-transparent bg-clip-text drop-shadow-sm">
        RDF Static Visualization
      </h1>
      <p className="text-slate-200 mt-3 max-w-3xl mx-auto">
        Configurable, compact, deterministic SVGs for RDF subgraphs — designed for documentation, teaching, and reproducible analysis.
      </p>
    </header>
  )
}
