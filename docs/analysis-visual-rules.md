# Analysis visual rules

This document is the shared visual contract for every Analyze algorithm. Algorithms emit semantic
roles and real graph IDs only. They must never choose colors, meshes, timing, or fabricate geometry;
the shared world renderer owns those decisions.

## Role contract

| Semantic role  | Meaning                                           | Result/Trace treatment                                                 |
| -------------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| `current`      | Node currently being processed                    | Bright cyan, solid pulsing glyph                                       |
| `frontier`     | Discovered work waiting to be processed           | Violet, thin wireframe glyph                                           |
| `inspecting`   | Node or stored edge currently being considered    | Amber, brief pulse on the real node/edge                               |
| `revisited`    | A walk reaches an already visited node            | Orange, double-ring pulse                                              |
| `settled`      | Completed exploration footprint                   | Muted orange, static glyph                                             |
| `active`       | The node/edge for the currently timed Reveal step | Muted orange; transient, then settles                                  |
| `result`       | Explicit successful-result role in Trace          | Green; only explicit Reveal emphasis replays a path in green           |
| `component-N`  | Persistent numbered component membership          | Stable shared palette slot `N`                                         |
| `color-N`      | Persistent numbered color-class membership        | Stable shared color-class palette slot `N`                             |
| `critical`     | Critical finding or warning edge/node             | Dedicated red/pink warning treatment                                   |
| `rejected`     | Rejected candidate in Trace                       | Muted red/pink, temporary only                                         |
| ranking result | Relative node importance                          | Shared result ring with score-driven scale and an exact Result ranking |

Start and End landmarks always render above every role and remain distinct by geometry, not color alone.

### Role resolution, colors, and precedence

- The renderer's Trace role priority is `result` > `current` > `inspecting` > `frontier` >
  `settled` > `rejected`. Roles outside that list retain their emitted order. Start/End landmark
  glyphs are drawn in a separate layer above this priority.
- For Reveal, the node or edge belonging to the currently timed step is transient `active` orange;
  after the step it retains its explicit persistent role (if any) or resolves to `settled` orange.
  `revisit-node` temporarily resolves to `revisited`, then returns to the accumulated settled
  footprint. Explicit path-emphasis actions resolve to green `result`.
- Shared role colors are: current/start-side/source `#67e8f9`, frontier `#a78bfa`, inspecting
  `#fbbf24`, settled/active/revisited `#f0a65a`, result `#4ade80`, target-side `#f472b6`, critical
  `#f43f5e`, and rejected/fallback warning `#ef6b73`. The revisit pulse's outer ring uses
  `#fb923c`.
- Component and color-class roles share the same six-color palette, in role-suffix order:
  `#60a5fa`, `#a78bfa`, `#34d399`, `#fbbf24`, `#fb7185`, `#22d3ee`, repeating every six slots.
  The numeric role suffix is zero-based: `component-0` / `color-0` is displayed as Component 1 /
  Color 1 and selects the first palette color. Display numbering is one-based; keep that mapping
  consistent in world decorations, Result swatches, and accessible labels.
- The `walk`, `start-side`, and `target-side` Reveal action roles are animation cues, not new
  persistent result categories. `walk` resolves to the ordinary settled footprint; start-side and
  target-side distinguish the two active Bidirectional BFS waves (cyan and pink respectively).
- Do not introduce undeclared algorithm-specific colors or geometry. Add new semantic roles here
  and to renderer-policy tests before using them.

### Landmarks and ranking scale

- Start is a cyan octahedron; End is a camera-facing pink filled center with two concentric rings.
  A node serving as both is a white combined octahedron/ring marker. Their larger glyph scales are
  1.9 for Start or End and 2.05 for the combined marker. These shapes and high contrast, not color
  alone, identify endpoints.
- Ranking scores are clamped to `[0, 1]`. Ring scale is `1 + 0.9 × score`, so it ranges from 1.0
  to 1.9. Ring color interpolates in two equal score intervals: dark red `#7f1d1d` at 0, yellow
  `#facc15` at 0.5, and bright green `#4ade80` at 1.
- The hovered ranking card is camera-facing at the node center, layered in front of the ring, and
  content-fitted. It shows `label · Rank N · score`, formatting the hover score to four decimal
  places; the accessible Result ranking table retains the artifact's exact score value.

## Persistent-result rules

- Explicit successful structures—returned paths, spanning trees, matchings, positive-flow edges,
  and exact node-set optima—use persistent green emphasis. They take priority over ordinary
  traversal decoration, but never over Start/End landmarks.
- Component membership uses `component-N`: Component 1 always maps to palette slot 1, Component 2
  to slot 2, across Connected, Weakly Connected, and Strongly Connected Components.
- Color-class membership uses `color-N`: Color 1 always maps to color-class slot 1 across
  Bipartite Check, Greedy, Welsh-Powell, and DSATUR Coloring. This is distinct from component
  membership even when palette hues overlap.
- Critical findings use `critical` and retain the dedicated warning treatment for bridges,
  articulation points, and directed-cycle findings.
- Ranking analyses retain a shared result-ring treatment. Ring size is derived only from the
  normalized score in the ranking artifact; equal scores receive equal scale. Centrality color uses
  a perceptual three-stop scale: dark red `#7f1d1d` at score 0, yellow `#facc15` at score 0.5, and
  bright green `#4ade80` at score 1. The Result lists the exact score and stable rank, so size and
  color are never the sole meaning.
- Ranking order is score descending, with stored node order as the deterministic tie-breaker.
- Hovering a ranked node in Result shows a non-interactive, camera-facing card at the node center
  with its label, ordinal rank, and score to four decimal places. Its dark, content-fitted
  background is rendered in front of the ranking ring; it disappears on pointer leave. The Result
  table preserves the exact ranking artifact values.
- Persistent result roles do not change the graph's base mesh, edge data, selection, persistence, or
  undo history.

## Reveal rules

- Mode-capable DFS and Depth-Limited DFS name their single Reveal phase `traverse` in Traverse mode
  and `search` in Search mode. These phase IDs are traceability metadata only; they do not change
  visual treatment. IDDFS names each repeated depth pass `depth-N`, matching the visible restart
  sequence; its final Result metrics remain those of the found depth or completed exploration, not
  the currently animated pass.
- Every Reveal step is one node or one real edge at 50 ms per step. Separate phases pause for
  200 ms; this is how IDDFS makes each depth restart perceptible. Reduced motion skips timing and
  pulse animation but retains the final correct roles, path, landmarks, and memberships.
- Multi-source BFS starts all selected roots in the same initial wave; Bidirectional BFS shows the
  Start-side and Target-side roots/waves concurrently. Their active wave markers are cyan and pink,
  while accumulated exploration remains orange and a found path is replayed in green.
- IDDFS clears the visible footprint between depth passes and replays the traversal from depth 0
  upward. The Result remains immutable during this animation. Random Walk reveals each actual step;
  revisits replay the incoming real edge and show the transient double-ring pulse, without a visit
  badge. The revealed footprint remains orange unless a successful Search path is explicitly replayed.
- Single-mode BFS retains its existing `traversal` phase ID; DFS and Depth-Limited DFS use the
  mode-valued `traverse` / `search` IDs above. Do not infer a different palette from phase names.
- A generic `reveal-node` or `reveal-edge` without an explicit role resolves to `settled`.
- Generic Reveal is orange throughout; it must never turn green merely because a generic action is complete.
- Green is reserved for explicit returned-path emphasis actions.
- Persistent component and critical roles survive Reveal completion. Temporary Current, Frontier,
  Inspecting, and Revisited states resolve to the settled footprint after they are no longer active.
- Final MST tree edges/nodes and explicit shortest-path emphasis are persistent successful-result
  artifacts; candidate, rejected, frontier, and inspection states remain temporary.
- Maximum-flow Reveal may inspect only real stored edges; internal reverse residual arcs appear in
  Trace data only and never create graph geometry. Positive-flow edges replay as explicit green
  success emphasis. Minimum-Cut edges retain the `critical` warning role, while its two partitions
  and capacity remain textually listed in Result.
- Eulerian and Hamiltonian routes replay only their returned real stored nodes and edges using
  explicit green path emphasis. Optional Start and an open route's End retain landmark precedence.
  Repeated closing nodes do not create extra geometry, and parallel edges remain distinct by stored
  edge ID. Their Trace inspectors expose route construction rather than changing persistent color:
  Eulerian Trace shows the current node, remaining edges, traversal stack, and emitted route;
  Hamiltonian Trace shows evaluated DP states, the current candidate, retained parent decisions,
  and the reconstructed route.
- Maximum Clique, Maximum Independent Set, and Minimum Vertex Cover use persistent green result
  rings for returned members. Candidate, bound, pruning, and rejected-set work is Trace-only or
  temporary. A successful empty set has no persistent footprint and is identified textually in
  Result; it is not `No result`. Clique and Independent Set Trace show current/candidate/best sets
  and the branch upper bound. Vertex Cover Trace shows forced nodes, the current cover, the next
  uncovered real edge, the cover bound, pruning, and the best cover found so far.
- Exact Hamiltonian and exact node-set analyses above 20 nodes use the standard prominent
  `No result` surface explaining the responsiveness limit and leave no graph footprint.
- Node Eccentricity uses the shared score-driven ranking rings and lists exact unweighted hop
  eccentricities in an accessible table. Diameter replays one deterministic real witness path in
  green; Graph Center retains green result rings. Radius and Density are scalar results, while
  Degree Distribution is tabular; those three intentionally create no persistent graph footprint.
- Girth replays one deterministic shortest real cycle in green. Tree/Forest Detection uses stable
  `component-N` roles for Tree and Forest results; a `Neither` result retains one deterministic
  real cycle with the `critical` warning treatment and an explicit Critical legend.
- Louvain and Label Propagation use the shared `component-N` palette for persistent community
  membership. Their Result names each community and lists its members; weights are interpreted as
  nonnegative connection strengths and modularity is reported numerically.
- Traveling Salesman and Chinese Postman use the explicit green route replay. Every route segment
  maps to a stored edge; repeated edge IDs in Chinese Postman mean an intentional extra traversal,
  not fabricated graph geometry. Candidate and shortest-path work stays temporary/Trace-only.
- Planarity Test has no persistent graph footprint. Planar Embedding reports a per-node cyclic
  edge-incidence order in the generic table and does not alter saved positions or graph geometry.
  The rotation system includes every stored parallel edge and lists a self-loop twice at its node,
  representing its two real incidences. Both analyses use the deterministic left-right planarity
  core; Trace names DFS orientations, low-point decisions, conflict constraints, and embedding
  completion without adding visual roles.
- Whole-graph distance metrics reject disconnected graphs instead of displaying infinity. All
  structural distance values are unweighted hop counts; edge weights and positions do not affect
  them.
- A successful cycle-detection run with no findings has no warning footprint; an ineligible or
  no-result run has no final result footprint unless its algorithm explicitly retained explored work.
- Each timed Reveal step marks exactly one node or one real stored edge. Existing shared timing and
  reduced-motion behavior apply unchanged.

## Safety and accessibility

- Every displayed edge references an existing graph edge and uses its stored endpoints.
- A color never carries meaning alone: Result/Trace names memberships, paths, and critical findings.
- Ranking scale is accompanied by an accessible ordered ranking with exact values. Component and
  warning legends likewise name their meaning without relying on hue or shape alone.
- Component palette assignment is index-based: Component 1 always uses palette slot 1 across all
  component algorithms, Component 2 slot 2, and so on.
- Decorations are session-only, non-interactive, and never mutate persisted graph data.

## Result artifact presentation

- Result and Trace tabs and their legends stay pinned. When the panel reaches its available
  viewport height, only the content body scrolls; otherwise the panel grows to fit its contents.
- Result artifacts are collapsed by default to keep long results scannable. Their disclosure state
  is retained while switching between Result and Trace during the same run, then reset for a new
  analysis result.
- Partition artifacts use a small heading for each named group followed by its members. If group
  colors are meaningful, show the matching palette swatch in the group heading and retain textual
  names and membership counts.
- Ranking and map-like artifacts use accessible tables with clear column headers and exact values.
  Wide tables may scroll horizontally without resizing the whole panel.
- Status surfaces distinguish ineligible/rejected results from valid analyses with no result; both
  use readable foreground/background contrast and explicit text labels.

## Implementation boundary

Use `src/lib/world/analysis-decoration.ts` as the policy implementation and test surface. New
algorithms may introduce a semantic role only after documenting its persistent/temporary lifetime,
accessible Result label, color/glyph treatment, precedence relative to landmarks/path/component/
critical roles, and reduced-motion behavior.

## Required update for every new algorithm

Every new Analyze algorithm must review this document as part of its spec and implementation.

- If it uses only existing roles and artifact presentation, its spec/tasks must state which existing
  rules it follows and tests must cover the applicable final and temporary states.
- If it adds a role, artifact presentation, result precedence, reveal behavior, or changes an
  existing visual meaning, this document and its renderer-policy tests must be updated in the same
  change before delivery.
- A new algorithm is incomplete if its Result/Trace/Reveal visual semantics are undocumented here.
