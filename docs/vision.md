# Vision — Yggnet

Yggnet (IG-net) is a **3D open-world abstract graph** tool: any graph (org, family, roadmap, learning map, …) lives in space you survey and navigate.

## Product locks

- **Explore:** RTS / SimCity bird’s-eye (not FPS cockpit)
- **Directions:** Google-style A→B; follow-edge = one-hop
- **UI/UX:** simple, clean, modern; technical path look
- **Dual UI:** manager CRUD + world
- **Algorithms:** result first; **cached step traces**; stale on edit; extensive picker over time
- **Workers later:** `AlgorithmRunner` + serializable snapshots from day one

## Stack

SvelteKit + Threlte + TypeScript · custom `src/lib/graph` · plain CSS variables · Vercel (static SPA) · MIT · Playwright from day one · no GitHub Actions for now

## Process (summary)

Spec-driven `SPEC-XXX` · TDD · Git Flow · Kanban in `backlog/` · SemVer on release (sequential bumps in merge-to-develop order; `none` allowed)

Full feature inventory lives on the [backlog board](../backlog/board.md) (`ITEM-001`…). Process detail: CONTRIBUTING, ADRs, and backlog templates.
