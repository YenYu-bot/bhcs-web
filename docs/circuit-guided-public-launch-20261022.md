# Circuit Guided Lab — public launch (2026-10-22)

## Owner decision and evidence

The website owner confirmed that human acceptance had passed and explicitly authorized public availability on 2026-10-22. This publication makes `tools/science/circuit-guided.html` discoverable from the science directory and learning resources page; it remains free to use without login. The established `tools/circuit-lab.html` is retained unchanged.

The previous [five-student usability gate](circuit-guided-first-time-user-gate.md) calls for anonymized participant records, iOS and Android coverage, and specific learning-outcome thresholds. Those *individual* supporting records have not been provided in this workflow, so this document does **not** claim the five-student evidence requirements were independently verified. The owner's affirmative public-release decision is recorded separately from those outstanding artifacts.

## Change boundaries

- Source of truth: `scripts/science/catalog.mjs` and `scripts/build_science.mjs`. New Guided Lab is listed alongside, not instead of, the legacy circuit tool.
- Public metadata: indexable robots directive, canonical/OG description, removed "unpublished prototype" wording, links back to science overview and learning resources.
- Generated assets: `tools/science/index.html`, `ziyuan.html` and `sitemap.xml` reflect the new public lab; resource counts must remain builder-consistent.
- Tests: `scripts/test_circuit_guided_site.mjs` now asserts the public contracts. No scientific calculation, learner input, experimental flow, progress/restore, or Notebook/Challenges logic is changed.

## Acceptance and rollback

1. Before merging, latest PR head must pass all required CI jobs, including `core`, `site`, `science-guided` and `CI Gate`, as well as builder/sitemap idempotence checks.
2. After merging, verify the new main SHA, Pages deployment, public URL, robots metadata, both resource listings, and sitemap. Search-engine indexing is separate and may take time.
3. Continue to preserve anonymous user testing notes as they become available; do not fabricate scores, participants or devices.

To roll back public discoverability, revert the publication PR (or restore `noindex`, remove guided directory references, rebuild resources and sitemap) without deleting the legacy lab.
