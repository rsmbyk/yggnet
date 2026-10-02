---
id: SPEC-075
item: ITEM-083
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Betweenness centrality'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Betweenness centrality

- Fieldless Betweenness respects arrows; undirected edges act as two-way links; weights are ignored.
- Include all equal shortest paths and return normalized `[0,1]` scores with stable node-order ties.
- Empty graph returns `No result`; shared ranking rings/list present exact normalized scores.
