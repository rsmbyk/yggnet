---
id: SPEC-073
item: ITEM-081
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Degree centrality'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Degree centrality

- Fieldless analysis returns each node's in-degree, out-degree, and total degree; undirected edges
  contribute to both in and out.
- Total degree determines normalized `[0,1]` ranking scale; stored node order breaks equal scores.
- Empty graph returns `No result`; weights are ignored.
- Result uses shared scaled ranking rings plus accessible exact values.
