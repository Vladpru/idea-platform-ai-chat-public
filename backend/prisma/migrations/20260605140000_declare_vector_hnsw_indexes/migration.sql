CREATE INDEX IF NOT EXISTS "idea_ai_embedding_hnsw_idx" ON "idea" USING hnsw ("ai_embedding" vector_cosine_ops);
CREATE INDEX IF NOT EXISTS "problem_ai_embedding_hnsw_idx" ON "problem" USING hnsw ("ai_embedding" vector_cosine_ops);
CREATE INDEX IF NOT EXISTS "tag_ai_embedding_hnsw_idx" ON "tag" USING hnsw ("ai_embedding" vector_cosine_ops);
