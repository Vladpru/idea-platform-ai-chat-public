ALTER TABLE "tag"
  ADD COLUMN IF NOT EXISTS "ai_embedding" vector(768),
  ADD COLUMN IF NOT EXISTS "embedding_hash" text;

CREATE INDEX IF NOT EXISTS "tag_ai_embedding_hnsw_idx"
  ON "tag" USING hnsw ("ai_embedding" vector_cosine_ops);
