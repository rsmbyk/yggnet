---
id: SPEC-074
item: ITEM-082
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'PageRank centrality'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: PageRank centrality

- Fieldless PageRank respects arrows; undirected edges act as two-way links; weights are ignored.
- Use damping 0.85, tolerance 1e-6, and a bounded internal iteration guard with no user fields.
- Helper text explains link-based influence, directional flow, and the fixed defaults.
- Scores are normalized ranking values with stored node order tie-breaking; empty graph is `No result`.
