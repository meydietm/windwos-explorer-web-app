# Windows Explorer-like Web App (Take-Home Test)

A web application that mimics core behaviors of **Windows Explorer**:
- Left panel: folder tree (unlimited depth, expand/collapse)
- Right panel: direct contents of selected folder (folders + files)
- Global search with pagination (“Load more”)
- Scalable mode: **lazy-load tree** for large datasets

Built as a monorepo with **Bun + TypeScript** on backend and **Vue 3 + Vite + TypeScript** on frontend, backed by **PostgreSQL** and **Drizzle ORM**.

---

## Tech Stack

**Backend**
- Bun + TypeScript
- Elysia (HTTP server)
- Drizzle ORM
- PostgreSQL (Docker)

**Frontend**
- Vue 3 + Vite + TypeScript
- Tailwind CSS
- Lucide icons

**Quality**
- Typecheck: `tsc` (API) + `vue-tsc` (Web)
- Unit/Component tests: Bun test (API), Vitest (Web)
- E2E tests: Playwright (full mode + lazy mode)
- CI: GitHub Actions (lint/typecheck/tests/e2e + artifacts on failure)

---

## Monorepo Structure

```
.
├─ apps/
│  ├─ api/               # Bun + Elysia API
│  └─ web/               # Vue 3 + Vite web app
├─ packages/
│  └─ shared/            # Shared DTO/types
├─ infra/                # Docker / DB related
└─ scripts/              # E2E server orchestrator, utilities
```

---

## Prerequisites

- **Bun** installed
- **Docker** installed (for PostgreSQL)

---

## Quick Start

### 1) Install dependencies
```bash
bun install
```

### 2) Start database
```bash
bun run db:up
```

### 3) Migrate + seed
```bash
bun run db:migrate
bun run db:seed
```

### 4) Run dev servers
```bash
bun run dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:3001`

---

## Demo Script (2 minutes)

A quick path to validate the key requirements:

1) **Tree + contents**
- Open `http://localhost:5173`
- Expand **This PC → Local Disk (C:) → Users → Meydie**
- Click **Downloads**
- Verify right panel shows direct folders/files + breadcrumb updates

2) **Search + open result**
- Type `report` in the top search bar (min 2 chars)
- Verify results list appears
- Click a result → app navigates to `/folders/:id` and right panel updates

3) **Load more**
- In search results, click **Load more**
- Verify total results increase (pagination works)

4) **Scalable tree (lazy mode)**
- Stop web dev server and restart with:
  ```bash
  VITE_TREE_MODE=lazy bun run --cwd apps/web dev
  ```
- Expand **This PC**
- Verify the app requests `/api/v1/folders/:id/children` (children fetched on demand)

5) **Quality gates**
- Run:
  ```bash
  bun run typecheck
  bun run test
  bun run --cwd apps/web e2e
  bun run --cwd apps/web e2e:lazy
  ```

---

## Environment Variables

### Backend (apps/api)
- `DATABASE_URL` (Postgres connection string)
- `PORT` (default 3001)

### Frontend (apps/web)
- `VITE_TREE_MODE`:
  - `full` (default): fetch full tree on load
  - `lazy`: fetch roots first, fetch children on expand (scalable)

### E2E
- `E2E_API_PORT` (default 3001)
- `E2E_WEB_PORT` (default 5173)

---

## Features

### Folder Tree (Left Panel)
- Recursive tree rendering (built from scratch, no tree UI library)
- Expand/collapse
- Unlimited nesting depth
- Selected folder highlighted
- Two modes:
  - **Full mode**: fetch full tree on load
  - **Lazy mode**: fetch roots, then fetch children on demand

### Contents (Right Panel)
- Shows **direct** subfolders + files of the selected folder
- Breadcrumb for current path
- Local (in-folder) filter + sort

### Search
- Global search for folders & files (min 2 chars)
- Pagination + “Load more”
- Clicking a search result opens the corresponding folder

---

## API Overview

> Endpoints are versioned under `/api/v1`.

Common endpoints:
- `GET /api/v1/folders/tree` (full mode tree)
- `GET /api/v1/folders/root` (lazy mode roots)
- `GET /api/v1/folders/:id/children` (lazy mode children)
- `GET /api/v1/folders/:id/path` (breadcrumb path)
- `GET /api/v1/folders/:id/items` (direct folders + files)
- `GET /api/v1/search?q=...&types=folders,files&limit=...&offset=...`

---

## Commands

### Root (recommended)
```bash
bun run dev           # run api + web (dev)
bun run db:up         # start Postgres (docker)
bun run db:down       # stop Postgres
bun run db:migrate    # drizzle migrate
bun run db:seed       # seed dataset
bun run db:reset      # truncate + migrate + seed (project helper)
bun run test          # run all tests (api + web)
bun run typecheck     # typecheck api + web
```

### API only
```bash
bun run --cwd apps/api dev
bun run --cwd apps/api test
bun run --cwd apps/api typecheck
```

### Web only
```bash
bun run --cwd apps/web dev
bun run --cwd apps/web test        # Vitest component/unit tests
bun run --cwd apps/web typecheck   # vue-tsc
```

---

## Testing

### 1) Typecheck
```bash
bun run typecheck
```

### 2) Unit / Integration / Component tests
```bash
bun run test
```

- API tests cover critical endpoints (root/children/path/items)
- Web tests cover key UI components (TopBar, RightPanel, TreeNode)

### 3) E2E tests (Playwright)
```bash
bun run --cwd apps/web e2e        # full mode
bun run --cwd apps/web e2e:lazy   # lazy mode
bun run --cwd apps/web e2e:ui     # interactive UI runner
```

E2E uses a small orchestrator (`scripts/e2e-servers.ts`) to start API + Web and wait until both are ready before running tests.

---

## Notes on Scalability

For large datasets (deep tree, many children, many search hits):
- `VITE_TREE_MODE=lazy` avoids fetching the full tree on initial load.
- Search supports pagination (`limit`, `offset`) and “Load more”.
- Seed generates enough data to validate pagination behavior.

---

## Architectural Notes

- Clear separation between:
  - **routes/controllers** (HTTP handlers)
  - **services** (business logic)
  - **repositories** (DB access)
  - **shared DTOs** (`packages/shared`) to keep types consistent across API/Web

---

## Troubleshooting

### Web shows blank / cannot load API
- Ensure API is running on `http://localhost:3001`
- Ensure Postgres container is healthy and you have run migrate + seed:
  ```bash
  bun run db:up
  bun run db:migrate
  bun run db:seed
  ```

### Windows terminal & Bun `--cwd`
If you run commands from repo root, prefer:
```bash
bun run --cwd apps/web dev
bun run --cwd apps/api dev
```

---

## Requirement Checklist (High Level)

- ✅ Windows Explorer-like UI (tree + contents)
- ✅ Unlimited folder depth
- ✅ Data stored in DB (PostgreSQL) + ORM (Drizzle)
- ✅ REST API + versioning
- ✅ Display files in right panel
- ✅ Search + pagination (“Load more”)
- ✅ Scalable mode (lazy-load tree)
- ✅ Tests: unit/component/integration + E2E
- ✅ CI with artifacts on E2E failure
- ✅ Typecheck (API + Web)

---

## License
For technical assessment / demonstration purposes.
