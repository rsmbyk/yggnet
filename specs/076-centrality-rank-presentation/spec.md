---
id: SPEC-076
item: ITEM-084
type: fix
feature_area: analyze
bump: patch
status: Accepted
title: 'Centrality rank presentation'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Centrality rank presentation

- Centrality rankings retain score-scaled rings and add a stable cool/dim low-score to warm/bright
  high-score color scale.
- Hovering a ranked node in Result displays its node label, ordinal rank, and exact normalized score.
- The card is transient, non-interactive, and accessible; it disappears on pointer leave and does not
  affect selection, editing, Trace, reduced motion, or non-ranking analyses.
- Result ranking list remains the non-color/non-size equivalent.
