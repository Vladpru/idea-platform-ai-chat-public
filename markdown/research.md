# Research: LLM, RAG, and Vector Search

## Large Language Models (LLMs)

An LLM is a neural network trained on large text corpora to predict the next token in a sequence. At inference time it takes a **prompt** (a block of text) and generates a continuation. The quality of the answer depends almost entirely on the quality of the prompt.

**Key limitation for this project:** LLMs have a training cutoff and no access to private data. They cannot answer questions about documents they have never seen. This is the problem RAG solves.

**Model used:** Google Gemini (`gemini-2.0-flash`) via `GeminiService`. Invoked in `AiChatService.sendMessage()` through `GeminiService.generateChatAnswer(prompt)`.

---

## Retrieval-Augmented Generation (RAG)

RAG is the pattern of fetching relevant documents at query time and inserting them into the prompt before calling the LLM. The LLM is instructed to answer only from those excerpts.

```
User question
    │
    ├──→ Retrieval: find top-K relevant chunks from knowledge base
    │
    └──→ Prompt assembly: question + chunks + user context
              │
              └──→ LLM → grounded answer + source citations
```

**Why RAG instead of fine-tuning:**
- Fine-tuning bakes knowledge into weights — updating it requires re-training.
- RAG keeps knowledge in a database — updating means re-ingesting one file.
- RAG gives source transparency: you know exactly which document produced each answer.

**This project's RAG pipeline has two phases:**

### Phase 1 — Ingestion (offline)
`ObsidianIngestionService` reads `.md` files from the Obsidian vault, splits them into chunks, embeds each chunk into a 768-dimensional vector, and stores both the text and vector in PostgreSQL.

### Phase 2 — Retrieval (online, per query)
`KnowledgeRetrievalService` embeds the user's query into the same vector space, then runs a hybrid search (semantic + keyword) to find the top-K most relevant chunks.

---

## Embeddings and Vector Search

### What is an embedding?

An embedding model maps text to a fixed-length float array (a vector). Semantically similar texts produce vectors that are close together in the vector space, regardless of exact word overlap.

**Model used:** `text-embedding-004` (Google) via `EmbeddingService.embedText()`. Output: `number[768]`.

### Cosine similarity

The standard metric for comparing text embeddings. Measures the angle between two vectors — 1.0 means identical direction (very similar), 0 means orthogonal (unrelated).

PostgreSQL `pgvector` operator: `embedding <=> query_vector` (cosine distance; lower = more similar).

### Approximate Nearest Neighbour (HNSW)

Scanning every row for the closest vector is O(n). HNSW (Hierarchical Navigable Small World) is a graph-based index that finds approximate nearest neighbours in O(log n).

```sql
CREATE INDEX knowledge_chunk_embedding_hnsw_idx
    ON knowledge_chunk USING hnsw (embedding vector_cosine_ops);
```

Trade-off: slight recall loss (~1-2%) for dramatically faster queries at scale.

### Full-text search (FTS)

Keyword search using PostgreSQL's built-in `tsvector`. Useful when the query contains exact terms that semantic search might miss (e.g. product codes, proper nouns).

```sql
-- Generated column — maintained automatically by Postgres
fts_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED;

CREATE INDEX knowledge_chunk_fts_idx ON knowledge_chunk USING GIN (fts_vector);
```

### Hybrid retrieval with RRF

Neither semantic nor keyword search is best for all queries. **Reciprocal Rank Fusion (RRF)** merges the two ranked lists without requiring score normalisation:

```
rrf_score = 1/(k + rank_semantic) + 1/(k + rank_keyword)
```

`k = 60` (constant that dampens the influence of very high ranks). A chunk that appears highly in both lists scores highest. Implemented in `KnowledgeRetrievalService.retrieveHybrid()`.

---

## Query Reformulation

Short follow-up messages ("what about this?", "and permissions?") rely on context from previous turns. Sending them directly to the retriever produces poor results.

`AiChatService.needsReformulation()` detects pronoun and follow-up patterns. If triggered, `GeminiService.reformulateQuery()` rewrites the question into a standalone form before retrieval.
