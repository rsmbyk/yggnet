---
id: SPEC-078
item: ITEM-086
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Hopcroft-Karp matching'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Hopcroft-Karp matching

- **Status:** Accepted

## Intent

Find a maximum number of non-overlapping node pairs in a bipartite graph.

## Scope

**In:** one fieldless Hopcroft-Karp Analyze definition; deterministic inferred bipartition; standard
matching `edge-set` Result; BFS/DFS-phase Trace and Reveal; domain, UI/world, and Playwright
coverage.

**Out:** weighted matching, minimum-cost matching, user-selected left/right partitions, matching on
non-bipartite graphs, graph edits, and custom panels.

## Domain rules

- Every stored edge is treated as an undirected matching candidate; direction and weight are ignored.
  Parallel edges represent one candidate pair.
- Before matching, derive a two-color bipartition across all disconnected regions using stored node
  order. A self-loop or odd cycle returns prominent `No result` explaining that Hopcroft-Karp
  requires a bipartite graph.
- Empty graphs return `No result`; isolated nodes are valid and remain unmatched.
- The stored-node-derived left/right class is stable. BFS layers and DFS candidate edges follow
  stored edge order, selecting deterministic maximum-match representatives when choices tie.
- Result emits an `edge-set` of selected stored edges and reports matching cardinality, matched-node
  count, and unmatched-node count.

## Presentation rules

- Result retains only selected matching edges and their endpoint nodes using explicit green success
  emphasis. No candidate or inferred bipartition decoration remains after completion.
- Trace exposes inferred sides, BFS layers, augmenting paths, selected pairs, and rejected or
  superseded candidates. Reveal presents actual stored candidate and augmenting edges only.
- Ineligible results have no fabricated edges or matching decoration. Existing landmark and visual
  precedence rules remain unchanged.

## Acceptance scenarios

- Given a disconnected bipartite graph with isolated nodes, the definition finds the deterministic
  maximum matching and reports unmatched nodes.
- Given multiple maximum matchings, stored edge order selects the displayed representative.
- Given directed or parallel edges, endpoint pairs are treated as undirected single candidates.
- Given an odd cycle or self-loop, the definition returns explanatory `No result` without a final
  matching footprint.
