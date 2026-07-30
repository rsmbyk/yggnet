# Docker

Yggnet ships as a static SPA. The image builds the app with Node, then serves `build/` with nginx.

## Requirements

- Docker Engine 24+ (or Docker Desktop)
- Docker Compose v2 (`docker compose`)

## Quick start

From the repository root:

```bash
docker compose up --build -d
```

Open [http://localhost:8080](http://localhost:8080).

Stop and remove the container:

```bash
docker compose down
```

## Image only

```bash
docker build -t yggnet:local .
docker run --rm -p 8080:80 yggnet:local
```

## Notes

- Host port **8080** maps to container port **80**. Change the left side of `ports` in `compose.yml` if needed.
- Production on Vercel still uses `@sveltejs/adapter-vercel` when `VERCEL=1`. The Docker build path uses `@sveltejs/adapter-static` (no `VERCEL` env).
- Do not bind-mount `node_modules` into the build; the image runs `npm ci` inside the build stage.
