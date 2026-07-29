# Yggnet

**Yggnet** (pronounced _IG-net_) is a **3D open-world abstract graph** explorer and pathfinder.

Named after Yggdrasil — the world-tree as a navigable **net** of relations.

- **Explore** — RTS / SimCity bird’s-eye view
- **Directions** — Google-style A→B path travel
- **Analyze** — algorithms with cached step traces
- **Manager** — simple, clean, modern CRUD alongside the world

## Stack

SvelteKit · Threlte (Three.js) · TypeScript · plain CSS variables · Vercel (static SPA)

## Develop

```bash
npm install
npx playwright install chromium
npm run dev
```

```bash
npm run test:coverage   # unit + ≥90% on src/lib/graph/**
npm run test:e2e        # Playwright
npm run check
npm run lint
```

## Process

Spec-driven (`SPEC-XXX`) · TDD · Git Flow (`develop` / `main`) · in-repo Kanban (`backlog/`)

See [CONTRIBUTING.md](./CONTRIBUTING.md), [AGENTS.md](./AGENTS.md), and [docs/vision.md](./docs/vision.md).

## License

[MIT](./LICENSE)
