# Architecture: AI Chat with RAG + DB Pipeline

## Overview

The system answers user questions by combining two parallel data sources:

- **Structured** — the PostgreSQL database (user profile, chat history)
- **Unstructured** — the RAG knowledge base (Obsidian markdown vault, stored as vector embeddings)

These two sources never mix until the orchestration layer assembles the final prompt for the LLM.

---

## Module Map

```
backend/src/modules/
├── ai-chat/                  # Orchestration layer
│   ├── ai-chat.controller.ts    POST /ai/chat
│   ├── ai-chat.service.ts       sendMessage() — merges DB + RAG + LLM
│   └── user-context.service.ts  getContext() → name, role, seniority, score
│
├── rag/                      # Knowledge pipeline
│   ├── ingestion.interface.ts         IIngestionService (swappable)
│   ├── obsidian-ingestion.service.ts  Reads vault, chunks, embeds, stores
│   ├── knowledge-retrieval.service.ts Hybrid RRF search (semantic + FTS)
│   ├── vault-sync.service.ts          Hash-based diff engine
│   ├── vault-sync.cron.ts             @Cron every 5 min → syncVault()
│   ├── rag.controller.ts              POST /rag/ingest (manual trigger)
│   └── lib/
│       ├── collect-vault-files.util.ts  Recursive .md file scan
│       └── file-hash.util.ts            SHA-256 for dedup
│
├── embedding/
│   └── embedding.service.ts  text-embedding-004 via Google GenAI
│
└── ai/
    └── gemini.service.ts     generateChatAnswer(), reformulateQuery()
```

---

## Data Flow

### Ingestion (offline)

```
Obsidian vault (.md files)
        │
        ▼
collectVaultFiles()         — recursive scan, skip hidden files
        │
        ▼
extractFrontmatter()        — YAML block → metadata JSON
        │
        ▼
chunkText()                 — split by headings → paragraphs → 500-char windows
        │                      with 50-char overlap
        ▼
EmbeddingService            — text-embedding-004 → number[768]
        │
        ▼
PostgreSQL knowledge_chunk  — content, embedding (vector), metadata (jsonb),
                               source (relative path), file_hash (sha256)
```

**Automatic sync:** `VaultSyncCron` fires every 5 minutes and calls `VaultSyncService.syncVault()`.
- Files whose SHA-256 hash matches the stored hash are skipped.
- Deleted files have their chunks removed.
- Changed or new files are re-embedded and re-inserted.

**Manual trigger:** `POST /rag/ingest` calls `IIngestionService.ingestAll()` — re-ingests the entire vault unconditionally.

### Query (online, per request)

```
POST /ai/chat  { message }
        │
        ├──────────────────────────────────────────── parallel
        │                                              │
        ▼                                              ▼
UserContextService.getContext()             chatMessage[] (last 10)
→ { name, role, memberSinceDays,
    contributionScore }
        │
        ├──────────────────────────────────────────── query reformulation (if needed)
        │                                              GeminiService.reformulateQuery()
        │                                              → standalone question
        │                                              │
        │                                              ▼
        │                                   KnowledgeRetrievalService.retrieve(query, topK, role)
        │                                    ├─ embed query → vector
        │                                    ├─ semantic: HNSW top 50
        │                                    │   (+ filter access:admin if MEMBER)
        │                                    ├─ keyword:  GIN/FTS top 50
        │                                    │   (+ filter access:admin if MEMBER)
        │                                    └─ RRF fusion → top 5 chunks
        │                                              │
        └──────────────────────── merge ───────────────┘
                                    │
                                    ▼
                           buildPrompt()
                     system instruction
                     + user name, role, seniority, contribution score
                     + knowledge chunks (content + source + metadata)
                     + conversation history
                     + current question
                                    │
                                    ▼
                       GeminiService.generateChatAnswer()
                                    │
                                    ▼
                       { answer, sources, history }
```

---

## Database Schema

### `knowledge_chunk`

| Column | Type | Notes |
|---|---|---|
| `id` | `text` | UUID, primary key |
| `source` | `text` | Relative path from vault root (e.g. `projects/auth.md`) |
| `content` | `text` | Raw chunk text |
| `embedding` | `vector(768)` | pgvector; HNSW index for cosine search |
| `fts_vector` | `tsvector` | Generated column; GIN index for keyword search |
| `metadata` | `jsonb` | Obsidian frontmatter fields |
| `file_hash` | `text` | SHA-256 of the source file; used for dedup |
| `created_at` | `timestamp` | Ingestion time |

### `user` (relevant fields)

| Column | Type | Notes |
|---|---|---|
| `role` | `UserRole` enum | `ADMIN` or `MEMBER` (default); controls RAG chunk visibility |
| `created_at` | `timestamp` | Used to compute `memberSinceDays` |

### `chat_message`

| Column | Type | Notes |
|---|---|---|
| `id` | `text` | UUID |
| `user_id` | `text` | FK → `user.id` |
| `role` | `text` | `"user"` or `"assistant"` |
| `content` | `text` | Message body |
| `sources` | `jsonb` | Array of `{ title, relevance }` on assistant messages |
| `created_at` | `timestamp` | Used for ordering history |

---

## Architecture Rules (from spec)

| Rule | Implementation |
|---|---|
| **Swappable source** | `IIngestionService` + `INGESTION_SERVICE` token. Swap `useClass` in `RagModule` to change the knowledge source. |
| **Separate concerns** | Ingestion, retrieval, and generation are independent NestJS modules with no circular imports. |
| **RAG transparency** | Every `ChatResponseDto` includes `sources: [{ title, relevance }]`. |
| **DB ≠ RAG** | DB data (role, seniority, score, history) and RAG chunks are fetched independently and merged only inside `buildPrompt()`. |
| **Role-based access** | Chunks tagged `access: admin` in Obsidian frontmatter are filtered at SQL level for MEMBER users — the LLM never sees restricted content. |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Backend | NestJS (TypeScript) |
| Database | PostgreSQL (Neon) + Prisma ORM |
| Vector storage | pgvector (same DB, no separate service) |
| Embeddings | Google `text-embedding-004` (768 dims) |
| LLM | Google Gemini `gemini-2.0-flash` |
| Orchestration | Custom (`AiChatService`) — no LangChain |
| Knowledge source | Obsidian vault (local filesystem) |
| Sync | `@nestjs/schedule` cron (every 5 min) + SHA-256 dedup |

---

## Sequence Diagrams

See [rag-sequence.md](./rag-sequence.md) for detailed Mermaid diagrams of both the ingestion and query flows.
