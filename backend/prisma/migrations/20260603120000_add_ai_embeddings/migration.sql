-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Idea: semantic embedding columns
ALTER TABLE "idea"
  ADD COLUMN IF NOT EXISTS "ai_embedding" vector(768),
  ADD COLUMN IF NOT EXISTS "embedding_hash" text;

-- Problem: semantic embedding columns
ALTER TABLE "problem"
  ADD COLUMN IF NOT EXISTS "ai_embedding" vector(768),
  ADD COLUMN IF NOT EXISTS "embedding_hash" text;

-- HNSW indexes for cosine similarity (<=> operator)
CREATE INDEX IF NOT EXISTS "idea_ai_embedding_hnsw_idx"
  ON "idea" USING hnsw ("ai_embedding" vector_cosine_ops);

CREATE INDEX IF NOT EXISTS "problem_ai_embedding_hnsw_idx"
  ON "problem" USING hnsw ("ai_embedding" vector_cosine_ops);
