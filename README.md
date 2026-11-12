# ecommerce-with-ai

Product catalog in Postgres (pgvector) + a customer products API + an AI shopping assistant (RAG chat) — a playground for learning vector search.

## Quick start

```bash
cp .env.example .env      # then set CATALOG_API_URL
pnpm install
pnpm db:up                # Postgres 17 + pgvector in Docker
pnpm db:migrate           # apply Drizzle migrations
pnpm seed                 # import products from the catalog API (idempotent)
pnpm embeddings:fill      # embed new/changed products with Ollama (needs `ollama serve`)
pnpm dev                  # API on http://localhost:3000
pnpm web:dev              # chat UI on http://localhost:5173 (needs Ollama: embedding + chat models)
```

## API

| Method | Path                                                   | Description                  |
| ------ | ------------------------------------------------------ | ---------------------------- |
| GET    | `/health`                                              | Health check                 |
| GET    | `/api/products?page=1&limit=20&category=...&brand=...` | Paginated list (limit ≤ 100) |
| GET    | `/api/products/:slug`                                  | Single product               |

`POST /api/chat` — body `{ message, history? }`, streams Server-Sent Events:
`status` (search → found → answer) → `thinking`* → `answer`* → `products` → `suggestions` → `done` (or `error`).

A ready-made **Bruno** collection is in `bruno/` (open the folder in Bruno, pick the _Local_ environment).

Errors always look like `{ "error": { "code", "message", "details?" } }` (400 / 404 / 500).

## Structure

```
src/
├── config/env.ts                  # all env vars, validated with zod (fail fast)
├── db/
│   ├── client.ts                  # pg pool + drizzle instance (singleton)
│   ├── schema.ts                  # tables
│   └── helpers.ts                 # generic upsert helper
├── lib/                           # framework-agnostic utilities
│   ├── errors.ts                  # AppError / NotFoundError / ValidationError
│   ├── http-client.ts             # fetchJson with timeout + retry/backoff
│   ├── concurrency.ts             # mapWithConcurrency
│   ├── pagination.ts              # page/offset/meta helpers
│   ├── validation.ts              # zod request validator for Hono
│   └── logger.ts
├── integrations/catalog-api/      # everything specific to the external catalog API
│   ├── catalog-api.types.ts       # external response shapes
│   ├── catalog-api.client.ts      # HTTP gateway (pagination iterator, details)
│   ├── catalog-api.mapper.ts      # external product → DB row, bundle filtering
│   └── catalog-api-product-source.ts  # adapter implementing ProductSource
├── integrations/ollama/           # adapters: ChatModel, ProductEmbedder, QueryEmbedder
├── modules/products/              # the products feature
│   ├── product.types.ts           # DTOs / filters
│   ├── product.validation.ts      # request schemas
│   ├── product.repository.ts      # data access (interface + Drizzle impl)
│   ├── product.service.ts         # read use cases for the API
│   ├── product-source.ts          # ProductSource interface
│   ├── product-sync.service.ts    # import use case (source → repository)
│   ├── product-embedder.ts        # ProductEmbedder interface
│   ├── product-embedding.service.ts  # embedding use case (incremental, batched)
│   └── product.routes.ts          # HTTP controller
├── modules/chat/                 # RAG chat assistant
│   ├── chat-model.ts              # ChatModel interface (streaming LLM)
│   ├── chat.prompt.ts             # system prompt + product context
│   ├── chat.service.ts            # search → LLM → products → follow-ups (async generator of events)
│   ├── follow-up-extractor.ts     # splits streamed answer from "FOLLOW-UPS:" list
│   ├── chat.routes.ts             # POST /api/chat (SSE)
│   └── chat.types.ts / chat.validation.ts
├── scripts/
│   ├── seed.ts                    # CLI: run the sync
│   └── fill-products-embeddings.ts   # CLI: fill embeddings (--force to redo all)
├── container.ts                   # composition root (wires dependencies)
├── app.ts                         # builds the Hono app (no listen → testable)
└── server.ts                      # starts HTTP server + graceful shutdown
```

Dependencies point inward: `routes → service → repository interface`; only `container.ts` knows concrete classes.

Frontend (`web/`, React + Vite): `api/` (SSE client) · `hooks/` (`useChat` + reducer) · `components/` (thinking panel, product cards, composer) · `types/` (mirrors the backend event contract).

## Configuration (`.env`)

| Variable              | Default                | Purpose                                            |
| --------------------- | ---------------------- | -------------------------------------------------- |
| `DATABASE_URL`        | —                      | Postgres connection                                |
| `CATALOG_API_URL`     | —                      | External product catalog API                       |
| `PORT`                | 3000                   | API port                                           |
| `OLLAMA_HOST`         | http://localhost:11434 | Ollama server                                      |
| `CHAT_MODEL`          | qwen3.5:4b             | Chat LLM                                           |
| `CHAT_THINK`          | true                   | Stream the model's reasoning (slower, esp. on CPU) |
| `CHAT_CONTEXT_TOKENS` | 8192                   | LLM context window                                 |

## Design patterns used

- **Repository** — `ProductRepository` hides Drizzle/SQL from business logic.
- **Service layer** — `ProductService`, `ProductSyncService` hold use cases; routes stay thin.
- **Adapter** — `OllamaProductEmbedder` adapts Ollama to `ProductEmbedder`; `CatalogApiProductSource` adapts the external API to the `ProductSource` interface, so the sync doesn't depend on the vendor.
- **Gateway** — `CatalogApiClient` is the only code that knows external URLs/envelopes.
- **Mapper** — `catalog-api.mapper.ts` converts external shapes to DB rows.
- **Dependency injection / Composition root** — constructor injection, wired once in `container.ts`.
- **Iterator** — async generators stream pages instead of loading everything in memory.
- **Factory** — `createApp`, `createContainer`, `createProductRoutes`.
- **Singleton** — one DB pool per process (`db/client.ts`).

## Scripts

| Script                               | What it does                    |
| ------------------------------------ | ------------------------------- |
| `pnpm dev` / `pnpm start`            | Run API (watch / once)          |
| `pnpm seed`                          | Import/refresh products         |
| `pnpm db:up` / `db:down` / `db:psql` | Docker Postgres                 |
| `pnpm db:generate` / `db:migrate`    | Drizzle migrations              |
| `pnpm db:studio`                     | Browse data                     |
| `pnpm check`                         | typecheck + lint + format check |
| `pnpm lint:fix` / `pnpm format`      | Auto-fix                        |

## Adding vector search

Natural home: `modules/search/` (or `product.service.ts` + a `GET /api/products/search` route registered **before** `/:slug`). Put the embedding provider behind an interface (e.g. `EmbeddingProvider`) and wire it in `container.ts`; add its config to `config/env.ts`.
